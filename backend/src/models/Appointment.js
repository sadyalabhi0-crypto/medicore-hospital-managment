import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    appointmentDate: {
      type: String, // Stored as YYYY-MM-DD for reliable slot matching
      required: [true, 'Appointment date is required'],
    },
    appointmentTime: {
      type: String, // e.g., "10:30"
      required: [true, 'Appointment time is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for visit is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'checked-in', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast slot lookup to prevent double booking
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, appointmentTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
