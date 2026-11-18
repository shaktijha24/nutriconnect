'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Trash2, Save } from 'lucide-react';
import { api, useLoad, fmtDate } from '@/lib/client';
import { Spinner, Alert, Stars } from '@/components/ui';
import BookingSummary from '@/components/BookingSummary';
import ChatBox from '@/components/ChatBox';
import SessionPanel from '@/components/SessionPanel';
import ProgressChart from '@/components/ProgressChart';

const DEFAULT_MEALS = [
  { time: '7:30 AM', name: 'Breakfast', items: '' },
  { time: '11:00 AM', name: 'Mid-morning snack', items: '' },
  { time: '1:30 PM', name: 'Lunch', items: '' },
  { time: '5:00 PM', name: 'Evening snack', items: '' },
  { time: '8:00 PM', name: 'Dinner', items: '' },
];

export default function ProviderBookingPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(`/api/bookings/${id}`);
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState([]);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const b = data?.booking;

  useEffect(() => {
    if (!b) return;
    setPlan({
      title: b.dietPlan?.title || `${b.packageSnapshot?.title} — plan for ${b.client?.name?.split(' ')[0]}`,
      overview: b.dietPlan?.overview || '',
      dailyCalories: b.dietPlan?.dailyCalories || '',
      meals: b.dietPlan?.meals?.length ? b.dietPlan.meals : DEFAULT_MEALS,
      guidelines: b.dietPlan?.guidelines || '',
    });
    if (['accepted', 'completed'].includes(b.status)) {
      api(`/api/progress?clientId=${b.client._id}`).then((d) => setProgress(d.entries)).catch(() => {});
    }
  }, [b]);

  const setMeal = (i, k, v) => setPlan({ ...plan, meals: plan.meals.map((m, j) => (i === j ? { ...m, [k]: v } : m)) });

  async function savePlan(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api(`/api/bookings/${id}/plan`, { method: 'PUT', body: plan });
      setMsg({ kind: 'success', text: 'Diet plan saved and shared with your client.' });
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function act(action) {
    try {
      await api(`/api/bookings/${id}/action`, { method: 'PATCH', body: { action } });
      reload();
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    }
  }

  if (loading || (b && !plan)) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  const canPlan = ['accepted', 'completed'].includes(b.status);

  return (
    <div className="space-y-6">
      <Link href="/provider" className="text-sm font-medium text-slate-500 hover:text-ink">← Appointments</Link>
      <Alert kind={msg?.kind}>{msg?.text}</Alert>
      <BookingSummary booking={b} counterpart={`Client: ${b.client?.name}`} />

      <div className="flex flex-wrap gap-3 text-sm">
        {b.status === 'requested' && <><button className="btn-primary btn-sm" onClick={() => act('accept')}>Accept appointment</button><Link href="/provider" className="btn-ghost btn-sm">Decline from list</Link></>}
      </div>

      <SessionPanel booking={b} serverNow={data.serverNow} role="provider" onChange={reload} />

      {canPlan && (
        <form onSubmit={savePlan} className="card space-y-5 p-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Personalised diet plan</h2>
            <p className="text-sm text-slate-500">The client sees this on their booking page as soon as you save.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2"><label className="label">Plan title</label><input className="input" value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} /></div>
            <div><label className="label">Daily calories (kcal)</label><input type="number" className="input" value={plan.dailyCalories} onChange={(e) => setPlan({ ...plan, dailyCalories: e.target.value })} /></div>
          </div>
          <div><label className="label">Overview</label><textarea className="input min-h-[80px]" value={plan.overview} onChange={(e) => setPlan({ ...plan, overview: e.target.value })} placeholder="Summary of the approach and goals for this phase" /></div>

          <div className="space-y-3">
            <label className="label">Meals</label>
            {plan.meals.map((m, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[110px_160px_1fr_auto]">
                <input className="input" value={m.time} onChange={(e) => setMeal(i, 'time', e.target.value)} placeholder="Time" />
                <input className="input" value={m.name} onChange={(e) => setMeal(i, 'name', e.target.value)} placeholder="Meal" />
                <textarea rows={1} className="input" value={m.items} onChange={(e) => setMeal(i, 'items', e.target.value)} placeholder="Foods & portions" />
                <button type="button" className="btn-ghost px-2" onClick={() => setPlan({ ...plan, meals: plan.meals.filter((_, j) => j !== i) })} aria-label="Remove meal"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" className="btn-secondary btn-sm" onClick={() => setPlan({ ...plan, meals: [...plan.meals, { time: '', name: '', items: '' }] })}><Plus className="h-3.5 w-3.5" /> Add meal</button>
          </div>
          <div><label className="label">Guidelines</label><textarea className="input min-h-[80px]" value={plan.guidelines} onChange={(e) => setPlan({ ...plan, guidelines: e.target.value })} placeholder="Water intake, exercise, foods to avoid, sleep…" /></div>
          <button className="btn-primary" disabled={saving}><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & share plan'}</button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChatBox endpoint={`/api/bookings/${id}/messages`} me={b.provider?._id}
          enabled={b.status === 'accepted' && !!b.session?.activeEnd && new Date(b.session.activeEnd).getTime() > Date.now()}
          disabledText={b.status === 'accepted' ? 'Start a live session to chat with your client.' : 'Chat is open only during live sessions.'}
          note="Keep it respectful: rude messages are reported to the admin instantly. Phone numbers cannot be shared." />
        <div className="space-y-6">
          {canPlan && (
            <div className="card p-6">
              <h3 className="font-semibold">Client progress (weight)</h3>
              <div className="mt-3"><ProgressChart entries={progress} metric="weight" /></div>
              {progress.length > 0 && <p className="mt-2 text-xs text-slate-500">Latest: {progress[progress.length - 1].weight} kg on {fmtDate(progress[progress.length - 1].date)}{progress[progress.length - 1].bmi ? ` · BMI ${progress[progress.length - 1].bmi}` : ''}</p>}
            </div>
          )}
          {b.feedback?.rating && (
            <div className="card p-6">
              <h3 className="font-semibold">Client feedback</h3>
              <div className="mt-3 flex justify-between text-sm"><span>Overall</span><Stars value={b.feedback.rating} /></div>
              <div className="mt-2 flex justify-between text-sm"><span>Politeness</span><Stars value={b.feedback.politeness} /></div>
              {b.feedback.comment && <p className="mt-3 text-sm text-slate-600">“{b.feedback.comment}”</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
