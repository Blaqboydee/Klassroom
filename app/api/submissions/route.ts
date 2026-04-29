import { NextRequest, NextResponse } from "next/server";
import { findSubmissions, createSubmission, findAssignmentById, updateStudent, findStudentById } from "../../../lib/db";

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

  // Update streak
  const student = await findStudentById(studentId);
  if (student) {
    const today = submittedAt.slice(0, 10);
    const last = student.lastSubmissionDate;
    let streak = student.streak;
    if (!last) {
      streak = 1;
    } else {
      const gap = (new Date(today).getTime() - new Date(last).getTime()) / 86_400_000;
      streak = gap <= 1 ? streak + 1 : 1;
    }
    await updateStudent(studentId, { streak, lastSubmissionDate: today });
  }

  return NextResponse.json({ submission }, { status: 201 });
}
