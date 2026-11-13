import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  isActive: true,
};

const ReceptionistsPage = () => {
  const [receptionists, setReceptionists] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingRec, setDeletingRec] = useState(null);

  const fetchReceptionists = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/receptionists', {
        params: { search: search.trim() },
      });
      setReceptionists(data.receptionists || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load receptionists.',
      });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchReceptionists();
  }, [fetchReceptionists]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const openCreateModal = () => {
    setEditingRec(null);
    setFormData(INITIAL_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (rec) => {
    setEditingRec(rec);
    setFormData({
      name: rec.name || '',
      email: rec.email || '',
      password: '',
      phone: rec.phone || '',
      isActive: rec.isActive ?? true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingRec) {
        await api.put(`/receptionists/${editingRec._id}`, formData);
        showToast('success', 'Receptionist account updated.');
      } else {
        await api.post('/receptionists', formData);
        showToast('success', 'Receptionist account created.');
      }
      setIsModalOpen(false);
      fetchReceptionists();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save receptionist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRec) return;
    try {
      await api.delete(`/receptionists/${deletingRec._id}`);
      showToast('success', 'Receptionist removed.');
      setDeletingRec(null);
      fetchReceptionists();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete receptionist.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Receptionist Staff Accounts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage front-desk coordinators authorized to register patients and manage check-ins.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary self-start sm:self-auto">
          <UserPlus className="h-4 w-4" />
          Add Receptionist
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

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receptionist by name, email, or phone..."
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-6 pr-4">Staff Member</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    Loading receptionist accounts...
                  </td>
                </tr>
              ) : receptionists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No receptionist accounts found.
                  </td>
                </tr>
              ) : (
                receptionists.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/70">
                    <td className="py-4 pl-6 pr-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-medical-50 text-medical-600">
                          <UserCheck className="h-4 w-4" />
                        </div>
                        {rec.name}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{rec.email}</td>
                    <td className="py-4 px-4 text-slate-600">{rec.phone}</td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={rec.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(rec)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingRec(rec)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Receptionist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingRec ? 'Edit Receptionist' : 'New Receptionist Account'}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  {editingRec ? 'New Password (leave blank to keep)' : 'Password (optional)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Defaults to Password123!"
                  className="input-field"
                />
              </div>

              {editingRec && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="recActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-medical-600"
                  />
                  <label htmlFor="recActive" className="text-sm font-medium text-slate-700">
                    Account is active
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Receptionist?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Permanently remove <strong>{deletingRec.name}</strong> from front-desk access?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setDeletingRec(null)} className="btn-secondary">
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

export default ReceptionistsPage;
