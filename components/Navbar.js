'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import Logo from './Logo';
import { api, initials } from '@/lib/client';

const PUBLIC_LINKS = [
  { href: '/dieticians', label: 'Find an expert' },
  { href: '/bmi', label: 'BMI calculator' },
  { href: '/sample-document', label: 'For dieticians' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api('/api/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null));
    setOpen(false);
  }, [pathname]);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  const dashLabel = { client: 'My dashboard', provider: 'Expert dashboard', admin: 'Admin panel' };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/70 bg-[#fbfaf6]/85 backdrop-blur">
      <nav className="container-x flex h-16 items-center justify-between">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${pathname.startsWith(l.href) ? 'text-brand-700' : 'text-slate-600 hover:text-ink'}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.role === 'admin' && user.openReports > 0 && (
                <Link href="/admin/reports" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Open reports">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{user.openReports}</span>
                </Link>
              )}
              <Link href={`/${user.role}`} className="btn-secondary">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">{initials(user.name)}</span>
                {dashLabel[user.role]}
              </Link>
              <button onClick={logout} className="btn-ghost" title="Log out"><LogOut className="h-4 w-4" /></button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/signup" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
        <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-50">{l.label}</Link>
            ))}
            <div className="my-2 h-px bg-slate-100" />
            {user ? (
              <>
                <Link href={`/${user.role}`} className="btn-primary">{dashLabel[user.role]}</Link>
                <button onClick={logout} className="btn-secondary">Log out</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="btn-secondary">Log in</Link>
                <Link href="/signup" className="btn-primary">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
