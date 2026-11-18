'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Star, Briefcase, Languages, UserSearch } from 'lucide-react';
import { useLoad, inr } from '@/lib/client';
import { Avatar, Empty, Spinner, Alert } from '@/components/ui';

export default function DieticiansPage() {
  const { data, loading, error } = useLoad('/api/providers');
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('rating');

  const list = useMemo(() => {
    let l = data?.providers || [];
    if (type !== 'all') l = l.filter((p) => p.providerType === type);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((p) => [p.name, p.headline, ...p.specializations, ...p.languages].join(' ').toLowerCase().includes(s));
    }
    const sorters = {
      rating: (a, b) => b.ratingAvg - a.ratingAvg,
      experience: (a, b) => b.experienceYears - a.experienceYears,
      price: (a, b) => (a.startingPrice ?? 1e9) - (b.startingPrice ?? 1e9),
    };
    return [...l].sort(sorters[sort]);
  }, [data, q, type, sort]);

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Find your dietician</h1>
        <p className="mt-2 text-slate-600">Every expert here has been verified by our team.</p>
      </div>

      <div className="card mb-6 grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by name, speciality (e.g. PCOS, diabetes) or language" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All experts</option><option value="Dietician">Dieticians</option><option value="Nutritionist">Nutritionists</option>
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rating">Top rated</option><option value="experience">Most experienced</option><option value="price">Lowest price</option>
        </select>
      </div>

      <Alert>{error}</Alert>
      {loading ? <Spinner /> : list.length === 0 ? (
        <Empty icon={UserSearch} title="No experts found" text={data?.providers?.length ? 'Try a different search.' : 'Experts will appear here once approved by the admin.'} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Link key={p.id} href={`/dieticians/${p.id}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg">
              <div className="flex items-start gap-3">
                <Avatar name={p.name} />
                <div className="min-w-0">
                  <p className="truncate font-semibold group-hover:text-brand-700">{p.name}</p>
                  <p className="text-xs font-medium text-brand-600">{p.providerType}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {p.ratingCount ? <><b className="text-ink">{p.ratingAvg.toFixed(1)}</b> ({p.ratingCount})</> : 'New'}
                  </div>
                </div>
              </div>
              {p.headline && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.headline}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.specializations.slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{p.experienceYears} yrs experience</span>
                {p.languages.length > 0 && <span className="flex items-center gap-1"><Languages className="h-3.5 w-3.5" />{p.languages.slice(0, 2).join(', ')}</span>}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 mt-5">
                <p className="text-sm">{p.startingPrice != null ? <>From <b>{inr(p.startingPrice)}</b></> : <span className="text-slate-400">No packages yet</span>}</p>
                <span className="text-sm font-semibold text-brand-700">View & book →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
