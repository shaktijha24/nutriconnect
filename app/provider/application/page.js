'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, XCircle, PauseCircle, CheckCircle2, FileText, Send, Save } from 'lucide-react';
import { api, useLoad, fmtDate } from '@/lib/client';
import { Spinner, Alert } from '@/components/ui';
import DocumentUpload from '@/components/DocumentUpload';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_INFO = {
  pending: { icon: Clock, cls: 'border-amber-200 bg-amber-50 text-amber-900', title: 'Your application is pending review',
    text: 'Until the admin approves you, you can only access this page. Complete every section below and submit — most reviews happen within 1–2 working days.' },
  rejected: { icon: XCircle, cls: 'border-red-200 bg-red-50 text-red-900', title: 'Your application was not approved',
    text: 'Please read the admin’s reason, update your application and submit again.' },
  suspended: { icon: PauseCircle, cls: 'border-orange-200 bg-orange-50 text-orange-900', title: 'Your account is suspended',
    text: 'You cannot accept clients while suspended. A hearing with the admin is held 5 days after the suspension to decide whether you are reinstated.' },
  approved: { icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-900', title: 'You are approved 🎉',
    text: 'Keep your profile up to date — clients see it when they choose an expert.' },
};

function Section({ n, title, desc, children }) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</span>
        <div><h2 className="font-semibold">{title}</h2>{desc && <p className="text-sm text-slate-500">{desc}</p>}</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function ApplicationPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useLoad('/api/provider/profile');
  const [f, setF] = useState(null);
  const [declaration, setDeclaration] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data || f) return; // fill the form once; later reloads must not wipe unsaved edits
    const p = data.profile;
    setF({
      ...p,
      specializations: (p.specializations || []).join(', '),
      languages: (p.languages || []).join(', '),
      documentLinks: (p.documentLinks || []).join('\n'),
      availability: p.availability || { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '10:00', endTime: '18:00' },
    });
    setDeclaration(!!p.declaration);
  }, [data]);

  if (loading || (!f && !error)) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const status = data.account.status;
  const info = STATUS_INFO[status];
  const locked = status === 'suspended';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleDay = (d) => {
    const days = f.availability.days.includes(d) ? f.availability.days.filter((x) => x !== d) : [...f.availability.days, d];
    setF({ ...f, availability: { ...f.availability, days } });
  };

  async function save(submit) {
    setBusy(true);
    setMsg(null);
    try {
      const body = { ...f, documentLinks: f.documentLinks.split(/\n|,/), submit, declaration };
      await api('/api/provider/profile', { method: 'PUT', body });
      setMsg({ kind: 'success', text: submit ? 'Application submitted! The admin will review it shortly.' : 'Saved.' });
      reload();
      router.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  const Icon = info?.icon || Clock;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{status === 'approved' ? 'Profile & documents' : 'Expert application'}</h1>
        <p className="mt-1 text-slate-500">Hi {data.account.name.split(' ')[0]} — this is how the admin learns about your skills and experience.</p>
      </div>

      {info && (
        <div className={`flex gap-4 rounded-2xl border p-5 ${info.cls}`}>
          <Icon className="h-6 w-6 shrink-0" />
          <div className="text-sm">
            <p className="text-base font-semibold">{info.title}</p>
            <p className="mt-1 opacity-90">{info.text}</p>
            {data.account.statusReason && status !== 'pending' && <p className="mt-2 rounded-lg bg-white/60 p-2"><b>Admin&apos;s note:</b> {data.account.statusReason}</p>}
            {data.profile.submittedAt && <p className="mt-2 text-xs opacity-75">Last submitted {fmtDate(data.profile.submittedAt)}</p>}
            {status === 'suspended' && data.hearing && data.hearing.status === 'scheduled' && (
              <p className="mt-3"><Link href="/provider/hearing" className="btn-primary btn-sm">Hearing on {new Date(data.hearing.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} → open</Link></p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 text-sm">
          <FileText className="h-5 w-5 shrink-0 text-brand-600" />
          <p><b>Not sure what to write?</b> See a complete sample application and how the admin scores it.</p>
        </div>
        <Link href="/sample-document" target="_blank" className="btn-secondary btn-sm shrink-0">Open sample document</Link>
      </div>

      <Alert kind={msg?.kind}>{msg?.text}</Alert>

      <fieldset disabled={locked || busy} className="space-y-6">
        <Section n={1} title="Professional identity">
          <div><label className="label">I am a</label><select className="input" value={f.providerType} onChange={set('providerType')}><option>Dietician</option><option>Nutritionist</option></select></div>
          <div><label className="label">Headline</label><input className="input" value={f.headline || ''} onChange={set('headline')} placeholder="Clinical dietician for diabetes & PCOS" /></div>
          <div className="sm:col-span-2"><label className="label">Professional bio *</label><textarea className="input min-h-[100px]" value={f.bio || ''} onChange={set('bio')} placeholder="Tell clients about your background and how you help." /></div>
          <div><label className="label">Specialisations</label><input className="input" value={f.specializations} onChange={set('specializations')} placeholder="Weight loss, PCOS, Diabetes" /><p className="hint">Separate with commas</p></div>
          <div><label className="label">Languages</label><input className="input" value={f.languages} onChange={set('languages')} placeholder="English, Hindi, Punjabi" /></div>
        </Section>

        <Section n={2} title="Qualifications & licence" desc="The admin verifies these before approving you.">
          <div><label className="label">Highest qualification *</label><input className="input" value={f.qualification || ''} onChange={set('qualification')} placeholder="M.Sc. Food Science & Nutrition" /></div>
          <div><label className="label">University / institute</label><input className="input" value={f.university || ''} onChange={set('university')} /></div>
          <div><label className="label">Graduation year</label><input type="number" className="input" value={f.graduationYear || ''} onChange={set('graduationYear')} /></div>
          <div><label className="label">Registration / licence number *</label><input className="input" value={f.registrationNumber || ''} onChange={set('registrationNumber')} placeholder="e.g. RD / IDA number" /></div>
          <div className="sm:col-span-2"><label className="label">Certifications</label><textarea className="input" value={f.certifications || ''} onChange={set('certifications')} placeholder="Certified Diabetes Educator (2020)…" /></div>
        </Section>

        <Section n={3} title="Experience">
          <div><label className="label">Years of experience</label><input type="number" min="0" className="input" value={f.experienceYears ?? 0} onChange={set('experienceYears')} /></div>
          <div className="sm:col-span-2"><label className="label">Previous workplaces</label><textarea className="input" value={f.previousWorkplaces || ''} onChange={set('previousWorkplaces')} placeholder="Hospital / clinic, role, years" /></div>
          <div className="sm:col-span-2"><label className="label">Your consultation approach</label><textarea className="input" value={f.approach || ''} onChange={set('approach')} placeholder="How you assess clients, review plans and communicate" /></div>
        </Section>

        <Section n={4} title="Sample work" desc="This is the most important part of your application.">
          <div className="sm:col-span-2"><label className="label">Sample diet plan *</label><textarea className="input min-h-[180px] font-mono text-xs" value={f.sampleDietPlan || ''} onChange={set('sampleDietPlan')} placeholder={'Client profile: …\n\n7:00 AM — …\n8:00 AM — Breakfast: …\n…\nGuidelines: …'} /><p className="hint">{(f.sampleDietPlan || '').length} characters (min. 80)</p></div>
          <div className="sm:col-span-2"><label className="label">Case study (optional)</label><textarea className="input" value={f.caseStudy || ''} onChange={set('caseStudy')} /></div>
        </Section>

        <section className="card p-6">
          <div className="mb-5 flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">5</span>
            <div>
              <h2 className="font-semibold">Application report for the admin <span className="text-red-600">*</span></h2>
              <p className="text-sm text-slate-500">Fill the template (same format as the sample document) and upload it as PDF or Word. We check that every required section is present.</p>
            </div>
          </div>
          <DocumentUpload document={data.document} disabled={locked} onUploaded={() => { setMsg({ kind: 'success', text: 'Document uploaded and format check passed.' }); reload(); }} />
        </section>

        <Section n={6} title="Supporting links & references" desc="Optional: links to scans of your degree, licence and ID (Google Drive/Dropbox, view-only).">
          <div className="sm:col-span-2"><label className="label">Document links (one per line)</label><textarea className="input min-h-[90px]" value={f.documentLinks} onChange={set('documentLinks')} placeholder={'https://drive.google.com/…/degree.pdf\nhttps://drive.google.com/…/licence.pdf'} /></div>
          <div className="sm:col-span-2"><label className="label">Professional references</label><textarea className="input" value={f.references || ''} onChange={set('references')} placeholder="Name, designation, contact" /></div>
        </Section>

        <Section n={7} title="Availability" desc="Clients can only book within these days and hours.">
          <div className="sm:col-span-2">
            <label className="label">Working days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button type="button" key={d} onClick={() => toggleDay(d)} className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold ${f.availability.days.includes(d) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div><label className="label">From</label><input type="time" step="3600" className="input" value={f.availability.startTime} onChange={(e) => setF({ ...f, availability: { ...f.availability, startTime: e.target.value } })} /></div>
          <div><label className="label">To</label><input type="time" step="3600" className="input" value={f.availability.endTime} onChange={(e) => setF({ ...f, availability: { ...f.availability, endTime: e.target.value } })} /></div>
        </Section>

        {status !== 'approved' && (
          <label className="card flex cursor-pointer gap-3 p-5 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} />
            <span>I confirm that the information and documents are true. I agree to treat every client with respect, and I understand that NutriConnect may suspend or terminate my account for misconduct or consistently poor feedback.</span>
          </label>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => save(false)}><Save className="h-4 w-4" /> Save draft</button>
          {status === 'approved' ? (
            <button type="button" className="btn-primary" onClick={() => save(false)}>Update profile</button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => save(true)} disabled={!declaration}><Send className="h-4 w-4" /> {data.profile.submittedAt ? 'Re-submit for review' : 'Submit for review'}</button>
          )}
        </div>
      </fieldset>
    </div>
  );
}
