import Department from '../models/Department.js';
import Doctor from '../models/Doctor.js';

/**
 * @desc    Get all clinical departments
 * @route   GET /api/departments
 * @access  Private (All authenticated roles)
 */
export const getDepartments = async (req, res, next) => {
  try {
    const { status = '' } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const departments = await Department.find(filter)
      .populate({
        path: 'headDoctor',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ name: 1 });

    // Count doctors per department
    const doctorCounts = await Doctor.aggregate([
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    doctorCounts.forEach((item) => {
      if (item._id) countMap[item._id.toString()] = item.count;
    });

    const enriched = departments.map((dept) => ({
      ...dept.toObject(),
      doctorCount: countMap[dept._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      departments: enriched,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new hospital department
 * @route   POST /api/departments
 * @access  Private (Admin)
 */
export const createDepartment = async (req, res, next) => {
  try {
    const { name, description, headDoctor, status } = req.body;

    if (!name || !description) {
      res.status(400);
      throw new Error('Department name and description are required.');
    }

    const existing = await Department.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      res.status(400);
      throw new Error('A department with this name already exists.');
    }

    const department = await Department.create({
      name: name.trim(),
      description: description.trim(),
      headDoctor: headDoctor || null,
      status: status || 'active',
    });

    const populated = await Department.findById(department._id).populate({
      path: 'headDoctor',
      populate: { path: 'userId', select: 'name email phone' },
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a department
 * @route   PUT /api/departments/:id
 * @access  Private (Admin)
 */
export const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      res.status(404);
      throw new Error('Department not found.');
    }

    const { name, description, headDoctor, status } = req.body;

    if (name !== undefined) department.name = name.trim();
    if (description !== undefined) department.description = description.trim();
    if (headDoctor !== undefined) department.headDoctor = headDoctor || null;
    if (status !== undefined) department.status = status;

    await department.save();

    const populated = await Department.findById(department._id).populate({
      path: 'headDoctor',
      populate: { path: 'userId', select: 'name email phone' },
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      department: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a department
 * @route   DELETE /api/departments/:id
 * @access  Private (Admin)
 */
export const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      res.status(404);
      throw new Error('Department not found.');
    }

    // Unlink doctors assigned to this department
    await Doctor.updateMany(
      { departmentId: department._id },
      { $set: { departmentId: null } }
    );

    await Department.findByIdAndDelete(department._id);

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
