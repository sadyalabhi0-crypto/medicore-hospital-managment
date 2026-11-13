import React from 'react';

const COLOR_MAP = {
  blue: 'bg-medical-50 text-medical-600 border-medical-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const iconStyle = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs font-medium text-slate-500">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconStyle}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
