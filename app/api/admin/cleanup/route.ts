import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { ObjectId } from "mongodb";

/**
 * POST /api/admin/cleanup
 * One-time (and safe-to-repeat) job that prunes orphaned references:
 *   1. Removes memberIds from classrooms where the user no longer exists.
 *   2. Deletes submissions whose studentId or assignmentId no longer exists.
 *
 * Body: { adminSecret: string }  — must match ADMIN_CLEANUP_SECRET env var.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_CLEANUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_CLEANUP_SECRET not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as { adminSecret?: string };
  if (body.adminSecret !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();

  // ── 1. Prune orphaned classroom memberIds ─────────────────────────────────
  const classrooms = await db.collection("classrooms").find({}, { projection: { _id: 1, memberIds: 1 } }).toArray();

  let removedMemberCount = 0;
  for (const classroom of classrooms) {
    const memberIds: string[] = classroom.memberIds ?? [];
    if (memberIds.length === 0) continue;

    // Check which of these user IDs actually exist.
    const existingUsers = await db
      .collection("users")
      .find(
        { _id: { $in: memberIds.map((id: string) => new ObjectId(id)) } },
        { projection: { _id: 1 } }
      )
      .toArray();

    const existingSet = new Set(existingUsers.map((u) => (u._id as ObjectId).toHexString()));
    const orphaned = memberIds.filter((id: string) => !existingSet.has(id));

    if (orphaned.length > 0) {
      await db.collection("classrooms").updateOne(
        { _id: classroom._id },
        { $pull: { memberIds: { $in: orphaned } } } as Record<string, unknown>
      );
      removedMemberCount += orphaned.length;
    }
  }

  // ── 2. Prune submissions with non-existent students ───────────────────────
  const allStudentIds = (
    await db.collection("users").find({ role: "student" }, { projection: { _id: 1 } }).toArray()
  ).map((u) => (u._id as ObjectId).toHexString());

  const orphanedStudentResult = await db
    .collection("submissions")
    .deleteMany({ studentId: { $nin: allStudentIds } });

  // ── 3. Prune submissions with non-existent assignments ────────────────────
  const allAssignmentIds = (
    await db.collection("assignments").find({}, { projection: { _id: 1 } }).toArray()
  ).map((a) => (a._id as ObjectId).toHexString());

  const orphanedAssignmentResult = await db
    .collection("submissions")
    .deleteMany({ assignmentId: { $nin: allAssignmentIds } });

  // ── 4. Backfill isLate on existing submissions using end-of-day UTC rule ──
  const allSubmissions = await db.collection("submissions").find({}).toArray();
  const assignmentDueDates = new Map<string, string>();
  const assignmentDocs = await db.collection("assignments").find({}, { projection: { _id: 1, dueDate: 1 } }).toArray();
  for (const a of assignmentDocs) {
    assignmentDueDates.set((a._id as ObjectId).toHexString(), a.dueDate as string);
  }

  let recomputedLate = 0;
  for (const sub of allSubmissions) {
    const dueDate = assignmentDueDates.get(sub.assignmentId as string);
    if (!dueDate) continue;
    const dueEnd = new Date(dueDate);
    dueEnd.setUTCHours(23, 59, 59, 999);
    const correctIsLate = new Date(sub.submittedAt as string) > dueEnd;
    if (correctIsLate !== sub.isLate) {
      await db.collection("submissions").updateOne(
        { _id: sub._id },
        { $set: { isLate: correctIsLate } }
      );
      recomputedLate++;
    }
  }

  return NextResponse.json({
    success: true,
    removedOrphanedMembers: removedMemberCount,
    removedOrphanedSubmissions:
      orphanedStudentResult.deletedCount + orphanedAssignmentResult.deletedCount,
    recomputedIsLate: recomputedLate,
  });
}
