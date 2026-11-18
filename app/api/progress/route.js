import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Booking, Progress } from '@/lib/models';
import { calcBMI } from '@/lib/bmi';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const user = await requireUser(['client', 'provider', 'admin']);
  let clientId = user._id;
  if (user.role !== 'client') {
    clientId = new URL(req.url).searchParams.get('clientId');
    if (!clientId) throw new HttpError(400, 'clientId is required.');
    if (user.role === 'provider') {
      const link = await Booking.exists({ provider: user._id, client: clientId, status: { $in: ['accepted', 'completed'] } });
      if (!link) throw new HttpError(403, 'You can only view progress of your own clients.');
    }
  }
  const entries = await Progress.find({ client: clientId }).sort({ date: 1 }).lean();
  return json({ entries });
});

export const POST = handler(async (req) => {
  const user = await requireUser(['client']);
  const b = await readBody(req);
  const weight = Number(b.weight);
  if (!(weight > 10 && weight < 400)) throw new HttpError(400, 'Please enter a valid weight in kg.');
  let heightCm = Number(b.heightCm) || undefined;
  if (!heightCm) {
    const last = await Progress.findOne({ client: user._id, heightCm: { $gt: 0 } }).sort({ date: -1 });
    heightCm = last?.heightCm;
  }
  const entry = await Progress.create({
    client: user._id,
    date: b.date ? new Date(b.date) : new Date(),
    weight,
    heightCm,
    bmi: heightCm ? calcBMI(weight, heightCm) : undefined,
    waist: Number(b.waist) || undefined,
    notes: String(b.notes || '').slice(0, 500),
  });
  return json({ entry }, 201);
});
