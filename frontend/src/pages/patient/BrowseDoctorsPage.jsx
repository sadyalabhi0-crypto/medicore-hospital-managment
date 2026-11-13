import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  Building2,
  Award,
  DollarSign,
  Clock,
  CalendarPlus,
} from 'lucide-react';
import api from '../../api/axios';

const BrowseDoctorsPage = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, deptsRes] = await Promise.all([
        api.get('/doctors', {
          params: {
            search: search.trim(),
            departmentId: departmentFilter,
          },
        }),
        api.get('/departments', { params: { status: 'active' } }),
      ]);
      // Only show active doctors to patients
      const activeDoctors = (docsRes.data.doctors || []).filter(
        (d) => d.userId?.isActive !== false
      );
      setDoctors(activeDoctors);
      setDepartments(deptsRes.data.departments || []);
    } catch (err) {
      console.error('Error loading doctors:', err);
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleBookWithDoctor = (doc) => {
    navigate(`/patient/appointments?doctorId=${doc._id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Find a Specialist &amp; Book Consultation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse board-certified hospital physicians by clinical department, experience, and
          availability.
        </p>
      </div>

      {/* Search & Department Filter */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name or specialization (e.g. Cardiology)..."
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

      {/* Doctors Cards */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          Searching available specialists...
        </div>
      ) : doctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          No specialists matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doc) => {
            const activeSlots = (doc.availability || []).filter((s) => s.isAvailable);

            return (
              <div
                key={doc._id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-medical-50 text-medical-600 border border-medical-100">
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

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> Department
                      </span>
                      <span className="font-semibold text-slate-800">
                        {doc.departmentId?.name || 'General Medicine'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Award className="h-3.5 w-3.5 text-slate-400" /> Credentials
                      </span>
                      <span className="font-medium text-slate-800">
                        {doc.qualification} ({doc.experience} yrs exp)
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
                  </div>

                  {/* Weekly Schedule Pills */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase text-slate-400">
                      <Clock className="h-3 w-3 text-medical-600" /> Available Days
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSlots.length === 0 ? (
                        <span className="text-xs text-slate-400">Schedule on request</span>
                      ) : (
                        activeSlots.map((s) => (
                          <span
                            key={s.day}
                            className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200"
                          >
                            {s.day.slice(0, 3)}: {s.startTime}–{s.endTime}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBookWithDoctor(doc)}
                  className="btn-primary mt-5 w-full py-2.5 text-xs"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Book Appointment
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseDoctorsPage;
