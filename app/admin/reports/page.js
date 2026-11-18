'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { api, useLoad } from '@/lib/client';
import { PageHeader, Spinner, Alert, Empty } from '@/components/ui';
import ReportCard from '@/components/ReportCard';

export default function ReportsPage() {
  const [status, setStatus] = useState('open');
  const { data, loading, error, reload } = useLoad(`/api/admin/reports?status=${status}`);
  const [notes, setNotes] = useState({});

  async function update(id, newStatus) {
    await api(`/api/admin/reports/${id}`, { method: 'PATCH', body: { status: newStatus, adminNote: notes[id] } });
    reload();
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Impolite behaviour, low ratings, flagged messages and client complaints arrive here instantly." />
      <div className="mb-4 inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {['open', 'resolved', 'dismissed', 'all'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${status === s ? 'bg-brand-600 text-white' : 'text-slate-500'}`}>{s}</button>
        ))}
      </div>
      <Alert>{error}</Alert>
      {loading ? <Spinner /> : !data?.reports?.length ? (
        <Empty icon={ShieldCheck} title="Nothing to review" text="No reports in this list." />
      ) : (
        <div className="space-y-3">
          {data.reports.map((r) => (
            <ReportCard key={r._id} r={r}>
              {r.status === 'open' && (
                <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row">
                  <input className="input" placeholder="Admin note (optional)" value={notes[r._id] || ''} onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })} />
                  <div className="flex shrink-0 gap-2">
                    {r.provider && <Link href={`/admin/providers/${r.provider._id}`} className="btn-warn btn-sm">Take action on expert</Link>}
                    <button className="btn-primary btn-sm" onClick={() => update(r._id, 'resolved')}>Resolve</button>
                    <button className="btn-secondary btn-sm" onClick={() => update(r._id, 'dismissed')}>Dismiss</button>
                  </div>
                </div>
              )}
              {r.status !== 'open' && <button className="btn-ghost btn-sm mt-2" onClick={() => update(r._id, 'open')}>Re-open</button>}
            </ReportCard>
          ))}
        </div>
      )}
    </>
  );
}
