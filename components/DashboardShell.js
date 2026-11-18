'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, LineChart, Calculator, Search, Package, FileText, Users, ShieldAlert, CalendarCheck,
  MessageSquareHeart, Gavel, Phone,
} from 'lucide-react';
import { api } from '@/lib/client';
import { Alert } from './ui';

const NAV = {
  client: [
    { href: '/client', label: 'Overview', icon: LayoutDashboard },
    { href: '/client/progress', label: 'Progress', icon: LineChart },
    { href: '/dieticians', label: 'Find an expert', icon: Search },
    { href: '/bmi', label: 'BMI calculator', icon: Calculator },
  ],
  provider: [
    { href: '/provider', label: 'Appointments', icon: CalendarCheck },
    { href: '/provider/packages', label: 'Diet packages', icon: Package },
    { href: '/provider/application', label: 'Profile & documents', icon: FileText },
  ],
  providerLimited: [{ href: '/provider/application', label: 'Application status', icon: FileText }],
  providerSuspended: [
    { href: '/provider/application', label: 'Account status', icon: FileText },
    { href: '/provider/hearing', label: 'My hearing', icon: Gavel },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/providers', label: 'Experts', icon: Users },
    { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
    { href: '/admin/feedback', label: 'Customer feedback', icon: MessageSquareHeart },
    { href: '/admin/hearings', label: 'Hearings', icon: Gavel },
    { href: '/admin/bookings', label: 'Bookings & payments', icon: CalendarCheck },
  ],
};

// Google sign-ups don't give us a phone number, so we ask for it once.
function PhoneReminder() {
  const [missing, setMissing] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api('/api/auth/me').then((d) => setMissing(d.user && d.user.role !== 'admin' && !d.user.phone)).catch(() => {});
  }, []);
  if (!missing) return null;
  async function save(e) {
    e.preventDefault();
    try {
      await api('/api/auth/me', { method: 'PATCH', body: { phone } });
      setMissing(false);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form onSubmit={save} className="mb-6 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center">
      <Phone className="h-5 w-5 shrink-0 text-sky-700" />
      <p className="flex-1 text-sm text-sky-900"><b>Add your phone number</b> to complete your profile. It is never shown in chat.</p>
      <input className="input sm:w-48" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required />
      <button className="btn-primary">Save</button>
      {error && <div className="sm:w-full"><Alert>{error}</Alert></div>}
    </form>
  );
}

export default function DashboardShell({ role, status, children }) {
  const pathname = usePathname();
  let key = role;
  if (role === 'provider' && status === 'suspended') key = 'providerSuspended';
  else if (role === 'provider' && status !== 'approved') key = 'providerLimited';
  const items = NAV[key];
  const isActive = (href) => pathname === href || (href !== `/${role}` && pathname.startsWith(href + '/'));

  return (
    <div className="container-x py-6 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="no-print lg:w-56 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 lg:sticky lg:top-24 lg:flex-col">
            {items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive(href) ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'}`}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 flex-1">
          {role !== 'admin' && <PhoneReminder />}
          {children}
        </section>
      </div>
    </div>
  );
}
