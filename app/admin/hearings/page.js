'use client';
import Link from 'next/link';
import { Gavel } from 'lucide-react';
import { useLoad, fmtDate } from '@/lib/client';
import { PageHeader, Spinner, Alert, Empty, StatusBadge, Avatar } from '@/components/ui';

export default function AdminHearingsPage() {
  const { data, loading, error } = useLoad('/api/hearings');
  const now = data?.serverNow || Date.now();
  return (
    <>
      <PageHeader title="Hearings" subtitle="Held 5 days after an expert is suspended. You decide whether to forgive (reinstate) or terminate." />
      <Alert>{error}</Alert>
      {loading ? <Spinner /> : !data?.hearings?.length ? <Empty icon={Gavel} title="No hearings" text="Hearings appear here when you suspend an expert." /> : (
        <div className="card overflow-x-auto">
          <table className="table-x">
            <thead><tr><th>Expert</th><th>Suspended</th><th>Hearing date</th><th>Status</th><th>Outcome</th><th /></tr></thead>
            <tbody>
              {data.hearings.map((h) => {
                const open = h.status === 'scheduled' && new Date(h.scheduledAt).getTime() <= now;
                return (
                  <tr key={h._id}>
                    <td><div className="flex items-center gap-3"><Avatar name={h.provider?.name || '?'} size="sm" /><div><p className="font-semibold">{h.provider?.name}</p><p className="text-xs text-slate-500">{h.reportCount} reports</p></div></div></td>
                    <td>{fmtDate(h.suspendedAt)}</td>
                    <td>{new Date(h.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>{h.status === 'concluded' ? <StatusBadge status="resolved" label="Concluded" /> : open ? <StatusBadge status="open" label="Open now" /> : <StatusBadge status="pending" label="Scheduled" />}</td>
                    <td className="text-xs">{h.outcome?.decision ? `${h.outcome.decision} · ${h.outcome.mistakeLevel}` : '—'}</td>
                    <td><Link href={`/admin/hearings/${h._id}`} className={open ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>{open ? 'Join hearing' : 'View'}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
