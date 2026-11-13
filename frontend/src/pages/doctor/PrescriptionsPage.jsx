import React, { useState, useEffect, useCallback } from 'react';
import {
  Pill,
  Plus,
  Trash2,
  User,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/axios';

const EMPTY_MEDICINE = {
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
};

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Issue Prescription Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }]);
  const [instructions, setInstructions] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prescRes, ptRes] = await Promise.all([
        api.get('/prescriptions', {
          params: { patientId: selectedPatientFilter },
        }),
        api.get('/patients', { params: { limit: 100 } }),
      ]);
      setPrescriptions(prescRes.data.prescriptions || []);
      const pts = ptRes.data.patients || [];
      setPatients(pts);
      setPatientId((prev) => prev || pts[0]?._id || '');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to load prescriptions.',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPatientFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const addMedicineRow = () => {
    setMedicines((prev) => [...prev, { ...EMPTY_MEDICINE }]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length <= 1) return;
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await api.post('/prescriptions', {
        patientId,
        medicines,
        instructions,
      });
      showToast('success', 'Digital prescription issued successfully.');
      setIsModalOpen(false);
      setMedicines([{ ...EMPTY_MEDICINE }]);
      setInstructions('');
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to issue prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Electronic Prescriptions (e-Rx)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Issue structured medication regimens with dosage, frequency, and duration for patients.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setIsModalOpen(true);
          }}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Issue New Prescription
        </button>
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

      {/* Filter by Patient */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="max-w-sm">
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Filter by Patient
          </label>
          <select
            value={selectedPatientFilter}
            onChange={(e) => setSelectedPatientFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Patients</option>
            {patients.map((pt) => (
              <option key={pt._id} value={pt._id}>
                {pt.userId?.name} ({pt.bloodGroup})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prescriptions Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          Loading prescriptions...
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          No prescriptions issued yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {prescriptions.map((pr) => (
            <div
              key={pr._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-50 text-medical-600">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {pr.patientId?.userId?.name || 'Patient'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Prescribed by {pr.doctorId?.userId?.name || 'Doctor'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(pr.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {pr.medicines?.map((med, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{med.name}</span>
                      <span className="ml-2 rounded bg-medical-100 px-2 py-0.5 font-semibold text-medical-700">
                        {med.dosage}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      {med.frequency} • <strong>{med.duration}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {pr.instructions && (
                <p className="mt-4 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900 border border-amber-100">
                  <strong>Instructions:</strong> {pr.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Issue Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Issue Digital Prescription
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Select Patient *
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Choose Patient</option>
                  {patients.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.userId?.name} ({pt.bloodGroup})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase text-slate-600">
                    Medications *
                  </label>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-medical-600 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Another Medicine
                  </button>
                </div>

                {medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-9"
                  >
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Medicine Name *"
                        value={med.name}
                        onChange={(e) =>
                          handleMedicineChange(idx, 'name', e.target.value)
                        }
                        className="input-field py-2 text-xs"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={med.dosage}
                        onChange={(e) =>
                          handleMedicineChange(idx, 'dosage', e.target.value)
                        }
                        className="input-field py-2 text-xs"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Frequency (e.g. Twice daily)"
                        value={med.frequency}
                        onChange={(e) =>
                          handleMedicineChange(idx, 'frequency', e.target.value)
                        }
                        className="input-field py-2 text-xs"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Duration (7 days)"
                        value={med.duration}
                        onChange={(e) =>
                          handleMedicineChange(idx, 'duration', e.target.value)
                        }
                        className="input-field py-2 text-xs"
                        required
                      />
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(idx)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Special Instructions &amp; Dietary Advice
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Take after meals with plenty of water..."
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Issuing...' : 'Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsPage;
