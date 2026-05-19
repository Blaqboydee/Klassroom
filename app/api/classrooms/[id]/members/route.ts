import { NextRequest, NextResponse } from "next/server";
import {
  findClassroomById,
  findUserById,
  findUserByEmail,
  addMemberToClassroom,
  removeMemberFromClassroom,
} from "@/lib/db";

async function verifyOwner(classroomId: string, adminId?: string) {
  if (!adminId) return { error: NextResponse.json({ error: "adminId is required" }, { status: 401 }) };
  const [classroom, caller] = await Promise.all([
    findClassroomById(classroomId),
    findUserById(adminId),
  ]);
  if (!classroom) return { error: NextResponse.json({ error: "Classroom not found" }, { status: 404 }) };
  if (!caller || caller.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  if (classroom.adminId !== adminId) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { classroom };
}

// POST /api/classrooms/[id]/members — admin adds a student by email
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { adminId?: string; email?: string };
  const { adminId, email } = body;

  const check = await verifyOwner(id, adminId);
  if ("error" in check) return check.error;

  if (!email?.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const target = await findUserByEmail(email.trim());
  if (!target) return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
  if (target.role !== "student") return NextResponse.json({ error: "That account is not a student" }, { status: 400 });

  // Already a member — idempotent
  if (check.classroom.memberIds.includes(target.id)) {
    return NextResponse.json({ classroom: check.classroom, student: target });
  }

  const updated = await addMemberToClassroom(id, target.id);
  return NextResponse.json({ classroom: updated, student: target }, { status: 201 });
}

// DELETE /api/classrooms/[id]/members — admin removes a student (class-specific only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { adminId?: string; userId?: string };
  const { adminId, userId } = body;

  const check = await verifyOwner(id, adminId);
  if ("error" in check) return check.error;

  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const updated = await removeMemberFromClassroom(id, userId);
  if (!updated) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  return NextResponse.json({ classroom: updated });
}
