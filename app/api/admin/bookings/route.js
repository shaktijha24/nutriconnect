import { handler, json, requireUser } from '@/lib/api';
import { Booking } from '@/lib/models';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await requireUser(['admin']);
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(300)
    .populate('client', 'name email')
    .populate('provider', 'name')
    .select('-dietPlan')
    .lean();
  return json({ bookings });
});
