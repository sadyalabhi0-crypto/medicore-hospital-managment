import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Save, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import api from '../../api/axios';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DoctorAvailabilityPage = () => {
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [consultationFee, setConsultationFee] = useState(150);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors/me/profile');
      const doc = data.doctor;
      setDoctor(doc);
      setConsultationFee(doc.consultationFee ?? 150);

      // Normalize all 7 days of the week
      const existingMap = {};
      (doc.availability || []).forEach((s) => {
        existingMap[s.day] = s;
      });

      const normalized = WEEKDAYS.map((day) => ({
        day,
        startTime: existingMap[day]?.startTime || '09:00',
        endTime: existingMap[day]?.endTime || '17:00',
        isAvailable:
          existingMap[day]?.isAvailable !== undefined
            ? existingMap[day].isAvailable
            : !['Saturday', 'Sunday'].includes(day),
      }));

      setSlots(normalized);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to load availability settings.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSlotChange = (index, field, value) => {
    setSlots((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.put('/doctors/me/availability', {
        availability: slots,
        consultationFee: Number(consultationFee),
      });
      setFeedback({
        type: 'success',
        message: 'Weekly availability and consultation fee saved successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update schedule.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
        Loading your weekly schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manage Weekly Availability
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure your consultation days, shift hours, and standard consultation fee.
          </p>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Consultation Fee Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Standard Consultation Fee
              </h2>
              <p className="text-xs text-slate-500">
                {doctor?.specialization} • {doctor?.departmentId?.name || 'General'}
              </p>
            </div>

            <div className="relative w-44">
              <DollarSign className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="number"
                min="0"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="input-field pl-9 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Weekly Slots Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-medical-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Weekly Shift Schedule</h2>
              <p className="text-xs text-slate-500">
                Toggle active days and specify your consultation hours
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {slots.map((slot, idx) => (
              <div
                key={slot.day}
                className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3 min-w-[160px]">
                  <input
                    type="checkbox"
                    id={`day-${slot.day}`}
                    checked={slot.isAvailable}
                    onChange={(e) =>
                      handleSlotChange(idx, 'isAvailable', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-medical-600 focus:ring-medical-500"
                  />
                  <label
                    htmlFor={`day-${slot.day}`}
                    className={`text-sm font-semibold ${
                      slot.isAvailable ? 'text-slate-900' : 'text-slate-400 line-through'
                    }`}
                  >
                    {slot.day}
                  </label>
                </div>

                {slot.isAvailable ? (
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="mr-2 text-xs text-slate-500">From</span>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleSlotChange(idx, 'startTime', e.target.value)
                        }
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="mr-2 text-xs text-slate-500">To</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleSlotChange(idx, 'endTime', e.target.value)
                        }
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    Off Duty / Unavailable
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" />
              {saving ? 'Saving Schedule...' : 'Save Weekly Schedule'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DoctorAvailabilityPage;
