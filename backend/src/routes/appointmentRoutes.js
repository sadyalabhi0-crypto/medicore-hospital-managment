import express from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getDoctorSlots,
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/booked-slots', getDoctorSlots);

router
  .route('/')
  .get(getAppointments)
  .post(authorize('admin', 'receptionist', 'patient'), createAppointment);

router
  .route('/:id')
  .get(getAppointmentById)
  .put(updateAppointment)
  .delete(authorize('admin', 'receptionist'), deleteAppointment);

export default router;
