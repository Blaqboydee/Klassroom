import { NextRequest, NextResponse } from "next/server";
import { updateAssignment, deleteAssignment, findAssignmentById, findClassroomById, findUserById } from "../../../../lib/db";

// Verify the caller is an admin who owns the classroom this assignment belongs to.
async function verifyOwner(assignmentId: string, adminId?: string): Promise<{ error: NextResponse } | { assignment: Awaited<ReturnType<typeof findAssignmentById>> }> {
  if (!adminId) return { error: NextResponse.json({ error: "adminId is required" }, { status: 401 }) };
  const [assignment, caller] = await Promise.all([findAssignmentById(assignmentId), findUserById(adminId)]);
  if (!assignment) return { error: NextResponse.json({ error: "Assignment not found" }, { status: 404 }) };
  if (!caller || caller.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const classroom = await findClassroomById(assignment.classroomId);
  if (!classroom || classroom.adminId !== adminId) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { assignment };
}

// PATCH /api/assignments/:id — update title, description, or dueDate
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, description, dueDate, adminId } = body as { title?: string; description?: string; dueDate?: string; adminId?: string };

  const check = await verifyOwner(id, adminId);
  if ("error" in check) return check.error;

  if (!title?.trim() && !dueDate) {
    return NextResponse.json({ error: "At least title or dueDate is required" }, { status: 400 });
  }

  const patch: Partial<{ title: string; description: string; dueDate: string }> = {};
  if (title?.trim()) patch.title = title.trim();
  if (description !== undefined) patch.description = description;
  if (dueDate) patch.dueDate = dueDate;

  const assignment = await updateAssignment(id, patch);
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  return NextResponse.json({ assignment });
}

// DELETE /api/assignments/:id — delete an assignment
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { adminId?: string };

  const check = await verifyOwner(id, body.adminId);
  if ("error" in check) return check.error;

  const deleted = await deleteAssignment(id);
  if (!deleted) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
