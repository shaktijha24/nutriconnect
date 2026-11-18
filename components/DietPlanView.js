import { Utensils, Flame } from 'lucide-react';

export default function DietPlanView({ plan }) {
  if (!plan?.meals?.length && !plan?.overview) return null;
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-100">Your personalised plan</p>
        <h3 className="font-display mt-1 text-2xl font-semibold">{plan.title}</h3>
        {plan.dailyCalories && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm"><Flame className="h-4 w-4" />{plan.dailyCalories} kcal / day</p>}
      </div>
      <div className="space-y-5 p-6">
        {plan.overview && <p className="whitespace-pre-line text-slate-700">{plan.overview}</p>}
        {plan.meals?.length > 0 && (
          <ol className="relative space-y-4 border-l-2 border-brand-100 pl-6">
            {plan.meals.map((m, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white ring-4 ring-white"><Utensils className="h-3 w-3" /></span>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{m.time}</p>
                <p className="font-semibold">{m.name}</p>
                <p className="whitespace-pre-line text-sm text-slate-600">{m.items}</p>
              </li>
            ))}
          </ol>
        )}
        {plan.guidelines && (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <p className="mb-1 font-semibold">Guidelines</p>
            <p className="whitespace-pre-line">{plan.guidelines}</p>
          </div>
        )}
        {plan.updatedAt && <p className="text-xs text-slate-400">Last updated {new Date(plan.updatedAt).toLocaleString('en-IN')}</p>}
      </div>
    </div>
  );
}
