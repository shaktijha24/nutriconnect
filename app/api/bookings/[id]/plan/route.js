import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { getBookingFor } from '@/lib/bookings';

// Dietician writes / updates the personalised diet plan for a booking
export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(['provider']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  if (!['accepted', 'completed'].includes(booking.status)) {
    throw new HttpError(400, 'Accept the booking before writing a diet plan.');
  }
  const b = await readBody(req);
  const meals = (Array.isArray(b.meals) ? b.meals : [])
    .filter((m) => m && (m.name || m.items))
    .slice(0, 12)
    .map((m) => ({ time: String(m.time || ''), name: String(m.name || ''), items: String(m.items || '').slice(0, 1000) }));

  booking.dietPlan = {
    title: b.title || 'Personalised diet plan',
    overview: b.overview || '',
    dailyCalories: Number(b.dailyCalories) || undefined,
    meals,
    guidelines: b.guidelines || '',
    updatedAt: new Date(),
  };
  await booking.save();
  return json({ dietPlan: booking.dietPlan });
});
