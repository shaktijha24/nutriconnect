import { handler, json, requireUser, HttpError } from '@/lib/api';
import { Progress } from '@/lib/models';

export const DELETE = handler(async (req, { params }) => {
  const user = await requireUser(['client']);
  const res = await Progress.deleteOne({ _id: params.id, client: user._id });
  if (!res.deletedCount) throw new HttpError(404, 'Entry not found.');
  return json({ ok: true });
});
