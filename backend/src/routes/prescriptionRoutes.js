import express from 'express';
import {
  getAllPrescriptions,
  getPrescriptionsByPatient,
  createPrescription,
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'doctor', 'patient'), getAllPrescriptions)
  .post(authorize('admin', 'doctor'), createPrescription);

router.get('/:patientId', getPrescriptionsByPatient);

export default router;
