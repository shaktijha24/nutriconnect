'use client';
import { useEffect, useState } from 'react';
import { Gavel } from 'lucide-react';
import { api, useLoad } from '@/lib/client';
import { Spinner, Alert, Empty } from '@/components/ui';
import HearingView from '@/components/HearingView';

export default function ProviderHearingPage() {
  const { data, loading, error } = useLoad('/api/hearings');
  const [me, setMe] = useState(null);
  useEffect(() => { api('/api/auth/me').then((d) => setMe(d.user?.id)).catch(() => {}); }, []);
  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  const latest = data.hearings.find((h) => h.status === 'scheduled') || data.hearings[0];
  if (!latest) return <Empty icon={Gavel} title="No hearing scheduled" />;
  return <HearingView id={latest._id} role="provider" me={me} />;
}
