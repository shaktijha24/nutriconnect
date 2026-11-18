import { Booking } from './models';

// Platform pricing rules
export const SESSION_PRICE = 200; // ₹ for a 1-hour live chat session
export const SESSION_MINUTES = 60;
export const TRIAL_MINUTES = 10; // free first session
export const FIRST_BOOKING_DISCOUNT = 10; // % off a client's first paid booking

const ACTIVE = ['pending_payment', 'requested', 'accepted', 'completed'];

/** What a client is still eligible for. */
export async function clientOffers(clientId) {
  const [trialUsed, paidBefore, pendingFeedback] = await Promise.all([
    Booking.exists({ client: clientId, type: 'trial', status: { $in: ['requested', 'accepted', 'completed'] } }),
    Booking.exists({ client: clientId, 'payment.status': 'paid' }),
    Booking.findOne({ client: clientId, status: 'completed', 'feedback.rating': { $exists: false } })
      .populate('provider', 'name').select('_id provider packageSnapshot').lean(),
  ]);
  return {
    trialAvailable: !trialUsed,
    firstDiscount: !paidBefore,
    discountPercent: FIRST_BOOKING_DISCOUNT,
    pendingFeedback: pendingFeedback
      ? { bookingId: pendingFeedback._id, provider: pendingFeedback.provider?.name, title: pendingFeedback.packageSnapshot?.title }
      : null,
  };
}

export function priceFor(base, firstDiscount) {
  const discountPercent = firstDiscount && base > 0 ? FIRST_BOOKING_DISCOUNT : 0;
  const discount = Math.round((base * discountPercent) / 100);
  return { base, discountPercent, discount, final: base - discount };
}

export { ACTIVE as ACTIVE_BOOKING_STATUSES };
