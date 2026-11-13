import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Department from '../models/Department.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import Bill from '../models/Bill.js';

// Helper to get last 7 days labels and YYYY-MM-DD strings
const getLast7Days = () => {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      label: dayNames[d.getDay()],
      fullLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return days;
};

/**
 * @desc    Get role-specific dashboard summary & analytics
 * @route   GET /api/dashboard
 * @access  Private (Admin, Doctor, Receptionist, Patient)
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const role = req.user.role;
    const todayStr = new Date().toISOString().split('T')[0];

    // =========================================================================
    // 1. ADMIN DASHBOARD
    // =========================================================================
    if (role === 'admin') {
      const [
        totalPatients,
        totalDoctors,
        totalDepartments,
        todaysAppointments,
        allAppointments,
        paidBills,
        pendingBills,
        recentAppointments,
        recentPatients,
      ] = await Promise.all([
        Patient.countDocuments(),
        Doctor.countDocuments(),
        Department.countDocuments({ status: 'active' }),
        Appointment.countDocuments({ appointmentDate: todayStr }),
        Appointment.find().select('appointmentDate status doctorId'),
        Bill.find({ paymentStatus: 'paid' }).select('amount createdAt'),
        Bill.find({ paymentStatus: 'pending' }).select('amount'),
        Appointment.find()
          .sort({ createdAt: -1 })
          .limit(6)
          .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'name email phone' },
          })
          .populate({
            path: 'doctorId',
            populate: [
              { path: 'userId', select: 'name email' },
              { path: 'departmentId', select: 'name' },
            ],
          }),
        Patient.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'name email phone createdAt'),
      ]);

      const totalRevenue = paidBills.reduce((acc, b) => acc + (b.amount || 0), 0);
      const pendingRevenue = pendingBills.reduce((acc, b) => acc + (b.amount || 0), 0);

      // Build 7-day appointment & revenue analytics trend
      const last7Days = getLast7Days();
      const appointmentTrend = last7Days.map((day) => {
        const dayAppointments = allAppointments.filter((a) => a.appointmentDate === day.dateStr);
        const dayPaidBills = paidBills.filter(
          (b) => b.createdAt && b.createdAt.toISOString().split('T')[0] === day.dateStr
        );
        return {
          name: day.label,
          date: day.fullLabel,
          appointments: dayAppointments.length,
          completed: dayAppointments.filter((a) => a.status === 'completed').length,
          revenue: dayPaidBills.reduce((sum, b) => sum + (b.amount || 0), 0),
        };
      });

      // Appointment status distribution for pie/bar chart
      const statusCounts = {
        scheduled: allAppointments.filter((a) => a.status === 'scheduled').length,
        'checked-in': allAppointments.filter((a) => a.status === 'checked-in').length,
        completed: allAppointments.filter((a) => a.status === 'completed').length,
        cancelled: allAppointments.filter((a) => a.status === 'cancelled').length,
      };

      const statusDistribution = [
        { name: 'Scheduled', value: statusCounts.scheduled, color: '#2563eb' },
        { name: 'Checked-In', value: statusCounts['checked-in'], color: '#f59e0b' },
        { name: 'Completed', value: statusCounts.completed, color: '#10b981' },
        { name: 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' },
      ];

      return res.status(200).json({
        success: true,
        role: 'admin',
        stats: {
          totalPatients,
          totalDoctors,
          totalDepartments,
          todaysAppointments,
          totalAppointments: allAppointments.length,
          totalRevenue,
          pendingRevenue,
        },
        charts: {
          appointmentTrend,
          statusDistribution,
        },
        recentAppointments,
        recentPatients,
      });
    }

    // =========================================================================
    // 2. DOCTOR DASHBOARD
    // =========================================================================
    if (role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id }).populate(
        'departmentId',
        'name'
      );

      if (!doctorProfile) {
        return res.status(200).json({
          success: true,
          role: 'doctor',
          stats: { todaysCount: 0, upcomingCount: 0, totalPatients: 0, completedCount: 0 },
          todaysSchedule: [],
          upcomingAppointments: [],
          recentMedicalRecords: [],
        });
      }

      const [doctorAppointments, recentMedicalRecords] = await Promise.all([
        Appointment.find({ doctorId: doctorProfile._id })
          .sort({ appointmentDate: 1, appointmentTime: 1 })
          .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'name email phone' },
          }),
        MedicalRecord.find({ doctorId: doctorProfile._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'name email phone' },
          }),
      ]);

      const todaysSchedule = doctorAppointments.filter((a) => a.appointmentDate === todayStr);
      const upcomingAppointments = doctorAppointments.filter(
        (a) => a.appointmentDate >= todayStr && a.status !== 'cancelled'
      );
      const uniquePatientIds = new Set(
        doctorAppointments.map((a) => a.patientId?._id?.toString()).filter(Boolean)
      );
      const completedCount = doctorAppointments.filter((a) => a.status === 'completed').length;

      return res.status(200).json({
        success: true,
        role: 'doctor',
        doctorProfile,
        stats: {
          todaysCount: todaysSchedule.length,
          upcomingCount: upcomingAppointments.length,
          totalPatients: uniquePatientIds.size,
          completedCount,
        },
        todaysSchedule,
        upcomingAppointments: upcomingAppointments.slice(0, 6),
        recentMedicalRecords,
      });
    }

    // =========================================================================
    // 3. RECEPTIONIST DASHBOARD
    // =========================================================================
    if (role === 'receptionist') {
      const [
        totalPatients,
        todaysAppointmentsList,
        allUpcomingCount,
        recentPatients,
      ] = await Promise.all([
        Patient.countDocuments(),
        Appointment.find({ appointmentDate: todayStr })
          .sort({ appointmentTime: 1 })
          .populate({
            path: 'patientId',
            populate: { path: 'userId', select: 'name email phone' },
          })
          .populate({
            path: 'doctorId',
            populate: [
              { path: 'userId', select: 'name email' },
              { path: 'departmentId', select: 'name' },
            ],
          }),
        Appointment.countDocuments({
          appointmentDate: { $gte: todayStr },
          status: { $ne: 'cancelled' },
        }),
        Patient.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .populate('userId', 'name email phone createdAt'),
      ]);

      const checkedInToday = todaysAppointmentsList.filter(
        (a) => a.status === 'checked-in'
      ).length;
      const pendingCheckInToday = todaysAppointmentsList.filter(
        (a) => a.status === 'scheduled'
      ).length;

      return res.status(200).json({
        success: true,
        role: 'receptionist',
        stats: {
          todaysAppointments: todaysAppointmentsList.length,
          checkedInToday,
          pendingCheckInToday,
          totalPatients,
          allUpcomingCount,
        },
        todaysSchedule: todaysAppointmentsList,
        recentPatients,
      });
    }

    // =========================================================================
    // 4. PATIENT DASHBOARD
    // =========================================================================
    const patientProfile = await Patient.findOne({ userId: req.user._id });

    if (!patientProfile) {
      return res.status(200).json({
        success: true,
        role: 'patient',
        stats: {
          upcomingCount: 0,
          totalVisits: 0,
          prescriptionsCount: 0,
          unpaidBillsAmount: 0,
        },
        upcomingAppointments: [],
        appointmentHistory: [],
        recentPrescriptions: [],
        recentBills: [],
      });
    }

    const [appointments, prescriptions, bills] = await Promise.all([
      Appointment.find({ patientId: patientProfile._id })
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email phone' },
            { path: 'departmentId', select: 'name' },
          ],
        }),
      Prescription.find({ patientId: patientProfile._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        }),
      Bill.find({ patientId: patientProfile._id }).sort({ createdAt: -1 }).limit(5),
    ]);

    const upcomingAppointments = appointments.filter(
      (a) => a.appointmentDate >= todayStr && a.status !== 'cancelled'
    );
    const unpaidBillsAmount = bills
      .filter((b) => b.paymentStatus === 'pending')
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    return res.status(200).json({
      success: true,
      role: 'patient',
      patientProfile,
      stats: {
        upcomingCount: upcomingAppointments.length,
        totalVisits: appointments.length,
        prescriptionsCount: prescriptions.length,
        unpaidBillsAmount,
      },
      upcomingAppointments,
      appointmentHistory: appointments.slice(0, 6),
      recentPrescriptions: prescriptions,
      recentBills: bills,
    });
  } catch (error) {
    next(error);
  }
};
