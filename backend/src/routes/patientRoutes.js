import express from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'receptionist', 'doctor'), getPatients)
  .post(authorize('admin', 'receptionist'), createPatient);

router
  .route('/:id')
  .get(authorize('admin', 'receptionist', 'doctor', 'patient'), getPatientById)
  .put(authorize('admin', 'receptionist', 'patient'), updatePatient)
  .delete(authorize('admin'), deletePatient);

export default router;
