import express from 'express';
import {
  getAllMedicalRecords,
  getMedicalRecordsByPatient,
  createMedicalRecord,
} from '../controllers/medicalRecordController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'doctor', 'patient'), getAllMedicalRecords)
  .post(authorize('admin', 'doctor'), createMedicalRecord);

router.get('/:patientId', getMedicalRecordsByPatient);

export default router;
