'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/client';
import HearingView from '@/components/HearingView';

export default function AdminHearingPage() {
  const { id } = useParams();
  const [me, setMe] = useState(null);
  useEffect(() => { api('/api/auth/me').then((d) => setMe(d.user?.id)).catch(() => {}); }, []);
  return (
    <div className="space-y-4">
      <Link href="/admin/hearings" className="text-sm font-medium text-slate-500 hover:text-ink">← All hearings</Link>
      <HearingView id={id} role="admin" me={me} />
    </div>
  );
}
