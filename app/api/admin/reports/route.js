import { handler, json, requireUser } from '@/lib/api';
import { Report } from '@/lib/models';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireUser(['admin']);
  const status = new URL(req.url).searchParams.get('status') || 'open';
  const filter = status === 'all' ? {} : { status };
  const reports = await Report.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('provider', 'name email status')
    .populate('client', 'name email')
    .lean();
  return json({ reports });
});
