import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { getBookingFor, sessionActive } from '@/lib/bookings';
import { Message, Report } from '@/lib/models';
import { checkPoliteness, containsPhoneNumber } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req, { params }) => {
  const user = await requireUser(['client', 'provider', 'admin']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  const messages = await Message.find({ booking: booking._id })
    .sort({ createdAt: 1 }).limit(500).populate('sender', 'name').lean();
  return json({ messages, active: sessionActive(booking), activeEnd: booking.session?.activeEnd, serverNow: Date.now() });
});

export const POST = handler(async (req, { params }) => {
  const user = await requireUser(['client', 'provider']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  if (!sessionActive(booking)) {
    throw new HttpError(400, 'Chat is only open during a live session. Start a session to chat.');
  }
  const { text } = await readBody(req);
  const clean = String(text || '').trim().slice(0, 1000);
  if (!clean) throw new HttpError(400, 'Message cannot be empty.');

  // Rule: nobody may share phone numbers in chat
  if (containsPhoneNumber(clean)) {
    throw new HttpError(400, 'Sharing phone numbers is not allowed in NutriConnect chat. Please keep all communication on the platform.');
  }

  let flagged = false;
  if (user.role === 'provider') {
    const check = checkPoliteness(clean);
    if (check.flagged) {
      flagged = true;
      // Report to admin immediately
      await Report.create({
        provider: user._id,
        client: booking.client,
        booking: booking._id,
        type: 'flagged_message',
        severity: 'high',
        source: 'system',
        details: `Automatic politeness check: provider ${check.reasons.join(', ')}. Message: "${clean.slice(0, 300)}"`,
      });
    }
  }

  const message = await Message.create({ booking: booking._id, sender: user._id, senderRole: user.role, text: clean, flagged });
  return json({ message, warning: flagged ? 'This message was flagged as impolite and reported to the admin. Please keep communication respectful.' : null }, 201);
});
