// models/Attendance.ts

export type AttendanceStatus = "present" | "absent";

/** One student's mark within a single day's roll call. */
export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

/**
 * One day's roll call for a classroom. At most one session exists per
 * (classroomId, date) pair — re-taking attendance for a date overwrites it.
 *
 * Records are stored explicitly for every student on the roster at the time the
 * roll was taken, so "absent" is always distinguishable from "joined the class
 * after this session was held".
 */
export interface AttendanceSession {
  id: string;
  classroomId: string;
  adminId: string;      // instructor who took the roll
  date: string;         // ISO date "YYYY-MM-DD" — the class day
  note?: string;        // optional topic, e.g. "Week 3 — Hooks"
  records: AttendanceRecord[];
  createdAt: string;    // ISO datetime
  updatedAt: string;    // ISO datetime
}
