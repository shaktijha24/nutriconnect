import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Report, User } from '@/lib/models';
import { hearingOpen, loadHearing, cancelOpenBookings, deactivatePackages } from '@/lib/hearings';

// Admin decides the outcome after the hearing: forgive (reinstate) or terminate.
export const POST = handler(async (req, { params }) => {
  const admin = await requireUser(['admin']);
  const hearing = await loadHearing(admin, params.id);
  if (hearing.status === 'concluded') throw new HttpError(400, 'This hearing has already concluded.');
  if (!hearingOpen(hearing)) throw new HttpError(400, 'The hearing has not started yet. It opens 5 days after the suspension.');

  const { decision, mistakeLevel, notes } = await readBody(req);
  if (!['forgiven', 'terminated'].includes(decision)) throw new HttpError(400, 'Choose to forgive or terminate.');
  if (!['minor', 'moderate', 'severe'].includes(mistakeLevel)) throw new HttpError(400, 'Choose the mistake level.');
  if (!notes?.trim()) throw new HttpError(400, 'Please write the hearing notes — the expert will see them.');

  const provider = await User.findById(hearing.provider._id);
  const now = new Date();
  if (decision === 'forgiven') {
    provider.status = 'approved';
    provider.statusReason = `Reinstated after hearing (${mistakeLevel} mistake): ${notes.trim()}`;
    provider.reportsResetAt = now; // report counter starts again from zero
    await Report.updateMany({ provider: provider._id, status: 'open' }, { status: 'resolved', adminNote: 'Closed at hearing', resolvedAt: now });
  } else {
    provider.status = 'terminated';
    provider.statusReason = `Terminated after hearing (${mistakeLevel} mistake): ${notes.trim()}`;
    await cancelOpenBookings(provider._id, ['pending_payment', 'requested', 'accepted'], 'Cancelled by NutriConnect: expert account terminated. Any payment is refunded.');
    await deactivatePackages(provider._id);
    await Report.updateMany({ provider: provider._id, status: 'open' }, { status: 'resolved', adminNote: 'Expert terminated at hearing', resolvedAt: now });
  }
  provider.statusHistory.push({ status: provider.status, reason: provider.statusReason, by: admin.email });
  await provider.save();

  hearing.status = 'concluded';
  hearing.outcome = { decision, mistakeLevel, notes: notes.trim(), decidedBy: admin.email, decidedAt: now };
  await hearing.save();
  return json({ hearing: { _id: hearing._id, status: hearing.status, outcome: hearing.outcome } });
});
