import { NextRequest, NextResponse } from "next/server";
import { findSubmissionById, updateSubmission, deleteSubmission, findSubmissions, findClassrooms, findAssignmentsByClassroomIds, findStudentById, updateStudent, findAssignmentById, findClassroomById, findUserById } from "../../../../lib/db";
import { sendGradedEmail } from "../../../../lib/email";

// PATCH /api/submissions/[id]
//   Student updating link:     body = { link: string; studentId: string }
//   Instructor grading:        body = { grade?: string; feedback?: string }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { link?: string; studentId?: string; grade?: string; feedback?: string };

  // Student link update — requires studentId ownership check
  if (body.studentId) {
    const { link, studentId } = body;
    if (!link || !studentId) {
      return NextResponse.json({ error: "link and studentId are required" }, { status: 400 });
    }
    const existing = await findSubmissionById(id);
    if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    if (existing.studentId !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const updated = await updateSubmission(id, { link: link.trim() });
    return NextResponse.json({ submission: updated });
  }

  // Instructor grading — grade and/or feedback
  if (body.grade !== undefined || body.feedback !== undefined) {
    const existing = await findSubmissionById(id);
    if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    const updated = await updateSubmission(id, {
      ...(body.grade !== undefined ? { grade: body.grade } : {}),
      ...(body.feedback !== undefined ? { feedback: body.feedback } : {}),
    });

    // Fire-and-forget: email the student if they opted in and a grade was set
    if (body.grade !== undefined) {
      Promise.all([
        findUserById(existing.studentId),
        findAssignmentById(existing.assignmentId),
      ]).then(async ([student, assignment]) => {
        if (!student || !assignment) return;
        const classroom = await findClassroomById(assignment.classroomId);
        if (!classroom) return;
        sendGradedEmail(student, classroom, assignment, body.grade!, body.feedback).catch(() => { /* non-fatal */ });
      }).catch(() => { /* non-fatal */ });
    }

    return NextResponse.json({ submission: updated });
  }

  return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
