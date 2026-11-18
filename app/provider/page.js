'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Inbox, Users, IndianRupee, Star, HeartHandshake, Check, X, ChevronRight, CalendarX } from 'lucide-react';
import { api, useLoad, inr, fmtDate, fmtTime } from '@/lib/client';
import { PageHeader, StatCard, StatusBadge, Spinner, Alert, Empty, Modal, Avatar } from '@/components/ui';

const TABS = [
  ['requested', 'New requests'],
  ['accepted', 'Upcoming'],
  ['completed', 'Completed'],
  ['closed', 'Declined / cancelled'],
];

export default function ProviderDashboard() {
  const { data, loading, error, reload } = useLoad('/api/bookings');
  const profile = useLoad('/api/provider/profile');
  const [tab, setTab] = useState('requested');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState(null);

  const bookings = (data?.bookings || []).filter((b) => b.status !== 'pending_payment');
  const p = profile.data?.profile;
  const filtered = bookings.filter((b) => (tab === 'closed' ? ['rejected', 'cancelled'].includes(b.status) : b.status === tab));
  const earnings = bookings.filter((b) => ['accepted', 'completed'].includes(b.status)).reduce((s, b) => s + (b.payment?.amount || 0), 0);
  const count = (s) => bookings.filter((b) => b.status === s).length;

  async function act(id, action, extra = {}) {
    setMsg(null);
    try {
      await api(`/api/bookings/${id}/action`, { method: 'PATCH', body: { action, ...extra } });
      setMsg({ kind: 'success', text: action === 'accept' ? 'Appointment accepted. The client has been notified.' : 'Request declined and the client refunded.' });
      setRejecting(null);
      setReason('');
      reload();
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
    }
  }

  return (
    <>
      <PageHeader title="Appointments" subtitle="Accept requests that fit your availability. Always be warm and respectful — clients rate your politeness." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Inbox} label="New requests" value={count('requested')} tone="sky" />
        <StatCard icon={Users} label="Active clients" value={count('accepted')} />
        <StatCard icon={IndianRupee} label="Earnings" value={inr(earnings)} tone="peach" sub="Confirmed & completed" />
        <StatCard icon={Star} label="Rating" tone="amber" value={p?.ratingCount ? p.ratingAvg.toFixed(1) : '—'}
          sub={p?.ratingCount ? <span className="inline-flex items-center gap-1"><HeartHandshake className="h-3 w-3" />Politeness {p.politenessAvg.toFixed(1)} · {p.ratingCount} reviews</span> : 'No reviews yet'} />
      </div>

      {p && p.politenessAvg > 0 && p.politenessAvg < 3 && (
        <div className="mb-6"><Alert kind="warn">Your politeness score is below 3. Low scores are reported to the admin and can lead to suspension. Please review how you communicate with clients.</Alert></div>
      )}
      {profile.data?.reportCount > 0 && (
        <div className="mb-6"><Alert kind={profile.data.reportCount >= 3 ? 'error' : 'warn'}>
          You have <b>{profile.data.reportCount} of {profile.data.reportLimit}</b> user reports. At {profile.data.reportLimit} reports the admin can suspend your account, followed by a hearing.
        </Alert></div>
      )}
      <div className="mb-4"><Alert kind={msg?.kind}>{msg?.text}</Alert></div>

      <div className="card overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 p-2">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${tab === k ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-ink'}`}>
              {l}{k === 'requested' && count('requested') > 0 && <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 text-xs text-white">{count('requested')}</span>}
            </button>
          ))}
        </div>
        <Alert>{error}</Alert>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="p-6"><Empty icon={CalendarX} title="Nothing here" text={tab === 'requested' ? 'New paid requests will appear here.' : 'No bookings in this list yet.'} /></div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((b) => (
              <li key={b._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <Link href={`/provider/bookings/${b._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={b.client?.name || '?'} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.client?.name} <span className="font-normal text-slate-500">· {b.packageSnapshot?.title}</span></p>
                    <p className="text-sm text-slate-500">{fmtDate(b.date)}, {fmtTime(b.timeSlot)}{b.goal ? ` · Goal: ${b.goal}` : ''}</p>
                  </div>
                </Link>
                {b.status === 'requested' ? (
                  <div className="flex gap-2">
                    <button className="btn-secondary btn-sm" onClick={() => setRejecting(b)}><X className="h-3.5 w-3.5" /> Decline</button>
                    <button className="btn-primary btn-sm" onClick={() => act(b._id, 'accept')}><Check className="h-3.5 w-3.5" /> Accept</button>
                  </div>
                ) : (
                  <Link href={`/provider/bookings/${b._id}`} className="flex items-center gap-2"><StatusBadge status={b.status} /><ChevronRight className="h-4 w-4 text-slate-400" /></Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Decline this request">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">The client will be refunded in full. Please give a short, polite reason — for example suggesting another time.</p>
          <textarea className="input min-h-[100px]" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Sorry, I'm unavailable at this time. Could you please book a slot on Thursday instead? Thank you for understanding." />
          <button className="btn-danger w-full" disabled={!reason.trim()} onClick={() => act(rejecting._id, 'reject', { reason })}>Decline & refund</button>
        </div>
      </Modal>
    </>
  );
}
