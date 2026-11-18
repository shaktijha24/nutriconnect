'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Scale, Activity, Search, ChevronRight, CalendarX } from 'lucide-react';
import { api, useLoad, inr, fmtDate, fmtTime } from '@/lib/client';
import { bmiCategory } from '@/lib/bmi';
import { StatusBadge, StatCard, Spinner, Empty, PageHeader, Alert, Avatar } from '@/components/ui';

export default function ClientDashboard() {
  const { data, loading, error } = useLoad('/api/bookings');
  const [progress, setProgress] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(() => {
    api('/api/progress').then((d) => setProgress(d.entries)).catch(() => {});
    api('/api/auth/me').then((d) => setMe(d.user)).catch(() => {});
  }, []);

  const bookings = data?.bookings || [];
  const active = bookings.filter((b) => ['requested', 'accepted'].includes(b.status)).length;
  const last = progress[progress.length - 1];
  const first = progress[0];
  const cat = bmiCategory(last?.bmi);
  const awaitingPay = bookings.filter((b) => b.status === 'pending_payment');

  return (
    <>
      <PageHeader title={`Hi ${me?.name?.split(' ')[0] || 'there'} 👋`} subtitle="Here's how your health journey is going."
        action={<Link href="/dieticians" className="btn-primary"><Search className="h-4 w-4" /> Book an expert</Link>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Active consultations" value={active} sub={`${bookings.length} bookings in total`} />
        <StatCard icon={Scale} label="Latest weight" value={last ? `${last.weight} kg` : '—'} tone="peach"
          sub={last && first && last !== first ? `${(last.weight - first.weight).toFixed(1)} kg since ${fmtDate(first.date)}` : <Link href="/client/progress" className="text-brand-700">Log your first entry →</Link>} />
        <StatCard icon={Activity} label="Latest BMI" value={last?.bmi ?? '—'} tone="sky" sub={cat?.label || <Link href="/bmi" className="text-brand-700">Calculate BMI →</Link>} />
      </div>

      {awaitingPay.length > 0 && (
        <div className="mb-6"><Alert kind="warn">You have {awaitingPay.length} booking{awaitingPay.length > 1 ? 's' : ''} awaiting payment. Your expert sees the request only after payment.</Alert></div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold">My bookings</h2>
        </div>
        <Alert>{error}</Alert>
        {loading ? <Spinner /> : bookings.length === 0 ? (
          <div className="p-6"><Empty icon={CalendarX} title="No bookings yet" text="Find a dietician you like and book a package to get your personalised plan." action={<Link href="/dieticians" className="btn-primary">Find an expert</Link>} /></div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <li key={b._id}>
                <Link href={`/client/bookings/${b._id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                  <Avatar name={b.provider?.name || '?'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.packageSnapshot?.title}</p>
                    <p className="text-sm text-slate-500">with {b.provider?.name} · {fmtDate(b.date)}, {fmtTime(b.timeSlot)}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <StatusBadge status={b.status} />
                    <p className="mt-1 text-xs text-slate-500">{inr(b.payment?.amount)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
