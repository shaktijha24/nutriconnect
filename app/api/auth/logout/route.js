import { cookies } from 'next/headers';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  cookies().delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
