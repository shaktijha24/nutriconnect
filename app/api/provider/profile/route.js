import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { ProviderProfile, ProviderDocument, Hearing } from '@/lib/models';
import { countReports, REPORT_LIMIT } from '@/lib/hearings';

export const dynamic = 'force-dynamic';

const TEXT_FIELDS = [
  'headline', 'bio', 'qualification', 'university', 'registrationNumber', 'certifications',
  'previousWorkplaces', 'approach', 'sampleDietPlan', 'caseStudy', 'references',
];

export const GET = handler(async () => {
  const user = await requireUser(['provider'], { allowUnapproved: true });
  let profile = await ProviderProfile.findOne({ user: user._id }).lean();
  if (!profile) profile = (await ProviderProfile.create({ user: user._id })).toObject();
  const [document, reportCount, hearing] = await Promise.all([
    ProviderDocument.findOne({ user: user._id }).select('-data').lean(),
    countReports(user),
    Hearing.findOne({ provider: user._id }).sort({ createdAt: -1 }).select('-messages').lean(),
  ]);
  return json({
    profile,
    document,
    reportCount,
    reportLimit: REPORT_LIMIT,
    hearing,
    account: { name: user.name, email: user.email, phone: user.phone, status: user.status, statusReason: user.statusReason, statusHistory: user.statusHistory },
  });
});

export const PUT = handler(async (req) => {
  const user = await requireUser(['provider'], { allowUnapproved: true });
  if (['suspended', 'terminated'].includes(user.status)) {
    throw new HttpError(403, `Your account is ${user.status}. Please contact the administrator.`);
  }
  const body = await readBody(req);
  const profile = (await ProviderProfile.findOne({ user: user._id })) || new ProviderProfile({ user: user._id });

  for (const f of TEXT_FIELDS) if (body[f] !== undefined) profile[f] = String(body[f]).slice(0, 5000);
  if (['Dietician', 'Nutritionist'].includes(body.providerType)) profile.providerType = body.providerType;
  if (body.experienceYears !== undefined) profile.experienceYears = Math.max(0, Number(body.experienceYears) || 0);
  if (body.graduationYear !== undefined) profile.graduationYear = Number(body.graduationYear) || undefined;
  const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((s) => s.trim()).filter(Boolean).slice(0, 15);
  if (body.specializations !== undefined) profile.specializations = list(body.specializations);
  if (body.languages !== undefined) profile.languages = list(body.languages);
  if (body.documentLinks !== undefined) profile.documentLinks = list(body.documentLinks).filter((l) => /^https?:\/\//.test(l));
  if (body.availability) {
    profile.availability = {
      days: Array.isArray(body.availability.days) ? body.availability.days : profile.availability.days,
      startTime: body.availability.startTime || profile.availability.startTime,
      endTime: body.availability.endTime || profile.availability.endTime,
    };
  }

  // Submitting the application for review
  if (body.submit) {
    const missing = [];
    if (!profile.qualification) missing.push('qualification');
    if (!profile.registrationNumber) missing.push('registration / licence number');
    if (!profile.sampleDietPlan || profile.sampleDietPlan.length < 80) missing.push('sample diet plan (at least 80 characters)');
    if (!profile.bio) missing.push('professional bio');
    if (!(await ProviderDocument.exists({ user: user._id }))) missing.push('application document upload (PDF/DOCX in the sample format)');
    if (!body.declaration) missing.push('declaration');
    if (missing.length) throw new HttpError(400, `Please complete: ${missing.join(', ')}.`);
    profile.declaration = true;
    profile.submittedAt = new Date();
    if (user.status === 'rejected') {
      user.status = 'pending';
      user.statusReason = 'Re-submitted application';
      user.statusHistory.push({ status: 'pending', reason: 'Re-submitted application', by: 'provider' });
      await user.save();
    }
  }

  await profile.save();
  return json({ profile, status: user.status });
});
