'use client';
import { useEffect, useState } from 'react';
import { Gavel, CalendarClock, CheckCircle2, Ban, AlertTriangle } from 'lucide-react';
import { api, useLoad, fmtDate } from '@/lib/client';
import { Spinner, Alert, StatusBadge } from './ui';
import ChatBox from './ChatBox';
import { REPORT_LABELS } from './ReportCard';

function Countdown({ to, offset }) {
  const [now, setNow] = useState(Date.now() + offset);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);
  const ms = Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return <span className="tabular-nums">{d}d {h}h {m}m {s}s</span>;
}

/** Hearing page shared by the admin and the suspended expert. */
export default function HearingView({ id, role, me }) {
  const { data, loading, error, reload } = useLoad(`/api/hearings/${id}`);
  const [form, setForm] = useState({ decision: '', mistakeLevel: '', notes: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  // Re-check every 15 s so the hearing opens automatically when its time arrives
  useEffect(() => {
    const t = setInterval(reload, 15000);
    return () => clearInterval(t);
  }, [reload]);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  const { hearing: h, reports, serverNow } = data;
  const offset = serverNow - Date.now();
  const open = h.status === 'scheduled' && new Date(h.scheduledAt).getTime() <= serverNow;

  async function conclude(e) {
    e.preventDefault();
    const verb = form.decision === 'forgiven' ? 'reinstate' : 'permanently terminate';
    if (!confirm(`Confirm: ${verb} ${h.provider.name}?`)) return;
    setBusy(true);
    try {
      await api(`/api/hearings/${id}/conclude`, { method: 'POST', body: form });
      setMsg({ kind: 'success', text: 'Hearing concluded and the decision has been applied.' });
      reload();
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Gavel className="h-4 w-4" /> Suspension hearing</p>
            <h1 className="font-display text-2xl font-semibold">{role === 'admin' ? h.provider.name : 'Your hearing with the NutriConnect admin'}</h1>
            <p className="mt-1 text-sm text-slate-500">Suspended {fmtDate(h.suspendedAt)} · {h.reportCount} reports at the time</p>
          </div>
          <StatusBadge status={h.status === 'concluded' ? (h.outcome?.decision === 'forgiven' ? 'approved' : 'terminated') : open ? 'accepted' : 'pending'}
            label={h.status === 'concluded' ? `Concluded · ${h.outcome?.decision}` : open ? 'In session' : 'Scheduled'} />
        </div>
        <p className="mt-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-900"><b>Reason for suspension:</b> {h.suspensionReason}</p>

        {h.status === 'scheduled' && !open && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <CalendarClock className="h-6 w-6 text-brand-600" />
            <div className="text-sm">
              <p>Hearing opens on <b>{new Date(h.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</b> (5 days after suspension).</p>
              <p className="text-lg font-semibold">Starts in <Countdown to={h.scheduledAt} offset={offset} /></p>
            </div>
          </div>
        )}

        {h.status === 'concluded' && (
          <div className={`mt-4 flex gap-3 rounded-xl p-4 text-sm ${h.outcome.decision === 'forgiven' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
            {h.outcome.decision === 'forgiven' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <Ban className="h-5 w-5 shrink-0" />}
            <div>
              <p className="font-semibold">{h.outcome.decision === 'forgiven' ? 'Forgiven — account reinstated' : 'Account terminated'} · mistake level: {h.outcome.mistakeLevel}</p>
              <p className="mt-1">{h.outcome.notes}</p>
              <p className="mt-1 text-xs opacity-75">Decided {fmtDate(h.outcome.decidedAt)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ChatBox
          endpoint={`/api/hearings/${id}/messages`}
          me={me}
          enabled={open}
          title="Hearing session"
          pollMs={3000}
          height="h-96"
          disabledText={h.status === 'concluded' ? 'This hearing has concluded.' : 'The hearing chat opens at the scheduled time.'}
          note={role === 'provider' ? 'Explain what happened and how you will improve. Be honest and respectful.' : 'Ask the expert about each report, then record your decision.'}
        />

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-amber-500" /> Reports under review ({reports.length})</h3>
            <ul className="space-y-2 text-sm">
              {reports.map((r) => (
                <li key={r._id} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold">{REPORT_LABELS[r.type] || r.type} <span className="text-xs font-normal text-slate-400">· {fmtDate(r.createdAt)}</span></p>
                  <p className="text-slate-600">{r.details}</p>
                </li>
              ))}
            </ul>
          </div>

          {role === 'admin' && h.status === 'scheduled' && (
            <form onSubmit={conclude} className="card space-y-4 p-6">
              <h3 className="font-semibold">Hearing decision</h3>
              {!open && <Alert kind="info">You can record the decision once the hearing has opened.</Alert>}
              <fieldset disabled={!open || busy} className="space-y-4">
                <div>
                  <label className="label">Mistake level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['minor', 'moderate', 'severe'].map((l) => (
                      <button type="button" key={l} onClick={() => setForm({ ...form, mistakeLevel: l })}
                        className={`rounded-xl border-2 py-2 text-sm font-semibold capitalize ${form.mistakeLevel === l ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Decision</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setForm({ ...form, decision: 'forgiven' })} className={`rounded-xl border-2 py-3 text-sm font-semibold ${form.decision === 'forgiven' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200'}`}>Forgive & reinstate</button>
                    <button type="button" onClick={() => setForm({ ...form, decision: 'terminated' })} className={`rounded-xl border-2 py-3 text-sm font-semibold ${form.decision === 'terminated' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200'}`}>Terminate</button>
                  </div>
                </div>
                <div><label className="label">Hearing notes (shown to the expert)</label><textarea className="input min-h-[90px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <button className={form.decision === 'terminated' ? 'btn-danger w-full' : 'btn-primary w-full'} disabled={!form.decision || !form.mistakeLevel || !form.notes.trim()}>Record decision</button>
              </fieldset>
              <Alert kind={msg?.kind}>{msg?.text}</Alert>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
