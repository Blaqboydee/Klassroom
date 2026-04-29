// models/User.ts
// Single unified user model — role separates admins from students.

export type Role = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  streak: number;
  lastSubmissionDate: string | null; // ISO date e.g. "2026-04-29"
  passwordHash?: string;             // bcrypt hash — only set for admin accounts
}
