import { Booking } from './models';
import { HttpError } from './api';

/** Fetches a booking and verifies the user may see it. Providers never receive the client's phone/email. */
export async function getBookingFor(user, id, { populate = true } = {}) {
  await autoCompleteSessions({ _id: id });
  let q = Booking.findById(id);
  if (populate) {
    const clientFields = user.role === 'provider' ? 'name' : 'name email phone';
    q = q
      .populate('client', clientFields)
      .populate('provider', 'name status')
      .populate('package', 'title features durationWeeks sessions');
  }
  const booking = await q;
  if (!booking) throw new HttpError(404, 'Booking not found.');
  const clientId = String(booking.client?._id || booking.client);
  const providerId = String(booking.provider?._id || booking.provider);
  const uid = String(user._id);
  if (user.role === 'admin') return booking;
  if (user.role === 'client' && clientId === uid) return booking;
  if (user.role === 'provider' && providerId === uid) return booking;
  throw new HttpError(403, 'You do not have access to this booking.');
}

/** Is a live chat session running right now? */
export const sessionActive = (b, now = new Date()) =>
  b.status === 'accepted' && b.session?.activeEnd && new Date(b.session.activeEnd) > now;

/**
 * When the last session's time is over, the booking becomes "completed" automatically
 * (the client is then asked for mandatory feedback).
 */
export async function autoCompleteSessions(filter = {}) {
  const ended = await Booking.find({ ...filter, status: 'accepted', 'session.activeEnd': { $lt: new Date() } })
    .select('session.used session.total').lean();
  const done = ended.filter((b) => (b.session?.used || 0) >= (b.session?.total || 1)).map((b) => b._id);
  if (done.length) await Booking.updateMany({ _id: { $in: done } }, { $set: { status: 'completed' } });
}

export function timeSlots(start = '10:00', end = '18:00') {
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const out = [];
  for (let t = toMin(start); t + 60 <= toMin(end); t += 60) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
