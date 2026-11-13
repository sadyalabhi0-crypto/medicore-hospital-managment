import express from 'express';
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getMyDoctorProfile,
  updateMyAvailability,
} from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/me/profile', authorize('doctor'), getMyDoctorProfile);
router.put('/me/availability', authorize('doctor'), updateMyAvailability);

router
  .route('/')
  .get(getDoctors)
  .post(authorize('admin'), createDoctor);

router
  .route('/:id')
  .get(getDoctorById)
  .put(authorize('admin', 'doctor'), updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

export default router;
