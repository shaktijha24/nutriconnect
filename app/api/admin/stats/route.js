import { handler, json, requireUser } from '@/lib/api';
import { Booking, Hearing, Report, User } from '@/lib/models';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await requireUser(['admin']);
  const [clients, providerStatus, bookingStatus, revenueAgg, openReports, recentReports, pendingProviders, hearings, avgFeedback] = await Promise.all([
    User.countDocuments({ role: 'client' }),
    User.aggregate([{ $match: { role: 'provider' } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { 'payment.status': 'paid', 'payment.refundStatus': { $ne: 'refunded' } } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]),
    Report.countDocuments({ status: 'open' }),
    Report.find({ status: 'open' }).sort({ createdAt: -1 }).limit(6).populate('provider', 'name').populate('client', 'name').lean(),
    User.find({ role: 'provider', status: 'pending' }).sort({ createdAt: -1 }).limit(6).select('name email createdAt').lean(),
    Hearing.find({ status: 'scheduled' }).sort({ scheduledAt: 1 }).limit(6).populate('provider', 'name').select('-messages').lean(),
    Booking.find({ 'feedback.rating': { $exists: true } }).select('feedback.rating feedback.politeness').lean(),
  ]);
  const toMap = (arr) => Object.fromEntries(arr.map((x) => [x._id, x.n]));
  return json({
    clients,
    providers: toMap(providerStatus),
    bookings: toMap(bookingStatus),
    revenue: revenueAgg[0]?.total || 0,
    openReports,
    recentReports,
    pendingProviders,
    hearings,
    feedback: {
      n: avgFeedback.length,
      rating: avgFeedback.length ? avgFeedback.reduce((t, b) => t + b.feedback.rating, 0) / avgFeedback.length : 0,
      politeness: avgFeedback.length ? avgFeedback.reduce((t, b) => t + b.feedback.politeness, 0) / avgFeedback.length : 0,
    },
  });
});
