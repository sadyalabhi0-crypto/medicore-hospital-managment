import Bill from '../models/Bill.js';
import Patient from '../models/Patient.js';

/**
 * @desc    Get bills (all for Admin/Receptionist, own bills for Patient)
 * @route   GET /api/bills
 * @access  Private (Admin, Receptionist, Patient)
 */
export const getBills = async (req, res, next) => {
  try {
    const { paymentStatus = '', patientId = '' } = req.query;
    const filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (req.user.role === 'patient') {
      const pt = await Patient.findOne({ userId: req.user._id });
      if (!pt) {
        return res.status(200).json({
          success: true,
          count: 0,
          summary: { totalPaid: 0, totalPending: 0, totalBills: 0 },
          bills: [],
        });
      }
      filter.patientId = pt._id;
    } else if (patientId) {
      filter.patientId = patientId;
    }

    const bills = await Bill.find(filter)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime reason status doctorId',
        populate: {
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        },
      })
      .sort({ createdAt: -1 });

    const totalPaid = bills
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    const totalPending = bills
      .filter((b) => b.paymentStatus === 'pending')
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    res.status(200).json({
      success: true,
      count: bills.length,
      summary: {
        totalPaid,
        totalPending,
        totalBills: bills.length,
      },
      bills,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new invoice / bill
 * @route   POST /api/bills
 * @access  Private (Admin, Receptionist)
 */
export const createBill = async (req, res, next) => {
  try {
    const { patientId, appointmentId, amount, paymentStatus, paymentMethod } = req.body;

    if (!patientId || amount === undefined) {
      res.status(400);
      throw new Error('Patient and bill amount are required.');
    }

    const bill = await Bill.create({
      patientId,
      appointmentId: appointmentId || null,
      amount: Number(amount),
      paymentStatus: paymentStatus || 'pending',
      paymentMethod:
        paymentStatus === 'paid' && (!paymentMethod || paymentMethod === 'unpaid')
          ? 'card'
          : paymentMethod || 'unpaid',
    });

    const populated = await Bill.findById(bill._id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime reason status',
      });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully.',
      bill: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update bill payment status & payment method
 * @route   PUT /api/bills/:id
 * @access  Private (Admin, Receptionist, Patient)
 */
export const updateBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      res.status(404);
      throw new Error('Bill not found.');
    }

    // If patient is paying their own bill, verify ownership
    if (req.user.role === 'patient') {
      const pt = await Patient.findOne({ userId: req.user._id });
      if (!pt || bill.patientId.toString() !== pt._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this bill.');
      }
    }

    const { amount, paymentStatus, paymentMethod } = req.body;

    if (amount !== undefined && req.user.role !== 'patient') {
      bill.amount = Number(amount);
    }
    if (paymentStatus !== undefined) {
      bill.paymentStatus = paymentStatus;
    }
    if (paymentMethod !== undefined) {
      bill.paymentMethod = paymentMethod;
    }

    await bill.save();

    const populated = await Bill.findById(bill._id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime reason status',
      });

    res.status(200).json({
      success: true,
      message: 'Billing record updated successfully.',
      bill: populated,
    });
  } catch (error) {
    next(error);
  }
};
