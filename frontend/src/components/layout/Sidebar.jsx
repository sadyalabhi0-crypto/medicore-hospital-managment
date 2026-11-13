import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  Calendar,
  FileText,
  Pill,
  CreditCard,
  UserCheck,
  Clock,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_NAVIGATION = {
  admin: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
    { name: 'Patients', path: '/admin/patients', icon: Users },
    { name: 'Receptionists', path: '/admin/receptionists', icon: UserCheck },
    { name: 'Departments', path: '/admin/departments', icon: Building2 },
    { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
    { name: 'Billing & Reports', path: '/admin/billing', icon: CreditCard },
  ],
  doctor: [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'My Appointments', path: '/doctor/appointments', icon: Calendar },
    { name: 'Medical Records', path: '/doctor/medical-records', icon: FileText },
    { name: 'Prescriptions', path: '/doctor/prescriptions', icon: Pill },
    { name: 'My Availability', path: '/doctor/availability', icon: Clock },
  ],
  receptionist: [
    { name: 'Dashboard', path: '/receptionist/dashboard', icon: LayoutDashboard },
    { name: 'Patients Directory', path: '/receptionist/patients', icon: Users },
    { name: 'Appointments & Check-In', path: '/receptionist/appointments', icon: Calendar },
    { name: 'Billing Desk', path: '/receptionist/billing', icon: CreditCard },
  ],
  patient: [
    { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'Find Doctors', path: '/patient/doctors', icon: Stethoscope },
    { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
    { name: 'Prescriptions & Records', path: '/patient/records', icon: FileText },
    { name: 'Billing & Invoices', path: '/patient/billing', icon: CreditCard },
  ],
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navItems = ROLE_NAVIGATION[user?.role] || ROLE_NAVIGATION.patient;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-medical-600 text-white shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                MediCore
              </span>
              <span className="ml-1 rounded-md bg-medical-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-medical-700">
                HMS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role workspace badge */}
        <div className="px-4 pt-5 pb-2">
          <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Active Workspace
            </p>
            <p className="mt-0.5 text-xs font-bold capitalize text-medical-700">
              {user?.role} Portal
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-medical-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom System Status Card */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-gradient-to-br from-medical-50 to-slate-50 p-3.5 border border-medical-100">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800">System Online</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              HIPAA-ready clinical records &amp; real-time appointment sync.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
