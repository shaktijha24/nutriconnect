'use client';
import { useState } from 'react';
import { Trash2, LineChart, Plus } from 'lucide-react';
import { api, useLoad, fmtDate } from '@/lib/client';
import { bmiCategory } from '@/lib/bmi';
import { PageHeader, Spinner, Alert, Empty, StatCard } from '@/components/ui';
import ProgressChart from '@/components/ProgressChart';

const today = () => new Date().toISOString().slice(0, 10);

export default function ProgressPage() {
  const { data, loading, error, reload } = useLoad('/api/progress');
  const [form, setForm] = useState({ date: today(), weight: '', heightCm: '', waist: '', notes: '' });
  const [metric, setMetric] = useState('weight');
  const [msg, setMsg] = useState(null);
  const entries = data?.entries || [];
  const first = entries[0];
  const last = entries[entries.length - 1];
  const hasHeight = entries.some((e) => e.heightCm);

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/api/progress', { method: 'POST', body: form });
      setForm({ ...form, weight: '', waist: '', notes: '' });
      setMsg({ kind: 'success', text: 'Entry added.' });
      reload();
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    }
  }

  async function remove(id) {
    if (!confirm('Delete this entry?')) return;
    await api(`/api/progress/${id}`, { method: 'DELETE' }).catch(() => {});
    reload();
  }

  return (
    <>
      <PageHeader title="Progress report" subtitle="Log regularly — your dietician sees this too, so they can fine-tune your plan." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Starting weight" value={first ? `${first.weight} kg` : '—'} sub={first && fmtDate(first.date)} />
        <StatCard label="Current weight" value={last ? `${last.weight} kg` : '—'} tone="peach" sub={last && fmtDate(last.date)} />
        <StatCard label="Total change" tone="sky" value={first && last ? `${last.weight - first.weight > 0 ? '+' : ''}${(last.weight - first.weight).toFixed(1)} kg` : '—'}
          sub={last?.bmi ? `BMI ${last.bmi} · ${bmiCategory(last.bmi)?.label}` : ''} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Trend</h2>
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              {[['weight', 'Weight'], ['bmi', 'BMI'], ['waist', 'Waist']].map(([k, l]) => (
                <button key={k} onClick={() => setMetric(k)} className={`rounded-md px-3 py-1.5 ${metric === k ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{l}</button>
              ))}
            </div>
          </div>
          {loading ? <Spinner /> : <ProgressChart entries={entries} metric={metric} />}
        </div>

        <form onSubmit={add} className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-semibold"><Plus className="h-4 w-4 text-brand-600" /> New entry</h2>
          <Alert kind={msg?.kind}>{msg?.text}</Alert>
          <div><label className="label">Date</label><input type="date" className="input" max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Weight (kg)</label><input type="number" step="0.1" required className="input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
            <div><label className="label">Waist (cm)</label><input type="number" step="0.1" className="input" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" className="input" placeholder={hasHeight ? 'Uses your last height' : 'Needed for BMI'} value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
          </div>
          <div><label className="label">Notes</label><input className="input" placeholder="How are you feeling?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <button className="btn-primary w-full">Add entry</button>
        </form>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <Alert>{error}</Alert>
        {!loading && entries.length === 0 ? (
          <div className="p-6"><Empty icon={LineChart} title="No entries yet" text="Add your first weigh-in to start your progress report." /></div>
        ) : (
          <table className="table-x">
            <thead><tr><th>Date</th><th>Weight</th><th>BMI</th><th>Waist</th><th>Notes</th><th /></tr></thead>
            <tbody>
              {[...entries].reverse().map((e) => (
                <tr key={e._id}>
                  <td>{fmtDate(e.date)}</td><td className="font-semibold">{e.weight} kg</td>
                  <td>{e.bmi ? <span>{e.bmi} <span className="text-xs text-slate-500">{bmiCategory(e.bmi)?.label}</span></span> : '—'}</td>
                  <td>{e.waist ? `${e.waist} cm` : '—'}</td><td className="text-slate-500">{e.notes || '—'}</td>
                  <td><button onClick={() => remove(e._id)} className="text-slate-400 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
