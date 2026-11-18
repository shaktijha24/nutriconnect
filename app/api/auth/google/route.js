import { createRemoteJWKSet, jwtVerify } from 'jose';
import { handler, json, readBody, HttpError, setAuthCookie, publicUser } from '@/lib/api';
import { User, ProviderProfile } from '@/lib/models';

// Google Sign-In (free). The browser sends Google's ID token; we verify it with Google's public keys.
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export const POST = handler(async (req) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new HttpError(400, 'Google sign-in is not configured on this server.');
  const { credential, role, providerType, mode } = await readBody(req);
  if (!credential) throw new HttpError(400, 'Missing Google credential.');

  let g;
  try {
    ({ payload: g } = await jwtVerify(credential, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    }));
  } catch {
    throw new HttpError(401, 'Google sign-in failed. Please try again.');
  }
  if (!g.email || !g.email_verified) throw new HttpError(401, 'Your Google email is not verified.');

  const email = g.email.toLowerCase();
  let user = await User.findOne({ $or: [{ googleId: g.sub }, { email }] });

  if (user) {
    if (!user.googleId) user.googleId = g.sub; // link Google to an existing email account
    if (!user.avatar && g.picture) user.avatar = g.picture;
    await user.save();
    if (user.role === 'provider' && user.status === 'terminated') {
      throw new HttpError(403, 'This account has been terminated by the administrator.');
    }
  } else {
    // New account. From the login page we create a client; from sign-up we use the chosen role.
    const safeRole = mode === 'signup' && role === 'provider' ? 'provider' : 'client';
    const first = g.given_name || g.name?.split(' ')[0] || 'User';
    const last = g.family_name || g.name?.split(' ').slice(1).join(' ') || '';
    user = await User.create({
      firstName: first,
      lastName: last,
      name: `${first} ${last}`.trim(),
      email,
      googleId: g.sub,
      avatar: g.picture,
      role: safeRole,
      status: safeRole === 'provider' ? 'pending' : 'active',
      statusHistory: safeRole === 'provider' ? [{ status: 'pending', reason: 'Signed up with Google', by: 'system' }] : [],
    });
    if (safeRole === 'provider') {
      await ProviderProfile.create({ user: user._id, providerType: providerType === 'Nutritionist' ? 'Nutritionist' : 'Dietician' });
    }
  }

  await setAuthCookie(user);
  return json({ user: publicUser(user), isNew: !user.phone });
});
