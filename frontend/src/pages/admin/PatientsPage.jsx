import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pill,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  dateOfBirth: '',
  gender: 'Male',
  bloodGroup: 'O+',
  address: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  isActive: true,
};

const PatientsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // List & filter state
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Patient Detail Modal state
  const [viewingPatient, setViewingPatient] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete confirmation state
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients', {
        params: {
          search: search.trim(),
          bloodGroup: bloodGroupFilter,
          gender: genderFilter,
          page,
          limit: 8,
        },
      });
      setPatients(data.patients || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load patient directory.',
      });
    } finally {
      setLoading(false);
    }
  }, [search, bloodGroupFilter, genderFilter, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const openCreateModal = () => {
    setEditingPatient(null);
    setFormData(INITIAL_FORM);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (pt) => {
    setEditingPatient(pt);
    const dobFormatted = pt.dateOfBirth
      ? new Date(pt.dateOfBirth).toISOString().split('T')[0]
      : '';
    setFormData({
      name: pt.userId?.name || '',
      email: pt.userId?.email || '',
      password: '',
      phone: pt.userId?.phone || '',
      dateOfBirth: dobFormatted,
      gender: pt.gender || 'Male',
      bloodGroup: pt.bloodGroup || 'Unknown',
      address: pt.address || '',
      emergencyName: pt.emergencyContact?.name || '',
      emergencyPhone: pt.emergencyContact?.phone || '',
      emergencyRelation: pt.emergencyContact?.relation || '',
      isActive: pt.userId?.isActive ?? true,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formError) setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      address: formData.address,
      isActive: formData.isActive,
      emergencyContact: {
        name: formData.emergencyName,
        phone: formData.emergencyPhone,
        relation: formData.emergencyRelation,
      },
    };

    if (!editingPatient && formData.password) {
      payload.password = formData.password;
    }

    try {
      if (editingPatient) {
        await api.put(`/patients/${editingPatient._id}`, payload);
        showToast('success', 'Patient profile updated successfully.');
      } else {
        await api.post('/patients', payload);
        showToast('success', 'New patient registered successfully.');
      }
      setIsFormOpen(false);
      fetchPatients();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'An error occurred while saving patient details.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPatient = async (patientId) => {
    setDetailLoading(true);
    setViewingPatient({ loading: true });
    try {
      const { data } = await api.get(`/patients/${patientId}`);
      setViewingPatient(data);
    } catch (err) {
      setViewingPatient(null);
      showToast('error', err.response?.data?.message || 'Failed to load patient details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPatient) return;
    setDeleting(true);
    try {
      await api.delete(`/patients/${deletingPatient._id}`);
      showToast('success', 'Patient record deleted permanently.');
      setDeletingPatient(null);
      fetchPatients();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to delete patient record.');
    } finally {
      setDeleting(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} yrs` : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Patient Management Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register walk-in patients, update demographic &amp; emergency details, and inspect
            clinical histories.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn-primary self-start sm:self-auto">
          <UserPlus className="h-4 w-4" />
          Register New Patient
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

      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by patient name, email, or phone number..."
              className="input-field pl-10"
            />
          </div>

          <div>
            <select
              value={bloodGroupFilter}
              onChange={(e) => {
                setBloodGroupFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Blood Group: {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-medical-600" />
            <span className="text-sm font-bold text-slate-900">
              Registered Patients ({total})
            </span>
          </div>
          {(search || bloodGroupFilter || genderFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setBloodGroupFilter('');
                setGenderFilter('');
                setPage(1);
              }}
              className="text-xs font-semibold text-medical-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-6 pr-4">Patient</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Demographics</th>
                <th className="py-3.5 px-4">Blood Group</th>
                <th className="py-3.5 px-4">Emergency Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    Loading patient records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No patients matched your search criteria.
                  </td>
                </tr>
              ) : (
                patients.map((pt) => (
                  <tr key={pt._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 pl-6 pr-4">
                      <p className="font-semibold text-slate-900">
                        {pt.userId?.name || 'Unnamed Patient'}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">
                        {pt.address}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-800">{pt.userId?.phone}</p>
                      <p className="text-xs text-slate-500">{pt.userId?.email}</p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-800">{pt.gender}</p>
                      <p className="text-xs text-slate-500">{calculateAge(pt.dateOfBirth)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                        {pt.bloodGroup}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {pt.emergencyContact?.name ? (
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {pt.emergencyContact.name}{' '}
                            {pt.emergencyContact.relation && (
                              <span className="font-normal text-slate-500">
                                ({pt.emergencyContact.relation})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{pt.emergencyContact.phone}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not provided</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge
                        status={pt.userId?.isActive !== false ? 'active' : 'inactive'}
                      />
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewPatient(pt._id)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-medical-50 hover:text-medical-600 hover:border-medical-200"
                          title="View Patient Details & Clinical History"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(pt)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                          title="Edit Patient"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingPatient(pt)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            title="Delete Patient (Admin)"
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

        {/* Pagination Footer */}
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
          MODAL 1: CREATE / EDIT PATIENT
         ===================================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingPatient ? 'Edit Patient Record' : 'Register New Patient'}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingPatient
                    ? 'Update demographic, contact, and emergency details.'
                    : 'Creates a patient portal account (default password: Password123! if left blank).'}
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
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
                    onChange={handleFormChange}
                    className="input-field"
                    required
                  />
                </div>

                {!editingPatient && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                      Portal Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
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
                    onChange={handleFormChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleFormChange}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                      className="input-field"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleFormChange}
                      className="input-field"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Residential Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="input-field"
                  required
                />
              </div>

              {/* Emergency Contact Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Emergency Contact Information
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergencyName"
                      value={formData.emergencyName}
                      onChange={handleFormChange}
                      placeholder="Jane Doe"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleFormChange}
                      placeholder="+1 (555) 000-0000"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyRelation"
                      value={formData.emergencyRelation}
                      onChange={handleFormChange}
                      placeholder="Spouse / Parent"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {editingPatient && isAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="h-4 w-4 rounded border-slate-300 text-medical-600 focus:ring-medical-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    Patient portal account is active
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting
                    ? 'Saving...'
                    : editingPatient
                    ? 'Save Changes'
                    : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: VIEW PATIENT CLINICAL SUMMARY
         ===================================================================== */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Patient Clinical Profile</h2>
                <p className="text-xs text-slate-500">
                  Comprehensive demographics, visits, and medical history
                </p>
              </div>
              <button
                onClick={() => setViewingPatient(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading || viewingPatient.loading ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Loading patient profile...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Demographics Card */}
                <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3 border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Patient Name</p>
                    <p className="mt-0.5 text-base font-bold text-slate-900">
                      {viewingPatient.patient?.userId?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {viewingPatient.patient?.gender} •{' '}
                      {calculateAge(viewingPatient.patient?.dateOfBirth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Contact Info</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-medical-600" />
                      {viewingPatient.patient?.userId?.phone}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-medical-600" />
                      {viewingPatient.patient?.userId?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">
                      Blood &amp; Address
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <HeartPulse className="h-3.5 w-3.5" />
                      Blood Group: {viewingPatient.patient?.bloodGroup}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{viewingPatient.patient?.address}</span>
                    </p>
                  </div>
                </div>

                {/* Recent Medical Records */}
                <div>
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <FileText className="h-4 w-4 text-medical-600" />
                    Medical Records ({viewingPatient.history?.medicalRecords?.length || 0})
                  </h3>
                  {viewingPatient.history?.medicalRecords?.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                      No medical diagnoses recorded for this patient yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {viewingPatient.history?.medicalRecords?.map((rec) => (
                        <div
                          key={rec._id}
                          className="rounded-xl border border-slate-200 p-3.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-medical-700">{rec.diagnosis}</span>
                            <span className="text-slate-400">
                              {new Date(rec.createdAt).toLocaleDateString()} •{' '}
                              {rec.doctorId?.userId?.name}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600">
                            <strong>Treatment:</strong> {rec.treatment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Appointments */}
                <div>
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Calendar className="h-4 w-4 text-medical-600" />
                    Recent Appointments ({viewingPatient.history?.appointments?.length || 0})
                  </h3>
                  {viewingPatient.history?.appointments?.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                      No appointments scheduled for this patient.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {viewingPatient.history?.appointments?.map((appt) => (
                        <div
                          key={appt._id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              {appt.appointmentDate} at {appt.appointmentTime} —{' '}
                              {appt.doctorId?.userId?.name}
                            </p>
                            <p className="text-slate-500">{appt.reason}</p>
                          </div>
                          <StatusBadge status={appt.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Prescriptions */}
                <div>
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Pill className="h-4 w-4 text-medical-600" />
                    Prescriptions ({viewingPatient.history?.prescriptions?.length || 0})
                  </h3>
                  {viewingPatient.history?.prescriptions?.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                      No prescriptions on file.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {viewingPatient.history?.prescriptions?.map((pr) => (
                        <div
                          key={pr._id}
                          className="rounded-xl border border-slate-200 p-3 text-xs space-y-1"
                        >
                          <p className="font-semibold text-slate-800">
                            Issued by {pr.doctorId?.userId?.name} on{' '}
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {pr.medicines?.map((m, i) => (
                              <span
                                key={i}
                                className="rounded bg-medical-50 px-2 py-0.5 text-medical-700 font-medium"
                              >
                                {m.name} ({m.dosage})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: DELETE CONFIRMATION (ADMIN ONLY)
         ===================================================================== */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Patient Record?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to permanently delete{' '}
              <strong>{deletingPatient.userId?.name}</strong>? This will also remove their
              appointments, medical records, prescriptions, and billing history.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingPatient(null)}
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
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
