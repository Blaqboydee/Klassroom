import { NextRequest, NextResponse } from "next/server";
import { findSubmissionById, updateSubmission, deleteSubmission, findSubmissions, findClassrooms, findAssignmentsByClassroomIds, findStudentById, updateStudent } from "../../../../lib/db";

// PATCH /api/submissions/[id] — student updates their submission link
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { link: string; studentId: string };
  const { link, studentId } = body;

  if (!link || !studentId) {
    return NextResponse.json({ error: "link and studentId are required" }, { status: 400 });
  }

  const existing = await findSubmissionById(id);
  if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (existing.studentId !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await updateSubmission(id, link.trim());
  return NextResponse.json({ submission: updated });
}

// DELETE /api/submissions/[id] — student deletes their own submission and recalculates streak
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { studentId: string };
  const { studentId } = body;

  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

  const existing = await findSubmissionById(id);
  if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (existing.studentId !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await deleteSubmission(id);

  // Recalculate streak after deletion
  const student = await findStudentById(studentId);
  if (student) {
    const enrolledClassrooms = await findClassrooms({ memberId: studentId });
    const classroomIds = enrolledClassrooms.map((c) => c.id);
    const allAssignments = await findAssignmentsByClassroomIds(classroomIds);
    const allSubmissions = await findSubmissions({ studentId });
    const submittedSet = new Set(allSubmissions.map((s) => s.assignmentId));
    const now = new Date();
    const pastAssignments = allAssignments.filter(
      (a) => new Date(a.dueDate) <= now || submittedSet.has(a.id)
    );
    let streak = 0;
    for (let i = pastAssignments.length - 1; i >= 0; i--) {
      if (submittedSet.has(pastAssignments[i].id)) { streak++; } else { break; }
    }
    const lastSub = allSubmissions.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
    await updateStudent(studentId, { streak, lastSubmissionDate: lastSub?.submittedAt.slice(0, 10) ?? null });
  }

  return NextResponse.json({ ok: true });
}
