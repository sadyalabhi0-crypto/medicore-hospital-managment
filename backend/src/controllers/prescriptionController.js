import Prescription from '../models/Prescription.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

/**
 * @desc    Get all prescriptions (scoped by role or patientId query)
 * @route   GET /api/prescriptions
 * @access  Private (Admin, Doctor, Patient)
 */
export const getAllPrescriptions = async (req, res, next) => {
  try {
    const { patientId = '' } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      const pt = await Patient.findOne({ userId: req.user._id });
      if (!pt) {
        return res.status(200).json({ success: true, prescriptions: [] });
      }
      filter.patientId = pt._id;
    } else if (patientId) {
      filter.patientId = patientId;
    }

    const prescriptions = await Prescription.find(filter)
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
      })
      .populate('appointmentId', 'appointmentDate appointmentTime reason')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get prescriptions for a specific patient
 * @route   GET /api/prescriptions/:patientId
 * @access  Private (Admin, Doctor, Receptionist, or the Patient themselves)
 */
export const getPrescriptionsByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'patient') {
      const pt = await Patient.findOne({ userId: req.user._id });
      if (!pt || pt._id.toString() !== patientId) {
        res.status(403);
        throw new Error('Not authorized to view another patient prescriptions.');
      }
    }

    const prescriptions = await Prescription.find({ patientId })
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
      })
      .populate('appointmentId', 'appointmentDate appointmentTime reason')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Issue a new prescription
 * @route   POST /api/prescriptions
 * @access  Private (Doctor, Admin)
 */
export const createPrescription = async (req, res, next) => {
  try {
    let { patientId, doctorId, appointmentId, medicines, instructions } = req.body;

    if (req.user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: req.user._id });
      if (!doc) {
        res.status(400);
        throw new Error('Doctor profile not found.');
      }
      doctorId = doc._id;
    }

    if (!patientId || !doctorId || !Array.isArray(medicines) || medicines.length === 0) {
      res.status(400);
      throw new Error('Please select a patient and provide at least one medicine.');
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      medicines,
      instructions: instructions ? instructions.trim() : '',
    });

    const populated = await Prescription.findById(prescription._id)
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
      })
      .populate('appointmentId', 'appointmentDate appointmentTime reason');

    res.status(201).json({
      success: true,
      message: 'Prescription issued successfully.',
      prescription: populated,
    });
  } catch (error) {
    next(error);
  }
};
