import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import Bill from '../models/Bill.js';

/**
 * @desc    Get all patients with search, bloodGroup/gender filter, and pagination
 * @route   GET /api/patients
 * @access  Private (Admin, Receptionist, Doctor)
 */
export const getPatients = async (req, res, next) => {
  try {
    const {
      search = '',
      bloodGroup = '',
      gender = '',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const patientFilter = {};
    if (bloodGroup) patientFilter.bloodGroup = bloodGroup;
    if (gender) patientFilter.gender = gender;

    // If search query provided, match users by name, email, or phone
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        role: 'patient',
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      }).select('_id');

      patientFilter.userId = { $in: matchingUsers.map((u) => u._id) };
    }

    const total = await Patient.countDocuments(patientFilter);
    const patients = await Patient.find(patientFilter)
      .populate('userId', 'name email phone profileImage isActive createdAt')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      patients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single patient details with appointment, medical record, prescription & billing history
 * @route   GET /api/patients/:id
 * @access  Private (Admin, Receptionist, Doctor, or the Patient themselves)
 */
export const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      'userId',
      'name email phone profileImage isActive createdAt'
    );

    if (!patient) {
      res.status(404);
      throw new Error('Patient record not found.');
    }

    // Prevent patients from viewing other patients' sensitive records
    if (
      req.user.role === 'patient' &&
      patient.userId?._id?.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to view another patient record.');
    }

    const [appointments, medicalRecords, prescriptions, bills] = await Promise.all([
      Appointment.find({ patientId: patient._id })
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .limit(10)
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email' },
            { path: 'departmentId', select: 'name' },
          ],
        }),
      MedicalRecord.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        }),
      Prescription.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        }),
      Bill.find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.status(200).json({
      success: true,
      patient,
      history: {
        appointments,
        medicalRecords,
        prescriptions,
        bills,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create / register a new patient (by Admin or Receptionist)
 * @route   POST /api/patients
 * @access  Private (Admin, Receptionist)
 */
export const createPatient = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      emergencyContact,
    } = req.body;

    if (!name || !email || !phone || !dateOfBirth || !gender || !address) {
      res.status(400);
      throw new Error(
        'Please provide name, email, phone, date of birth, gender, and address.'
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400);
      throw new Error('A user with this email address is already registered.');
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password && password.trim().length >= 6 ? password.trim() : 'Password123!',
      phone: phone.trim(),
      role: 'patient',
    });

    const patient = await Patient.create({
      userId: user._id,
      dateOfBirth,
      gender,
      address: address.trim(),
      bloodGroup: bloodGroup || 'Unknown',
      emergencyContact: {
        name: emergencyContact?.name || '',
        phone: emergencyContact?.phone || '',
        relation: emergencyContact?.relation || '',
      },
    });

    const populatedPatient = await Patient.findById(patient._id).populate(
      'userId',
      'name email phone profileImage isActive createdAt'
    );

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      patient: populatedPatient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update patient profile & user details
 * @route   PUT /api/patients/:id
 * @access  Private (Admin, Receptionist, or the Patient themselves)
 */
export const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      res.status(404);
      throw new Error('Patient record not found.');
    }

    if (
      req.user.role === 'patient' &&
      patient.userId.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to update this patient record.');
    }

    const {
      name,
      email,
      phone,
      isActive,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      emergencyContact,
    } = req.body;

    // Update linked User record
    const user = await User.findById(patient.userId);
    if (user) {
      if (name !== undefined) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (email !== undefined && email.toLowerCase().trim() !== user.email) {
        const emailExists = await User.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: user._id },
        });
        if (emailExists) {
          res.status(400);
          throw new Error('Email address is already in use by another account.');
        }
        user.email = email.toLowerCase().trim();
      }
      if (typeof isActive === 'boolean' && req.user.role === 'admin') {
        user.isActive = isActive;
      }
      await user.save();
    }

    // Update Patient record
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (gender !== undefined) patient.gender = gender;
    if (address !== undefined) patient.address = address.trim();
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (emergencyContact !== undefined) {
      patient.emergencyContact = {
        name: emergencyContact.name ?? patient.emergencyContact?.name ?? '',
        phone: emergencyContact.phone ?? patient.emergencyContact?.phone ?? '',
        relation: emergencyContact.relation ?? patient.emergencyContact?.relation ?? '',
      };
    }

    await patient.save();

    const updatedPatient = await Patient.findById(patient._id).populate(
      'userId',
      'name email phone profileImage isActive createdAt'
    );

    res.status(200).json({
      success: true,
      message: 'Patient details updated successfully.',
      patient: updatedPatient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete patient profile and linked user account
 * @route   DELETE /api/patients/:id
 * @access  Private (Admin only)
 */
export const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      res.status(404);
      throw new Error('Patient record not found.');
    }

    // Remove associated clinical & billing records and user account
    await Promise.all([
      Appointment.deleteMany({ patientId: patient._id }),
      MedicalRecord.deleteMany({ patientId: patient._id }),
      Prescription.deleteMany({ patientId: patient._id }),
      Bill.deleteMany({ patientId: patient._id }),
      User.findByIdAndDelete(patient.userId),
      Patient.findByIdAndDelete(patient._id),
    ]);

    res.status(200).json({
      success: true,
      message: 'Patient and associated records deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
