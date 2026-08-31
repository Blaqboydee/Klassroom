# Klassroom — Implemented Features

A full record of every feature that has been built and shipped.

---

## Core Features

### 1. Submission Grading & Comments
Instructors can leave a numeric grade and written feedback on any student submission. Students see the grade and comment on their dashboard under the relevant assignment card.

**Files:** `app/api/submissions/[id]/route.ts` (PATCH), `app/dashboard/student/page.tsx`

---

### 2. Announcements
Instructors can post classroom-wide announcements from the admin dashboard. Students see a notification badge in the nav and a scrollable announcement feed on their dashboard.

**Files:** `app/api/announcements/route.ts`, `app/dashboard/admin/announcements/page.tsx`, `app/dashboard/student/page.tsx`

---

### 3. CSV Export
Admin dashboard includes an "Export CSV" button on the assignments page that downloads the full submission matrix (student × assignment) as a `.csv` file, ready for gradebook import.

**Files:** `app/dashboard/admin/assignments/page.tsx`

---

### 4. Student Submission History
Students have a dedicated section on their dashboard showing every assignment they've submitted, with submission date, link, grade, and feedback, across all enrolled classrooms.

**Files:** `app/dashboard/student/page.tsx`, `hooks/useSubmissions.ts`

---

### 7. Late Submission Warnings
Submissions that arrive after the assignment due date are automatically flagged `isLate: true`. The flag surfaces in the submission matrix on the admin dashboard with an amber "Late" indicator, and on the student dashboard.

**Files:** `app/api/submissions/route.ts`, `app/dashboard/admin/assignments/page.tsx`, `app/dashboard/student/page.tsx`

---

### 10. Assignment Feed
Students see a chronological feed of all upcoming and past assignments across every classroom they're enrolled in — sorted by due date, with submission status inline.

**Files:** `app/dashboard/student/page.tsx`, `hooks/useAssignments.ts`

---

### 11. Attendance Register
Instructors take a daily roll call from a dedicated Attendance page: pick the class and date, and the roster loads with everyone marked present so the instructor only flags the absentees. Saving a date that was already recorded corrects that session rather than creating a duplicate — the register holds at most one session per (classroom, date).

The register grid shows every student against every class day held, with per-student attendance rate, present/absent totals, and a CSV export. Class-wide stats surface classes held, average attendance, and how many students have missed 2+ classes in a row. Students see a per-class attendance rate card on their dashboard.

Attendance percentages are **derived on read** — like streaks, nothing is aggregated into a stored counter, so deleting or correcting a session immediately and correctly recalculates every rate.

**Files:** `models/Attendance.ts`, `lib/attendance.ts` (pure `computeAttendanceSummary`), `lib/db.ts`, `app/api/attendance/route.ts`, `app/api/attendance/[id]/route.ts`, `app/api/attendance/summary/route.ts`, `hooks/useAttendance.ts`, `app/dashboard/admin/attendance/page.tsx`, `app/dashboard/student/page.tsx`

---

### 12. Student Self-Enroll via Link
Instructors can generate a shareable invite link (e.g. `/join/ABC123`) from the admin classroom panel. Clicking the link takes a student directly to the enroll flow; login and signup pages also handle the `?join=CODE` query param so the join happens automatically after authentication.

**Files:** `app/join/[code]/page.tsx`, `app/join/[code]/JoinClient.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, `app/api/classrooms/join/route.ts`, `app/api/classrooms/[id]/route.ts` (GET `?code=`)

---

### 13. Email Notifications
Students can opt in to email alerts from their dashboard. Emails are sent via Resend for:
- New assignment posted
- Submission graded (with grade + feedback)
- New classroom announcement
- Live challenge launched

**Files:** `lib/email.ts`, `app/api/assignments/route.ts`, `app/api/submissions/[id]/route.ts`, `app/api/announcements/route.ts`, `app/api/challenges/route.ts`, `app/api/users/[id]/route.ts` (PATCH emailOptIn), `app/dashboard/student/page.tsx` (toggle UI)

---

## Live Board

### Live Submission Board
A real-time board (`/live`) that auto-refreshes every 5 seconds. Admins see a grid of all enrolled students with their submission status, late flag, streak, and submission time for the most recent assignment. Also displays the active challenge leaderboard when a challenge is running.

**Files:** `app/live/page.tsx`

---

## Challenges

### Timed Live Challenges
Admins can post a timed challenge (title, description, time window in minutes, optional prize) from the dedicated Challenges page. Students see a "Live Challenge" banner on their dashboard and can submit a solution link. The live board shows a real-time ranked leaderboard (fastest submission = #1). Admins can declare a winner and close the challenge.

**Key flows:**
- Admin posts challenge → enrolled students receive email notification (if opted in)
- Student submits link within the time window
- Live board shows ranked submissions updating every 5 seconds
- Admin declares winner → challenge closes

**Files:**
- `models/Challenge.ts`
- `app/api/challenges/route.ts` (GET list, POST create)
- `app/api/challenges/[id]/route.ts` (GET detail + submissions, PATCH close/winner)
- `app/api/challenges/[id]/submit/route.ts` (POST student submission)
- `app/dashboard/admin/challenges/page.tsx`
- `app/dashboard/student/page.tsx` (challenge banner + submit form)
- `app/live/page.tsx` (challenge leaderboard panel)

---

## Data Models

| Model | Collection | Purpose |
|---|---|---|
| `User` | `users` | Students and admins; includes `streak`, `lastSubmissionDate`, `emailOptIn` |
| `Classroom` | `classrooms` | Classroom with `adminId`, `memberIds`, `inviteCode` |
| `Assignment` | `assignments` | Assignment with `classroomId`, `dueDate`, `description` |
| `Submission` | `submissions` | Student submission with `link`, `isLate`, `grade`, `feedback` |
| `Challenge` | `challenges` | Timed challenge with `windowMinutes`, `prize`, `status`, `winnerId` |
| `ChallengeSubmission` | `challengeSubmissions` | Student challenge entry with `submittedAt` (used for ranking) |
| `AttendanceSession` | `attendance` | One day's roll call: `classroomId`, `date`, `records[]` — unique per (classroom, date) |

---

## API Surface

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/users` | List / create users |
| GET/PATCH | `/api/users/[id]` | Get user, update emailOptIn |
| POST | `/api/auth` | Login (bcrypt password check) |
| GET/POST | `/api/classrooms` | List / create classrooms |
| GET/PATCH/DELETE | `/api/classrooms/[id]` | Classroom detail, update, delete |
| POST | `/api/classrooms/join` | Enroll student via invite code |
| POST | `/api/classrooms/leave` | Remove student from classroom |
| GET/POST | `/api/assignments` | List / create assignments |
| GET/PATCH/DELETE | `/api/assignments/[id]` | Assignment detail, update, delete |
| GET/POST | `/api/submissions` | List / create submissions |
| GET/PATCH/DELETE | `/api/submissions/[id]` | Submission detail, grade, delete |
| GET/POST | `/api/announcements` | List / create announcements |
| GET | `/api/streaks` | Read student streaks (derived on read; never stored) |
| GET/POST | `/api/students` | Student-specific queries |
| GET/POST | `/api/challenges` | List / create challenges |
| GET/PATCH | `/api/challenges/[id]` | Challenge detail + submissions, close/set winner |
| POST | `/api/challenges/[id]/submit` | Student submits solution link |
| GET/POST | `/api/attendance` | List roll calls by classroom / save a day's roll (upserts on date) |
| PATCH/DELETE | `/api/attendance/[id]` | Correct or remove a saved roll call |
| GET | `/api/attendance/summary` | Attendance rates (derived on read; `?studentId=` or `?classroomId=`) |
| POST | `/api/admin/cleanup` | Admin utility: remove stale data |
