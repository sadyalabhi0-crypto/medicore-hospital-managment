import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CalendarPlus,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';

const todayISO = () => new Date().toISOString().split('T')[0];

const AppointmentsPage = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  // List & filter state
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Reference lists for booking modal
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Booking Modal state
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: todayISO(),
    appointmentTime: '09:00',
    reason: '',
    notes: '',
  });
  const [slotInfo, setSlotInfo] = useState({
    allSlots: [],
    bookedSlots: [],
    isDayAvailable: true,
    loading: false,
  });
  const [bookError, setBookError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reschedule / Edit Notes Modal state
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    status: 'scheduled',
    notes: '',
  });
  const [rescheduleError, setRescheduleError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments', {
        params: {
          status: statusFilter,
          date: dateFilter,
          page,
          limit: 10,
        },
      });
      setAppointments(data.appointments || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load appointments.',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const loadPatientsAndDoctors = useCallback(async () => {
    if (!isStaff) return;
    try {
      const [ptRes, docRes] = await Promise.all([
        api.get('/patients', { params: { limit: 100 } }),
        api.get('/doctors'),
      ]);
      const pts = ptRes.data.patients || [];
      const docs = docRes.data.doctors || [];
      setPatients(pts);
      setDoctors(docs);
      setBookForm((prev) => ({
        ...prev,
        patientId: prev.patientId || pts[0]?._id || '',
        doctorId: prev.doctorId || docs[0]?._id || '',
      }));
    } catch (err) {
      console.error('Error loading booking references:', err);
    }
  }, [isStaff]);

  useEffect(() => {
    loadPatientsAndDoctors();
  }, [loadPatientsAndDoctors]);

  // Fetch available slots whenever doctorId or appointmentDate changes in booking modal
  useEffect(() => {
    if (!isBookOpen || !bookForm.doctorId || !bookForm.appointmentDate) return;

    let active = true;
    const fetchSlots = async () => {
      setSlotInfo((prev) => ({ ...prev, loading: true }));
      try {
        const { data } = await api.get('/appointments/booked-slots', {
          params: {
            doctorId: bookForm.doctorId,
            date: bookForm.appointmentDate,
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
        if (available.length > 0 && !available.includes(bookForm.appointmentTime)) {
          setBookForm((prev) => ({ ...prev, appointmentTime: available[0] }));
        }
      } catch (err) {
        if (active) setSlotInfo((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchSlots();
    return () => {
      active = false;
    };
  }, [isBookOpen, bookForm.doctorId, bookForm.appointmentDate]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleQuickStatusUpdate = async (apptId, newStatus) => {
    try {
      await api.put(`/appointments/${apptId}`, { status: newStatus });
      showToast('success', `Appointment marked as ${newStatus}.`);
      fetchAppointments();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDeleteAppointment = async (apptId) => {
    try {
      await api.delete(`/appointments/${apptId}`);
      showToast('success', 'Appointment deleted.');
      fetchAppointments();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete appointment.');
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookError('');
    setSubmitting(true);

    try {
      await api.post('/appointments', bookForm);
      showToast('success', 'Appointment booked and consultation invoice generated.');
      setIsBookOpen(false);
      setBookForm((prev) => ({ ...prev, reason: '', notes: '' }));
      fetchAppointments();
    } catch (err) {
      setBookError(
        err.response?.data?.message || 'Unable to book appointment. Slot may be taken.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openRescheduleModal = (appt) => {
    setReschedulingAppt(appt);
    setRescheduleForm({
      appointmentDate: appt.appointmentDate,
      appointmentTime: appt.appointmentTime,
      status: appt.status,
      notes: appt.notes || '',
    });
    setRescheduleError('');
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setRescheduleError('');
    setSubmitting(true);
    try {
      await api.put(`/appointments/${reschedulingAppt._id}`, rescheduleForm);
      showToast('success', 'Appointment updated successfully.');
      setReschedulingAppt(null);
      fetchAppointments();
    } catch (err) {
      setRescheduleError(
        err.response?.data?.message || 'Conflict detected while rescheduling.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user?.role === 'doctor'
              ? 'My Assigned Patient Appointments'
              : 'Appointment Scheduling & Queue Management'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {user?.role === 'doctor'
              ? 'Review scheduled consultations, update visit status, and add clinical notes.'
              : 'Book new consultations with double-booking protection, manage patient check-ins, and reschedule visits.'}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => {
              setBookError('');
              setIsBookOpen(true);
            }}
            className="btn-primary self-start sm:self-auto"
          >
            <CalendarPlus className="h-4 w-4" />
            Book New Appointment
          </button>
        )}
      </div>

      {/* Feedback Banner */}
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

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="checked-in">Checked-In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-400">
              Filter by Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDateFilter(todayISO());
                setPage(1);
              }}
              className="btn-secondary text-xs py-2.5"
            >
              Today&apos;s Queue
            </button>
            {(statusFilter || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('');
                  setDateFilter('');
                  setPage(1);
                }}
                className="text-xs font-semibold text-medical-600 hover:underline px-2 py-2.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-medical-600" />
            <span className="text-sm font-bold text-slate-900">
              Appointments ({total})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-6 pr-4">Date &amp; Time</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Doctor &amp; Dept</th>
                <th className="py-3.5 px-4">Reason &amp; Notes</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No appointments found for the selected filters.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/70">
                    <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{appt.appointmentDate}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 rounded bg-medical-50 px-2 py-0.5 text-xs font-semibold text-medical-700">
                        <Clock className="h-3 w-3" /> {appt.appointmentTime}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">
                        {appt.patientId?.userId?.name || 'Patient'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {appt.patientId?.userId?.phone}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-800">
                        {appt.doctorId?.userId?.name || 'Doctor'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {appt.doctorId?.departmentId?.name || appt.doctorId?.specialization}
                      </p>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-slate-800 truncate">{appt.reason}</p>
                      {appt.notes && (
                        <p className="text-xs text-slate-400 italic truncate">
                          Note: {appt.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {appt.status === 'scheduled' && (
                          <button
                            onClick={() =>
                              handleQuickStatusUpdate(appt._id, 'checked-in')
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                            title="Mark Patient Checked-In"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Check-In
                          </button>
                        )}

                        {(appt.status === 'scheduled' ||
                          appt.status === 'checked-in') && (
                          <button
                            onClick={() =>
                              handleQuickStatusUpdate(appt._id, 'completed')
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            title="Complete Consultation"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                          </button>
                        )}

                        <button
                          onClick={() => openRescheduleModal(appt)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          title="Reschedule / Edit Notes"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button
                            onClick={() =>
                              handleQuickStatusUpdate(appt._id, 'cancelled')
                            }
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Cancel Appointment"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        {isStaff && (
                          <button
                            onClick={() => handleDeleteAppointment(appt._id)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5">
            <p className="text-xs text-slate-500">
              Page <strong>{page}</strong> of <strong>{pages}</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: BOOK NEW APPOINTMENT (ADMIN / RECEPTIONIST)
         ===================================================================== */}
      {isBookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Book Patient Appointment</h2>
                <p className="text-xs text-slate-500">
                  Real-time slot conflict checking prevents double-booking doctors.
                </p>
              </div>
              <button
                onClick={() => setIsBookOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {bookError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {bookError}
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Select Patient *
                </label>
                <select
                  value={bookForm.patientId}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, patientId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Choose Patient</option>
                  {patients.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.userId?.name} ({pt.userId?.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Select Specialist Doctor *
                </label>
                <select
                  value={bookForm.doctorId}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, doctorId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Choose Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.userId?.name} — {doc.specialization} (${doc.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    min={todayISO()}
                    value={bookForm.appointmentDate}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, appointmentDate: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Available Time Slot *
                  </label>
                  <select
                    value={bookForm.appointmentTime}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, appointmentTime: e.target.value })
                    }
                    className="input-field"
                    required
                  >
                    {slotInfo.allSlots.length === 0 ? (
                      <option value="09:00">09:00</option>
                    ) : (
                      slotInfo.allSlots.map((slot) => {
                        const isTaken = slotInfo.bookedSlots.includes(slot);
                        return (
                          <option key={slot} value={slot} disabled={isTaken}>
                            {slot} {isTaken ? '(Booked)' : '(Available)'}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              {!slotInfo.isDayAvailable && (
                <p className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                  Note: The selected doctor marks this weekday as off-duty in their weekly
                  schedule.
                </p>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Reason for Visit *
                </label>
                <input
                  type="text"
                  value={bookForm.reason}
                  onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                  placeholder="e.g. Follow-up cardiology consultation"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Clinical / Front-Desk Notes
                </label>
                <textarea
                  rows={2}
                  value={bookForm.notes}
                  onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                  placeholder="Optional check-in or triage notes..."
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBookOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: RESCHEDULE / UPDATE STATUS & NOTES
         ===================================================================== */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Reschedule / Update Appointment
                </h2>
                <p className="text-xs text-slate-500">
                  {reschedulingAppt.patientId?.userId?.name} with{' '}
                  {reschedulingAppt.doctorId?.userId?.name}
                </p>
              </div>
              <button
                onClick={() => setReschedulingAppt(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {rescheduleError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {rescheduleError}
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleForm.appointmentDate}
                    onChange={(e) =>
                      setRescheduleForm({
                        ...rescheduleForm,
                        appointmentDate: e.target.value,
                      })
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={rescheduleForm.appointmentTime}
                    onChange={(e) =>
                      setRescheduleForm({
                        ...rescheduleForm,
                        appointmentTime: e.target.value,
                      })
                    }
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Appointment Status
                </label>
                <select
                  value={rescheduleForm.status}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, status: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="checked-in">Checked-In</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={rescheduleForm.notes}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, notes: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setReschedulingAppt(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : 'Update Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
