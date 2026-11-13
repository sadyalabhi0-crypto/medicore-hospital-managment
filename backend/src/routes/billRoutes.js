import express from 'express';
import { getBills, createBill, updateBill } from '../controllers/billController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'receptionist', 'patient'), getBills)
  .post(authorize('admin', 'receptionist'), createBill);

router.put('/:id', authorize('admin', 'receptionist', 'patient'), updateBill);

export default router;
