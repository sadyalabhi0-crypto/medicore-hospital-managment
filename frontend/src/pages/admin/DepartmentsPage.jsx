import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  X,
  Stethoscope,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';

const INITIAL_FORM = {
  name: '',
  description: '',
  headDoctor: '',
  status: 'active',
};

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deletingDept, setDeletingDept] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, docRes] = await Promise.all([
        api.get('/departments'),
        api.get('/doctors'),
      ]);
      setDepartments(deptRes.data.departments || []);
      setDoctors(docRes.data.doctors || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Unable to load departments.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData(INITIAL_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      description: dept.description || '',
      headDoctor: dept.headDoctor?._id || '',
      status: dept.status || 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept._id}`, formData);
        showToast('success', 'Department updated successfully.');
      } else {
        await api.post('/departments', formData);
        showToast('success', 'New department created successfully.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      await api.delete(`/departments/${deletingDept._id}`);
      showToast('success', 'Department deleted.');
      setDeletingDept(null);
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete department.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hospital Clinical Departments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize clinical specialties, assign department heads, and manage operational status.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Department
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

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          Loading hospital departments...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medical-50 text-medical-600 border border-medical-100">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                      <p className="text-xs text-slate-500">
                        {dept.doctorCount || 0} Assigned Specialists
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={dept.status} />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-600">
                  {dept.description}
                </p>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Head of Department
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-800">
                    <Stethoscope className="h-3.5 w-3.5 text-medical-600" />
                    {dept.headDoctor?.userId?.name || 'Not assigned'}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => openEditModal(dept)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeletingDept(dept)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingDept ? 'Edit Department' : 'Create Department'}
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
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dermatology"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe clinical services and specialties offered..."
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Head Doctor
                  </label>
                  <select
                    value={formData.headDoctor}
                    onChange={(e) => setFormData({ ...formData, headDoctor: e.target.value })}
                    className="input-field"
                  >
                    <option value="">None Assigned</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.userId?.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Operational Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
                  {submitting ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Department?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Delete <strong>{deletingDept.name}</strong>? Doctors in this department will remain
              active but become unassigned.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setDeletingDept(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
