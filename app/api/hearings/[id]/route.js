import { handler, json, requireUser } from '@/lib/api';
import { Report } from '@/lib/models';
import { loadHearing } from '@/lib/hearings';

export const dynamic = 'force-dynamic';


export const GET = handler(async (req, { params }) => {
  const user = await requireUser(['admin', 'provider'], { allowUnapproved: true });
  const hearing = await loadHearing(user, params.id);
  // Reports that led to the suspension (visible to both sides so the provider can respond)
  const reports = await Report.find({
    provider: hearing.provider._id,
    status: { $ne: 'dismissed' },
    createdAt: { $lte: hearing.suspendedAt, ...(hearing.provider.reportsResetAt ? { $gt: hearing.provider.reportsResetAt } : {}) },
  }).sort({ createdAt: -1 }).select('type severity details createdAt source').lean();
  const out = hearing.toObject();
  delete out.messages;
  return json({ hearing: out, reports, serverNow: Date.now() });
});
