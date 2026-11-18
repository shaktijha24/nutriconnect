import { handler, json, requireUser } from '@/lib/api';
import { ProviderDocument, ProviderProfile, User } from '@/lib/models';
import { countReports, REPORT_LIMIT } from '@/lib/hearings';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireUser(['admin']);
  const status = new URL(req.url).searchParams.get('status');
  const filter = { role: 'provider' };
  if (status && status !== 'all') filter.status = status;
  const users = await User.find(filter).sort({ createdAt: -1 }).select('name email phone status statusReason createdAt reportsResetAt');
  const ids = users.map((u) => u._id);
  const [profiles, docs, counts] = await Promise.all([
    ProviderProfile.find({ user: { $in: ids } }).select('user providerType experienceYears qualification submittedAt ratingAvg politenessAvg ratingCount').lean(),
    ProviderDocument.find({ user: { $in: ids } }).select('user filename').lean(),
    Promise.all(users.map((u) => countReports(u))),
  ]);
  const providers = users.map((u, i) => ({
    ...u.toObject(),
    profile: profiles.find((p) => String(p.user) === String(u._id)) || null,
    hasDocument: docs.some((d) => String(d.user) === String(u._id)),
    reportCount: counts[i],
  }));
  return json({ providers, reportLimit: REPORT_LIMIT });
});
