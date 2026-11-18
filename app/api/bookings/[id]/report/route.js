import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { getBookingFor } from '@/lib/bookings';
import { Report } from '@/lib/models';

// Client reports a problem with their dietician directly to the admin
export const POST = handler(async (req, { params }) => {
  const user = await requireUser(['client']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  const { details } = await readBody(req);
  if (!details?.trim() || details.trim().length < 10) throw new HttpError(400, 'Please describe what happened (at least 10 characters).');
  const report = await Report.create({
    provider: booking.provider,
    client: user._id,
    booking: booking._id,
    type: 'client_complaint',
    severity: 'high',
    source: 'client',
    details: details.trim().slice(0, 2000),
  });
  return json({ report }, 201);
});
