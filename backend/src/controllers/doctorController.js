import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Department from '../models/Department.js';
import Appointment from '../models/Appointment.js';

const DEFAULT_AVAILABILITY = [
  { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
  { day: 'Saturday', startTime: '10:00', endTime: '14:00', isAvailable: false },
  { day: 'Sunday', startTime: '10:00', endTime: '14:00', isAvailable: false },
];

/**
 * @desc    Get all doctors with search & department/specialization filters
 * @route   GET /api/doctors
 * @access  Private (All authenticated roles)
 */
export const getDoctors = async (req, res, next) => {
  try {
    const { search = '', departmentId = '', specialization = '' } = req.query;

    const filter = {};
    if (departmentId) filter.departmentId = departmentId;
    if (specialization) {
      filter.specialization = { $regex: new RegExp(specialization.trim(), 'i') };
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        role: 'doctor',
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      }).select('_id');

      filter.$or = [
        { userId: { $in: matchingUsers.map((u) => u._id) } },
        { specialization: regex },
        { qualification: regex },
      ];
    }

    const doctors = await Doctor.find(filter)
      .populate('userId', 'name email phone profileImage isActive createdAt')
      .populate('departmentId', 'name status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single doctor profile by ID
 * @route   GET /api/doctors/:id
 * @access  Private
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone profileImage isActive createdAt')
      .populate('departmentId', 'name description status');

    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found.');
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new doctor (creates User + Doctor profile)
 * @route   POST /api/doctors
 * @access  Private (Admin)
 */
export const createDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      departmentId,
      qualification,
      experience,
      consultationFee,
      availability,
    } = req.body;

    if (!name || !email || !phone || !specialization || !qualification) {
      res.status(400);
      throw new Error(
        'Please provide name, email, phone, specialization, and qualification.'
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400);
      throw new Error('An account with this email already exists.');
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password && password.trim().length >= 6 ? password.trim() : 'Password123!',
      phone: phone.trim(),
      role: 'doctor',
    });

    const doctor = await Doctor.create({
      userId: user._id,
      specialization: specialization.trim(),
      departmentId: departmentId || null,
      qualification: qualification.trim(),
      experience: Number(experience) || 1,
      consultationFee: Number(consultationFee) || 150,
      availability:
        Array.isArray(availability) && availability.length > 0
          ? availability
          : DEFAULT_AVAILABILITY,
    });

    const populated = await Doctor.findById(doctor._id)
      .populate('userId', 'name email phone profileImage isActive createdAt')
      .populate('departmentId', 'name status');

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully.',
      doctor: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update doctor profile & linked user account
 * @route   PUT /api/doctors/:id
 * @access  Private (Admin or the Doctor themselves)
 */
export const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found.');
    }

    if (
      req.user.role === 'doctor' &&
      doctor.userId.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to edit another doctor profile.');
    }

    const {
      name,
      email,
      phone,
      isActive,
      specialization,
      departmentId,
      qualification,
      experience,
      consultationFee,
      availability,
    } = req.body;

    const user = await User.findById(doctor.userId);
    if (user) {
      if (name !== undefined) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (email !== undefined && email.toLowerCase().trim() !== user.email) {
        const dup = await User.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: user._id },
        });
        if (dup) {
          res.status(400);
          throw new Error('Email is already in use by another account.');
        }
        user.email = email.toLowerCase().trim();
      }
      if (typeof isActive === 'boolean' && req.user.role === 'admin') {
        user.isActive = isActive;
      }
      await user.save();
    }

    if (specialization !== undefined) doctor.specialization = specialization.trim();
    if (departmentId !== undefined) doctor.departmentId = departmentId || null;
    if (qualification !== undefined) doctor.qualification = qualification.trim();
    if (experience !== undefined) doctor.experience = Number(experience);
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
    if (Array.isArray(availability)) doctor.availability = availability;

    await doctor.save();

    const updated = await Doctor.findById(doctor._id)
      .populate('userId', 'name email phone profileImage isActive createdAt')
      .populate('departmentId', 'name status');

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully.',
      doctor: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get & update logged-in doctor's own availability schedule
 * @route   GET /api/doctors/me/profile & PUT /api/doctors/me/availability
 * @access  Private (Doctor)
 */
export const getMyDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone profileImage')
      .populate('departmentId', 'name');

    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found for current user.');
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyAvailability = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found.');
    }

    const { availability, consultationFee } = req.body;
    if (Array.isArray(availability)) {
      doctor.availability = availability;
    }
    if (consultationFee !== undefined) {
      doctor.consultationFee = Number(consultationFee);
    }

    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Weekly availability schedule updated successfully.',
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete doctor profile & user account
 * @route   DELETE /api/doctors/:id
 * @access  Private (Admin)
 */
export const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found.');
    }

    await Promise.all([
      Department.updateMany({ headDoctor: doctor._id }, { $set: { headDoctor: null } }),
      Appointment.deleteMany({ doctorId: doctor._id }),
      User.findByIdAndDelete(doctor.userId),
      Doctor.findByIdAndDelete(doctor._id),
    ]);

    res.status(200).json({
      success: true,
      message: 'Doctor removed from hospital directory.',
    });
  } catch (error) {
    next(error);
  }
};
