import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';
import DashboardShell from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect(`/${user.role}`);
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
