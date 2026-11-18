import BMICalculator from '@/components/BMICalculator';

export const metadata = { title: 'BMI Calculator — NutriConnect' };

export default function BMIPage() {
  return (
    <div className="container-x py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">BMI calculator</h1>
        <p className="mt-2 text-slate-600">Body Mass Index is a quick check of weight relative to height. Use it as a starting point, then let an expert look at the whole picture.</p>
      </div>
      <BMICalculator />
      <div className="mt-10 grid gap-4 sm:grid-cols-4">
        {[['Below 18.5', 'Underweight', 'bg-blue-50 text-blue-700'], ['18.5 – 24.9', 'Healthy', 'bg-emerald-50 text-emerald-700'], ['25 – 29.9', 'Overweight', 'bg-amber-50 text-amber-700'], ['30 and above', 'Obese', 'bg-red-50 text-red-700']].map(([r, l, c]) => (
          <div key={l} className={`rounded-2xl p-4 ${c}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-80">{l}</p><p className="mt-1 text-lg font-bold">{r}</p></div>
        ))}
      </div>
    </div>
  );
}
