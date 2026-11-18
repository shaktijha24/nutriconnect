import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Ban } from 'lucide-react';
import { getCurrentUser } from '@/lib/api';
import DashboardShell from '@/components/DashboardShell';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

// Approval gate: pending / rejected / suspended providers can ONLY see their application page.
export default async function ProviderLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'provider') redirect(`/${user.role}`);

  // Terminated while still logged in: show a message instead of redirecting
  // (redirecting to /login would loop, because the login cookie is still valid).
  if (user.status === 'terminated') {
    return (
      <div className="container-x flex flex-col items-center py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600"><Ban className="h-7 w-7" /></span>
        <h1 className="font-display mt-4 text-2xl font-semibold">Your account has been terminated</h1>
        <p className="mt-2 max-w-md text-slate-600">
          The NutriConnect admin has removed your expert account.
          {user.statusReason ? ` Reason: ${user.statusReason}` : ''}
        </p>
        <div className="mt-6"><LogoutButton /></div>
      </div>
    );
  }

  const path = headers().get('x-pathname') || '';
  const approved = user.status === 'approved';
  const allowed = ['/provider/application', ...(user.status === 'suspended' ? ['/provider/hearing'] : [])];
  if (!approved && !allowed.some((p) => path.startsWith(p))) redirect('/provider/application');
  return <DashboardShell role="provider" status={user.status}>{children}</DashboardShell>;
}
