import MedicalRecord from '../models/MedicalRecord.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

/**
 * @desc    Get all medical records (for Admin / Doctor) or filtered by patient
 * @route   GET /api/medical-records
 * @access  Private (Admin, Doctor, Patient)
 */
export const getAllMedicalRecords = async (req, res, next) => {
  try {
    const { patientId = '' } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      const pt = await Patient.findOne({ userId: req.user._id });
      if (!pt) {
        return res.status(200).json({ success: true, records: [] });
      }
      filter.patientId = pt._id;
    } else if (patientId) {
      filter.patientId = patientId;
    }

    const records = await MedicalRecord.find(filter)
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
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get medical records for a specific patient
 * @route   GET /api/medical-records/:patientId
 * @access  Private (Admin, Doctor, Receptionist, or the Patient themselves)
 */
export const getMedicalRecordsByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'patient') {
      const pt = await Patient.findOne({ userId: req.user._id });
      if (!pt || pt._id.toString() !== patientId) {
        res.status(403);
        throw new Error('Not authorized to access another patient medical records.');
      }
    }

    const records = await MedicalRecord.find({ patientId })
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
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new medical record entry
 * @route   POST /api/medical-records
 * @access  Private (Doctor, Admin)
 */
export const createMedicalRecord = async (req, res, next) => {
  try {
    let { patientId, doctorId, diagnosis, symptoms, treatment, notes } = req.body;

    if (req.user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: req.user._id });
      if (!doc) {
        res.status(400);
        throw new Error('Doctor profile not found.');
      }
      doctorId = doc._id;
    }

    if (!patientId || !doctorId || !diagnosis || !treatment) {
      res.status(400);
      throw new Error('Please provide patient, doctor, diagnosis, and treatment plan.');
    }

    const parsedSymptoms = Array.isArray(symptoms)
      ? symptoms
      : typeof symptoms === 'string' && symptoms.trim()
      ? symptoms.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      diagnosis: diagnosis.trim(),
      symptoms: parsedSymptoms,
      treatment: treatment.trim(),
      notes: notes ? notes.trim() : '',
    });

    const populated = await MedicalRecord.findById(record._id)
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
      });

    res.status(201).json({
      success: true,
      message: 'Medical record added successfully.',
      record: populated,
    });
  } catch (error) {
    next(error);
  }
};
