import { handler, json, requireUser } from '@/lib/api';
import { ProviderDocument } from '@/lib/models';

export const dynamic = 'force-dynamic';

// Admin downloads / opens an expert's application document
export const GET = handler(async (req, { params }) => {
  await requireUser(['admin']);
  const doc = await ProviderDocument.findOne({ user: params.id });
  if (!doc) return json({ error: 'No document uploaded.' }, 404);
  const inline = doc.mimeType === 'application/pdf' && !new URL(req.url).searchParams.get('download');
  return new Response(doc.data, {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(doc.filename)}"`,
    },
  });
});
