'use client';
import { useEffect, useState } from 'react';
import { Timer, PlayCircle, CheckCircle2, Hourglass } from 'lucide-react';
import { api } from '@/lib/client';
import { Alert } from './ui';

const pad = (n) => String(n).padStart(2, '0');
export const formatLeft = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

/** Shows the live session state with a countdown and a Start button. Calls onChange when state changes. */
export default function SessionPanel({ booking, serverNow, role, onChange }) {
  const s = booking.session || {};
  const [offset] = useState(() => (serverNow ? serverNow - Date.now() : 0));
  const [now, setNow] = useState(Date.now() + offset);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const end = s.activeEnd ? new Date(s.activeEnd).getTime() : 0;
  const active = booking.status === 'accepted' && end > now;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);

  // When the countdown ends, refresh so the chat locks and the booking may complete
  useEffect(() => {
    if (end && end <= now && end > now - 1500) onChange?.();
  }, [now, end, onChange]);

  async function start() {
    const mins = s.minutes || 60;
    if (!confirm(`Start a ${mins}-minute live session now? The timer cannot be paused.`)) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/bookings/${booking._id}/session`, { method: 'POST' });
      onChange?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const remaining = (s.total || 1) - (s.used || 0);
  const other = role === 'client' ? 'your expert' : 'your client';

  let body;
  if (['pending_payment'].includes(booking.status)) {
    body = <p className="text-sm text-slate-600">Complete the payment first. The live chat session opens after payment and the expert&apos;s confirmation.</p>;
  } else if (booking.status === 'requested') {
    body = <p className="text-sm text-slate-600">{role === 'client' ? 'Waiting for the expert to accept your request.' : 'Accept this request to enable live sessions.'}</p>;
  } else if (active) {
    const pct = Math.max(0, Math.min(100, ((end - now) / (s.minutes * 60000)) * 100));
    body = (
      <div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Session live now</p>
            <p className="font-display text-4xl font-semibold tabular-nums">{formatLeft(end - now)}</p>
            <p className="text-xs text-slate-500">time remaining · chat with {other} below</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Session {s.used} of {s.total}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
      </div>
    );
  } else if (booking.status === 'accepted' && remaining > 0) {
    body = (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{s.used ? 'Ready for your next session' : 'Ready to start'}</p>
          <p className="text-sm text-slate-600">{remaining} session{remaining > 1 ? 's' : ''} of {s.minutes} minutes left. Chat opens only while a session is running.</p>
        </div>
        <button onClick={start} disabled={busy} className="btn-primary"><PlayCircle className="h-4 w-4" />{busy ? 'Starting…' : `Start ${s.minutes}-min session`}</button>
      </div>
    );
  } else if (booking.status === 'completed') {
    body = <p className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-brand-600" />All {s.total} session{s.total > 1 ? 's' : ''} completed.</p>;
  } else {
    body = <p className="text-sm text-slate-500">This booking is {booking.status}. No sessions available.</p>;
  }

  return (
    <div className={`card p-5 ${active ? 'border-emerald-300 ring-4 ring-emerald-50' : ''}`}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
        {active ? <Timer className="h-4 w-4 text-emerald-600" /> : <Hourglass className="h-4 w-4" />} Live session · {s.minutes || 60} minutes
      </div>
      {body}
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
    </div>
  );
}
