'use client';
import { Loader2, Star, X } from 'lucide-react';

const STATUS_STYLES = {
  pending_payment: ['Awaiting payment', 'bg-amber-50 text-amber-700 ring-amber-200'],
  requested: ['Awaiting expert', 'bg-sky-50 text-sky-700 ring-sky-200'],
  accepted: ['Confirmed', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  rejected: ['Declined', 'bg-red-50 text-red-700 ring-red-200'],
  completed: ['Completed', 'bg-violet-50 text-violet-700 ring-violet-200'],
  cancelled: ['Cancelled', 'bg-slate-100 text-slate-600 ring-slate-200'],
  pending: ['Pending review', 'bg-amber-50 text-amber-700 ring-amber-200'],
  approved: ['Approved', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  suspended: ['Suspended', 'bg-orange-50 text-orange-700 ring-orange-200'],
  terminated: ['Terminated', 'bg-red-50 text-red-700 ring-red-200'],
  active: ['Active', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  open: ['Open', 'bg-red-50 text-red-700 ring-red-200'],
  resolved: ['Resolved', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  dismissed: ['Dismissed', 'bg-slate-100 text-slate-600 ring-slate-200'],
  paid: ['Paid', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  unpaid: ['Unpaid', 'bg-amber-50 text-amber-700 ring-amber-200'],
  free: ['Free', 'bg-peach-50 text-peach-500 ring-peach-100'],
  high: ['High', 'bg-red-50 text-red-700 ring-red-200'],
  medium: ['Medium', 'bg-amber-50 text-amber-700 ring-amber-200'],
  low: ['Low', 'bg-slate-100 text-slate-600 ring-slate-200'],
};

export function StatusBadge({ status, label }) {
  const [text, cls] = STATUS_STYLES[status] || [status, 'bg-slate-100 text-slate-600 ring-slate-200'];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || text}
    </span>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 text-slate-400 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  const cls = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
  }[kind];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      {Icon && <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></span>}
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600', peach: 'bg-peach-50 text-peach-500', sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600', red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-4.5 w-4.5" size={18} /></span>}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-ink" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stars({ value = 0, onChange, size = 18 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer transition hover:scale-110' : 'cursor-default'} aria-label={`${n} star`}>
          <Star size={size} className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name = '', size = 'md' }) {
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-xl' }[size];
  const palette = ['bg-brand-100 text-brand-700', 'bg-peach-100 text-peach-500', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700'];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  const letters = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className={`grid shrink-0 place-items-center rounded-2xl font-bold ${s} ${palette[idx]}`}>{letters}</span>;
}
