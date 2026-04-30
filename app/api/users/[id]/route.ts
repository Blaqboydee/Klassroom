import { NextRequest, NextResponse } from "next/server";
import { findUserById } from "../../../../lib/db";

// GET /api/users/:id — fetch a single user by ID
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await findUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role, streak: user.streak, lastSubmissionDate: user.lastSubmissionDate } });
}
