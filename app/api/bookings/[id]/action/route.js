import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { getBookingFor } from '@/lib/bookings';
import { refundBooking } from '@/lib/payments';

const TRANSITIONS = {
  provider: {
    accept: { from: ['requested'], to: 'accepted' },
    reject: { from: ['requested'], to: 'rejected', refund: true, needsReason: true },
    // "completed" happens automatically when the last live session's time runs out
  },
  client: {
    cancel: { from: ['pending_payment', 'requested'], to: 'cancelled', refund: true },
  },
};

export const PATCH = handler(async (req, { params }) => {
  const user = await requireUser(['client', 'provider']);
  const { action, reason } = await readBody(req);
  const rule = TRANSITIONS[user.role]?.[action];
  if (!rule) throw new HttpError(400, 'Unknown action.');

  const booking = await getBookingFor(user, params.id, { populate: false });
  if (!rule.from.includes(booking.status)) {
    throw new HttpError(400, `This booking is "${booking.status.replace('_', ' ')}" and can't be changed that way.`);
  }
  if (rule.needsReason && !reason?.trim()) throw new HttpError(400, 'Please give the client a short, polite reason.');

  booking.status = rule.to;
  if (reason) booking.providerNote = reason.trim();
  if (rule.refund) await refundBooking(booking);
  await booking.save();
  return json({ booking });
});
