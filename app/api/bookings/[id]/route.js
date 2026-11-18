import { handler, json, requireUser } from '@/lib/api';
import { getBookingFor } from '@/lib/bookings';
import { razorpayEnabled } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req, { params }) => {
  const user = await requireUser(['client', 'provider', 'admin']);
  const booking = await getBookingFor(user, params.id);
  return json({ booking, paymentMode: razorpayEnabled() ? 'razorpay' : 'demo', serverNow: Date.now() });
});
