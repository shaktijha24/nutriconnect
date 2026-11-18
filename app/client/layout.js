import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';
import DashboardShell from '@/components/DashboardShell';
import FeedbackGate from '@/components/FeedbackGate';

export const dynamic = 'force-dynamic';

export default async function ClientLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'client') redirect(`/${user.role}`);
  return (
    <DashboardShell role="client">
      <FeedbackGate />
      {children}
    </DashboardShell>
  );
}
