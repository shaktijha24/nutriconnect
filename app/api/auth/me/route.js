import { handler, json, readBody, getCurrentUser, HttpError, publicUser, normalizePhone } from '@/lib/api';
import { Report, Hearing } from '@/lib/models';
import { clientOffers } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await getCurrentUser();
  if (!user) return json({ user: null });
  const out = { ...publicUser(user), statusReason: user.statusReason };
  if (user.role === 'admin') {
    out.openReports = await Report.countDocuments({ status: 'open' });
    out.hearingsDue = await Hearing.countDocuments({ status: 'scheduled', scheduledAt: { $lte: new Date() } });
  }
  if (user.role === 'client') out.offers = await clientOffers(user._id);
  return json({ user: out });
});

// Update name / phone (used after Google sign-up to add the phone number)
export const PATCH = handler(async (req) => {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  const { firstName, lastName, phone } = await readBody(req);
  if (phone !== undefined) {
    const clean = normalizePhone(phone);
    if (!clean) throw new HttpError(400, 'Please enter a valid phone number (10 digits).');
    user.phone = clean;
  }
  if (firstName?.trim()) user.firstName = firstName.trim();
  if (lastName?.trim()) user.lastName = lastName.trim();
  if (firstName || lastName) user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  await user.save();
  return json({ user: publicUser(user) });
});
