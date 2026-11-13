import User from '../models/User.js';

/**
 * @desc    Get all receptionist accounts
 * @route   GET /api/receptionists
 * @access  Private (Admin)
 */
export const getReceptionists = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const filter = { role: 'receptionist' };

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const receptionists = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: receptionists.length,
      receptionists,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new receptionist account
 * @route   POST /api/receptionists
 * @access  Private (Admin)
 */
export const createReceptionist = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !phone) {
      res.status(400);
      throw new Error('Please provide name, email, and phone number.');
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(400);
      throw new Error('An account with this email already exists.');
    }

    const receptionist = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password && password.trim().length >= 6 ? password.trim() : 'Password123!',
      phone: phone.trim(),
      role: 'receptionist',
    });

    res.status(201).json({
      success: true,
      message: 'Receptionist account created successfully.',
      receptionist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update receptionist account
 * @route   PUT /api/receptionists/:id
 * @access  Private (Admin)
 */
export const updateReceptionist = async (req, res, next) => {
  try {
    const receptionist = await User.findOne({
      _id: req.params.id,
      role: 'receptionist',
    });

    if (!receptionist) {
      res.status(404);
      throw new Error('Receptionist account not found.');
    }

    const { name, email, phone, isActive, password } = req.body;

    if (name !== undefined) receptionist.name = name.trim();
    if (phone !== undefined) receptionist.phone = phone.trim();
    if (typeof isActive === 'boolean') receptionist.isActive = isActive;
    if (email !== undefined && email.toLowerCase().trim() !== receptionist.email) {
      const dup = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: receptionist._id },
      });
      if (dup) {
        res.status(400);
        throw new Error('Email is already in use by another account.');
      }
      receptionist.email = email.toLowerCase().trim();
    }
    if (password && password.trim().length >= 6) {
      receptionist.password = password.trim();
    }

    await receptionist.save();

    res.status(200).json({
      success: true,
      message: 'Receptionist account updated successfully.',
      receptionist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete receptionist account
 * @route   DELETE /api/receptionists/:id
 * @access  Private (Admin)
 */
export const deleteReceptionist = async (req, res, next) => {
  try {
    const receptionist = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'receptionist',
    });

    if (!receptionist) {
      res.status(404);
      throw new Error('Receptionist account not found.');
    }

    res.status(200).json({
      success: true,
      message: 'Receptionist account deleted.',
    });
  } catch (error) {
    next(error);
  }
};
