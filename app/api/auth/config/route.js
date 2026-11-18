export const dynamic = 'force-dynamic';

// Public settings the browser needs (no secrets)
export function GET() {
  return Response.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
}
