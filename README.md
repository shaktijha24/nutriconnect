# NutriConnect — Dietician Consultation Marketplace

A full-stack marketplace where clients book verified dieticians & nutritionists, pay online, receive personalised diet plans and track their progress — with an admin who approves, suspends or terminates experts.

**Stack:** Next.js 14 (App Router, React 18) · Tailwind CSS · MongoDB (Mongoose) · JWT auth (httpOnly cookie, `jose` + `bcryptjs`) · Razorpay (optional, falls back to demo payments) · Deploys to Render via `render.yaml`.

---

## Features

| Area | What it does |
|---|---|
| **Auth** | Sign up with **first name, last name, phone, email, password**, or **Continue with Google** (free, optional via `GOOGLE_CLIENT_ID`). Role chooser: client or dietician/nutritionist. The admin is created from env vars and logs in at `/login` straight into the admin panel. |
| **Role-based access** | `middleware.js` blocks `/client`, `/provider`, `/admin` by role. Every API re-checks the role from the database. |
| **Provider approval gate** | New experts are **pending** and can only see their application page until the admin approves them. |
| **Application document** | Experts download a Word template, fill it in the sample-document format and upload **PDF or DOCX (≤ 5 MB)**. The server checks the real file signature, reads the text, and rejects files missing any required section (Professional identity, Qualifications, Experience, Consultation approach, Sample diet plan, Declaration) or shorter than 200 words. The admin downloads it from the expert's page. |
| **Pricing** | New clients get one **free 10-minute trial chat**. A **1-hour live chat session costs ₹200**. A client's **first paid booking is 10% off** (₹180 for a session). Expert diet packages use the expert's price, and each package session is a 60-minute live chat. |
| **Live chat sessions** | After payment and the expert's acceptance, either side presses **Start session**: chat opens for exactly 60 minutes (10 for the trial) with a countdown, then locks. When the last session ends, the booking completes automatically. |
| **Chat rules** | Phone numbers are blocked in chat, including disguised ones (spaces, dashes, +91, written as words). Rude messages from experts are reported to the admin instantly. Experts never see the client's phone or email. |
| **Mandatory feedback** | After a booking completes, the client must rate overall experience and politeness before using the dashboard or booking again. Low politeness or complaint words create an admin report. |
| **5-report suspension rule** | The admin can suspend an expert **only after 5 user reports** (dismissed reports don't count) and must give a reason, which the expert sees. Unconfirmed bookings are cancelled and refunded. |
| **Hearings** | A hearing is scheduled automatically **5 days after suspension**. When it opens, the admin and the expert talk in a hearing chat. The admin records the mistake level (minor/moderate/severe) and decides **forgive & reinstate** (report counter resets) or **terminate**. |
| **Admin** | Overview stats, expert approval, reports inbox, **customer feedback** page, hearings, all bookings & payments. |
| **Also** | BMI calculator, diet packages, Razorpay or demo payments with refunds, accept/decline with reason, meal-by-meal diet plans, progress charts. |

---

## Run locally

Requires **Node 20+** and a MongoDB database (free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster, or local MongoDB).

```bash
npm install
cp .env.example .env        # then fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed                # demo accounts for every feature (re-run any time to reset them)
npm run dev                 # http://localhost:3000
```

Demo logins after seeding (password `Demo@123`). Admin = your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

| Account | Ready-made scenario |
|---|---|
| `client@demo.com` (Rahul) | Accepted PCOS package with Meera → press **Start 60-min session** |
| `priya@demo.com` | Brand-new client → free trial + 10% first discount |
| `vikram@demo.com` | Trial ended without feedback → mandatory feedback popup |
| `anita@demo.com` | Paid request waiting for Arjun to accept |
| `meera@demo.com` | Approved, top-rated expert |
| `arjun@demo.com` | 5 reports → admin can suspend |
| `neha@demo.com` | 2 reports → suspend is locked |
| `kabir@demo.com` | Suspended 5 days ago → hearing open now |
| `sana@demo.com` | Pending applicant with uploaded document |

---

## Deploy

### 1. Create the database (MongoDB Atlas, free)
1. Create a free M0 cluster → **Database Access**: add a user with a password.
2. **Network Access** → add `0.0.0.0/0` (Render's IPs are dynamic).
3. **Connect → Drivers** → copy the connection string and put a database name in it, e.g. `.../nutriconnect?retryWrites=true&w=majority`.

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "NutriConnect initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/nutriconnect.git
git push -u origin main
```
(`.env` is git-ignored — never commit secrets.)

### 3. Deploy on Render
**Option A — Blueprint (uses `render.yaml`)**
1. Render dashboard → **New → Blueprint** → pick your repo.
2. Fill in the prompted env vars: `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (and Razorpay keys if you have them). `JWT_SECRET` is generated automatically.
3. Click **Apply**. First build takes ~3–5 minutes.

**Option B — Manual Web Service**
- New → Web Service → connect repo
- Runtime: **Node** · Build: `npm install && npm run build` · Start: `npm start`
- Environment: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_VERSION=20.18.0` (+ optional `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
- Health check path: `/api/health`

The admin account is created on the first request that touches the database. Log in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

> Free Render instances sleep after inactivity; the first request afterwards takes ~30–50 s.

### Google Sign-In (free, optional)
1. Go to **console.cloud.google.com** → create a project → **APIs & Services → OAuth consent screen** → External → fill app name & your email → Save.
2. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
3. **Authorized JavaScript origins**: add `http://localhost:3000` and your Render URL (e.g. `https://nutriconnect.onrender.com`). No redirect URI is needed.
4. Copy the **Client ID** (ends with `.apps.googleusercontent.com`) into `GOOGLE_CLIENT_ID` in `.env` and on Render. Restart. The Google button appears on login and sign-up.

### Real payments (Razorpay)
Create test keys at dashboard.razorpay.com → Settings → API Keys and set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`. The app switches from demo checkout to Razorpay automatically. Switch to live keys when you go live.

---

## Project structure
```
app/
  page.js                 Landing page
  login/, signup/         Auth pages
  bmi/                    BMI calculator
  dieticians/             Browse experts, profile + booking
  sample-document/        Sample application for experts
  client/                 Client dashboard, booking detail (pay, plan, chat, feedback), progress
  provider/               Appointments, booking detail (plan editor), packages, application
  admin/                  Overview, experts (approve/suspend/terminate), reports, bookings
  api/                    REST route handlers (auth, providers, bookings, payments, progress, admin)
components/               UI building blocks (Navbar, ChatBox, ProgressChart, BMICalculator…)
lib/                      db connection, models, auth, payments, moderation, helpers
middleware.js             Role-based route protection
scripts/seed.mjs          Demo data
render.yaml               Render blueprint
```

## Booking lifecycle
`pending_payment → (paid) requested → accepted → completed`  
Side exits: `rejected` (by expert, refunded) · `cancelled` (by client, or by admin action on the expert, refunded).

## Ideas for next steps
- Real-time chat (Socket.IO / Pusher) and video calls (Jitsi / Daily)
- Email/SMS alerts to admin on high-severity reports (Resend, Twilio)
- File uploads for certificates (Cloudinary / S3) instead of links
