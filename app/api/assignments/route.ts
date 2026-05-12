import { NextRequest, NextResponse } from "next/server";
import { findAssignments, findAssignmentsByClassroomIds, createAssignment, findClassroomById, findUsersByIds } from "../../../lib/db";
import { sendNewAssignmentEmails } from "../../../lib/email";

// GET /api/assignments — list assignments, filtered by ?classroomId= (single or multiple)
// Requires at least one classroomId — returns empty array otherwise to prevent data leaking.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classroomIds = searchParams.getAll("classroomId");

  if (classroomIds.length === 0) {
    return NextResponse.json({ assignments: [] });
  }

  let assignments;
  if (classroomIds.length === 1) {
    assignments = await findAssignments({ classroomId: classroomIds[0] });
  } else {
    assignments = await findAssignmentsByClassroomIds(classroomIds);
  }
  return NextResponse.json({ assignments });
}

// POST /api/assignments — create an assignment (admin only)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, dueDate, classroomId } = body as {
    title: string;
    description?: string;
    dueDate: string;
    classroomId: string;
  };

  if (!title || !dueDate || !classroomId) {
    return NextResponse.json({ error: "title, dueDate, and classroomId are required" }, { status: 400 });
  }

  // TODO: verify admin role from auth token
  const assignment = await createAssignment({
    classroomId,
    title,
    description: description ?? "",
    dueDate,
    createdAt: new Date().toISOString(),
  });

  // Fire-and-forget: email enrolled students who opted in
  findClassroomById(classroomId).then(async (classroom) => {
    if (!classroom || classroom.memberIds.length === 0) return;
    const students = await findUsersByIds(classroom.memberIds);
    sendNewAssignmentEmails(students, classroom, assignment).catch(() => { /* non-fatal */ });
  }).catch(() => { /* non-fatal */ });

  return NextResponse.json({ assignment }, { status: 201 });
}
