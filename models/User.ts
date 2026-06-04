// models/User.ts
// Single unified user model — role separates admins from students.

export type Role = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  // Vestigial — NOT a source of truth. Streaks are per-class and derived on
  // read (a student has one streak per classroom), served from /api/streaks via
  // lib/streak.ts, never from these fields. Kept only as an initial 0/null at
  // account creation; no read path consumes them.
  streak: number;
  lastSubmissionDate: string | null; // ISO date e.g. "2026-04-29"
  passwordHash?: string;             // bcrypt hash — only set for admin accounts
  emailOptIn?: boolean;              // opt-in for email notifications
}
