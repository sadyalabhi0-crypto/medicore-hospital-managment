import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Bill from '../models/Bill.js';

/**
 * Helper to generate 30-minute time slots between startTime and endTime
 */
const generateTimeSlots = (startTime = '09:00', endTime = '17:00') => {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let currentMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += 30;
  }
  return slots;
};

/**
 * @desc    Get booked and available time slots for a doctor on a given date
 * @route   GET /api/appointments/booked-slots?doctorId=...&date=YYYY-MM-DD
 * @access  Private
 */
export const getDoctorSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      res.status(400);
      throw new Error('doctorId and date query parameters are required.');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found.');
    }

    // Determine day of week in UTC from YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayOfWeek = dayNames[dateObj.getUTCDay()];

    const daySchedule = (doctor.availability || []).find((s) => s.day === dayOfWeek);

    // Find non-cancelled appointments for this doctor on this date
    const existingAppointments = await Appointment.find({
      doctorId,
      appointmentDate: date,
      status: { $ne: 'cancelled' },
    }).select('appointmentTime');

    const bookedSlots = existingAppointments.map((a) => a.appointmentTime);

    let allSlots = [];
    let isDayAvailable = true;

    if (daySchedule) {
      if (!daySchedule.isAvailable) {
        isDayAvailable = false;
      } else {
        allSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime);
      }
    } else {
      allSlots = generateTimeSlots('09:00', '17:00');
    }

    res.status(200).json({
      success: true,
      date,
      dayOfWeek,
      isDayAvailable,
      allSlots,
      bookedSlots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments (filtered by role, status, date, doctor, patient, pagination)
 * @route   GET /api/appointments
 * @access  Private
 */
export const getAppointments = async (req, res, next) => {
  try {
    const {
      status = '',
      date = '',
      doctorId = '',
      patientId = '',
      page = 1,
      limit = 15,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (date) filter.appointmentDate = date;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;

    // Enforce role-based scoping
    if (req.user.role === 'doctor') {
      const docProfile = await Doctor.findOne({ userId: req.user._id });
      if (!docProfile) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page: 1,
          pages: 1,
          appointments: [],
        });
      }
      filter.doctorId = docProfile._id;
    } else if (req.user.role === 'patient') {
      const ptProfile = await Patient.findOne({ userId: req.user._id });
      if (!ptProfile) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page: 1,
          pages: 1,
          appointments: [],
        });
      }
      filter.patientId = ptProfile._id;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'departmentId', select: 'name' },
        ],
      })
      .sort({ appointmentDate: -1, appointmentTime: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
export const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'departmentId', select: 'name' },
        ],
      });

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found.');
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Book a new appointment (prevents double-booking & auto-creates consultation bill)
 * @route   POST /api/appointments
 * @access  Private (Admin, Receptionist, Patient)
 */
export const createAppointment = async (req, res, next) => {
  try {
    let { patientId, doctorId, appointmentDate, appointmentTime, reason, notes } =
      req.body;

    // If a patient is booking for themselves, resolve their Patient profile ID automatically
    if (req.user.role === 'patient') {
      const ptProfile = await Patient.findOne({ userId: req.user._id });
      if (!ptProfile) {
        res.status(400);
        throw new Error('Patient profile not found for your account.');
      }
      patientId = ptProfile._id;
    }

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !reason) {
      res.status(400);
      throw new Error(
        'Please provide patient, doctor, appointment date, time slot, and reason for visit.'
      );
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      res.status(404);
      throw new Error('Selected doctor not found.');
    }

    // Check for double-booking conflict (same doctor, same date, same time, not cancelled)
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      appointmentTime,
      status: { $ne: 'cancelled' },
    });

    if (conflictingAppointment) {
      res.status(409);
      throw new Error(
        `This time slot (${appointmentTime} on ${appointmentDate}) is already booked for this doctor. Please choose another slot.`
      );
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      reason: reason.trim(),
      notes: notes ? notes.trim() : '',
      status: 'scheduled',
    });

    // Automatically create a corresponding consultation bill (pending)
    await Bill.create({
      patientId,
      appointmentId: appointment._id,
      amount: doctor.consultationFee || 150,
      paymentStatus: 'pending',
      paymentMethod: 'unpaid',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'departmentId', select: 'name' },
        ],
      });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment status or reschedule date/time
 * @route   PUT /api/appointments/:id
 * @access  Private (Admin, Receptionist, Doctor, Patient)
 */
export const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found.');
    }

    // Patients can only cancel their own appointments
    if (req.user.role === 'patient') {
      const ptProfile = await Patient.findOne({ userId: req.user._id });
      if (!ptProfile || appointment.patientId.toString() !== ptProfile._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to modify this appointment.');
      }
    }

    const { appointmentDate, appointmentTime, status, reason, notes } = req.body;

    // If date or time is changing, verify there is no double-booking conflict
    const newDate = appointmentDate || appointment.appointmentDate;
    const newTime = appointmentTime || appointment.appointmentTime;

    if (
      (newDate !== appointment.appointmentDate ||
        newTime !== appointment.appointmentTime) &&
      status !== 'cancelled'
    ) {
      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctorId: appointment.doctorId,
        appointmentDate: newDate,
        appointmentTime: newTime,
        status: { $ne: 'cancelled' },
      });

      if (conflict) {
        res.status(409);
        throw new Error(
          `Cannot reschedule: Doctor already has an appointment at ${newTime} on ${newDate}.`
        );
      }

      appointment.appointmentDate = newDate;
      appointment.appointmentTime = newTime;
    }

    if (status !== undefined) {
      appointment.status = status;
      // If appointment is cancelled, mark its pending bill as cancelled too
      if (status === 'cancelled') {
        await Bill.updateMany(
          { appointmentId: appointment._id, paymentStatus: 'pending' },
          { $set: { paymentStatus: 'cancelled' } }
        );
      }
    }

    if (reason !== undefined) appointment.reason = reason.trim();
    if (notes !== undefined) appointment.notes = notes.trim();

    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'departmentId', select: 'name' },
        ],
      });

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully.',
      appointment: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private (Admin, Receptionist)
 */
export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found.');
    }

    await Promise.all([
      Bill.deleteMany({ appointmentId: appointment._id }),
      Appointment.findByIdAndDelete(appointment._id),
    ]);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted.',
    });
  } catch (error) {
    next(error);
  }
};
