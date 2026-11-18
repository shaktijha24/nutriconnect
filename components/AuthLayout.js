import { CheckCircle2 } from 'lucide-react';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="container-x grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="relative hidden h-full max-h-[620px] overflow-hidden rounded-3xl bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-peach-400/20 blur-3xl" />
        <p className="relative font-display text-4xl font-semibold leading-tight">
          Small changes,<br /><span className="italic text-brand-300">guided by experts,</span><br />add up.
        </p>
        <ul className="relative space-y-3 text-sm text-slate-200">
          {['Verified dieticians & nutritionists', 'Personalised, meal-by-meal plans', 'Progress tracking you can see', 'Respectful care — guaranteed by client ratings'].map((t) => (
            <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-300" />{t}</li>
          ))}
        </ul>
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
