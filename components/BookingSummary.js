import { CalendarDays, Clock, Target, Stethoscope, Wallet, Timer } from 'lucide-react';
import { fmtDate, fmtTime, inr } from '@/lib/client';
import { StatusBadge } from './ui';

const STEPS = [
  ['pending_payment', 'Booked'],
  ['requested', 'Paid'],
  ['accepted', 'Confirmed'],
  ['completed', 'Completed'],
];

export const TYPE_LABEL = { trial: 'Free trial', session: '1-hour session', package: 'Diet package' };

export default function BookingSummary({ booking, counterpart }) {
  const order = STEPS.map((s) => s[0]);
  const idx = order.indexOf(booking.status);
  const closed = ['rejected', 'cancelled'].includes(booking.status);
  const pay = booking.payment || {};
  const payText = pay.status === 'free'
    ? 'Free'
    : `${inr(pay.amount)} · ${pay.status === 'paid' ? 'Paid' : 'Unpaid'}${booking.pricing?.discount ? ` (${booking.pricing.discountPercent}% first-booking discount)` : ''}${pay.refundStatus && pay.refundStatus !== 'none' ? ` · Refund ${pay.refundStatus}` : ''}`;
  const s = booking.session || {};

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{counterpart}</p>
          <h1 className="font-display text-2xl font-semibold">{booking.packageSnapshot?.title}</h1>
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{TYPE_LABEL[booking.type] || 'Booking'}</span>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {!closed && (
        <div className="mt-6 flex items-center">
          {STEPS.map(([, label], i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i <= idx ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span>
                <span className={`mt-1 text-[11px] font-medium ${i <= idx ? 'text-brand-700' : 'text-slate-400'}`}>{i === 1 && pay.status === 'free' ? 'Requested' : label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`mx-1 mb-4 h-0.5 flex-1 ${i < idx ? 'bg-brand-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <Row icon={CalendarDays} label="Date" value={fmtDate(booking.date)} />
        <Row icon={Clock} label="Time" value={fmtTime(booking.timeSlot)} />
        <Row icon={Timer} label="Live sessions" value={`${s.used || 0} of ${s.total || 1} used · ${s.minutes || 60} min each`} />
        <Row icon={Wallet} label="Payment" value={payText} />
        <Row icon={Target} label="Goal" value={booking.goal || '—'} />
        {booking.healthNotes && <Row icon={Stethoscope} label="Health notes" value={booking.healthNotes} />}
      </div>
      {booking.providerNote && (
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><b>Note:</b> {booking.providerNote}</p>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="break-words font-medium">{value}</p></div>
    </div>
  );
}
