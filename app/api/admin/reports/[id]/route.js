import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Report } from '@/lib/models';

export const PATCH = handler(async (req, { params }) => {
  await requireUser(['admin']);
  const { status, adminNote } = await readBody(req);
  if (!['open', 'resolved', 'dismissed'].includes(status)) throw new HttpError(400, 'Invalid status.');
  const report = await Report.findById(params.id);
  if (!report) throw new HttpError(404, 'Report not found.');
  report.status = status;
  if (adminNote !== undefined) report.adminNote = adminNote;
  report.resolvedAt = status === 'open' ? undefined : new Date();
  await report.save();
  return json({ report });
});
