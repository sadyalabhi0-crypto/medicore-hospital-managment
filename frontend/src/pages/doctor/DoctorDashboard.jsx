import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  RefreshCw,
  ArrowUpRight,
  Stethoscope,
} from 'lucide-react';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load doctor workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-medical-200 border-t-medical-600" />
          <p className="text-sm font-medium text-slate-500">Loading clinical workspace...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    todaysCount: 0,
    upcomingCount: 0,
    totalPatients: 0,
    completedCount: 0,
  };
  const todaysSchedule = data?.todaysSchedule || [];
  const upcomingAppointments = data?.upcomingAppointments || [];
  const recentMedicalRecords = data?.recentMedicalRecords || [];
  const profile = data?.doctorProfile;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-medical-600 text-white">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back, {user?.name}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {profile?.specialization || 'Clinical Specialist'} •{' '}
              {profile?.departmentId?.name || 'General Department'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/doctor/availability" className="btn-secondary text-xs">
            <Clock className="h-4 w-4" />
            Manage Availability
          </Link>
          <button onClick={fetchDashboard} className="btn-primary text-xs">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Schedule"
          value={stats.todaysCount}
          subtitle="Patients scheduled for today"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Upcoming Visits"
          value={stats.upcomingCount}
          subtitle="Active future appointments"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          subtitle="Unique patients under your care"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Completed Visits"
          value={stats.completedCount}
          subtitle="Consultations finalized"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Main Grid: Today's Schedule & Upcoming Appointments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today&apos;s Schedule</h2>
              <p className="text-xs text-slate-500">Appointments booked for today</p>
            </div>
            <Link
              to="/doctor/appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-700"
            >
              All Appointments <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {todaysSchedule.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                No appointments scheduled for today.
              </div>
            ) : (
              todaysSchedule.map((appt) => (
                <div
                  key={appt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-medical-100 px-2 py-0.5 text-xs font-bold text-medical-700">
                        {appt.appointmentTime}
                      </span>
                      <p className="font-semibold text-slate-900">
                        {appt.patientId?.userId?.name || 'Patient'}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{appt.reason}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Appointments</h2>
              <p className="text-xs text-slate-500">Next scheduled consultations</p>
            </div>
            <Link
              to="/doctor/prescriptions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-700"
            >
              Issue Prescription <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                No upcoming appointments found.
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <div
                  key={appt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {appt.patientId?.userId?.name || 'Patient'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {appt.appointmentDate} at {appt.appointmentTime} — {appt.reason}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Patient Medical Records */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-medical-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Patient Records</h2>
              <p className="text-xs text-slate-500">
                Latest diagnoses and treatment plans authored by you
              </p>
            </div>
          </div>
          <Link
            to="/doctor/medical-records"
            className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-700"
          >
            View All Records <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Patient</th>
                <th className="pb-3 px-4">Diagnosis</th>
                <th className="pb-3 px-4">Treatment Plan</th>
                <th className="pb-3 pl-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentMedicalRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                    No medical records authored yet.
                  </td>
                </tr>
              ) : (
                recentMedicalRecords.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900">
                      {rec.patientId?.userId?.name || 'Patient'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-medical-700">{rec.diagnosis}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-md truncate">
                      {rec.treatment}
                    </td>
                    <td className="py-3.5 pl-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
