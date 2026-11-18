import { handler, json, HttpError } from '@/lib/api';
import { User, ProviderProfile, Package, Booking } from '@/lib/models';
import { timeSlots } from '@/lib/bookings';
import { SESSION_PRICE, SESSION_MINUTES, TRIAL_MINUTES, FIRST_BOOKING_DISCOUNT } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// Public provider profile with active packages and reviews
export const GET = handler(async (req, { params }) => {
  const user = await User.findOne({ _id: params.id, role: 'provider', status: 'approved' }).select('name').lean();
  if (!user) throw new HttpError(404, 'This expert is not available.');

  const [profile, packages, reviewed] = await Promise.all([
    ProviderProfile.findOne({ user: user._id })
      .select('providerType headline bio qualification university experienceYears specializations languages certifications availability ratingAvg ratingCount politenessAvg')
      .lean(),
    Package.find({ provider: user._id, active: true }).sort({ price: 1 }).lean(),
    Booking.find({ provider: user._id, 'feedback.rating': { $exists: true } })
      .sort({ 'feedback.at': -1 }).limit(10).populate('client', 'name').select('feedback client').lean(),
  ]);

  const reviews = reviewed.map((b) => ({
    name: (b.client?.name || 'Client').split(' ')[0],
    rating: b.feedback.rating,
    comment: b.feedback.comment,
    at: b.feedback.at,
  }));

  return json({
    provider: { id: user._id, name: user.name, ...profile },
    packages,
    reviews,
    pricing: { sessionPrice: SESSION_PRICE, sessionMinutes: SESSION_MINUTES, trialMinutes: TRIAL_MINUTES, discountPercent: FIRST_BOOKING_DISCOUNT },
    slots: timeSlots(profile?.availability?.startTime, profile?.availability?.endTime),
  });
});
