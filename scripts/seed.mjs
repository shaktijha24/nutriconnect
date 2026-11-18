// Demo data:  npm run seed   (reads .env)
// Re-creates every *@demo.com account and its data (your real accounts are not touched).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI missing. Copy .env.example to .env first.');
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
const col = (n) => db.collection(n);
const { ObjectId } = mongoose.Types;
const now = new Date();
const hash = bcrypt.hashSync('Demo@123', 10);
const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;
const ago = (ms) => new Date(now.getTime() - ms);
const isoDate = (d) => d.toISOString().slice(0, 10);
function nextWeekday(offsetDays) {
  const d = new Date(now.getTime() + offsetDays * DAY);
  while ([0].includes(d.getDay())) d.setDate(d.getDate() + 1); // skip Sunday
  return isoDate(d);
}

/* ---------- 1. Remove old demo data ---------- */
const oldIds = (await col('users').find({ email: /@demo\.com$/i }).project({ _id: 1 }).toArray()).map((u) => u._id);
if (oldIds.length) {
  const bookingIds = (await col('bookings').find({ $or: [{ client: { $in: oldIds } }, { provider: { $in: oldIds } }] }).project({ _id: 1 }).toArray()).map((b) => b._id);
  await Promise.all([
    col('messages').deleteMany({ booking: { $in: bookingIds } }),
    col('bookings').deleteMany({ _id: { $in: bookingIds } }),
    col('providerprofiles').deleteMany({ user: { $in: oldIds } }),
    col('providerdocuments').deleteMany({ user: { $in: oldIds } }),
    col('packages').deleteMany({ provider: { $in: oldIds } }),
    col('progresses').deleteMany({ client: { $in: oldIds } }),
    col('reports').deleteMany({ $or: [{ provider: { $in: oldIds } }, { client: { $in: oldIds } }] }),
    col('hearings').deleteMany({ provider: { $in: oldIds } }),
  ]);
  await col('users').deleteMany({ _id: { $in: oldIds } });
}

/* ---------- 2. Admin (kept if it exists) ---------- */
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nutriconnect.com').toLowerCase();
let admin = await col('users').findOne({ email: adminEmail });
if (!admin) {
  const r = await col('users').insertOne({
    firstName: 'Admin', lastName: '', name: 'Administrator', email: adminEmail,
    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@12345', 10),
    role: 'admin', status: 'active', statusHistory: [], createdAt: now, updatedAt: now,
  });
  admin = { _id: r.insertedId };
}

/* ---------- 3. Users ---------- */
async function user(first, last, email, role, status, extra = {}) {
  const { insertedId } = await col('users').insertOne({
    firstName: first, lastName: last, name: `${first} ${last}`, email, password: hash,
    phone: extra.phone || '98' + String(Math.floor(10000000 + Math.random() * 89999999)),
    role, status, statusReason: extra.statusReason || '', statusHistory: extra.statusHistory || [],
    reportsResetAt: extra.reportsResetAt, createdAt: extra.createdAt || ago(60 * DAY), updatedAt: now,
  });
  return insertedId;
}

const rahul = await user('Rahul', 'Verma', 'client@demo.com', 'client', 'active');
const priya = await user('Priya', 'Nair', 'priya@demo.com', 'client', 'active', { createdAt: ago(1 * DAY) });
const vikram = await user('Vikram', 'Singh', 'vikram@demo.com', 'client', 'active');
const anita = await user('Anita', 'Das', 'anita@demo.com', 'client', 'active');

const meera = await user('Meera', 'Kapoor', 'meera@demo.com', 'provider', 'approved');
const arjun = await user('Arjun', 'Nair', 'arjun@demo.com', 'provider', 'approved');
const neha = await user('Neha', 'Gupta', 'neha@demo.com', 'provider', 'approved');
const kabir = await user('Kabir', 'Malhotra', 'kabir@demo.com', 'provider', 'suspended', {
  statusReason: 'Five client reports for rude and dismissive behaviour, including body-shaming comments in chat.',
  statusHistory: [{ status: 'suspended', reason: 'Five client reports for rude behaviour', by: adminEmail, at: ago(5 * DAY) }],
});
const sana = await user('Sana', 'Sheikh', 'sana@demo.com', 'provider', 'pending', {
  createdAt: ago(2 * DAY), statusHistory: [{ status: 'pending', reason: 'Signed up', by: 'system', at: ago(2 * DAY) }],
});

/* ---------- 4. Provider profiles ---------- */
const availability = { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], startTime: '10:00', endTime: '18:00' };
const baseProfile = { availability, declaration: true, submittedAt: ago(50 * DAY), documentLinks: [], politenessAvg: 0, ratingAvg: 0, ratingCount: 0, createdAt: now, updatedAt: now };
const samplePlan = '7:30 AM Breakfast: moong dal chilla + curd\n11:00 AM: fruit + nuts\n1:30 PM Lunch: 2 rotis, dal, sabzi, salad\n5:00 PM: roasted chana + green tea\n8:00 PM Dinner: paneer/fish with sautéed vegetables\nGuidelines: ~1,500 kcal, 2.5 L water, 30 min walk daily.';
await col('providerprofiles').insertMany([
  { ...baseProfile, user: meera, providerType: 'Dietician', headline: 'Clinical dietician for diabetes, PCOS & thyroid', bio: 'I help people manage lifestyle conditions with simple, home-cooked Indian food. 8 years of hospital and private practice experience.', qualification: 'M.Sc. Clinical Nutrition', university: 'Panjab University', graduationYear: 2015, registrationNumber: 'RD-2016-1042', experienceYears: 8, specializations: ['Diabetes', 'PCOS', 'Thyroid', 'Weight loss'], languages: ['English', 'Hindi', 'Punjabi'], sampleDietPlan: samplePlan, ratingAvg: 5, ratingCount: 1, politenessAvg: 5 },
  { ...baseProfile, user: arjun, providerType: 'Nutritionist', headline: 'Sports nutrition & healthy muscle gain', bio: 'Certified sports nutritionist working with runners, gym-goers and young athletes.', qualification: 'B.Sc. Nutrition & Dietetics', university: 'Kerala University', graduationYear: 2018, registrationNumber: 'SN-2019-2231', experienceYears: 5, specializations: ['Sports nutrition', 'Muscle gain', 'Vegan diets'], languages: ['English', 'Malayalam', 'Hindi'], sampleDietPlan: samplePlan, ratingAvg: 2, ratingCount: 2, politenessAvg: 1.5 },
  { ...baseProfile, user: neha, providerType: 'Dietician', headline: 'Gut health & weight management', bio: 'Helping busy professionals eat well with simple meal prep.', qualification: 'M.Sc. Food & Nutrition', university: 'Delhi University', graduationYear: 2017, registrationNumber: 'RD-2018-3310', experienceYears: 6, specializations: ['Gut health', 'Weight loss', 'Meal prep'], languages: ['English', 'Hindi'], sampleDietPlan: samplePlan },
  { ...baseProfile, user: kabir, providerType: 'Nutritionist', headline: 'Weight loss coach', bio: 'Fat loss and lifestyle coaching.', qualification: 'Diploma in Nutrition', university: 'IGNOU', graduationYear: 2019, registrationNumber: 'NT-2020-7781', experienceYears: 4, specializations: ['Weight loss'], languages: ['English', 'Hindi'], sampleDietPlan: samplePlan, ratingAvg: 1.8, ratingCount: 4, politenessAvg: 1.3 },
  { ...baseProfile, user: sana, providerType: 'Dietician', headline: 'Dietician for weight management and gut health', bio: 'Recently qualified dietician with one year of clinic experience, focused on practical vegetarian plans.', qualification: 'B.Sc. Home Science (Food & Nutrition)', university: 'Osmania University', graduationYear: 2023, registrationNumber: 'RD-2024-5521', experienceYears: 1, specializations: ['Weight management', 'Gut health'], languages: ['English', 'Hindi', 'Urdu'], approach: 'Detailed assessment, home-cooked regional food, weekly reviews.', sampleDietPlan: samplePlan, submittedAt: ago(1 * DAY) },
]);

// Sana uploaded her application document (passes the format check)
const here = path.dirname(fileURLToPath(import.meta.url));
const docBuf = fs.readFileSync(path.join(here, 'sample-application.docx'));
await col('providerdocuments').insertOne({
  user: sana, filename: 'Sana-Sheikh-Application.docx',
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size: docBuf.length, data: docBuf,
  sectionsFound: ['Professional identity', 'Qualifications & licence', 'Experience', 'Consultation approach', 'Sample diet plan', 'Declaration'],
  wordCount: 327, uploadedAt: ago(1 * DAY), createdAt: now, updatedAt: now,
});

/* ---------- 5. Packages ---------- */
const pkg = async (provider, p) => (await col('packages').insertOne({ ...p, provider, active: true, createdAt: now, updatedAt: now })).insertedId;
const meeraPcos = await pkg(meera, { title: 'PCOS Balance — 4 weeks', description: 'Hormone-friendly nutrition and lifestyle plan.', durationWeeks: 4, sessions: 4, price: 2999, features: ['Low-GI meal plan', '4 live chat sessions (1 hour each)', 'Supplement guidance'] });
await pkg(meera, { title: 'Diabetes Control — 8 weeks', description: 'Carb-smart meal plan with weekly sugar log reviews.', durationWeeks: 8, sessions: 8, price: 4999, features: ['Personalised meal plan', '8 live chat sessions', 'Recipe guide'] });
await pkg(arjun, { title: 'Lean Muscle Starter', description: 'High-protein plan aligned to your training split.', durationWeeks: 6, sessions: 6, price: 3499, features: ['Macro targets', 'Pre/post workout meals', 'Weekly adjustments'] });
await pkg(neha, { title: 'Gut Reset — 3 weeks', description: 'Fibre-rich, gut-friendly meals.', durationWeeks: 3, sessions: 3, price: 1999, features: ['Meal plan', '3 live chat sessions'] });
await pkg(kabir, { title: 'Fat Loss 30', description: '30-day fat loss plan.', durationWeeks: 4, sessions: 4, price: 2499, features: ['Meal plan'] });

/* ---------- 6. Bookings ---------- */
async function booking(b) {
  const { insertedId } = await col('bookings').insertOne({
    goal: '', healthNotes: '', providerNote: '', createdAt: now, updatedAt: now,
    ...b,
    session: { history: [], ...b.session },
  });
  return insertedId;
}
const paid = (amount, at) => ({ status: 'paid', amount, method: 'demo', paymentId: `demo_${Math.random().toString(36).slice(2)}`, paidAt: at, refundStatus: 'none' });

// Rahul: past 1-hour session with Meera (first booking → 10% off), feedback given
const rahulPast = await booking({
  client: rahul, provider: meera, type: 'session', status: 'completed', date: isoDate(ago(10 * DAY)), timeSlot: '11:00',
  packageSnapshot: { title: '1-hour live consultation', price: 200, sessions: 1 },
  pricing: { base: 200, discountPercent: 10, discount: 20, final: 180 },
  session: { minutes: 60, total: 1, used: 1, activeStart: ago(10 * DAY), activeEnd: new Date(ago(10 * DAY).getTime() + 60 * MIN), startedBy: 'provider' },
  payment: paid(180, ago(11 * DAY)), goal: 'Lose 5 kg',
  feedback: { rating: 5, politeness: 5, comment: 'Very kind and practical advice. Loved the Indian meal ideas!', at: ago(10 * DAY) },
});
// Rahul: active PCOS package with Meera, accepted and paid → ready to "Start 60-min session"
const rahulPkg = await booking({
  client: rahul, provider: meera, type: 'package', package: meeraPcos, status: 'accepted', date: nextWeekday(2), timeSlot: '15:00',
  packageSnapshot: { title: 'PCOS Balance — 4 weeks', price: 2999, durationWeeks: 4, sessions: 4 },
  pricing: { base: 2999, discountPercent: 0, discount: 0, final: 2999 },
  session: { minutes: 60, total: 4, used: 0 },
  payment: paid(2999, ago(1 * DAY)), goal: 'Regularise cycle and lose 4 kg', healthNotes: 'Vegetarian, mild thyroid',
  dietPlan: { title: 'PCOS plan — week 1', overview: 'Low-GI vegetarian meals, 1,500 kcal.', dailyCalories: 1500,
    meals: [{ time: '8:00 AM', name: 'Breakfast', items: 'Besan chilla + mint chutney + curd' }, { time: '1:30 PM', name: 'Lunch', items: '2 jowar rotis, rajma, salad' }, { time: '8:00 PM', name: 'Dinner', items: 'Paneer bhurji, sautéed vegetables' }],
    guidelines: '30 min brisk walk daily, 2.5 L water.', updatedAt: ago(1 * DAY) },
});
// Vikram: free 10-min trial with Arjun has ended, NO feedback yet → mandatory feedback popup
const vikramTrial = await booking({
  client: vikram, provider: arjun, type: 'trial', status: 'completed', date: isoDate(ago(1 * DAY)), timeSlot: '12:00',
  packageSnapshot: { title: 'Free 10-minute trial chat', price: 0, sessions: 1 },
  pricing: { base: 0, discountPercent: 0, discount: 0, final: 0 },
  session: { minutes: 10, total: 1, used: 1, activeStart: ago(1 * DAY), activeEnd: new Date(ago(1 * DAY).getTime() + 10 * MIN), startedBy: 'provider' },
  payment: { status: 'free', amount: 0, method: 'free', paidAt: ago(2 * DAY), refundStatus: 'none' },
  goal: 'Build muscle',
});
// Anita: paid session with Arjun, waiting for him to accept → test Accept / Decline
await booking({
  client: anita, provider: arjun, type: 'session', status: 'requested', date: nextWeekday(3), timeSlot: '16:00',
  packageSnapshot: { title: '1-hour live consultation', price: 200, sessions: 1 },
  pricing: { base: 200, discountPercent: 0, discount: 0, final: 200 },
  session: { minutes: 60, total: 1, used: 0 },
  payment: paid(200, ago(2 * 60 * MIN)), goal: 'Marathon nutrition',
});
// Past bookings with Arjun and Kabir (for reports & feedback history)
const pastWith = (client, provider, fb, daysAgo) => booking({
  client, provider, type: 'session', status: 'completed', date: isoDate(ago(daysAgo * DAY)), timeSlot: '10:00',
  packageSnapshot: { title: '1-hour live consultation', price: 200, sessions: 1 },
  pricing: { base: 200, discountPercent: 0, discount: 0, final: 200 },
  session: { minutes: 60, total: 1, used: 1, activeStart: ago(daysAgo * DAY), activeEnd: new Date(ago(daysAgo * DAY).getTime() + 60 * MIN) },
  payment: paid(200, ago((daysAgo + 1) * DAY)), feedback: { ...fb, at: ago(daysAgo * DAY) },
});
const a1 = await pastWith(anita, arjun, { rating: 2, politeness: 1, comment: 'He was rude and called my diet useless.' }, 20);
const a2 = await pastWith(rahul, arjun, { rating: 2, politeness: 2, comment: 'Unprofessional, kept interrupting.' }, 15);
const k1 = await pastWith(anita, kabir, { rating: 1, politeness: 1, comment: 'Body shaming comments. Very insulting.' }, 30);
const k2 = await pastWith(vikram, kabir, { rating: 2, politeness: 1, comment: 'Shouted at me in chat.' }, 25);

/* ---------- 7. Chat messages ---------- */
const msg = (bk, sender, role, text, t) => ({ booking: bk, sender, senderRole: role, text, flagged: false, createdAt: t, updatedAt: t });
await col('messages').insertMany([
  msg(rahulPast, rahul, 'client', 'Hello doctor, I want to lose about 5 kg.', ago(10 * DAY)),
  msg(rahulPast, meera, 'provider', 'Hi Rahul! Happy to help. Tell me about a typical day of meals.', new Date(ago(10 * DAY).getTime() + 2 * MIN)),
  msg(rahulPast, rahul, 'client', 'Mostly rice, dal and evening snacks from outside.', new Date(ago(10 * DAY).getTime() + 4 * MIN)),
  msg(rahulPast, meera, 'provider', 'Great start. We will swap the evening snack for roasted chana and add a walk after dinner.', new Date(ago(10 * DAY).getTime() + 6 * MIN)),
  msg(vikramTrial, arjun, 'provider', 'Hi Vikram, what is your training routine?', ago(1 * DAY)),
  msg(vikramTrial, vikram, 'client', 'Gym 4 days a week.', new Date(ago(1 * DAY).getTime() + MIN)),
]);

/* ---------- 8. Reports ---------- */
const report = (provider, client, bk, type, details, daysAgo, severity = 'high', source = 'system') => ({
  provider, client, booking: bk, type, severity, source, details, status: 'open', createdAt: ago(daysAgo * DAY), updatedAt: now,
});
await col('reports').insertMany([
  // Arjun: 5 reports → admin can suspend him
  report(arjun, anita, a1, 'impolite_behaviour', 'Client rated politeness 1/5 and mentioned: rude. Comment: "He was rude and called my diet useless."', 20),
  report(arjun, anita, a1, 'flagged_message', 'Automatic politeness check: provider used the word "useless". Message: "This diet you follow is useless."', 20),
  report(arjun, rahul, a2, 'impolite_behaviour', 'Client rated politeness 2/5 and mentioned: unprofessional.', 15, 'medium'),
  report(arjun, rahul, a2, 'client_complaint', 'He kept interrupting me and did not listen to my medical history.', 15, 'high', 'client'),
  report(arjun, vikram, vikramTrial, 'flagged_message', 'Automatic politeness check: provider used the word "lazy". Message: "You are just lazy, that is the problem."', 1),
  // Neha: 2 reports → suspension stays locked (2/5)
  report(neha, vikram, null, 'impolite_behaviour', 'Client rated politeness 2/5 and mentioned: arrogant.', 18, 'medium'),
  report(neha, anita, null, 'client_complaint', 'Replied very late and seemed annoyed.', 12, 'medium', 'client'),
  // Kabir: 5 reports, already suspended
  ...[
    [anita, k1, 'impolite_behaviour', 'Client rated politeness 1/5 and mentioned: body shaming, insult.', 'system'],
    [vikram, k2, 'impolite_behaviour', 'Client rated politeness 1/5 and mentioned: shouted.', 'system'],
    [anita, k1, 'flagged_message', 'Automatic politeness check: provider used the word "fatso".', 'system'],
    [anita, k1, 'client_complaint', 'He mocked my weight in front of my family on the call.', 'client'],
    [vikram, k2, 'flagged_message', 'Automatic politeness check: provider wrote in all-caps (shouting).', 'system'],
  ].map(([c, bk, type, d, src], i) => ({ ...report(kabir, c, bk, type, d, 30 - i * 3, 'high', src), status: 'resolved', adminNote: 'Led to suspension' })),
]);

/* ---------- 9. Kabir's hearing (5 days after suspension → open now) ---------- */
await col('hearings').insertOne({
  provider: kabir,
  suspensionReason: 'Five client reports for rude and dismissive behaviour, including body-shaming comments in chat.',
  reportCount: 5, suspendedAt: ago(5 * DAY + 10 * MIN), scheduledAt: ago(10 * MIN), status: 'scheduled',
  messages: [{ _id: new ObjectId(), sender: admin._id, senderRole: 'admin', text: 'Hello Kabir. This hearing is about the five reports listed. Please explain what happened.', createdAt: ago(5 * MIN) }],
  createdAt: ago(5 * DAY), updatedAt: now,
});

/* ---------- 10. Progress for Rahul ---------- */
await col('progresses').insertMany([84, 83.1, 82.4, 81.6, 80.9].map((w, i) => ({
  client: rahul, date: ago((40 - i * 8) * DAY), weight: w, heightCm: 172, bmi: Math.round((w / (1.72 * 1.72)) * 10) / 10, notes: '', createdAt: now, updatedAt: now,
})));

console.log(`
✅ Demo data ready (password for every demo account: Demo@123)

  ADMIN    ${adminEmail}  /  ${process.env.ADMIN_PASSWORD ? '(your ADMIN_PASSWORD)' : 'Admin@12345'}

  CLIENTS
   client@demo.com  Rahul   – has an accepted PCOS package with Meera, ready to start a live session
   priya@demo.com   Priya   – brand-new: free 10-min trial + 10% off first booking
   vikram@demo.com  Vikram  – trial ended without feedback → must give feedback first
   anita@demo.com   Anita   – paid request waiting for Arjun to accept

  EXPERTS
   meera@demo.com   Meera   – approved, top rated
   arjun@demo.com   Arjun   – approved, 5 reports → admin CAN suspend
   neha@demo.com    Neha    – approved, 2 reports → suspend is locked
   kabir@demo.com   Kabir   – suspended 5 days ago, hearing is OPEN now
   sana@demo.com    Sana    – pending, document uploaded → approve or reject
`);
await mongoose.disconnect();
