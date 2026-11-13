import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus,
  Calendar,
  Pill,
  CreditCard,
  Activity,
  Stethoscope,
  ArrowUpRight,
} from 'lucide-react';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (err) {
      console.error('Patient dashboard error:', err);
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
          <p className="text-sm font-medium text-slate-500">Loading your health portal...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    upcomingCount: 0,
    totalVisits: 0,
    prescriptionsCount: 0,
    unpaidBillsAmount: 0,
  };
  const upcomingAppointments = data?.upcomingAppointments || [];
  const appointmentHistory = data?.appointmentHistory || [];
  const recentPrescriptions = data?.recentPrescriptions || [];
  const profile = data?.patientProfile;

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Book Appointment CTA */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-medical-700 via-medical-600 to-medical-800 p-6 text-white shadow-sm sm:flex-row sm:items-center">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-medium text-medical-50">
            Patient Health Workspace
          </span>
          <h1 className="text-2xl font-bold">Hello, {user?.name}</h1>
          <p className="text-xs text-medical-100">
            Blood Group: <strong>{profile?.bloodGroup || 'O+'}</strong> • Manage your specialist
            visits, prescriptions, and medical records in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/patient/doctors"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/25"
          >
            <Stethoscope className="h-4 w-4" />
            Browse Doctors
          </Link>
          <Link
            to="/patient/appointments"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-medical-700 shadow-xs transition hover:bg-medical-50"
          >
            <CalendarPlus className="h-4 w-4" />
            Book Appointment
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Upcoming Visits"
          value={stats.upcomingCount}
          subtitle="Scheduled appointments"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Total Visits"
          value={stats.totalVisits}
          subtitle="All-time hospital visits"
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Active Prescriptions"
          value={stats.prescriptionsCount}
          subtitle="Issued medication plans"
          icon={Pill}
          color="purple"
        />
        <StatCard
          title="Outstanding Balance"
          value={`$${stats.unpaidBillsAmount.toLocaleString()}`}
          subtitle="Pending bill payments"
          icon={CreditCard}
          color="amber"
        />
      </div>

      {/* Upcoming Appointments & Recent Prescriptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Appointments</h2>
              <p className="text-xs text-slate-500">Your scheduled consultations</p>
            </div>
            <Link
              to="/patient/appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-700"
            >
              Manage <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <p className="text-sm text-slate-400">You have no upcoming appointments.</p>
                <Link
                  to="/patient/appointments"
                  className="mt-2 inline-block text-xs font-semibold text-medical-600 hover:underline"
                >
                  Schedule an appointment now →
                </Link>
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <div
                  key={appt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {appt.doctorId?.userId?.name || 'Specialist'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {appt.doctorId?.departmentId?.name || appt.doctorId?.specialization} •{' '}
                      {appt.appointmentDate} at {appt.appointmentTime}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{appt.reason}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Prescriptions</h2>
              <p className="text-xs text-slate-500">Medications prescribed by your doctors</p>
            </div>
            <Link
              to="/patient/records"
              className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-700"
            >
              All Records <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentPrescriptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No prescriptions on file yet.
              </div>
            ) : (
              recentPrescriptions.map((presc) => (
                <div
                  key={presc._id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      Prescribed by {presc.doctorId?.userId?.name || 'Doctor'}
                    </p>
                    <span className="text-xs text-slate-400">
                      {new Date(presc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {presc.medicines?.map((med, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-medical-700 border border-medical-100"
                      >
                        {med.name} ({med.dosage}) — {med.frequency}
                      </span>
                    ))}
                  </div>
                  {presc.instructions && (
                    <p className="text-xs text-slate-500 italic">{presc.instructions}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Appointment History Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Appointment History</h2>
            <p className="text-xs text-slate-500">Complete log of your hospital visits</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Doctor</th>
                <th className="pb-3 px-4">Department</th>
                <th className="pb-3 px-4">Date &amp; Time</th>
                <th className="pb-3 px-4">Reason</th>
                <th className="pb-3 pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointmentHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                    No appointment history available.
                  </td>
                </tr>
              ) : (
                appointmentHistory.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900">
                      {appt.doctorId?.userId?.name || 'Doctor'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {appt.doctorId?.departmentId?.name || appt.doctorId?.specialization}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      {appt.appointmentDate} • {appt.appointmentTime}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {appt.reason}
                    </td>
                    <td className="py-3.5 pl-4">
                      <StatusBadge status={appt.status} />
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

export default PatientDashboard;
