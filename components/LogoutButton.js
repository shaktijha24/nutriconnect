'use client';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';

export default function LogoutButton({ className = 'btn-primary' }) {
  const router = useRouter();
  async function logout() {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/');
    router.refresh();
  }
  return <button onClick={logout} className={className}>Log out</button>;
}
