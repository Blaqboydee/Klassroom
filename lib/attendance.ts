// lib/attendance.ts — the single source of truth for attendance statistics.
//
// Like streaks (see lib/streak.ts), every number a student or instructor sees is
// *derived*: a pure function of the stored roll calls. Nothing is aggregated
// into a stored counter, so removing or correcting a session can never leave a
// stale total behind.

import type { AttendanceSession } from "@/models/Attendance";

export interface AttendanceSummary {
  /** Sessions in which this student was marked at all (present or absent). */
  sessionsRecorded: number;
  present: number;
  absent: number;
  /** Percentage present, 0–100 rounded. null when no session has recorded them. */
  rate: number | null;
  /** YYYY-MM-DD of the most recent session that recorded them, or null. */
  lastSessionDate: string | null;
  /** YYYY-MM-DD of the most recent session they were present for, or null. */
  lastPresentDate: string | null;
  /** Consecutive most-recent sessions marked absent — a "falling behind" signal. */
  absentStreak: number;
}

const EMPTY: AttendanceSummary = {
  sessionsRecorded: 0,
  present: 0,
  absent: 0,
  rate: null,
  lastSessionDate: null,
  lastPresentDate: null,
  absentStreak: 0,
};

/**
 * Summarise one student's attendance across the given sessions.
 *
 * `sessions` may arrive in any order and may span classrooms — the caller is
 * responsible for passing only the sessions it wants counted. Sessions that
 * hold no record for the student are ignored entirely, so a student who joined
 * mid-term is never penalised for roll calls taken before they enrolled.
 */
export function computeAttendanceSummary(
  sessions: AttendanceSession[],
  studentId: string,
): AttendanceSummary {
  // Oldest first, breaking date ties on id for a deterministic order.
  const marked = sessions
    .filter((s) => s.records.some((r) => r.studentId === studentId))
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));

  if (marked.length === 0) return { ...EMPTY };

  let present = 0;
  let lastPresentDate: string | null = null;
  for (const session of marked) {
    if (session.records.find((r) => r.studentId === studentId)?.status === "present") {
      present++;
      lastPresentDate = session.date;
    }
  }

  // Walk backwards from the newest session while the student was absent.
  let absentStreak = 0;
  for (let i = marked.length - 1; i >= 0; i--) {
    if (marked[i].records.find((r) => r.studentId === studentId)?.status === "present") break;
    absentStreak++;
  }

  return {
    sessionsRecorded: marked.length,
    present,
    absent: marked.length - present,
    rate: Math.round((present / marked.length) * 100),
    lastSessionDate: marked[marked.length - 1].date,
    lastPresentDate,
    absentStreak,
  };
}
