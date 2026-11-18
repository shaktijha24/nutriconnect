import { handler, json, requireUser, HttpError } from '@/lib/api';
import { getBookingFor } from '@/lib/bookings';
import { createRazorpayOrder, razorpayEnabled } from '@/lib/payments';
import { clientOffers, priceFor } from '@/lib/pricing';

// Step 1: start a payment. Returns a Razorpay order, or "demo" mode when keys are not configured.
export const POST = handler(async (req, { params }) => {
  const user = await requireUser(['client']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  if (booking.status !== 'pending_payment') throw new HttpError(400, 'This booking is already paid or closed.');

  // Re-check the first-booking discount (another booking may have been paid meanwhile)
  const offers = await clientOffers(user._id);
  const pricing = priceFor(booking.pricing?.base ?? booking.payment.amount, offers.firstDiscount);
  if (pricing.final !== booking.payment.amount) {
    booking.pricing = pricing;
    booking.payment.amount = pricing.final;
    await booking.save();
  }

  if (!razorpayEnabled()) return json({ mode: 'demo', amount: booking.payment.amount });

  const order = await createRazorpayOrder(booking.payment.amount, `bk_${booking._id}`);
  booking.payment.orderId = order.id;
  await booking.save();
  return json({
    mode: 'razorpay',
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    prefill: { name: user.name, email: user.email, contact: user.phone || '' },
  });
});
