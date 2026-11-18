import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Booking, Package, ProviderProfile, User } from '@/lib/models';
import { DAY_NAMES, timeSlots, autoCompleteSessions } from '@/lib/bookings';
import { clientOffers, priceFor, SESSION_PRICE, SESSION_MINUTES, TRIAL_MINUTES } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await requireUser(['client', 'provider', 'admin']);
  const filter = user.role === 'client' ? { client: user._id } : user.role === 'provider' ? { provider: user._id } : {};
  await autoCompleteSessions(filter);
  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .populate('client', user.role === 'provider' ? 'name' : 'name email')
    .populate('provider', 'name')
    .select('-dietPlan.meals')
    .lean();
  return json({ bookings });
});

export const POST = handler(async (req) => {
  const user = await requireUser(['client']);
  const { type = 'package', packageId, providerId, date, timeSlot, goal, healthNotes } = await readBody(req);
  if (!['trial', 'session', 'package'].includes(type)) throw new HttpError(400, 'Unknown booking type.');
  if (!date || !timeSlot) throw new HttpError(400, 'Please choose a date and time.');

  await autoCompleteSessions({ client: user._id });
  const offers = await clientOffers(user._id);
  if (offers.pendingFeedback) {
    throw new HttpError(400, `Please give feedback for your last session with ${offers.pendingFeedback.provider} before booking again.`);
  }

  // Work out what is being booked
  let pkg = null;
  let provId = providerId;
  if (type === 'package') {
    pkg = await Package.findOne({ _id: packageId, active: true });
    if (!pkg) throw new HttpError(404, 'This package is no longer available.');
    provId = pkg.provider;
  }
  const provider = await User.findOne({ _id: provId, role: 'provider', status: 'approved' });
  if (!provider) throw new HttpError(400, 'This expert is not accepting bookings right now.');
  if (type === 'trial' && !offers.trialAvailable) throw new HttpError(400, 'You have already used your free 10-minute trial session.');

  // Date & time checks against the expert's availability
  const profile = await ProviderProfile.findOne({ user: provider._id });
  const day = new Date(`${date}T00:00:00`);
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isNaN(day) || day < tomorrow) throw new HttpError(400, 'Please choose a date from tomorrow onwards.');
  const avail = profile?.availability || {};
  if (avail.days?.length && !avail.days.includes(DAY_NAMES[day.getDay()])) {
    throw new HttpError(400, `${provider.name} is not available on ${DAY_NAMES[day.getDay()]}. Available: ${avail.days.join(', ')}.`);
  }
  if (!timeSlots(avail.startTime, avail.endTime).includes(timeSlot)) throw new HttpError(400, 'Please pick one of the listed time slots.');
  const clash = await Booking.findOne({ provider: provider._id, date, timeSlot, status: { $in: ['requested', 'accepted'] } });
  if (clash) throw new HttpError(409, 'That slot was just taken. Please choose another time.');

  const spec = {
    trial: { title: 'Free 10-minute trial chat', base: 0, minutes: TRIAL_MINUTES, total: 1 },
    session: { title: '1-hour live consultation', base: SESSION_PRICE, minutes: SESSION_MINUTES, total: 1 },
    package: pkg && { title: pkg.title, base: pkg.price, minutes: SESSION_MINUTES, total: pkg.sessions || 1 },
  }[type];
  const pricing = priceFor(spec.base, offers.firstDiscount);
  const free = pricing.final === 0;

  const booking = await Booking.create({
    client: user._id,
    provider: provider._id,
    type,
    package: pkg?._id,
    packageSnapshot: { title: spec.title, price: spec.base, durationWeeks: pkg?.durationWeeks, sessions: spec.total },
    pricing,
    session: { minutes: spec.minutes, total: spec.total, used: 0 },
    date,
    timeSlot,
    goal,
    healthNotes,
    status: free ? 'requested' : 'pending_payment',
    payment: free
      ? { status: 'free', amount: 0, method: 'free', paidAt: new Date() }
      : { status: 'unpaid', amount: pricing.final },
  });
  return json({ booking }, 201);
});
