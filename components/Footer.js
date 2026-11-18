import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="no-print mt-16 border-t border-slate-200 bg-white">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Verified dieticians and nutritionists, personalised plans and honest progress tracking — all in one place.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">For clients</p>
          <ul className="space-y-2 text-slate-500">
            <li><Link href="/dieticians" className="hover:text-brand-700">Find an expert</Link></li>
            <li><Link href="/bmi" className="hover:text-brand-700">BMI calculator</Link></li>
            <li><Link href="/signup" className="hover:text-brand-700">Create an account</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">For experts</p>
          <ul className="space-y-2 text-slate-500">
            <li><Link href="/signup?role=provider" className="hover:text-brand-700">Join as a dietician</Link></li>
            <li><Link href="/sample-document" className="hover:text-brand-700">Application sample document</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} NutriConnect. Not a substitute for emergency medical care.
      </div>
    </footer>
  );
}
