import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { getBookingFor } from '@/lib/bookings';
import { Booking, ProviderProfile, Report } from '@/lib/models';
import { complaintSignals } from '@/lib/moderation';

export const POST = handler(async (req, { params }) => {
  const user = await requireUser(['client']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  const hadSession = (booking.session?.used || 0) > 0;
  if (!['accepted', 'completed'].includes(booking.status) || !hadSession) {
    throw new HttpError(400, 'You can rate your expert after your first live session.');
  }
  if (booking.feedback?.rating) throw new HttpError(400, 'You have already shared feedback for this booking.');

  const { rating, politeness, comment } = await readBody(req);
  const r = Math.round(Number(rating));
  const p = Math.round(Number(politeness));
  if (!(r >= 1 && r <= 5) || !(p >= 1 && p <= 5)) throw new HttpError(400, 'Please rate both the overall experience and politeness (1–5).');

  booking.feedback = { rating: r, politeness: p, comment: String(comment || '').slice(0, 1000), at: new Date() };
  await booking.save();

  // Recompute provider averages
  const all = await Booking.find({ provider: booking.provider, 'feedback.rating': { $exists: true } }).select('feedback').lean();
  const avg = (k) => Math.round((all.reduce((s, b) => s + (b.feedback[k] || 0), 0) / all.length) * 10) / 10;
  await ProviderProfile.updateOne(
    { user: booking.provider },
    { ratingAvg: avg('rating'), politenessAvg: avg('politeness'), ratingCount: all.length }
  );

  // Escalate poor behaviour to the admin immediately
  const signals = complaintSignals(comment);
  const base = { provider: booking.provider, client: user._id, booking: booking._id, source: 'system' };
  if (p <= 2 || signals.length) {
    await Report.create({
      ...base,
      type: 'impolite_behaviour',
      severity: p <= 1 || signals.length ? 'high' : 'medium',
      details: `Client rated politeness ${p}/5${signals.length ? ` and mentioned: ${signals.join(', ')}` : ''}. Comment: "${(comment || '').slice(0, 300)}"`,
    });
  } else if (r <= 2) {
    await Report.create({ ...base, type: 'low_rating', severity: 'medium', details: `Client gave an overall rating of ${r}/5. Comment: "${(comment || '').slice(0, 300)}"` });
  }

  return json({ feedback: booking.feedback });
});
