'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star } from 'lucide-react';
import { api } from '@/lib/client';

// Feedback after a session is mandatory: this blocks the client area until it is given.
export default function FeedbackGate() {
  const pathname = usePathname();
  const [pending, setPending] = useState(null);

  useEffect(() => {
    api('/api/auth/me').then((d) => setPending(d.user?.offers?.pendingFeedback || null)).catch(() => {});
  }, [pathname]);

  if (!pending || pathname === `/client/bookings/${pending.bookingId}`) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-500"><Star className="h-7 w-7 fill-amber-400" /></span>
        <h2 className="font-display mt-4 text-2xl font-semibold">How was your session?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your session with <b>{pending.provider}</b> ({pending.title}) has ended. Feedback is required before you continue — it takes 30 seconds and keeps our experts accountable.
        </p>
        <Link href={`/client/bookings/${pending.bookingId}#feedback`} className="btn-primary mt-6 w-full py-3">Give feedback now</Link>
      </div>
    </div>
  );
}
