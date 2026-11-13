import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new patient account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
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

    if (!name || !email || !password || !phone) {
      res.status(400);
      throw new Error('Please provide name, email, password, and phone number.');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400);
      throw new Error('An account with this email already exists.');
    }

    // Create User (default role: patient for public self-registration)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'patient',
    });

    // Create linked Patient profile
    const patientProfile = await Patient.create({
      userId: user._id,
      dateOfBirth: dateOfBirth || new Date('1995-01-01'),
      gender: gender || 'Other',
      address: address || 'Not specified',
      bloodGroup: bloodGroup || 'Unknown',
      emergencyContact: emergencyContact || { name: '', phone: '', relation: '' },
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isActive: user.isActive,
        patientProfileId: patientProfile._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide both email and password.');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password.');
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated. Please contact administration.');
    }

    let roleProfile = null;
    if (user.role === 'patient') {
      roleProfile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      roleProfile = await Doctor.findOne({ userId: user._id }).populate('departmentId', 'name');
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isActive: user.isActive,
        roleProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let roleProfile = null;
    if (user.role === 'patient') {
      roleProfile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      roleProfile = await Doctor.findOne({ userId: user._id }).populate('departmentId', 'name');
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        isActive: user.isActive,
        createdAt: user.createdAt,
        roleProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};
