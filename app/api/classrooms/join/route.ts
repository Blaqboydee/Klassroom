import { NextRequest, NextResponse } from "next/server";
import { findClassroomByCode, addMemberToClassroom } from "../../../../lib/db";

// POST /api/classrooms/join — student joins a classroom using a code
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, userId } = body as { code: string; userId: string };

  if (!code?.trim() || !userId) {
    return NextResponse.json({ error: "code and userId are required" }, { status: 400 });
  }

  const classroom = await findClassroomByCode(code.trim());
  if (!classroom) {
    return NextResponse.json({ error: "No classroom found with that code" }, { status: 404 });
  }

  // Already a member — return classroom without error
  if (classroom.memberIds.includes(userId)) {
    return NextResponse.json({ classroom });
  }

  const updated = await addMemberToClassroom(classroom.id, userId);
  return NextResponse.json({ classroom: updated ?? classroom });
}
