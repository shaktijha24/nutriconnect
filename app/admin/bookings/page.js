'use client';
import { useState } from 'react';
import { CalendarX } from 'lucide-react';
import { useLoad, inr, fmtDate, fmtTime } from '@/lib/client';
import { PageHeader, Spinner, Alert, Empty, StatusBadge } from '@/components/ui';

export default function AdminBookings() {
  const { data, loading, error } = useLoad('/api/admin/bookings');
  const [q, setQ] = useState('');
  const list = (data?.bookings || []).filter((b) =>
    [b.client?.name, b.provider?.name, b.packageSnapshot?.title, b.status].join(' ').toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Bookings & payments" subtitle="Every appointment on the platform."
        action={<input className="input sm:w-64" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />} />
      <Alert>{error}</Alert>
      {loading ? <Spinner /> : list.length === 0 ? <Empty icon={CalendarX} title="No bookings" /> : (
        <div className="card overflow-x-auto">
          <table className="table-x">
            <thead><tr><th>Client</th><th>Expert</th><th>Package</th><th>Slot</th><th>Payment</th><th>Status</th><th>Feedback</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b._id}>
                  <td><p className="font-semibold">{b.client?.name}</p><p className="text-xs text-slate-500">{b.client?.email}</p></td>
                  <td>{b.provider?.name}</td>
                  <td>{b.packageSnapshot?.title}<p className="text-xs text-slate-500">{{ trial: 'Free trial', session: '1-hour session', package: 'Package' }[b.type] || ''}{b.pricing?.discount ? ` · ${b.pricing.discountPercent}% off` : ''}</p></td>
                  <td className="whitespace-nowrap">{fmtDate(b.date)}<p className="text-xs text-slate-500">{fmtTime(b.timeSlot)}</p></td>
                  <td className="whitespace-nowrap">{inr(b.payment?.amount)} <StatusBadge status={b.payment?.status} />
                    {b.payment?.refundStatus !== 'none' && <p className="mt-1 text-xs text-slate-500">Refund {b.payment?.refundStatus}</p>}
                    {b.payment?.method && <p className="text-xs text-slate-400">{b.payment.method}</p>}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="text-xs">{b.feedback?.rating ? <>⭐ {b.feedback.rating} · 🤝 {b.feedback.politeness}</> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
