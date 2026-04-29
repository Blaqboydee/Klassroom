import { NextRequest, NextResponse } from "next/server";
import { updateClassroom, deleteClassroom, findClassroomById, findUserById } from "../../../../lib/db";

// Verify the caller is an admin who owns this classroom.
async function verifyOwner(classroomId: string, adminId?: string): Promise<{ error: NextResponse } | { classroom: Awaited<ReturnType<typeof findClassroomById>> }> {
  if (!adminId) return { error: NextResponse.json({ error: "adminId is required" }, { status: 401 }) };
  const [classroom, caller] = await Promise.all([findClassroomById(classroomId), findUserById(adminId)]);
  if (!classroom) return { error: NextResponse.json({ error: "Classroom not found" }, { status: 404 }) };
  if (!caller || caller.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  if (classroom.adminId !== adminId) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { classroom };
}

// PATCH /api/classrooms/:id — rename a classroom
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, adminId } = body as { name?: string; adminId?: string };

  const check = await verifyOwner(id, adminId);
  if ("error" in check) return check.error;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const classroom = await updateClassroom(id, { name: name.trim() });
  if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  return NextResponse.json({ classroom });
}

// DELETE /api/classrooms/:id — delete a classroom
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { adminId?: string };

  const check = await verifyOwner(id, body.adminId);
  if ("error" in check) return check.error;

  const deleted = await deleteClassroom(id);
  if (!deleted) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
