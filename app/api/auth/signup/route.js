import bcrypt from 'bcryptjs';
import { handler, json, readBody, HttpError, setAuthCookie, publicUser, normalizePhone } from '@/lib/api';
import { User, ProviderProfile } from '@/lib/models';

export const POST = handler(async (req) => {
  const { firstName, lastName, email, password, phone, role, providerType } = await readBody(req);
  const first = String(firstName || '').trim();
  const last = String(lastName || '').trim();
  if (!first || !last) throw new HttpError(400, 'Please enter your first name and last name.');
  if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) throw new HttpError(400, 'Please enter a valid phone number (10 digits, e.g. 9876543210).');
  if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  const safeRole = role === 'provider' ? 'provider' : 'client'; // admins can never sign up

  if (await User.findOne({ email: email.toLowerCase().trim() })) {
    throw new HttpError(409, 'An account with this email already exists. Try logging in.');
  }

  const user = await User.create({
    firstName: first,
    lastName: last,
    name: `${first} ${last}`,
    email,
    phone: cleanPhone,
    password: await bcrypt.hash(password, 10),
    role: safeRole,
    status: safeRole === 'provider' ? 'pending' : 'active',
    statusHistory: safeRole === 'provider' ? [{ status: 'pending', reason: 'Signed up', by: 'system' }] : [],
  });

  if (safeRole === 'provider') {
    await ProviderProfile.create({ user: user._id, providerType: providerType === 'Nutritionist' ? 'Nutritionist' : 'Dietician' });
  }

  await setAuthCookie(user);
  return json({ user: publicUser(user) }, 201);
});
