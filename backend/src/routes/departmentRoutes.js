import express from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getDepartments)
  .post(authorize('admin'), createDepartment);

router
  .route('/:id')
  .put(authorize('admin'), updateDepartment)
  .delete(authorize('admin'), deleteDepartment);

export default router;
