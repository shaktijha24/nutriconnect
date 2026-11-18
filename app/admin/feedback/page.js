'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MessageSquareHeart } from 'lucide-react';
import { useLoad, fmtDate } from '@/lib/client';
import { PageHeader, Spinner, Alert, Empty, Stars, StatCard } from '@/components/ui';

export default function AdminFeedbackPage() {
  const { data, loading, error } = useLoad('/api/admin/feedback');
  const [filter, setFilter] = useState('all');
  const all = data?.feedback || [];
  const list = all.filter((b) => (filter === 'low' ? b.feedback.politeness <= 2 || b.feedback.rating <= 2 : true));
  const avg = (k) => (all.length ? (all.reduce((s, b) => s + b.feedback[k], 0) / all.length).toFixed(1) : '—');

  return (
    <>
      <PageHeader title="Customer feedback" subtitle="Every rating clients give after their sessions. Low politeness creates a report automatically." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Reviews" value={all.length} />
        <StatCard label="Average rating" value={avg('rating')} tone="amber" />
        <StatCard label="Average politeness" value={avg('politeness')} tone="sky" />
      </div>
      <div className="mb-4 inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {[['all', 'All feedback'], ['low', 'Low ratings (≤ 2)']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === k ? 'bg-brand-600 text-white' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>
      <Alert>{error}</Alert>
      {loading ? <Spinner /> : list.length === 0 ? <Empty icon={MessageSquareHeart} title="No feedback yet" /> : (
        <div className="space-y-3">
          {list.map((b) => {
            const low = b.feedback.politeness <= 2 || b.feedback.rating <= 2;
            return (
              <div key={b._id} className={`card p-5 ${low ? 'border-red-200' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    <p><b>{b.client?.name}</b> rated <Link href={`/admin/providers/${b.provider?._id}`} className="font-semibold text-brand-700 hover:underline">{b.provider?.name}</Link></p>
                    <p className="text-xs text-slate-500">{b.packageSnapshot?.title} · {fmtDate(b.feedback.at)}</p>
                  </div>
                  <div className="flex gap-5 text-xs">
                    <div><p className="text-slate-500">Overall</p><Stars value={b.feedback.rating} size={14} /></div>
                    <div><p className="text-slate-500">Politeness</p><Stars value={b.feedback.politeness} size={14} /></div>
                  </div>
                </div>
                {b.feedback.comment && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">“{b.feedback.comment}”</p>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
