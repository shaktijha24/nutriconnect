import mongoose, { Schema } from 'mongoose';

const { ObjectId } = Schema.Types;

/* ---------------- Users ---------------- */
const UserSchema = new Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    name: { type: String, required: true, trim: true }, // "First Last", used for display
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // empty for Google-only accounts
    googleId: { type: String, index: true, sparse: true },
    avatar: String,
    phone: { type: String, trim: true },
    // Reports created after this date count towards the 5-report suspension rule
    reportsResetAt: Date,
    role: { type: String, enum: ['client', 'provider', 'admin'], default: 'client' },
    // clients/admin: active | providers: pending, approved, rejected, suspended, terminated
    status: {
      type: String,
      enum: ['active', 'pending', 'approved', 'rejected', 'suspended', 'terminated'],
      default: 'active',
    },
    statusReason: String,
    statusHistory: [
      { status: String, reason: String, by: String, at: { type: Date, default: Date.now } },
    ],
  },
  { timestamps: true }
);

/* ---------------- Provider application / profile ---------------- */
const ProviderProfileSchema = new Schema(
  {
    user: { type: ObjectId, ref: 'User', unique: true, required: true },
    providerType: { type: String, enum: ['Dietician', 'Nutritionist'], default: 'Dietician' },
    headline: String,
    bio: String,
    qualification: String,
    university: String,
    graduationYear: Number,
    registrationNumber: String,
    experienceYears: { type: Number, default: 0 },
    specializations: [String],
    languages: [String],
    certifications: String,
    previousWorkplaces: String,
    approach: String,
    sampleDietPlan: String,
    caseStudy: String,
    documentLinks: [String],
    references: String,
    availability: {
      days: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      startTime: { type: String, default: '10:00' },
      endTime: { type: String, default: '18:00' },
    },
    declaration: { type: Boolean, default: false },
    submittedAt: Date,
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    politenessAvg: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ---------------- Diet packages ---------------- */
const PackageSchema = new Schema(
  {
    provider: { type: ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    durationWeeks: { type: Number, default: 4, min: 1 },
    sessions: { type: Number, default: 4, min: 1 },
    price: { type: Number, required: true, min: 0 },
    features: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ---------------- Bookings ---------------- */
const MealSchema = new Schema({ time: String, name: String, items: String }, { _id: false });

const BookingSchema = new Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true, index: true },
    provider: { type: ObjectId, ref: 'User', required: true, index: true },
    // trial = free 10-min chat, session = 1-hour live chat (₹200), package = provider's diet package
    type: { type: String, enum: ['trial', 'session', 'package'], default: 'package' },
    package: { type: ObjectId, ref: 'Package' },
    packageSnapshot: { title: String, price: Number, durationWeeks: Number, sessions: Number },
    pricing: {
      base: Number,
      discountPercent: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      final: Number,
    },
    // Live chat sessions: chat is open only while a session is running
    session: {
      minutes: { type: Number, default: 60 },
      total: { type: Number, default: 1 },
      used: { type: Number, default: 0 },
      activeStart: Date,
      activeEnd: Date,
      startedBy: String,
      history: [{ start: Date, end: Date, _id: false }],
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    timeSlot: { type: String, required: true }, // HH:MM
    goal: String,
    healthNotes: String,
    status: {
      type: String,
      enum: ['pending_payment', 'requested', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending_payment',
    },
    providerNote: String,
    payment: {
      status: { type: String, enum: ['unpaid', 'paid', 'free'], default: 'unpaid' },
      amount: Number,
      method: String, // razorpay | demo | free
      orderId: String,
      paymentId: String,
      paidAt: Date,
      refundStatus: { type: String, enum: ['none', 'initiated', 'refunded'], default: 'none' },
    },
    dietPlan: {
      title: String,
      overview: String,
      dailyCalories: Number,
      meals: [MealSchema],
      guidelines: String,
      updatedAt: Date,
    },
    feedback: {
      rating: Number,
      politeness: Number,
      comment: String,
      at: Date,
    },
  },
  { timestamps: true }
);

/* ---------------- Chat messages ---------------- */
const MessageSchema = new Schema(
  {
    booking: { type: ObjectId, ref: 'Booking', required: true, index: true },
    sender: { type: ObjectId, ref: 'User', required: true },
    senderRole: String,
    text: { type: String, required: true, maxlength: 1000 },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------------- Progress entries ---------------- */
const ProgressSchema = new Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, default: Date.now },
    weight: { type: Number, required: true },
    heightCm: Number,
    bmi: Number,
    waist: Number,
    notes: String,
  },
  { timestamps: true }
);

/* ---------------- Reports to admin ---------------- */
const ReportSchema = new Schema(
  {
    provider: { type: ObjectId, ref: 'User', index: true },
    client: { type: ObjectId, ref: 'User' },
    booking: { type: ObjectId, ref: 'Booking' },
    type: {
      type: String,
      enum: ['impolite_behaviour', 'low_rating', 'flagged_message', 'client_complaint'],
    },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    source: { type: String, enum: ['system', 'client'], default: 'system' },
    details: String,
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
    adminNote: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

/* ---------------- Application document uploaded by a provider ---------------- */
const ProviderDocumentSchema = new Schema(
  {
    user: { type: ObjectId, ref: 'User', unique: true, required: true },
    filename: String,
    mimeType: String,
    size: Number,
    data: Buffer,
    sectionsFound: [String],
    wordCount: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* ---------------- Hearing after a suspension ---------------- */
const HearingMessageSchema = new Schema(
  { sender: { type: ObjectId, ref: 'User' }, senderRole: String, text: String, createdAt: { type: Date, default: Date.now } }
);

const HearingSchema = new Schema(
  {
    provider: { type: ObjectId, ref: 'User', required: true, index: true },
    suspensionReason: String,
    reportCount: Number,
    suspendedAt: { type: Date, default: Date.now },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'concluded'], default: 'scheduled' },
    messages: [HearingMessageSchema],
    outcome: {
      decision: { type: String, enum: ['forgiven', 'terminated'] },
      mistakeLevel: { type: String, enum: ['minor', 'moderate', 'severe'] },
      notes: String,
      decidedBy: String,
      decidedAt: Date,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const ProviderProfile =
  mongoose.models.ProviderProfile || mongoose.model('ProviderProfile', ProviderProfileSchema);
export const Package = mongoose.models.Package || mongoose.model('Package', PackageSchema);
export const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export const Progress = mongoose.models.Progress || mongoose.model('Progress', ProgressSchema);
export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export const ProviderDocument =
  mongoose.models.ProviderDocument || mongoose.model('ProviderDocument', ProviderDocumentSchema);
export const Hearing = mongoose.models.Hearing || mongoose.model('Hearing', HearingSchema);
