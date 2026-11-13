import React from 'react';
import { Menu, LogOut, ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200/70">
          <Calendar className="h-3.5 w-3.5 text-medical-600" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-medical-100 text-xs font-bold text-medical-700">
            {initials}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-semibold leading-none text-slate-900">{user?.name}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium capitalize text-slate-500">
              <ShieldCheck className="h-3 w-3 text-medical-600" />
              {user?.role}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
