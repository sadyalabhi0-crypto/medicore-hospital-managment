import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  X,
  Clock,
  DollarSign,
  Award,
  Building2,
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
  specialization: '',
  departmentId: '',
  qualification: '',
  experience: 5,
  consultationFee: 150,
  isActive: true,
};

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingDoctor, setDeletingDoctor] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDoctorsAndDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, deptsRes] = await Promise.all([
        api.get('/doctors', {
          params: {
            search: search.trim(),
            departmentId: departmentFilter,
          },
        }),
        api.get('/departments'),
      ]);
      setDoctors(docsRes.data.doctors || []);
      setDepartments(deptsRes.data.departments || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load doctors directory.',
      });
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter]);

  useEffect(() => {
    fetchDoctorsAndDepartments();
  }, [fetchDoctorsAndDepartments]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const openCreateModal = () => {
    setEditingDoctor(null);
    setFormData({
      ...INITIAL_FORM,
      departmentId: departments[0]?._id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (doc) => {
    setEditingDoctor(doc);
    setFormData({
      name: doc.userId?.name || '',
      email: doc.userId?.email || '',
      password: '',
      phone: doc.userId?.phone || '',
      specialization: doc.specialization || '',
      departmentId: doc.departmentId?._id || '',
      qualification: doc.qualification || '',
      experience: doc.experience ?? 1,
      consultationFee: doc.consultationFee ?? 150,
      isActive: doc.userId?.isActive ?? true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingDoctor) {
        await api.put(`/doctors/${editingDoctor._id}`, formData);
        showToast('success', 'Doctor profile updated successfully.');
      } else {
        await api.post('/doctors', formData);
        showToast('success', 'New doctor added to hospital directory.');
      }
      setIsModalOpen(false);
      fetchDoctorsAndDepartments();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save doctor profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoctor) return;
    setDeleting(true);
    try {
      await api.delete(`/doctors/${deletingDoctor._id}`);
      showToast('success', 'Doctor removed successfully.');
      setDeletingDoctor(null);
      fetchDoctorsAndDepartments();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete doctor.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Medical Staff &amp; Doctors Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Onboard hospital physicians, assign departments, and configure consultation fees.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary self-start sm:self-auto">
          <UserPlus className="h-4 w-4" />
          Add New Doctor
        </button>
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
          <div className="flex items-center gap-2.5">
            {feedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Department Filter */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name, specialization, qualification, or email..."
              className="input-field pl-10"
            />
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Clinical Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          Loading doctors directory...
        </div>
      ) : doctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          No doctors matched your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doc) => {
            const activeDays = (doc.availability || [])
              .filter((s) => s.isAvailable)
              .map((s) => s.day.slice(0, 3));

            return (
              <div
                key={doc._id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-medical-50 text-medical-600 font-bold border border-medical-100">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {doc.userId?.name}
                        </h3>
                        <p className="text-xs font-semibold text-medical-600">
                          {doc.specialization}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={doc.userId?.isActive !== false ? 'active' : 'inactive'}
                    />
                  </div>

                  <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> Department
                      </span>
                      <span className="font-semibold text-slate-800">
                        {doc.departmentId?.name || 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Award className="h-3.5 w-3.5 text-slate-400" /> Qualification
                      </span>
                      <span className="font-medium text-slate-800">
                        {doc.qualification} • {doc.experience} yrs
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Consultation Fee
                      </span>
                      <span className="font-bold text-emerald-700">
                        ${doc.consultationFee}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> Available Days
                      </span>
                      <span className="font-medium text-slate-700">
                        {activeDays.length > 0 ? activeDays.join(', ') : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="text-xs text-slate-400 truncate max-w-[170px]">
                    {doc.userId?.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingDoctor(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor'}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingDoctor
                    ? 'Update clinical credentials, department, and consultation fee.'
                    : 'Creates a physician account (default password: Password123! if left blank).'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Dr. Sarah Jenkins"
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
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="sarah.jenkins@medicore.com"
                    className="input-field"
                    required
                  />
                </div>

                {!editingDoctor && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                      Initial Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Defaults to Password123!"
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 200-0010"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Department
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Orthopedic Surgery"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Qualification *
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="e.g. MBBS, MD, FRCS"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                      Experience (Yrs) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                      Fee ($ USD) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="consultationFee"
                      value={formData.consultationFee}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>

              {editingDoctor && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="docActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-medical-600"
                  />
                  <label htmlFor="docActive" className="text-sm font-medium text-slate-700">
                    Doctor account is active and available for booking
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
                  {submitting
                    ? 'Saving...'
                    : editingDoctor
                    ? 'Save Changes'
                    : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Remove Doctor Profile?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove <strong>{deletingDoctor.userId?.name}</strong>?
              This will delete their user login and scheduled appointments.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingDoctor(null)}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Remove Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;
