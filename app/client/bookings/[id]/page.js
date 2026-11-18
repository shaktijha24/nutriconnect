'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CreditCard, ShieldCheck, Flag, ClipboardList, Smartphone } from 'lucide-react';
import { api, useLoad, inr } from '@/lib/client';
import { Spinner, Alert, Modal, Stars } from '@/components/ui';
import BookingSummary from '@/components/BookingSummary';
import DietPlanView from '@/components/DietPlanView';
import ChatBox from '@/components/ChatBox';
import SessionPanel from '@/components/SessionPanel';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function ClientBookingPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(`/api/bookings/${id}`);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoMethod, setDemoMethod] = useState('upi');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [fb, setFb] = useState({ rating: 0, politeness: 0, comment: '' });

  const b = data?.booking;

  // Jump to the feedback form when opened from the "feedback required" popup
  useEffect(() => {
    if (b && window.location.hash === '#feedback') document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth' });
  }, [b]);

  async function pay() {
    setBusy(true);
    setMsg(null);
    try {
      const order = await api(`/api/bookings/${id}/pay`, { method: 'POST' });
      if (order.mode === 'demo') {
        setDemoOpen(true);
        setBusy(false);
        return;
      }
      if (!(await loadRazorpay())) throw new Error('Could not load the payment window. Check your connection.');
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'NutriConnect',
        description: b.packageSnapshot?.title,
        prefill: order.prefill,
        theme: { color: '#1a7d53' },
        handler: async (resp) => {
          try {
            await api(`/api/bookings/${id}/pay/verify`, { method: 'POST', body: resp });
            setMsg({ kind: 'success', text: 'Payment successful! Your request has been sent to the expert.' });
            reload();
          } catch (e) {
            setMsg({ kind: 'error', text: e.message });
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
      setBusy(false);
    }
  }

  async function confirmDemo() {
    setBusy(true);
    try {
      await api(`/api/bookings/${id}/pay/verify`, { method: 'POST', body: { method: demoMethod } });
      setDemoOpen(false);
      setMsg({ kind: 'success', text: 'Payment successful! Your request has been sent to the expert.' });
      reload();
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function act(action) {
    if (action === 'cancel' && !confirm('Cancel this booking? Any payment will be refunded.')) return;
    try {
      await api(`/api/bookings/${id}/action`, { method: 'PATCH', body: { action } });
      reload();
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
    }
  }

  async function sendFeedback(e) {
    e.preventDefault();
    try {
      await api(`/api/bookings/${id}/feedback`, { method: 'POST', body: fb });
      setMsg({ kind: 'success', text: 'Thank you for your feedback!' });
      reload();
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    }
  }

  async function sendReport(e) {
    e.preventDefault();
    try {
      await api(`/api/bookings/${id}/report`, { method: 'POST', body: { details: reportText } });
      setReportOpen(false);
      setReportText('');
      setMsg({ kind: 'success', text: 'Your report was sent to the NutriConnect admin team. We take this seriously.' });
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    }
  }

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const chatEnabled = b.status === 'accepted' && b.session?.activeEnd && new Date(b.session.activeEnd).getTime() > Date.now();
  const canFeedback = ['accepted', 'completed'].includes(b.status) && (b.session?.used || 0) > 0 && !b.feedback?.rating;
  const feedbackRequired = canFeedback && b.status === 'completed';

  return (
    <div className="space-y-6">
      <Link href="/client" className="text-sm font-medium text-slate-500 hover:text-ink">← My bookings</Link>
      <Alert kind={msg?.kind}>{msg?.text}</Alert>
      <BookingSummary booking={b} counterpart={`with ${b.provider?.name}`} />

      {b.status === 'pending_payment' && (
        <div className="card flex flex-col gap-4 border-amber-200 bg-amber-50/50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Complete your payment</p>
            <p className="text-sm text-slate-600">Your expert will see your request once payment is done. Full refund if they can&apos;t take it.</p>
            {b.pricing?.discount > 0 && <p className="mt-1 text-sm font-semibold text-brand-700">🎉 First-booking discount applied: {b.pricing.discountPercent}% off (−{inr(b.pricing.discount)})</p>}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => act('cancel')}>Cancel</button>
            <button className="btn-primary" onClick={pay} disabled={busy}><CreditCard className="h-4 w-4" /> Pay {inr(b.payment?.amount)}</button>
          </div>
        </div>
      )}

      {b.status === 'requested' && (
        <div className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">{b.payment?.status === 'free' ? 'Free trial requested.' : 'Payment received.'} Waiting for <b>{b.provider?.name}</b> to confirm your slot.</p>
          <button className="btn-secondary btn-sm" onClick={() => act('cancel')}>Cancel & refund</button>
        </div>
      )}

      <SessionPanel booking={b} serverNow={data.serverNow} role="client" onChange={reload} />

      {b.dietPlan?.meals?.length || b.dietPlan?.overview ? (
        <DietPlanView plan={b.dietPlan} />
      ) : ['accepted', 'completed'].includes(b.status) && (
        <div className="card flex items-center gap-3 p-6 text-sm text-slate-600"><ClipboardList className="h-5 w-5 text-brand-600" /> Your expert will share your personalised diet plan here after your consultation.</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChatBox endpoint={`/api/bookings/${id}/messages`} me={b.client?._id} enabled={!!chatEnabled}
          disabledText={b.status === 'accepted' ? 'Chat opens when a live session is started.' : 'Chat is open only during live sessions.'} />

        <div className="space-y-6">
          {canFeedback && (
            <form id="feedback" onSubmit={sendFeedback} className={`card space-y-4 p-6 ${feedbackRequired ? 'border-amber-300 ring-4 ring-amber-50' : ''}`}>
              <div>
                <h3 className="font-semibold">Rate your session {feedbackRequired && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Required</span>}</h3>
                <p className="text-sm text-slate-500">Feedback is required after every booking. It keeps the quality high for everyone.</p>
              </div>
              <div className="flex items-center justify-between"><span className="text-sm font-medium">Overall</span><Stars value={fb.rating} onChange={(v) => setFb({ ...fb, rating: v })} size={24} /></div>
              <div className="flex items-center justify-between"><span className="text-sm font-medium">Politeness & respect</span><Stars value={fb.politeness} onChange={(v) => setFb({ ...fb, politeness: v })} size={24} /></div>
              <textarea className="input min-h-[80px]" placeholder="What went well? What could be better?" value={fb.comment} onChange={(e) => setFb({ ...fb, comment: e.target.value })} />
              <button className="btn-primary w-full" disabled={!fb.rating || !fb.politeness}>Submit feedback</button>
            </form>
          )}
          {b.feedback?.rating && (
            <div className="card p-6">
              <h3 className="font-semibold">Your feedback</h3>
              <div className="mt-3 flex items-center justify-between text-sm"><span>Overall</span><Stars value={b.feedback.rating} /></div>
              <div className="mt-2 flex items-center justify-between text-sm"><span>Politeness</span><Stars value={b.feedback.politeness} /></div>
              {b.feedback.comment && <p className="mt-3 text-sm text-slate-600">“{b.feedback.comment}”</p>}
            </div>
          )}
          {b.status !== 'pending_payment' && (
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-brand-600" /> Something not right?</h3>
              <p className="mt-1 text-sm text-slate-500">If your expert was rude or unprofessional, tell us. Reports go straight to the admin.</p>
              <button className="btn-secondary mt-4" onClick={() => setReportOpen(true)}><Flag className="h-4 w-4" /> Report a problem</button>
            </div>
          )}
        </div>
      </div>

      <Modal open={demoOpen} onClose={() => setDemoOpen(false)} title="Secure checkout">
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{b.packageSnapshot?.title}</p>
            <p className="text-2xl font-bold">{inr(b.payment?.amount)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[['upi', 'UPI', Smartphone], ['card', 'Card', CreditCard]].map(([k, l, Icon]) => (
              <button key={k} onClick={() => setDemoMethod(k)} className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold ${demoMethod === k ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'}`}><Icon className="h-4 w-4" />{l}</button>
            ))}
          </div>
          <Alert kind="info">Demo mode: no real money is charged. Add Razorpay keys in the environment to accept real payments.</Alert>
          <button className="btn-primary w-full py-3" onClick={confirmDemo} disabled={busy}>{busy ? 'Processing…' : `Pay ${inr(b.payment?.amount)}`}</button>
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report a problem">
        <form onSubmit={sendReport} className="space-y-4">
          <textarea className="input min-h-[120px]" required placeholder="Describe what happened…" value={reportText} onChange={(e) => setReportText(e.target.value)} />
          <button className="btn-danger w-full">Send to admin</button>
        </form>
      </Modal>
    </div>
  );
}
