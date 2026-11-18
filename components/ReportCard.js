import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { StatusBadge } from './ui';

export const REPORT_LABELS = {
  impolite_behaviour: 'Impolite behaviour (client feedback)',
  low_rating: 'Low rating',
  flagged_message: 'Disrespectful chat message',
  client_complaint: 'Client complaint',
};

export default function ReportCard({ r, children }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 ${r.status === 'open' && r.severity === 'high' ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <AlertTriangle className={`h-4 w-4 ${r.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
        <p className="font-semibold">{REPORT_LABELS[r.type] || r.type}</p>
        <StatusBadge status={r.severity} label={`${r.severity} severity`} />
        <StatusBadge status={r.status} />
        <span className="ml-auto text-xs text-slate-400">{new Date(r.createdAt).toLocaleString('en-IN')}</span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{r.details}</p>
      <p className="mt-2 text-xs text-slate-500">
        Expert: {r.provider ? <Link className="font-semibold text-brand-700 hover:underline" href={`/admin/providers/${r.provider._id}`}>{r.provider.name}</Link> : '—'}
        {r.provider?.status && <> ({r.provider.status})</>}
        {r.client && <> · Client: {r.client.name}</>}
        {' · '}{r.source === 'client' ? 'Reported by client' : 'Auto-detected'}
      </p>
      {r.adminNote && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs"><b>Admin note:</b> {r.adminNote}</p>}
      {children}
    </div>
  );
}
