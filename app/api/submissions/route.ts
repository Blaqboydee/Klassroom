import { NextRequest, NextResponse } from "next/server";
import { findSubmissions, createSubmission, findAssignmentById, updateStudent, findStudentById, findClassrooms, findAssignmentsByClassroomIds } from "../../../lib/db";

// GET /api/submissions — list submissions (optionally filtered by ?studentId= or ?assignmentId=)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") ?? undefined;
  const assignmentId = searchParams.get("assignmentId") ?? undefined;

  const submissions = await findSubmissions({ studentId, assignmentId });
  return NextResponse.json({ submissions });
}

// POST /api/submissions — student submits an assignment
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, assignmentId, link } = body as {
    studentId: string;
    assignmentId: string;
    link: string;
  };

  if (!studentId || !assignmentId || !link) {
    return NextResponse.json(
      { error: "studentId, assignmentId, and link are required" },
      { status: 400 }
    );
  }

  const submittedAt = new Date().toISOString();

  // Determine if late
  const assignment = await findAssignmentById(assignmentId);
  const isLate = assignment ? new Date(submittedAt) > new Date(assignment.dueDate) : false;

  const submission = await createSubmission({ studentId, assignmentId, link, submittedAt, isLate });

  // Recalculate streak: count consecutive most-recent assignments submitted
  const student = await findStudentById(studentId);
  if (student) {
    // Get all classrooms this student is enrolled in
    const enrolledClassrooms = await findClassrooms({ memberId: studentId });
    const classroomIds = enrolledClassrooms.map((c) => c.id);

    // Get all assignments across those classrooms, sorted by dueDate ascending
    const allAssignments = await findAssignmentsByClassroomIds(classroomIds);

    // Get all this student's submissions
    const allSubmissions = await findSubmissions({ studentId });
    const submittedSet = new Set(allSubmissions.map((s) => s.assignmentId));

    // Only consider assignments that are past-due OR already submitted
    // (early submissions count; unsubmitted future assignments don't penalise)
    const now = new Date();
    const pastAssignments = allAssignments.filter(
      (a) => new Date(a.dueDate) <= now || submittedSet.has(a.id)
    );

    // Walk backwards: count consecutive submitted assignments until first gap
    let streak = 0;
    for (let i = pastAssignments.length - 1; i >= 0; i--) {
      if (submittedSet.has(pastAssignments[i].id)) {
        streak++;
      } else {
        break;
      }
    }

    await updateStudent(studentId, { streak, lastSubmissionDate: submittedAt.slice(0, 10) });
  }

  return NextResponse.json({ submission }, { status: 201 });
}
