import { handler, json, requireUser, HttpError } from '@/lib/api';
import { ProviderDocument } from '@/lib/models';
import { validateApplicationDocument } from '@/lib/documents';

export const dynamic = 'force-dynamic';

// GET: info about my uploaded document (?download=1 returns the file)
export const GET = handler(async (req) => {
  const user = await requireUser(['provider'], { allowUnapproved: true });
  const download = new URL(req.url).searchParams.get('download');
  const doc = await ProviderDocument.findOne({ user: user._id }).select(download ? '' : '-data');
  if (!doc) return download ? json({ error: 'No document uploaded.' }, 404) : json({ document: null });
  if (download) {
    return new Response(doc.data, {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.filename)}"`,
      },
    });
  }
  return json({ document: doc });
});

// POST multipart/form-data with field "file"
export const POST = handler(async (req) => {
  const user = await requireUser(['provider'], { allowUnapproved: true });
  if (['suspended', 'terminated'].includes(user.status)) throw new HttpError(403, `Your account is ${user.status}.`);
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') throw new HttpError(400, 'Please choose a file to upload.');

  const buffer = Buffer.from(await file.arrayBuffer());
  const check = await validateApplicationDocument(file.name || 'document', buffer);
  if (!check.ok) return json({ error: 'Your document is not in the required format.', details: check.errors, sectionsFound: check.sectionsFound || [] }, 400);

  const doc = await ProviderDocument.findOneAndUpdate(
    { user: user._id },
    {
      user: user._id,
      filename: file.name,
      mimeType: check.mime,
      size: buffer.length,
      data: buffer,
      sectionsFound: check.sectionsFound,
      wordCount: check.wordCount,
      uploadedAt: new Date(),
    },
    { upsert: true, new: true }
  ).lean();
  delete doc.data; // never send the file bytes back
  return json({ document: doc }, 201);
});
