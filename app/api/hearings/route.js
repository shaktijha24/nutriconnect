import { handler, json, requireUser } from '@/lib/api';
import { Hearing } from '@/lib/models';

export const dynamic = 'force-dynamic';

// Admin: all hearings. Provider: their own hearings.
export const GET = handler(async () => {
  const user = await requireUser(['admin', 'provider'], { allowUnapproved: true });
  const filter = user.role === 'provider' ? { provider: user._id } : {};
  const hearings = await Hearing.find(filter)
    .sort({ status: -1, scheduledAt: 1 })
    .populate('provider', 'name email status')
    .select('-messages')
    .lean();
  return json({ hearings, serverNow: Date.now() });
});
