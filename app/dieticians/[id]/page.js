'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Star, Briefcase, GraduationCap, Languages, CalendarDays, Clock, Check, HeartHandshake } from 'lucide-react';
import { api, useLoad, inr, fmtDate, fmtTime } from '@/lib/client';
import { Avatar, Spinner, Alert, Modal, Stars } from '@/components/ui';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nextDates(days, count = 14) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 1; out.length < count && i < 60; i++) {
    const n = new Date(d);
    n.setDate(d.getDate() + i);
    if (!days?.length || days.includes(DAY_NAMES[n.getDay()])) out.push(n);
  }
  return out;
}
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ProviderProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, loading, error } = useLoad(`/api/providers/${id}`);
  const [me, setMe] = useState(undefined);
  const [pkg, setPkg] = useState(null);
  const [form, setForm] = useState({ date: '', timeSlot: '', goal: '', healthNotes: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/api/auth/me').then((d) => setMe(d.user)).catch(() => setMe(null)); }, []);
  const p = data?.provider;
  const dates = useMemo(() => nextDates(p?.availability?.days), [p]);

  function openBooking(k) {
    if (me === null) return router.push(`/login?next=/dieticians/${id}`);
    setErr('');
    setForm({ date: dates[0] ? iso(dates[0]) : '', timeSlot: '', goal: '', healthNotes: '' });
    setPkg(k);
  }

  async function book(e) {
    e.preventDefault();
    if (!form.timeSlot) return setErr('Please choose a time slot.');
    setBusy(true);
    setErr('');
    try {
      const { booking } = await api('/api/bookings', { method: 'POST', body: { ...form, type: pkg.type, packageId: pkg._id, providerId: id } });
      router.push(`/client/bookings/${booking._id}`);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  const pr = data?.pricing || { sessionPrice: 200, sessionMinutes: 60, trialMinutes: 10, discountPercent: 10 };
  const offers = me?.offers;
  const firstDiscount = offers ? offers.firstDiscount : true;
  const discounted = (price) => price - Math.round((price * pr.discountPercent) / 100);
  const bookBtn = (item, label) => (me && me.role !== 'client'
    ? <p className="mt-4 rounded-lg bg-slate-50 p-2 text-center text-xs text-slate-500">Log in as a client to book.</p>
    : <button onClick={() => openBooking(item)} className="btn-primary mt-4 w-full">{label}</button>);

  if (loading) return <Spinner className="py-32" />;
  if (error) return <div className="container-x py-16"><Alert>{error}</Alert></div>;

  return (
    <div className="container-x py-10">
      <Link href="/dieticians" className="text-sm font-medium text-slate-500 hover:text-ink">← All experts</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={p.name} size="lg" />
              <div>
                <h1 className="font-display text-3xl font-semibold">{p.name}</h1>
                <p className="font-medium text-brand-600">{p.providerType}{p.headline ? ` · ${p.headline}` : ''}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{p.ratingCount ? `${p.ratingAvg?.toFixed(1)} (${p.ratingCount} reviews)` : 'New expert'}</span>
                  {p.politenessAvg > 0 && <span className="flex items-center gap-1"><HeartHandshake className="h-4 w-4 text-brand-600" />Courtesy {p.politenessAvg.toFixed(1)}/5</span>}
                  <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{p.experienceYears} years</span>
                </div>
              </div>
            </div>
            {p.bio && <p className="mt-6 whitespace-pre-line text-slate-700">{p.bio}</p>}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {p.qualification && <Info icon={GraduationCap} label="Qualification" value={`${p.qualification}${p.university ? `, ${p.university}` : ''}`} />}
              {p.languages?.length > 0 && <Info icon={Languages} label="Languages" value={p.languages.join(', ')} />}
              <Info icon={CalendarDays} label="Available" value={p.availability?.days?.join(', ')} />
              <Info icon={Clock} label="Hours" value={`${fmtTime(p.availability?.startTime)} – ${fmtTime(p.availability?.endTime)}`} />
            </div>
            {p.specializations?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">{p.specializations.map((s) => <span key={s} className="chip">{s}</span>)}</div>
            )}
          </div>

          <div className="card p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold">Client reviews</h2>
            {data.reviews.length === 0 ? <p className="mt-3 text-sm text-slate-500">No reviews yet.</p> : (
              <div className="mt-4 divide-y divide-slate-100">
                {data.reviews.map((r, i) => (
                  <div key={i} className="py-4">
                    <div className="flex items-center justify-between"><p className="font-semibold">{r.name}</p><Stars value={r.rating} size={14} /></div>
                    {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                    <p className="mt-1 text-xs text-slate-400">{fmtDate(r.at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live consultations + packages */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Live chat consultations</h2>
          {offers?.trialAvailable !== false && (
            <div className="card border-peach-400/40 bg-peach-50/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-semibold">Free trial chat</p><p className="text-xs text-slate-500">{pr.trialMinutes} minutes · one per new client</p></div>
                <p className="text-lg font-bold text-brand-700">FREE</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">Meet {p.name.split(' ')[0]} in a short live chat before you commit.</p>
              {bookBtn({ type: 'trial', title: `Free ${pr.trialMinutes}-minute trial chat`, price: 0 }, 'Book free trial')}
            </div>
          )}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">1-hour live consultation</p><p className="text-xs text-slate-500">{pr.sessionMinutes} minutes live chat · after payment</p></div>
              <div className="text-right">
                {firstDiscount ? <><p className="text-xs text-slate-400 line-through">{inr(pr.sessionPrice)}</p><p className="text-lg font-bold text-brand-700">{inr(discounted(pr.sessionPrice))}</p></> : <p className="text-lg font-bold text-brand-700">{inr(pr.sessionPrice)}</p>}
              </div>
            </div>
            {firstDiscount && <p className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{pr.discountPercent}% off your first booking</p>}
            {bookBtn({ type: 'session', title: '1-hour live consultation', price: pr.sessionPrice }, 'Book 1-hour session')}
          </div>

          <h2 className="font-display pt-2 text-xl font-semibold">Diet packages</h2>
          <p className="-mt-2 text-xs text-slate-500">Each package session is a {pr.sessionMinutes}-minute live chat.</p>
          {data.packages.length === 0 && <p className="text-sm text-slate-500">This expert hasn&apos;t published packages yet.</p>}
          {data.packages.map((k) => (
            <div key={k._id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{k.title}</p>
                <p className="text-lg font-bold text-brand-700">{inr(k.price)}</p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{k.durationWeeks} weeks · {k.sessions} sessions</p>
              {k.description && <p className="mt-2 text-sm text-slate-600">{k.description}</p>}
              {k.features?.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">{k.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{f}</li>)}</ul>
              )}
              {firstDiscount && <p className="mt-3 text-xs font-semibold text-brand-700">First booking: {inr(discounted(k.price))} after {pr.discountPercent}% off</p>}
              {bookBtn({ ...k, type: 'package' }, 'Book this package')}
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!pkg} onClose={() => setPkg(null)} title={`Book: ${pkg?.title || ''}`} wide>
        <form onSubmit={book} className="space-y-5">
          <div>
            <label className="label">Choose a date</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((d) => (
                <button type="button" key={iso(d)} onClick={() => setForm({ ...form, date: iso(d), timeSlot: '' })}
                  className={`flex w-16 shrink-0 flex-col items-center rounded-xl border-2 py-2 text-sm transition ${form.date === iso(d) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="text-[11px] font-medium uppercase text-slate-500">{DAY_NAMES[d.getDay()]}</span>
                  <span className="text-lg font-bold">{d.getDate()}</span>
                  <span className="text-[11px] text-slate-500">{d.toLocaleString('en', { month: 'short' })}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Choose a time</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data.slots.map((s) => (
                <button type="button" key={s} onClick={() => setForm({ ...form, timeSlot: s })}
                  className={`rounded-xl border-2 py-2 text-sm font-medium transition ${form.timeSlot === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300'}`}>{fmtTime(s)}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Your main goal</label>
            <input className="input" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="e.g. Lose 6 kg, manage PCOS, build muscle" />
          </div>
          <div>
            <label className="label">Health conditions, allergies or food preferences</label>
            <textarea className="input min-h-[80px]" value={form.healthNotes} onChange={(e) => setForm({ ...form, healthNotes: e.target.value })} placeholder="e.g. Vegetarian, thyroid, lactose intolerant" />
          </div>
          <Alert>{err}</Alert>
          <div className="space-y-1 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Price</span><span>{pkg?.price ? inr(pkg.price) : 'Free'}</span></div>
            {firstDiscount && pkg?.price > 0 && <div className="flex justify-between text-brand-700"><span>First-booking discount ({pr.discountPercent}%)</span><span>−{inr(pkg.price - discounted(pkg.price))}</span></div>}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-bold">{pkg?.price ? inr(firstDiscount ? discounted(pkg.price) : pkg.price) : 'Free'}</p></div>
              <button className="btn-primary" disabled={busy}>{busy ? 'Booking…' : pkg?.price ? 'Continue to payment' : 'Send free request'}</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium">{value || '—'}</p></div>
    </div>
  );
}
