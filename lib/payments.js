import crypto from 'crypto';

export const razorpayEnabled = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

function authHeader() {
  const token = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');
  return `Basic ${token}`;
}

export async function createRazorpayOrder(amountInr, receipt) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: 'INR', receipt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.description || 'Could not create payment order');
  return data;
}

export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

/** Marks a refund on a booking. With Razorpay configured, also asks Razorpay to refund. */
export async function refundBooking(booking) {
  if (booking.payment?.status !== 'paid') return;
  booking.payment.refundStatus = 'initiated';
  if (booking.payment.method === 'razorpay' && razorpayEnabled() && booking.payment.paymentId) {
    try {
      const res = await fetch(
        `https://api.razorpay.com/v1/payments/${booking.payment.paymentId}/refund`,
        { method: 'POST', headers: { Authorization: authHeader(), 'Content-Type': 'application/json' }, body: '{}' }
      );
      if (res.ok) booking.payment.refundStatus = 'refunded';
    } catch (e) {
      console.error('Refund failed', e);
    }
  } else if (booking.payment.method === 'demo') {
    booking.payment.refundStatus = 'refunded';
  }
}
