import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  User,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/axios';

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, ptRes] = await Promise.all([
        api.get('/medical-records', {
          params: { patientId: selectedPatientFilter },
        }),
        api.get('/patients', { params: { limit: 100 } }),
      ]);
      setRecords(recRes.data.records || []);
      const pts = ptRes.data.patients || [];
      setPatients(pts);
      setFormData((prev) => ({
        ...prev,
        patientId: prev.patientId || pts[0]?._id || '',
      }));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to load medical records.',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await api.post('/medical-records', {
        patientId: formData.patientId,
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        treatment: formData.treatment,
        notes: formData.notes,
      });
      showToast('success', 'Clinical medical record saved successfully.');
      setIsModalOpen(false);
      setFormData((prev) => ({
        ...prev,
        diagnosis: '',
        symptoms: '',
        treatment: '',
        notes: '',
      }));
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save medical record.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((rec) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const ptName = rec.patientId?.userId?.name?.toLowerCase() || '';
    const diag = rec.diagnosis?.toLowerCase() || '';
    const treat = rec.treatment?.toLowerCase() || '';
    return ptName.includes(q) || diag.includes(q) || treat.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Patient Medical Histories &amp; Clinical Records
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Document clinical diagnoses, reported symptoms, and long-term treatment plans.
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
          Add Medical Record
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

      {/* Search & Patient Filter */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, diagnosis, or treatment..."
              className="input-field pl-10"
            />
          </div>

          <div>
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
      </div>

      {/* Records List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          Loading clinical medical records...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          No medical records found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rec) => (
            <div
              key={rec._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-50 text-medical-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {rec.diagnosis}
                    </h3>
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <User className="h-3.5 w-3.5 text-medical-600" />
                        Patient: {rec.patientId?.userId?.name || 'Patient'}
                      </span>
                      <span>•</span>
                      <span>Attending: {rec.doctorId?.userId?.name || 'Doctor'}</span>
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(rec.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Reported Symptoms
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {rec.symptoms && rec.symptoms.length > 0 ? (
                      rec.symptoms.map((sym, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200"
                        >
                          {sym}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Treatment Plan
                  </p>
                  <p className="mt-1 text-sm text-slate-800">{rec.treatment}</p>
                </div>
              </div>

              {rec.notes && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
                  <strong>Clinical Notes:</strong> {rec.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Medical Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                New Clinical Medical Record
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
                  Patient *
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) =>
                    setFormData({ ...formData, patientId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.userId?.name} ({pt.bloodGroup})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Primary Diagnosis *
                </label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  placeholder="e.g. Acute Bronchitis / Stage 1 Hypertension"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Symptoms (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.symptoms}
                  onChange={(e) =>
                    setFormData({ ...formData, symptoms: e.target.value })
                  }
                  placeholder="e.g. Persistent cough, Mild fever, Fatigue"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Treatment Plan *
                </label>
                <textarea
                  rows={3}
                  value={formData.treatment}
                  onChange={(e) =>
                    setFormData({ ...formData, treatment: e.target.value })
                  }
                  placeholder="Prescribed therapy, lifestyle adjustments, and follow-up schedule..."
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Additional Physician Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {submitting ? 'Saving...' : 'Save Medical Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsPage;
