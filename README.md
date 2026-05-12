# Klassroom

A classroom management platform for instructors and students. Admins post assignments and announcements, students submit work and build streaks, and everyone can see progress on a live board.

---

## Features

- **Assignments** — Admins create assignments with due dates; students submit links and get graded with written feedback
- **Announcements** — Classroom-wide posts with a notification badge for students
- **Submission matrix** — Admin view of all students × assignments with late flags and CSV export
- **Streaks** — Students earn a daily streak for consecutive submission days, visible on their dashboard
- **Live board** — Real-time screen (`/live`) showing every student's submission status for the latest assignment, refreshing every 5 seconds
- **Timed challenges** — Admins launch a live challenge with a time window and optional prize; students race to submit; live board shows a ranked leaderboard
- **Student self-enroll** — Shareable invite links (`/join/CODE`) let students join a classroom without an admin manually adding them
- **Email notifications** — Opt-in emails via Resend for new assignments, grades, announcements, and challenges
- **Submission history** — Students can view all their past submissions across every classroom

---

## Tech Stack

- **Framework** — Next.js 16 (App Router, Turbopack)
- **Database** — MongoDB (via native driver)
- **Auth** — bcryptjs password hashing, session stored in `localStorage`
- **Email** — Resend
- **Language** — TypeScript (strict)
- **Styling** — Tailwind CSS v4 + custom CSS component classes

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
MONGODB_URI=your_mongodb_connection_string
RESEND_API_KEY=your_resend_api_key
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  api/              # REST API routes (assignments, submissions, challenges, etc.)
  dashboard/
    admin/          # Admin pages (assignments, announcements, challenges)
    student/        # Student dashboard
  live/             # Live board
  join/[code]/      # Self-enroll flow
components/         # Landing page components
hooks/              # Data-fetching hooks (useAssignments, useSubmissions, etc.)
lib/
  db.ts             # MongoDB singleton + all DB helpers
  email.ts          # Resend email senders
models/             # TypeScript interfaces for all data models
```

---

## Deployment

Deploy to [Vercel](https://vercel.com) — add `MONGODB_URI` and `RESEND_API_KEY` as environment variables in the project settings, then push to your connected Git branch.
