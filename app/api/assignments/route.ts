import { NextRequest, NextResponse } from "next/server";
import { findAssignments, createAssignment } from "../../../lib/db";

// GET /api/assignments — list all assignments, optionally filtered by ?classroomId=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId") ?? undefined;
  const assignments = await findAssignments(classroomId ? { classroomId } : undefined);
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
  return NextResponse.json({ assignment }, { status: 201 });
}
