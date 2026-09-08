import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.FC<{ className?: string }>;
  trend?: { value: string; isPositive?: boolean };
  variant?: 'teal' | 'red' | 'amber' | 'blue' | 'purple' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'slate'
}) => {
  const variantStyles = {
    teal: 'border-teal-500/30 bg-teal-950/20 text-teal-400',
    red: 'border-red-500/30 bg-red-950/20 text-red-400',
    amber: 'border-amber-500/30 bg-amber-950/20 text-amber-400',
    blue: 'border-blue-500/30 bg-blue-950/20 text-blue-400',
    purple: 'border-purple-500/30 bg-purple-950/20 text-purple-400',
    slate: 'border-slate-800 bg-slate-900/60 text-slate-300'
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className={`rounded-xl border p-2 ${variantStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {trend && (
          <span className={`text-[11px] font-semibold ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}
    </div>
  );
};
