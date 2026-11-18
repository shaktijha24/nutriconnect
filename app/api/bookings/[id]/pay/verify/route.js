import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { getBookingFor } from '@/lib/bookings';
import { razorpayEnabled, verifyRazorpaySignature } from '@/lib/payments';

// Step 2: confirm the payment, then the request goes to the dietician.
export const POST = handler(async (req, { params }) => {
  const user = await requireUser(['client']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  if (booking.status !== 'pending_payment') throw new HttpError(400, 'This booking is already paid or closed.');
  const body = await readBody(req);

  if (razorpayEnabled()) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || razorpay_order_id !== booking.payment.orderId ||
        !verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      throw new HttpError(400, 'Payment could not be verified. If money was deducted it will be refunded automatically.');
    }
    booking.payment.method = 'razorpay';
    booking.payment.paymentId = razorpay_payment_id;
  } else {
    booking.payment.method = 'demo';
    booking.payment.paymentId = `demo_${Date.now()}`;
  }

  booking.payment.status = 'paid';
  booking.payment.paidAt = new Date();
  booking.status = 'requested';
  await booking.save();
  return json({ booking });
});
