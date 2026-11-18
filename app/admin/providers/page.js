'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, AlertTriangle } from 'lucide-react';
import { useLoad, fmtDate } from '@/lib/client';
import { PageHeader, Spinner, Alert, Empty, StatusBadge, Avatar } from '@/components/ui';

const TABS = ['pending', 'approved', 'rejected', 'suspended', 'terminated', 'all'];

function ProvidersList() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get('status') || 'pending');
  const { data, loading, error } = useLoad(`/api/admin/providers?status=${status}`);

  return (
    <>
      <PageHeader title="Experts" subtitle="Review applications and manage dieticians & nutritionists." />
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setStatus(t)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold capitalize ${status === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-ink'}`}>{t}</button>
        ))}
      </div>
      <Alert>{error}</Alert>
      {loading ? <Spinner /> : !data?.providers?.length ? (
        <Empty icon={Users} title={`No ${status === 'all' ? '' : status} experts`} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-x">
            <thead><tr><th>Expert</th><th>Type / experience</th><th>Application</th><th>Reports</th><th>Rating</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.providers.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td><div className="flex items-center gap-3"><Avatar name={p.name} size="sm" /><div><p className="font-semibold">{p.name}</p><p className="text-xs text-slate-500">{p.email}</p></div></div></td>
                  <td>{p.profile?.providerType}<p className="text-xs text-slate-500">{p.profile?.experienceYears || 0} yrs · {p.profile?.qualification || 'No qualification yet'}</p></td>
                  <td>{p.profile?.submittedAt ? <span className="text-xs">Submitted {fmtDate(p.profile.submittedAt)}</span> : <span className="text-xs text-amber-600">Not submitted</span>}
                    <p className={`text-xs ${p.hasDocument ? 'text-emerald-700' : 'text-slate-400'}`}>{p.hasDocument ? '✓ Document uploaded' : 'No document'}</p></td>
                  <td className="text-xs">{p.reportCount > 0
                    ? <span className={`flex items-center gap-1 font-semibold ${p.reportCount >= data.reportLimit ? 'text-red-600' : 'text-amber-600'}`}><AlertTriangle className="h-3 w-3" />{p.reportCount}/{data.reportLimit}</span>
                    : <span className="text-slate-400">0/{data.reportLimit}</span>}</td>
                  <td className="text-xs">{p.profile?.ratingCount ? <>⭐ {p.profile.ratingAvg} · courtesy {p.profile.politenessAvg}</> : '—'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td><Link href={`/admin/providers/${p._id}`} className="btn-secondary btn-sm">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminProvidersPage() {
  return <Suspense><ProvidersList /></Suspense>;
}
