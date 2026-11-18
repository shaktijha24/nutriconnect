import { handler, json, requireUser, HttpError } from '@/lib/api';
import { getBookingFor, sessionActive } from '@/lib/bookings';

// Start a live chat session (60 min, or 10 min for the free trial). Either the client or the expert can start it.
export const POST = handler(async (req, { params }) => {
  const user = await requireUser(['client', 'provider']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  if (booking.status !== 'accepted') throw new HttpError(400, 'The expert must accept the booking before a session can start.');
  if (!['paid', 'free'].includes(booking.payment?.status)) throw new HttpError(400, 'Payment is required before the session.');
  if (sessionActive(booking)) throw new HttpError(400, 'A session is already running.');
  const s = booking.session;
  if (s.used >= s.total) throw new HttpError(400, 'All sessions in this booking have been used.');

  const start = new Date();
  const end = new Date(start.getTime() + s.minutes * 60 * 1000);
  s.activeStart = start;
  s.activeEnd = end;
  s.used += 1;
  s.startedBy = user.role;
  s.history.push({ start, end });
  await booking.save();
  return json({ session: s, serverNow: Date.now() });
});
