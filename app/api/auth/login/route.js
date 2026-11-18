import bcrypt from 'bcryptjs';
import { handler, json, readBody, HttpError, setAuthCookie, publicUser } from '@/lib/api';
import { User } from '@/lib/models';

export const POST = handler(async (req) => {
  const { email, password } = await readBody(req);
  if (!email || !password) throw new HttpError(400, 'Please enter your email and password.');
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user && !user.password && user.googleId) {
    throw new HttpError(400, 'This account was created with Google. Please use "Continue with Google".');
  }
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Incorrect email or password.');
  }
  if (user.role === 'provider' && user.status === 'terminated') {
    throw new HttpError(403, 'This account has been terminated by the administrator.' +
      (user.statusReason ? ` Reason: ${user.statusReason}` : ''));
  }
  await setAuthCookie(user);
  return json({ user: publicUser(user) });
});
