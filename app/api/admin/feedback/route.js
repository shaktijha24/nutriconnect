import { handler, json, requireUser } from '@/lib/api';
import { Booking } from '@/lib/models';

export const dynamic = 'force-dynamic';

// All customer feedback for the admin
export const GET = handler(async () => {
  await requireUser(['admin']);
  const rows = await Booking.find({ 'feedback.rating': { $exists: true } })
    .sort({ 'feedback.at': -1 })
    .limit(500)
    .populate('client', 'name email')
    .populate('provider', 'name status')
    .select('feedback client provider packageSnapshot type date')
    .lean();
  return json({ feedback: rows });
});
