import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Package } from '@/lib/models';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await requireUser(['provider']);
  const packages = await Package.find({ provider: user._id }).sort({ createdAt: -1 }).lean();
  return json({ packages });
});

export const POST = handler(async (req) => {
  const user = await requireUser(['provider']);
  const b = await readBody(req);
  if (!b.title || b.price === undefined) throw new HttpError(400, 'Title and price are required.');
  const pkg = await Package.create({
    provider: user._id,
    title: b.title,
    description: b.description,
    durationWeeks: Number(b.durationWeeks) || 4,
    sessions: Number(b.sessions) || 4,
    price: Number(b.price),
    features: (Array.isArray(b.features) ? b.features : String(b.features || '').split('\n')).map((s) => s.trim()).filter(Boolean),
    active: b.active !== false,
  });
  return json({ package: pkg }, 201);
});
