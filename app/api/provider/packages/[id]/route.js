import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Package } from '@/lib/models';

async function own(user, id) {
  const pkg = await Package.findOne({ _id: id, provider: user._id });
  if (!pkg) throw new HttpError(404, 'Package not found.');
  return pkg;
}

export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(['provider']);
  const pkg = await own(user, params.id);
  const b = await readBody(req);
  for (const f of ['title', 'description']) if (b[f] !== undefined) pkg[f] = b[f];
  for (const f of ['durationWeeks', 'sessions', 'price']) if (b[f] !== undefined) pkg[f] = Number(b[f]);
  if (b.features !== undefined) {
    pkg.features = (Array.isArray(b.features) ? b.features : String(b.features).split('\n')).map((s) => s.trim()).filter(Boolean);
  }
  if (b.active !== undefined) pkg.active = Boolean(b.active);
  await pkg.save();
  return json({ package: pkg });
});

export const DELETE = handler(async (req, { params }) => {
  const user = await requireUser(['provider']);
  const pkg = await own(user, params.id);
  // Keep history intact: deactivate instead of hard delete
  pkg.active = false;
  await pkg.save();
  return json({ ok: true });
});
