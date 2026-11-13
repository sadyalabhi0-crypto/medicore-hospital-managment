import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarPlus,
  Calendar,
  Clock,
  Stethoscope,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';

const todayISO = () => new Date().toISOString().split('T')[0];

const PatientAppointmentsPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = searchParams.get('doctorId') || '';

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Booking form state
  const [formData, setFormData] = useState({
    doctorId: preselectedDoctorId,
    appointmentDate: todayISO(),
    appointmentTime: '10:00',
    reason: '',
    notes: '',
  });
  const [slotInfo, setSlotInfo] = useState({
    allSlots: [],
    bookedSlots: [],
    isDayAvailable: true,
    loading: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPatientAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, docRes] = await Promise.all([
        api.get('/appointments', { params: { limit: 50 } }),
        api.get('/doctors'),
      ]);
      setAppointments(apptRes.data.appointments || []);
      const activeDocs = (docRes.data.doctors || []).filter(
        (d) => d.userId?.isActive !== false
      );
      setDoctors(activeDocs);

      setFormData((prev) => ({
        ...prev,
        doctorId: prev.doctorId || preselectedDoctorId || activeDocs[0]?._id || '',
      }));
    } catch (err) {
      console.error('Error loading patient appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [preselectedDoctorId]);

  useEffect(() => {
    fetchPatientAppointments();
  }, [fetchPatientAppointments]);

  // Fetch doctor's available time slots when doctorId or date changes
  useEffect(() => {
    if (!formData.doctorId || !formData.appointmentDate) return;

    let active = true;
    const loadSlots = async () => {
      setSlotInfo((prev) => ({ ...prev, loading: true }));
      try {
        const { data } = await api.get('/appointments/booked-slots', {
          params: {
            doctorId: formData.doctorId,
            date: formData.appointmentDate,
          },
        });
        if (!active) return;
        const available = (data.allSlots || []).filter(
          (s) => !(data.bookedSlots || []).includes(s)
        );
        setSlotInfo({
          allSlots: data.allSlots || [],
          bookedSlots: data.bookedSlots || [],
          isDayAvailable: data.isDayAvailable,
          loading: false,
        });
        if (available.length > 0 && !available.includes(formData.appointmentTime)) {
          setFormData((prev) => ({ ...prev, appointmentTime: available[0] }));
        }
      } catch (err) {
        if (active) setSlotInfo((prev) => ({ ...prev, loading: false }));
      }
    };

    loadSlots();
    return () => {
      active = false;
    };
  }, [formData.doctorId, formData.appointmentDate]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/appointments', formData);
      showToast(
        'success',
        'Your appointment has been scheduled! A consultation invoice has been added to your billing tab.'
      );
      setFormData((prev) => ({ ...prev, reason: '', notes: '' }));
      fetchPatientAppointments();
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.message || 'Unable to book this slot. Please try another time.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    try {
      await api.put(`/appointments/${apptId}`, { status: 'cancelled' });
      showToast('success', 'Appointment cancelled.');
      fetchPatientAppointments();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to cancel appointment.');
    }
  };

  const selectedDoctor = doctors.find((d) => d._id === formData.doctorId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Book &amp; Manage My Appointments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a specialist, pick an available 30-minute consultation slot, or manage your
          upcoming visits.
        </p>
      </div>

      {feedback.message && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Interactive Booking Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-1">
          <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-medical-50 text-medical-600">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Schedule New Visit</h2>
              <p className="text-xs text-slate-500">Instant slot confirmation</p>
            </div>
          </div>

          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                Specialist Doctor *
              </label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.userId?.name} — {doc.specialization} (${doc.consultationFee})
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctor && (
              <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                <p className="font-semibold text-slate-800">
                  {selectedDoctor.departmentId?.name || selectedDoctor.specialization}
                </p>
                <p className="text-slate-500">
                  Consultation Fee:{' '}
                  <strong className="text-emerald-700">
                    ${selectedDoctor.consultationFee}
                  </strong>
                </p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                Preferred Date *
              </label>
              <input
                type="date"
                min={todayISO()}
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
                className="input-field"
                required
              />
            </div>

            {/* Interactive Time Slot Grid */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-600">
                Select Time Slot *
              </label>
              {!slotInfo.isDayAvailable ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Doctor is off-duty on this day of the week. Please pick another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                  {slotInfo.allSlots.map((slot) => {
                    const isBooked = slotInfo.bookedSlots.includes(slot);
                    const isSelected = formData.appointmentTime === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        disabled={isBooked}
                        onClick={() =>
                          setFormData({ ...formData, appointmentTime: slot })
                        }
                        className={`rounded-xl border py-2 text-xs font-semibold transition ${
                          isBooked
                            ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400 line-through'
                            : isSelected
                            ? 'border-medical-600 bg-medical-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-medical-300'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                Reason for Consultation *
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Describe symptoms or checkup reason..."
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !slotInfo.isDayAvailable}
              className="btn-primary w-full py-3"
            >
              <CalendarPlus className="h-4 w-4" />
              {submitting ? 'Scheduling...' : 'Confirm Appointment'}
            </button>
          </form>
        </div>

        {/* Right: My Appointments List */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-medical-600" />
              <h2 className="text-base font-bold text-slate-900">
                My Appointments ({appointments.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading your appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              You have not booked any appointments yet.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div
                  key={appt._id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <Stethoscope className="h-4 w-4 text-medical-600" />
                      <span className="font-bold text-slate-900">
                        {appt.doctorId?.userId?.name || 'Doctor'}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({appt.doctorId?.departmentId?.name || appt.doctorId?.specialization})
                      </span>
                    </div>
                    <p className="flex items-center gap-2 text-xs font-semibold text-medical-700">
                      <Clock className="h-3.5 w-3.5" />
                      {appt.appointmentDate} at {appt.appointmentTime}
                    </p>
                    <p className="text-xs text-slate-600">Reason: {appt.reason}</p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <StatusBadge status={appt.status} />
                    {appt.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancelAppointment(appt._id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAppointmentsPage;
