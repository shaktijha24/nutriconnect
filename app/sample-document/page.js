'use client';
import Link from 'next/link';
import { Printer, FileCheck2, Download } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Professional identity',
    rows: [
      ['Full name', 'Ananya Rao (example)'],
      ['Role', 'Registered Dietician'],
      ['Headline', 'Clinical dietician for diabetes, PCOS & healthy weight loss'],
      ['Languages', 'English, Hindi, Telugu'],
    ],
  },
  {
    title: '2. Qualifications & licence',
    rows: [
      ['Highest qualification', 'M.Sc. Food Science & Nutrition'],
      ['University / year', 'Example State University, 2017'],
      ['Registration / licence no.', 'RD-2018-XXXX (Indian Dietetic Association or equivalent body)'],
      ['Certifications', 'Certified Diabetes Educator (2020); Sports Nutrition Certificate (2022)'],
    ],
    note: 'Upload clear scans of your degree, registration certificate and ID to Google Drive / Dropbox and paste view-only links in the application.',
  },
  {
    title: '3. Experience',
    rows: [
      ['Total experience', '6 years'],
      ['Previous workplaces', 'City Multi-speciality Hospital (2018–2021, clinical dietician); FitLife Clinic (2021–present, consultant)'],
      ['Specialisations', 'Type 2 diabetes, PCOS, weight management, gut health'],
    ],
  },
  {
    title: '4. Consultation approach',
    text: 'I begin with a 40-minute assessment of medical history, lab reports, lifestyle, food habits and budget. Plans are built around regional home-cooked food, reviewed every week, and adjusted using the client’s progress log. I explain the “why” behind every change and keep conversations encouraging and judgement-free.',
  },
  {
    title: '5. Sample diet plan (required)',
    text: 'Client: 32-year-old female, vegetarian, PCOS, BMI 28.4, goal: −5 kg in 12 weeks.\n\n• 7:00 AM — Warm water with soaked methi seeds\n• 8:00 AM — 2 besan-vegetable chillas + mint chutney + 100 g curd\n• 11:00 AM — 1 guava + 5 walnut halves\n• 1:30 PM — 2 jowar rotis, 1 bowl rajma, cucumber-onion salad, buttermilk\n• 4:30 PM — Roasted chana (30 g) + green tea\n• 7:30 PM — Paneer bhurji (80 g) with sautéed vegetables, 1 small bowl brown rice\n• Guidelines: ~1,500 kcal, 25% protein, low-GI carbs, 30 min brisk walk daily, 7–8 h sleep.',
  },
  {
    title: '6. Case study (optional)',
    text: 'Client with uncontrolled type 2 diabetes (HbA1c 8.9%). Over 16 weeks with a carb-distribution plan and weekly check-ins, HbA1c fell to 7.1% and weight reduced by 4.2 kg, in coordination with the treating physician.',
  },
  {
    title: '7. References',
    rows: [['Professional reference', 'Dr. (Name), Head of Dietetics, City Multi-speciality Hospital — phone / email']],
  },
  {
    title: '8. Declaration',
    text: 'I confirm that the information and documents I have submitted are true. I agree to treat every client with respect, maintain confidentiality, and accept that NutriConnect may suspend or terminate my account for misconduct or consistently poor client feedback.',
  },
];

const RUBRIC = [
  ['Valid qualification & registration', 'Degree in nutrition/dietetics and a verifiable licence number.'],
  ['Relevant experience', 'At least 1–2 years of practice; workplaces that can be verified.'],
  ['Quality of sample plan', 'Safe, realistic, personalised, with clear timings, portions and guidelines.'],
  ['Communication & approach', 'Explains reasoning, respectful, client-centred tone.'],
  ['Complete documents', 'Readable links to degree, licence and photo ID.'],
];

export default function SampleDocumentPage() {
  return (
    <div className="container-x py-10">
      <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="chip mb-3"><FileCheck2 className="mr-1 h-3.5 w-3.5" /> For dieticians & nutritionists</span>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Sample application document</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            This is what a strong application looks like. Download the template, fill every numbered section in this format, and upload it as PDF or Word in your application. The upload is checked automatically: files missing any of the required sections (1, 2, 3, 4, 5 and 8) or shorter than 200 words are rejected.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/NutriConnect-Application-Template.docx" download className="btn-secondary"><Download className="h-4 w-4" /> Download template (.docx)</a>
          <button onClick={() => window.print()} className="btn-secondary"><Printer className="h-4 w-4" /> Print / Save PDF</button>
          <Link href="/provider/application" className="btn-primary">Start my application</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="card p-6 sm:p-10 lg:col-span-2">
          <div className="mb-8 flex items-start justify-between border-b border-dashed border-slate-200 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">NutriConnect · Expert application</p>
              <p className="font-display mt-1 text-2xl font-semibold">Ananya Rao, Registered Dietician</p>
            </div>
            <span className="rounded-lg border-2 border-brand-600 px-2 py-1 text-xs font-bold uppercase text-brand-700">Sample</span>
          </div>
          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="mb-3 font-semibold text-brand-800">{s.title}</h2>
                {s.rows && (
                  <dl className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {s.rows.map(([k, v]) => (
                      <div key={k} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-3">
                        <dt className="text-slate-500">{k}</dt><dd className="font-medium sm:col-span-2">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {s.text && <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{s.text}</p>}
                {s.note && <p className="mt-2 text-xs text-slate-500">ⓘ {s.note}</p>}
              </section>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold">How the admin evaluates you</h3>
            <ul className="mt-4 space-y-3">
              {RUBRIC.map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                  <div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-slate-500">{d}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6 text-sm">
            <h3 className="font-semibold">After you submit</h3>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-slate-600">
              <li>Your account stays <b>Pending</b> — you can only see your application status.</li>
              <li>The admin approves or rejects with a reason.</li>
              <li>If rejected, fix the issues and re-submit.</li>
              <li>Once approved, create packages and start accepting clients.</li>
            </ol>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Client feedback on politeness is monitored. Poor behaviour is reported to the admin and can lead to suspension or termination.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
