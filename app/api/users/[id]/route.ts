import { NextRequest, NextResponse } from "next/server";
import { findUserById, deleteUser } from "../../../../lib/db";

// GET /api/users/:id — fetch a single user by ID
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await findUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role, streak: user.streak, lastSubmissionDate: user.lastSubmissionDate } });
}

// DELETE /api/users/:id — delete a user and cascade-remove from classrooms + submissions
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteUser(id);
  if (!deleted) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
