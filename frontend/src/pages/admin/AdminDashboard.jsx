import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';

const AdminDashboard = () => {
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
      setError(
        err.response?.data?.message || 'Unable to load hospital analytics. Check server connection.'
      );
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
          <p className="text-sm font-medium text-slate-500">Loading hospital analytics...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalPatients: 0,
    totalDoctors: 0,
    totalDepartments: 0,
    todaysAppointments: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  };

  const appointmentTrend = data?.charts?.appointmentTrend || [];
  const statusDistribution = data?.charts?.statusDistribution || [];
  const recentAppointments = data?.recentAppointments || [];
  const recentPatients = data?.recentPatients || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hospital Executive Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time operational metrics, appointment volume, and clinical department performance.
          </p>
        </div>
        <button onClick={fetchDashboard} className="btn-secondary self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          subtitle="Active registered patients"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Doctors"
          value={stats.totalDoctors}
          subtitle={`Across ${stats.totalDepartments} active departments`}
          icon={Stethoscope}
          color="emerald"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todaysAppointments}
          subtitle={`${stats.totalAppointments} total scheduled visits`}
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtitle={`$${stats.pendingRevenue.toLocaleString()} in pending invoices`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 7-Day Appointment & Revenue Area Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                7-Day Appointment Activity Trend
              </h2>
              <p className="text-xs text-slate-500">
                Daily scheduled vs. completed patient consultations
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-medical-50 px-3 py-1 text-xs font-semibold text-medical-700">
              <TrendingUp className="h-3.5 w-3.5" />
              Last 7 Days
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={appointmentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  name="Appointments"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAppts)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Breakdown Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Appointment Status Mix</h2>
            <p className="text-xs text-slate-500">Breakdown by consultation stage</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section: Recent Appointments & Recent Patient Registrations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Appointments Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Appointments</h2>
              <p className="text-xs text-slate-500">Latest scheduled patient visits across departments</p>
            </div>
            <Link
              to="/admin/appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-700"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Patient</th>
                  <th className="pb-3 px-4">Doctor</th>
                  <th className="pb-3 px-4">Date &amp; Time</th>
                  <th className="pb-3 pl-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                      No appointments recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentAppointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-slate-900">
                          {appt.patientId?.userId?.name || 'Patient'}
                        </p>
                        <p className="text-xs text-slate-500">{appt.reason}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">
                          {appt.doctorId?.userId?.name || 'Assigned Doctor'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appt.doctorId?.departmentId?.name || appt.doctorId?.specialization}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{appt.appointmentDate}</p>
                        <p className="text-xs text-slate-500">{appt.appointmentTime}</p>
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

        {/* Recent Patient Registrations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">New Patients</h2>
              <p className="text-xs text-slate-500">Recently registered patient profiles</p>
            </div>
            <Link
              to="/admin/patients"
              className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-700"
            >
              Directory <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentPatients.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No patients found.</p>
            ) : (
              recentPatients.map((pt) => (
                <div
                  key={pt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {pt.userId?.name || 'Unnamed Patient'}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {pt.userId?.phone || pt.userId?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                      {pt.bloodGroup}
                    </span>
                    <span className="text-xs text-slate-500">{pt.gender}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
