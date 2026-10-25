# KC Fitness Hub — Web Application

> **Premier Gym & Fitness Hub**  
> *Bengaluru · Near Brigade Meadows, Kaggalipura*  
> Official Instagram: [@kcfitnesshub](https://www.instagram.com/kcfitnesshub)

A modern, full-stack fitness management and athlete portal built with Next.js, Supabase PostgreSQL, Drizzle ORM, and Google Gemini AI.

---

## ⚡ Key Features

- **Apple-Style Glassmorphic Header:** Floating tablet-shaped oval with frosted glass refraction, specular lighting, and responsive glass island drawer.
- **Attendance-Billed Memberships:** Fair billing system where plans only consume attended days; missed sessions automatically extend membership validity.
- **AI Workout Architect:** On-demand periodized workout splits tailored to athlete goals, experience levels, and schedules powered by Google Gemini (`gemini-3.5-flash-lite`).
- **Coach Connect & Trainer Portal:** Dedicated coach matching, custom progression splits, nutrition & macro targets, and direct in-app check-ins.
- **Role-Based Portals:**
  - **Athlete Portal:** Session check-in, attendance logs, subscription renewals, AI workout generator, and training guides.
  - **Trainer Portal:** Athlete rosters, check-in history, plan assignments, and client reviews.
  - **Admin Dashboard:** Member management, subscription metrics, revenue tracking, and renewal controls.
- **Fair Pricing Tiers:**
  - Monthly: ₹1,399 / mo (30 attended sessions)
  - Quarterly: ₹3,999 / 3 mos (90 attended sessions)
  - Half-Yearly: ₹6,999 / 6 mos (180 attended sessions · Most Popular)
  - Annual: ₹11,999 / yr (365 attended sessions · Best Value)
  - Registration Fee: One-time opening offer of ₹666/-
  - Dedicated Personal Coaching: ₹4,999 / 30 coached days

---

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Database:** [Supabase](https://supabase.com/) PostgreSQL
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **AI Engine:** [Google Gemini API](https://aistudio.google.com/)
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide Icons
- **Typography:** Anton & Space Grotesk via Google Fonts

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- A Supabase project with PostgreSQL
- Google AI Studio API Key

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
GEMINI_API_KEY="..."
```

### 3. Installation
```bash
npm install
```

### 4. Database Schema & Seeding
Push the Drizzle schema to your Supabase PostgreSQL instance and seed initial test data:

```bash
npm run db:push
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 Security
- Private API keys, database connection strings, and credentials are protected via `.gitignore` and must never be committed to source control.
- SSL connections with certificate authorization handling configured for cloud Supabase PostgreSQL.

---

## 📄 License
Private & Proprietary — KC Fitness Hub, Bengaluru.
