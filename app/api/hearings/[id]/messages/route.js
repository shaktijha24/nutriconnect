import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { User } from '@/lib/models';
import { hearingOpen, loadHearing } from '@/lib/hearings';

export const dynamic = 'force-dynamic';

const shape = (m, names) => ({
  _id: m._id, text: m.text, createdAt: m.createdAt, senderRole: m.senderRole,
  sender: { _id: m.sender, name: names[String(m.sender)] || (m.senderRole === 'admin' ? 'Admin' : 'Expert') },
});

export const GET = handler(async (req, { params }) => {
  const user = await requireUser(['admin', 'provider'], { allowUnapproved: true });
  const hearing = await loadHearing(user, params.id);
  const ids = [...new Set(hearing.messages.map((m) => String(m.sender)))];
  const users = await User.find({ _id: { $in: ids } }).select('name').lean();
  const names = Object.fromEntries(users.map((u) => [String(u._id), u.name]));
  return json({ messages: hearing.messages.map((m) => shape(m, names)), active: hearingOpen(hearing) });
});

export const POST = handler(async (req, { params }) => {
  const user = await requireUser(['admin', 'provider'], { allowUnapproved: true });
  const hearing = await loadHearing(user, params.id);
  if (hearing.status === 'concluded') throw new HttpError(400, 'This hearing has concluded.');
  if (!hearingOpen(hearing)) {
    throw new HttpError(400, `The hearing opens on ${new Date(hearing.scheduledAt).toLocaleString('en-IN')}.`);
  }
  const { text } = await readBody(req);
  const clean = String(text || '').trim().slice(0, 2000);
  if (!clean) throw new HttpError(400, 'Message cannot be empty.');
  hearing.messages.push({ sender: user._id, senderRole: user.role, text: clean });
  await hearing.save();
  return json({ ok: true }, 201);
});
