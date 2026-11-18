'use client';
import Link from 'next/link';
import { Users, UserCheck, Clock, CalendarCheck, IndianRupee, ShieldAlert, ChevronRight, Gavel, Star } from 'lucide-react';
import { useLoad, inr, fmtDate } from '@/lib/client';
import { PageHeader, StatCard, Spinner, Alert, Avatar } from '@/components/ui';
import ReportCard from '@/components/ReportCard';

export default function AdminHome() {
  const { data, loading, error } = useLoad('/api/admin/stats');
  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  const totalBookings = Object.values(data.bookings).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader title="Admin overview" subtitle="Approve experts, act on reports and keep quality high." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Clients" value={data.clients} />
        <StatCard icon={UserCheck} label="Approved experts" value={data.providers.approved || 0} tone="sky"
          sub={`${data.providers.suspended || 0} suspended · ${data.providers.terminated || 0} terminated`} />
        <StatCard icon={Clock} label="Pending applications" value={data.providers.pending || 0} tone="amber" />
        <StatCard icon={CalendarCheck} label="Bookings" value={totalBookings} tone="violet" sub={`${data.bookings.accepted || 0} active · ${data.bookings.completed || 0} completed`} />
        <StatCard icon={IndianRupee} label="Revenue collected" value={inr(data.revenue)} tone="peach" sub="Paid, excluding refunds" />
        <StatCard icon={ShieldAlert} label="Open reports" value={data.openReports} tone="red" sub={data.openReports ? 'Needs attention' : 'All clear'} />
        <StatCard icon={Star} label="Customer feedback" value={data.feedback.n ? data.feedback.rating.toFixed(1) : '—'} tone="amber"
          sub={data.feedback.n ? `${data.feedback.n} reviews · politeness ${data.feedback.politeness.toFixed(1)}` : 'No reviews yet'} />
        <StatCard icon={Gavel} label="Upcoming hearings" value={data.hearings.length} tone="violet"
          sub={data.hearings.some((h) => new Date(h.scheduledAt) <= new Date()) ? 'A hearing is open now' : 'Held 5 days after suspension'} />
      </div>

      {data.hearings.length > 0 && (
        <div className="card mb-6 p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Hearings</h2><Link href="/admin/hearings" className="text-sm font-semibold text-brand-700">View all →</Link></div>
          <ul className="divide-y divide-slate-100">
            {data.hearings.map((h) => {
              const open = new Date(h.scheduledAt) <= new Date();
              return (
                <li key={h._id}><Link href={`/admin/hearings/${h._id}`} className="flex items-center justify-between py-3 text-sm hover:opacity-80">
                  <span className="font-semibold">{h.provider?.name}</span>
                  <span className={open ? 'font-semibold text-red-600' : 'text-slate-500'}>{open ? 'Open now — join' : new Date(h.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </Link></li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Urgent reports</h2>
            <Link href="/admin/reports" className="text-sm font-semibold text-brand-700">View all →</Link>
          </div>
          {data.recentReports.length === 0 ? <p className="text-sm text-slate-500">No open reports. 🎉</p> : (
            <div className="space-y-3">{data.recentReports.map((r) => <ReportCard key={r._id} r={r} />)}</div>
          )}
        </div>
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Waiting for approval</h2>
            <Link href="/admin/providers?status=pending" className="text-sm font-semibold text-brand-700">View all →</Link>
          </div>
          {data.pendingProviders.length === 0 ? <p className="text-sm text-slate-500">No pending applications.</p> : (
            <ul className="divide-y divide-slate-100">
              {data.pendingProviders.map((p) => (
                <li key={p._id}>
                  <Link href={`/admin/providers/${p._id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <Avatar name={p.name} size="sm" />
                    <div className="flex-1"><p className="font-semibold">{p.name}</p><p className="text-xs text-slate-500">{p.email} · joined {fmtDate(p.createdAt)}</p></div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
