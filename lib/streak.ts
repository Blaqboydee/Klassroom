// lib/streak.ts — the single source of truth for streak logic.
//
// A streak is a *derived* value: a pure function of a student's assignments,
// their submissions, and the current time. Nothing about it is stored — every
// read recomputes it, so it can never go stale (e.g. a missed deadline breaks
// the streak the moment the deadline lapses, with no write required).

import type { Assignment } from "@/models/Assignment";
import type { Submission } from "@/models/Submission";

export interface StreakResult {
  /** Count of consecutive most-recent past assignments submitted on time. */
  streak: number;
  /** YYYY-MM-DD of the student's most recent submission, or null if none. */
  lastSubmissionDate: string | null;
}

/**
 * End-of-day (23:59:59.999 UTC) on an assignment's due date, in epoch ms.
 * A submission is late only *after* this instant, so an assignment is only
 * "past due" once now is past it — students keep until end of day to submit.
 * This mirrors the late-detection cutoff in POST /api/submissions.
 */
function dueDeadline(dueDate: string): number {
  const d = new Date(dueDate);
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Compute a student's streak from their assignments and submissions.
 *
 * Rules (walking from the most recent past assignment backwards):
 *   - on-time submission  → +1 to the streak
 *   - late submission     → preserves the streak but does not extend it
 *   - missing submission  → the chain ends
 *
 * Only assignments that are past their deadline OR already submitted are
 * considered, so unsubmitted *future* work never penalises a student, and
 * early submissions still count.
 *
 * `assignments` may span multiple classrooms and arrive in any order;
 * `submissions` should be all of the student's submissions. `now` is injected
 * for testability.
 */
export function computeStreak(
  assignments: Assignment[],
  submissions: Submission[],
  now: Date = new Date(),
): StreakResult {
  const lastSubmissionDate = submissions.reduce<string | null>(
    (latest, s) => (latest === null || s.submittedAt > latest ? s.submittedAt : latest),
    null,
  );

  const submittedSet = new Set(submissions.map((s) => s.assignmentId));
  const lateSet = new Set(submissions.filter((s) => s.isLate).map((s) => s.assignmentId));

  // Deterministic order: by due date ascending, breaking ties on id.
  const sorted = [...assignments].sort((a, b) =>
    a.dueDate === b.dueDate ? a.id.localeCompare(b.id) : a.dueDate.localeCompare(b.dueDate),
  );

  // Past = deadline has lapsed, or the student already submitted it.
  const nowMs = now.getTime();
  const past = sorted.filter((a) => dueDeadline(a.dueDate) < nowMs || submittedSet.has(a.id));

  let streak = 0;
  for (let i = past.length - 1; i >= 0; i--) {
    const id = past[i].id;
    if (!submittedSet.has(id)) break; // gap — the chain ends here
    if (!lateSet.has(id)) streak++;   // on time — counts toward the streak
    // late — fills the gap (keeps the chain alive) but doesn't increment
  }

  return { streak, lastSubmissionDate: lastSubmissionDate ? lastSubmissionDate.slice(0, 10) : null };
}
