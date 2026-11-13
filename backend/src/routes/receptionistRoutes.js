import express from 'express';
import {
  getReceptionists,
  createReceptionist,
  updateReceptionist,
  deleteReceptionist,
} from '../controllers/receptionistController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getReceptionists).post(createReceptionist);
router.route('/:id').put(updateReceptionist).delete(deleteReceptionist);

export default router;
