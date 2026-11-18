'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Stethoscope, Info } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import GoogleButton from '@/components/GoogleButton';
import { Alert } from '@/components/ui';
import { api } from '@/lib/client';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'provider' ? 'provider' : 'client');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '', providerType: 'Dietician' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const goNext = (user) => {
    router.push(user.role === 'provider' ? '/provider/application' : `/${user.role}`);
    router.refresh();
  };

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    setError('');
    try {
      const { user } = await api('/api/auth/signup', { method: 'POST', body: { ...form, role } });
      goNext(user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const roles = [
    { id: 'client', icon: User, title: "I'm looking for guidance", text: 'Book experts & track progress' },
    { id: 'provider', icon: Stethoscope, title: "I'm a dietician / nutritionist", text: 'Offer consultations' },
  ];

  return (
    <div>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {roles.map(({ id, icon: Icon, title, text }) => (
            <button type="button" key={id} onClick={() => setRole(id)}
              className={`rounded-2xl border-2 p-4 text-left transition ${role === id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <Icon className={`mb-2 h-5 w-5 ${role === id ? 'text-brand-600' : 'text-slate-400'}`} />
              <p className="text-sm font-semibold leading-snug">{title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{text}</p>
            </button>
          ))}
        </div>

        {role === 'provider' && (
          <div className="flex gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-800">
            <Info className="h-4 w-4 shrink-0" />
            <span>After signing up you&apos;ll fill your application and upload your document. Your account stays <b>pending</b> until the admin approves it. <Link href="/sample-document" className="font-semibold underline">See the sample document</Link>.</span>
          </div>
        )}
        {role === 'client' && (
          <div className="rounded-xl bg-peach-50 p-3 text-xs text-ink">🎁 New here? Your <b>first 10-minute chat is free</b> and your <b>first paid booking is 10% off</b>.</div>
        )}

        <Alert>{error}</Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">First name</label><input className="input" required value={form.firstName} onChange={set('firstName')} placeholder="Priya" autoComplete="given-name" /></div>
          <div><label className="label">Last name</label><input className="input" required value={form.lastName} onChange={set('lastName')} placeholder="Sharma" autoComplete="family-name" /></div>
          <div><label className="label">Phone number</label><input className="input" type="tel" required value={form.phone} onChange={set('phone')} placeholder="9876543210" autoComplete="tel" /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" /></div>
          {role === 'provider' && (
            <div className="sm:col-span-2">
              <label className="label">I am a</label>
              <select className="input" value={form.providerType} onChange={set('providerType')}>
                <option>Dietician</option><option>Nutritionist</option>
              </select>
            </div>
          )}
          <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete="new-password" /></div>
          <div><label className="label">Confirm password</label><input className="input" type="password" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></div>
        </div>
        <button className="btn-primary w-full py-3" disabled={loading}>{loading ? 'Creating account…' : role === 'provider' ? 'Create account & continue to application' : 'Create account'}</button>
      </form>

      <GoogleButton mode="signup" role={role} providerType={form.providerType} onSuccess={(d) => goNext(d.user)} onError={setError} />

      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link></p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="It takes less than a minute.">
      <Suspense><SignupForm /></Suspense>
    </AuthLayout>
  );
}
