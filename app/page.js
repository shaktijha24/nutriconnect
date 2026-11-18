import Link from 'next/link';
import {
  ClipboardList, Calculator, Package, LineChart, MessageCircle, ShieldCheck, ArrowRight, CheckCircle2, Star,
} from 'lucide-react';

const FEATURES = [
  { icon: ClipboardList, title: 'Personalised diet plans', text: 'Your expert builds a meal-by-meal plan around your goals, culture, budget and health conditions.' },
  { icon: Calculator, title: 'BMI calculator', text: 'Check your BMI in seconds, see your healthy weight range and save results to your profile.' },
  { icon: Package, title: 'Diet package booking', text: 'Pick a package that fits — weight loss, diabetes, PCOS, sports nutrition — and pay securely.' },
  { icon: LineChart, title: 'Progress reports', text: 'Log weight and waist, watch your trend chart, and share it with your expert automatically.' },
  { icon: MessageCircle, title: 'Chat with your expert', text: 'Ask questions between sessions. Every conversation is held to our respect standard.' },
  { icon: ShieldCheck, title: 'Verified professionals', text: 'Every dietician submits credentials and a sample plan, reviewed by our team before going live.' },
];

const STEPS = [
  ['Find your expert', 'Browse verified dieticians and nutritionists by speciality, language and price.'],
  ['Book & pay', 'Choose a package and a time that suits you. Pay securely online.'],
  ['Get your plan', 'Your expert confirms, consults you and shares a personalised diet plan.'],
  ['Track & improve', 'Log progress, chat with your expert and rate your experience.'],
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="grain relative overflow-hidden">
        <div className="container-x grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <span className="chip mb-5"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Every expert is verified by our team</span>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
              Eat better, with a real expert <span className="italic text-brand-600">in your corner.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Book certified dieticians and nutritionists, get a diet plan made for your body and your kitchen, and see your progress week by week.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dieticians" className="btn-primary px-6 py-3 text-base">Find a dietician <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/bmi" className="btn-secondary px-6 py-3 text-base">Check your BMI</Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><b className="text-ink">Rated by clients</b> after every consult</div>
            </div>
          </div>

          {/* Visual: plan + progress preview */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="card rotate-[-2deg] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Today&apos;s plan</p>
                  <p className="font-display text-lg font-semibold">1,650 kcal · High protein</p>
                </div>
                <span className="chip">Week 3</span>
              </div>
              {[
                ['7:30 AM', 'Breakfast', 'Moong dal chilla, mint chutney, curd'],
                ['11:00 AM', 'Mid-morning', 'Papaya bowl + 6 almonds'],
                ['1:30 PM', 'Lunch', '2 multigrain roti, palak paneer, salad'],
                ['7:30 PM', 'Dinner', 'Grilled fish / tofu, sautéed veggies'],
              ].map(([t, m, f]) => (
                <div key={t} className="flex gap-3 border-t border-slate-100 py-2.5 text-sm">
                  <span className="w-16 shrink-0 text-xs font-medium text-slate-400">{t}</span>
                  <div><p className="font-semibold">{m}</p><p className="text-slate-500">{f}</p></div>
                </div>
              ))}
            </div>
            <div className="card absolute -bottom-10 -left-4 w-52 rotate-[3deg] p-4 sm:-left-12">
              <p className="text-xs font-medium text-slate-500">Weight trend</p>
              <p className="text-xl font-bold text-brand-700">−3.4 kg</p>
              <svg viewBox="0 0 160 50" className="mt-1 w-full"><path d="M0,10 L25,14 L50,18 L75,22 L100,30 L125,33 L160,42" fill="none" stroke="#289b68" strokeWidth="3" strokeLinecap="round" /></svg>
            </div>
            <div className="card absolute -right-2 -top-6 rotate-[4deg] px-4 py-3 sm:-right-8">
              <p className="text-xs text-slate-500">BMI</p>
              <p className="text-lg font-bold">23.1 <span className="text-xs font-semibold text-emerald-600">Healthy</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-x py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Everything you need to eat well — in one place</h2>
          <p className="mt-3 text-slate-600">Simple to use, built around real consultations with real professionals.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink py-16 text-white">
        <div className="container-x">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, text], i) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="font-display text-4xl font-semibold text-brand-300">0{i + 1}</span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For experts */}
      <section className="container-x py-16">
        <div className="card grid items-center gap-8 overflow-hidden bg-gradient-to-br from-brand-50 to-peach-50 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">Are you a dietician or nutritionist?</h2>
            <p className="mt-3 text-slate-600">
              Join NutriConnect, set your own packages and availability, and grow your practice. Submit your credentials and a sample plan — our team reviews every application.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup?role=provider" className="btn-primary">Apply as an expert</Link>
              <Link href="/sample-document" className="btn-secondary">See the sample document</Link>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            {['Accept or decline requests based on your availability', 'Write meal-by-meal plans clients love', 'See client progress charts before each session', 'Get paid securely for every booking'].map((t) => (
              <li key={t} className="flex items-start gap-2.5 rounded-xl bg-white/70 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{t}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
