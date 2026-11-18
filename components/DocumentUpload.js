'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { UploadCloud, FileCheck2, FileWarning, Download, Loader2 } from 'lucide-react';
import { fmtDate } from '@/lib/client';

const REQUIRED = ['Professional identity', 'Qualifications & licence', 'Experience', 'Consultation approach', 'Sample diet plan', 'Declaration'];

/** Upload of the application report. The server checks file type and the sample-document format. */
export default function DocumentUpload({ document, onUploaded, disabled }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);

  async function upload(file) {
    setError(null);
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) return setError({ message: 'Only PDF (.pdf) or Word (.docx) files are accepted.' });
    if (file.size > 5 * 1024 * 1024) return setError({ message: 'File is larger than 5 MB.' });
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/provider/document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.error), { details: data.details, found: data.sectionsFound });
      onUploaded?.(data.document);
    } catch (e) {
      setError({ message: e.message, details: e.details, found: e.found });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <a href="/NutriConnect-Application-Template.docx" download className="btn-secondary btn-sm"><Download className="h-3.5 w-3.5" /> Download template (.docx)</a>
        <Link href="/sample-document" target="_blank" className="btn-ghost btn-sm">View filled sample</Link>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) upload(e.dataTransfer.files?.[0]); }}
        className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${drag ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50/60 hover:border-brand-400'} ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        {busy ? <Loader2 className="h-8 w-8 animate-spin text-brand-600" /> : <UploadCloud className="h-8 w-8 text-brand-600" />}
        <p className="mt-2 font-semibold">{busy ? 'Checking your document…' : document ? 'Upload a new version' : 'Click or drop your application document here'}</p>
        <p className="text-xs text-slate-500">PDF or DOCX · max 5 MB · must follow the sample document format</p>
        <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" disabled={disabled || busy} onChange={(e) => upload(e.target.files?.[0])} />
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="flex items-center gap-2 font-semibold"><FileWarning className="h-4 w-4" /> {error.message}</p>
          {error.details?.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{error.details.map((d) => <li key={d}>{d}</li>)}</ul>}
          {error.found && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {REQUIRED.map((r) => (
                <span key={r} className={`rounded-full px-2 py-0.5 text-xs font-medium ${error.found.includes(r) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{error.found.includes(r) ? '✓' : '✗'} {r}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {document && !error && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <FileCheck2 className="h-5 w-5 shrink-0 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-emerald-900">Format check passed</p>
            <p className="truncate text-emerald-800">{document.filename} · {Math.round(document.size / 1024)} KB · {document.wordCount} words · uploaded {fmtDate(document.uploadedAt)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{(document.sectionsFound || []).map((s) => <span key={s} className="rounded-full bg-white px-2 py-0.5 text-xs text-emerald-800">✓ {s}</span>)}</div>
          </div>
          <a href="/api/provider/document?download=1" className="btn-secondary btn-sm shrink-0">Download</a>
        </div>
      )}
    </div>
  );
}
