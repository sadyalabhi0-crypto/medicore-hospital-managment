import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@medicore.com', role: 'Hospital Administrator' },
  { label: 'Doctor', email: 'doctor@medicore.com', role: 'Interventional Cardiologist' },
  { label: 'Receptionist', email: 'receptionist@medicore.com', role: 'Front Desk Coordinator' },
  { label: 'Patient', email: 'patient@medicore.com', role: 'Registered Patient' },
];

const LoginPage = () => {
  const { login, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(formData.email.trim(), formData.password);
      navigate(getRoleDashboardPath(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to sign in. Please check your credentials or verify the backend server is running.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = (email) => {
    setFormData({ email, password: 'Password123!' });
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-medical-700 via-medical-800 to-slate-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">MediCore HMS</span>
            <p className="text-xs text-medical-200">Enterprise Healthcare Portal</p>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-medical-100">
            <ShieldCheck className="h-4 w-4 text-medical-300" />
            HIPAA-Grade Role-Based Access Control
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Unified clinical &amp; operational hospital management.
          </h1>
          <p className="text-sm leading-relaxed text-medical-100/90">
            Dedicated workspaces for Hospital Administrators, Physicians, Front-Desk Receptionists,
            and Patients—built for speed, clarity, and reliable care coordination.
          </p>
        </div>

        <div className="text-xs text-medical-200/80">
          &copy; {new Date().getFullYear()} MediCore Hospital Management System. All rights reserved.
        </div>
      </div>

      {/* Right login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-slate-900">MediCore HMS</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your credentials to access your role-specific dashboard.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@medicore.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quick Demo Credentials (Password: Password123!)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.label}
                  type="button"
                  onClick={() => fillDemoCredentials(acct.email)}
                  className="flex flex-col items-start rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-left transition hover:border-medical-300 hover:bg-medical-50/50"
                >
                  <span className="text-xs font-semibold text-slate-800">{acct.label}</span>
                  <span className="text-[11px] text-slate-500 truncate w-full">{acct.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-slate-600">
            New patient?{' '}
            <Link to="/register" className="font-semibold text-medical-600 hover:text-medical-700">
              Create a patient account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
