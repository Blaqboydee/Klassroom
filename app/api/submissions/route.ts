import { NextRequest, NextResponse } from "next/server";
import { findSubmissions, createSubmission, findAssignmentById, findAssignmentsByClassroomIds } from "../../../lib/db";

// GET /api/submissions — list submissions (optionally filtered by ?studentId=, ?assignmentId=, or ?classroomId= (repeatable))
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") ?? undefined;
  const assignmentId = searchParams.get("assignmentId") ?? undefined;
  const classroomIds = searchParams.getAll("classroomId");

  if (classroomIds.length > 0) {
    const assignments = await findAssignmentsByClassroomIds(classroomIds);
    // If the classrooms exist but have no assignments yet, there can be no submissions.
    if (assignments.length === 0) return NextResponse.json({ submissions: [] });
    const assignmentIds = assignments.map((a) => a.id);
    const submissions = await findSubmissions({ studentId, assignmentIds });
    return NextResponse.json({ submissions });
  }

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

  // Determine if late — a submission is late only after end-of-day (23:59:59 UTC) on the due date
  const assignment = await findAssignmentById(assignmentId);
  let isLate = false;
  if (assignment) {
    const dueEnd = new Date(assignment.dueDate);
    dueEnd.setUTCHours(23, 59, 59, 999);
    isLate = new Date(submittedAt) > dueEnd;
  }

  const submission = await createSubmission({ studentId, assignmentId, link, submittedAt, isLate });

  // No streak write: streaks are derived on read from submissions (see lib/streak.ts).
  return NextResponse.json({ submission }, { status: 201 });
}
