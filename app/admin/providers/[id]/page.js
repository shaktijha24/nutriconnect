'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, PauseCircle, ExternalLink, Check, X, FileText, Download, Gavel, Lock } from 'lucide-react';
import { api, useLoad, inr, fmtDate, fmtTime } from '@/lib/client';
import { Spinner, Alert, StatusBadge, Modal, Avatar, Stars } from '@/components/ui';
import ReportCard from '@/components/ReportCard';

function Field({ label, value, wide, mono }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 whitespace-pre-line text-sm ${mono ? 'rounded-xl bg-slate-50 p-3 font-mono text-xs' : ''} ${value ? '' : 'text-slate-400'}`}>{value || 'Not provided'}</p>
    </div>
  );
}

export default function AdminProviderDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(`/api/admin/providers/${id}`);
  const [pending, setPending] = useState(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState(null);

  async function run(action, why) {
    setMsg(null);
    try {
      const d = await api(`/api/admin/providers/${id}`, { method: 'PATCH', body: { action, reason: why } });
      const text = {
        approve: 'Expert approved — they can now create packages and take clients.',
        reject: 'Application rejected. The expert can see your reason and re-submit.',
        suspend: `Expert suspended. A hearing is scheduled for ${d.hearing ? new Date(d.hearing.scheduledAt).toLocaleString('en-IN') : 'in 5 days'}.`,
      }[action];
      setMsg({ kind: 'success', text });
      setPending(null);
      setReason('');
      reload();
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
    }
  }

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  const { provider: u, profile, packages, reports, bookingStats, document: doc, reportCount, reportLimit, hearings } = data;
  const prof = profile || {};
  const canSuspend = reportCount >= reportLimit;

  const checks = [
    ['Application document uploaded (format checked)', !!doc],
    ['Qualification provided', !!prof.qualification],
    ['Registration / licence number', !!prof.registrationNumber],
    ['At least 1 year experience', (prof.experienceYears || 0) >= 1],
    ['Detailed sample diet plan', (prof.sampleDietPlan || '').length >= 200],
    ['Declaration accepted', !!prof.declaration],
  ];
  const score = checks.filter((c) => c[1]).length;
  const activeHearing = hearings.find((h) => h.status === 'scheduled');

  return (
    <div className="space-y-6">
      <Link href="/admin/providers" className="text-sm font-medium text-slate-500 hover:text-ink">← All experts</Link>
      <Alert kind={msg?.kind}>{msg?.text}</Alert>

      <div className="card flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={u.name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-2xl font-semibold">{u.name}</h1><StatusBadge status={u.status} /></div>
            <p className="text-sm text-slate-500">{prof.providerType} · {u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
            <p className="text-xs text-slate-400">Joined {fmtDate(u.createdAt)}{prof.submittedAt ? ` · Application submitted ${fmtDate(prof.submittedAt)}` : ' · Application not submitted yet'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['pending', 'rejected'].includes(u.status) && <button className="btn-primary btn-sm" onClick={() => run('approve')}><CheckCircle2 className="h-3.5 w-3.5" />Approve</button>}
          {u.status === 'pending' && <button className="btn-secondary btn-sm" onClick={() => setPending('reject')}><XCircle className="h-3.5 w-3.5" />Reject</button>}
          {u.status === 'approved' && (
            canSuspend
              ? <button className="btn-warn btn-sm" onClick={() => setPending('suspend')}><PauseCircle className="h-3.5 w-3.5" />Suspend</button>
              : <span className="btn-secondary btn-sm cursor-not-allowed opacity-60" title={`Suspension unlocks at ${reportLimit} reports`}><Lock className="h-3.5 w-3.5" />Suspend ({reportCount}/{reportLimit} reports)</span>
          )}
          {activeHearing && <Link href={`/admin/hearings/${activeHearing._id}`} className="btn-primary btn-sm"><Gavel className="h-3.5 w-3.5" />Open hearing</Link>}
        </div>
      </div>

      {u.statusReason && <Alert kind="info"><b>Last status reason:</b> {u.statusReason}</Alert>}

      {u.status === 'approved' && (
        <div className="card p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">User reports towards suspension</span>
            <b className={canSuspend ? 'text-red-600' : ''}>{reportCount} / {reportLimit}</b>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${canSuspend ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, (reportCount / reportLimit) * 100)}%` }} /></div>
          <p className="mt-2 text-xs text-slate-500">Rule: an expert can be suspended only after {reportLimit} reports (dismissed reports don&apos;t count). A hearing follows 5 days after suspension.</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><FileText className="h-5 w-5 text-brand-600" /> Application report</h2>
            {doc ? (
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{doc.filename}</p>
                  <p className="text-slate-600">{Math.round(doc.size / 1024)} KB · {doc.wordCount} words · uploaded {fmtDate(doc.uploadedAt)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{doc.sectionsFound.map((s) => <span key={s} className="rounded-full bg-white px-2 py-0.5 text-xs text-emerald-800">✓ {s}</span>)}</div>
                </div>
                <div className="flex gap-2">
                  {doc.mimeType === 'application/pdf' && <a href={`/api/admin/providers/${u._id}/document`} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm"><ExternalLink className="h-3.5 w-3.5" />Open</a>}
                  <a href={`/api/admin/providers/${u._id}/document?download=1`} className="btn-primary btn-sm"><Download className="h-3.5 w-3.5" />Download</a>
                </div>
              </div>
            ) : <p className="text-sm text-slate-500">No document uploaded yet.</p>}
          </div>

          <div className="card p-6">
            <h2 className="mb-5 font-display text-xl font-semibold">Application form</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Headline" value={prof.headline} wide />
              <Field label="Bio" value={prof.bio} wide />
              <Field label="Qualification" value={prof.qualification} />
              <Field label="University / year" value={[prof.university, prof.graduationYear].filter(Boolean).join(', ')} />
              <Field label="Registration / licence no." value={prof.registrationNumber} />
              <Field label="Experience" value={`${prof.experienceYears || 0} years`} />
              <Field label="Specialisations" value={(prof.specializations || []).join(', ')} />
              <Field label="Languages" value={(prof.languages || []).join(', ')} />
              <Field label="Certifications" value={prof.certifications} wide />
              <Field label="Previous workplaces" value={prof.previousWorkplaces} wide />
              <Field label="Approach" value={prof.approach} wide />
              <Field label="Sample diet plan" value={prof.sampleDietPlan} wide mono />
              <Field label="Case study" value={prof.caseStudy} wide />
              <Field label="References" value={prof.references} wide />
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Supporting links</p>
                {(prof.documentLinks || []).length ? (
                  <ul className="mt-1 space-y-1">{prof.documentLinks.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm text-brand-700 hover:underline"><ExternalLink className="h-3.5 w-3.5 shrink-0" />{l}</a></li>)}</ul>
                ) : <p className="mt-1 text-sm text-slate-400">None</p>}
              </div>
              <Field label="Availability" value={`${(prof.availability?.days || []).join(', ')} · ${fmtTime(prof.availability?.startTime)}–${fmtTime(prof.availability?.endTime)}`} wide />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-semibold">Reports about this expert ({reports.length})</h2>
            {reports.length === 0 ? <p className="text-sm text-slate-500">No reports.</p> : <div className="space-y-3">{reports.map((r) => <ReportCard key={r._id} r={{ ...r, provider: null }} />)}</div>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold">Eligibility checklist</h3>
            <p className="text-xs text-slate-500">Auto-check to support your decision.</p>
            <p className="mt-3 text-3xl font-bold">{score}<span className="text-base text-slate-400">/{checks.length}</span></p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-500" style={{ width: `${(score / checks.length) * 100}%` }} /></div>
            <ul className="mt-4 space-y-2 text-sm">
              {checks.map(([l, ok]) => <li key={l} className="flex items-center gap-2">{ok ? <Check className="h-4 w-4 shrink-0 text-brand-600" /> : <X className="h-4 w-4 shrink-0 text-red-500" />}{l}</li>)}
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Performance</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Overall rating</span>{prof.ratingCount ? <Stars value={prof.ratingAvg} size={14} /> : <span className="text-slate-400">—</span>}</div>
              <div className="flex items-center justify-between"><span>Politeness</span>{prof.ratingCount ? <span className={prof.politenessAvg < 3 ? 'font-bold text-red-600' : 'font-semibold'}>{prof.politenessAvg}/5</span> : <span className="text-slate-400">—</span>}</div>
              <div className="flex justify-between"><span>Reviews</span><b>{prof.ratingCount || 0}</b></div>
              <div className="flex justify-between"><span>Bookings completed</span><b>{bookingStats.completed || 0}</b></div>
              <div className="flex justify-between"><span>Declined requests</span><b>{bookingStats.rejected || 0}</b></div>
            </div>
          </div>

          {hearings.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold">Hearings</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {hearings.map((h) => (
                  <li key={h._id}><Link href={`/admin/hearings/${h._id}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 hover:bg-slate-100">
                    <span>{fmtDate(h.scheduledAt)}</span>
                    <span className="text-xs font-semibold">{h.status === 'concluded' ? h.outcome?.decision : 'scheduled'}</span>
                  </Link></li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-6">
            <h3 className="font-semibold">Packages ({packages.length})</h3>
            <ul className="mt-3 space-y-2 text-sm">{packages.map((k) => <li key={k._id} className="flex justify-between gap-2"><span className={k.active ? '' : 'text-slate-400 line-through'}>{k.title}</span><b>{inr(k.price)}</b></li>)}</ul>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Status history</h3>
            <ol className="mt-3 space-y-2 text-xs">
              {[...(u.statusHistory || [])].reverse().map((h, i) => (
                <li key={i} className="border-l-2 border-slate-200 pl-3"><StatusBadge status={h.status} /><p className="mt-1 text-slate-600">{h.reason}</p><p className="text-slate-400">{fmtDate(h.at)} · {h.by}</p></li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <Modal open={!!pending} onClose={() => setPending(null)} title={pending === 'suspend' ? 'Suspend expert' : 'Reject application'}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {pending === 'reject' && 'The expert will see this reason and can fix their application and re-submit.'}
            {pending === 'suspend' && 'The expert sees this reason immediately and loses access. Unconfirmed bookings are cancelled and refunded. A hearing with the expert is scheduled automatically 5 days from now — you decide there whether to reinstate or terminate.'}
          </p>
          <textarea className="input min-h-[100px]" placeholder="Reason (shown to the expert)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className={pending === 'suspend' ? 'btn-warn w-full' : 'btn-primary w-full'} disabled={!reason.trim()} onClick={() => run(pending, reason)}>Confirm {pending}</button>
        </div>
      </Modal>
    </div>
  );
}
