import { NextRequest, NextResponse } from "next/server";
import { findClassroomById, removeMemberFromClassroom } from "../../../../lib/db";

// POST /api/classrooms/leave — student leaves a classroom
export async function POST(req: NextRequest) {
  const body = await req.json() as { classroomId: string; userId: string };
  const { classroomId, userId } = body;

  if (!classroomId || !userId) {
    return NextResponse.json({ error: "classroomId and userId are required" }, { status: 400 });
  }

  const classroom = await findClassroomById(classroomId);
  if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

  const updated = await removeMemberFromClassroom(classroomId, userId);
  return NextResponse.json({ classroom: updated });
}
