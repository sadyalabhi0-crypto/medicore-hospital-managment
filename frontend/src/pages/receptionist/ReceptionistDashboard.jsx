import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  CalendarPlus,
  Calendar,
  UserCheck,
  Clock,
  Users,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';

const ReceptionistDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (err) {
      console.error('Receptionist dashboard error:', err);
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
          <p className="text-sm font-medium text-slate-500">Loading front-desk portal...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    todaysAppointments: 0,
    checkedInToday: 0,
    pendingCheckInToday: 0,
    totalPatients: 0,
  };
  const todaysSchedule = data?.todaysSchedule || [];
  const recentPatients = data?.recentPatients || [];

  const filteredPatients = recentPatients.filter((pt) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = pt.userId?.name?.toLowerCase() || '';
    const email = pt.userId?.email?.toLowerCase() || '';
    const phone = pt.userId?.phone?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Front Desk &amp; Receptionist Desk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register walk-in patients, coordinate check-ins, and manage daily appointment queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/receptionist/patients" className="btn-primary text-xs">
            <UserPlus className="h-4 w-4" />
            Register New Patient
          </Link>
          <Link to="/receptionist/appointments" className="btn-secondary text-xs">
            <CalendarPlus className="h-4 w-4" />
            Book Appointment
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Appointments"
          value={stats.todaysAppointments}
          subtitle="Total scheduled for today"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Checked-In Today"
          value={stats.checkedInToday}
          subtitle="Arrived at hospital"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Awaiting Check-In"
          value={stats.pendingCheckInToday}
          subtitle="Expected arrivals today"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          subtitle="Registered in database"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Today's Appointments & Quick Patient Search */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Appointment Queue */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Today&apos;s Appointment Schedule
              </h2>
              <p className="text-xs text-slate-500">Live patient arrival and check-in queue</p>
            </div>
            <Link
              to="/receptionist/appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-700"
            >
              Manage Queue <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 px-4">Patient</th>
                  <th className="pb-3 px-4">Doctor</th>
                  <th className="pb-3 pl-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todaysSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                      No appointments booked for today yet.
                    </td>
                  </tr>
                ) : (
                  todaysSchedule.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 pr-4 font-bold text-medical-700 whitespace-nowrap">
                        {appt.appointmentTime}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">
                          {appt.patientId?.userId?.name || 'Patient'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appt.patientId?.userId?.phone || ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">
                          {appt.doctorId?.userId?.name || 'Doctor'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appt.doctorId?.departmentId?.name || appt.doctorId?.specialization}
                        </p>
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

        {/* Instant Patient Lookup */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quick Patient Search</h2>
              <p className="text-xs text-slate-500">Filter by name, phone, or email</p>
            </div>
            <Link
              to="/receptionist/patients"
              className="text-xs font-semibold text-medical-600 hover:text-medical-700"
            >
              Full List
            </Link>
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient..."
              className="input-field pl-10"
            />
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No matching patient records found.
              </p>
            ) : (
              filteredPatients.map((pt) => (
                <div
                  key={pt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {pt.userId?.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{pt.userId?.phone}</p>
                  </div>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                    {pt.bloodGroup}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
