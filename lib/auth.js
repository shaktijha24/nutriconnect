// Edge-safe helpers (used by middleware and server code)
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'nc_token';

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-secret-change-me');
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}
