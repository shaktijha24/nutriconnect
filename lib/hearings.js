import { Booking, Hearing, Package, Report } from './models';
import { HttpError } from './api';
import { refundBooking } from './payments';

// A provider can be suspended only after this many reports from users
export const REPORT_LIMIT = 5;

// Hearing takes place this many days after the suspension (env lets you shorten it for testing)
export const HEARING_DELAY_DAYS = Number(process.env.HEARING_DELAY_DAYS ?? 5);

/** Reports that count towards suspension: not dismissed, and made after the last hearing outcome. */
export function reportFilter(user) {
  const f = { provider: user._id, status: { $ne: 'dismissed' } };
  if (user.reportsResetAt) f.createdAt = { $gt: user.reportsResetAt };
  return f;
}

export const countReports = (user) => Report.countDocuments(reportFilter(user));

export const hearingOpen = (h, now = new Date()) => h.status === 'scheduled' && new Date(h.scheduledAt) <= now;

/** Cancels & refunds a provider's open bookings (used on suspension and termination). */
export async function cancelOpenBookings(providerId, statuses, note) {
  const open = await Booking.find({ provider: providerId, status: { $in: statuses } });
  for (const b of open) {
    b.status = 'cancelled';
    b.providerNote = note;
    await refundBooking(b);
    await b.save();
  }
  return open.length;
}

export async function deactivatePackages(providerId) {
  await Package.updateMany({ provider: providerId }, { active: false });
}

/** Loads a hearing and checks the user may see it. */
export async function loadHearing(user, id) {
  const hearing = await Hearing.findById(id).populate('provider', 'name email status statusReason reportsResetAt');
  if (!hearing) throw new HttpError(404, 'Hearing not found.');
  if (user.role === 'provider' && String(hearing.provider._id) !== String(user._id)) throw new HttpError(403, 'Not your hearing.');
  return hearing;
}
