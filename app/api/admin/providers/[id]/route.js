import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Booking, Hearing, Package, ProviderDocument, ProviderProfile, Report, User } from '@/lib/models';
import { REPORT_LIMIT, HEARING_DELAY_DAYS, countReports, cancelOpenBookings } from '@/lib/hearings';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req, { params }) => {
  await requireUser(['admin']);
  const user = await User.findOne({ _id: params.id, role: 'provider' }).select('-password');
  if (!user) throw new HttpError(404, 'Provider not found.');
  const [profile, packages, reports, bookingStats, document, reportCount, hearings] = await Promise.all([
    ProviderProfile.findOne({ user: user._id }).lean(),
    Package.find({ provider: user._id }).lean(),
    Report.find({ provider: user._id }).sort({ createdAt: -1 }).populate('client', 'name').lean(),
    Booking.aggregate([{ $match: { provider: user._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    ProviderDocument.findOne({ user: user._id }).select('-data').lean(),
    countReports(user),
    Hearing.find({ provider: user._id }).sort({ createdAt: -1 }).select('-messages').lean(),
  ]);
  return json({
    provider: user.toObject(), profile, packages, reports, document, reportCount, reportLimit: REPORT_LIMIT, hearings,
    bookingStats: Object.fromEntries(bookingStats.map((b) => [b._id, b.n])),
  });
});

// Admin actions here: approve | reject | suspend.
// Reinstating or terminating a suspended expert is decided in the hearing (/api/hearings/[id]/conclude).
const ACTIONS = {
  approve: { from: ['pending', 'rejected'], to: 'approved' },
  reject: { from: ['pending'], to: 'rejected', needsReason: true },
  suspend: { from: ['approved'], to: 'suspended', needsReason: true },
};

export const PATCH = handler(async (req, { params }) => {
  const admin = await requireUser(['admin']);
  const { action, reason } = await readBody(req);
  const rule = ACTIONS[action];
  if (!rule) throw new HttpError(400, 'Unknown action. Reinstating or terminating is done in the hearing.');
  const user = await User.findOne({ _id: params.id, role: 'provider' });
  if (!user) throw new HttpError(404, 'Provider not found.');
  if (!rule.from.includes(user.status)) throw new HttpError(400, `Cannot ${action} a provider who is ${user.status}.`);
  if (rule.needsReason && !reason?.trim()) throw new HttpError(400, 'Please write a reason — the provider will see it.');

  let hearing = null;
  if (action === 'suspend') {
    const reports = await countReports(user);
    if (reports < REPORT_LIMIT) {
      throw new HttpError(400, `Suspension is allowed only after ${REPORT_LIMIT} reports. This expert has ${reports}.`);
    }
  }

  user.status = rule.to;
  user.statusReason = reason?.trim() || '';
  user.statusHistory.push({ status: rule.to, reason: user.statusReason, by: admin.email });
  await user.save();

  if (action === 'suspend') {
    await cancelOpenBookings(user._id, ['pending_payment', 'requested'], 'Cancelled by NutriConnect: expert account suspended. Any payment is refunded.');
    const now = new Date();
    hearing = await Hearing.create({
      provider: user._id,
      suspensionReason: user.statusReason,
      reportCount: await countReports(user),
      suspendedAt: now,
      scheduledAt: new Date(now.getTime() + HEARING_DELAY_DAYS * 24 * 60 * 60 * 1000),
    });
  }

  return json({ provider: { _id: user._id, status: user.status, statusReason: user.statusReason }, hearing });
});
