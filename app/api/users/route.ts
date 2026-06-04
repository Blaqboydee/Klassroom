import { NextRequest, NextResponse } from "next/server";
import { findUsers, createUser } from "../../../lib/db";

// GET /api/users — list users, optionally filtered by ?role=student|admin.
// Streaks are per-class and derived separately via /api/streaks (see lib/streak.ts);
// the streak field on these user records is not authoritative.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") as "student" | "admin" | null;
  const users = await findUsers(role ? { role } : undefined);
  return NextResponse.json({ users });
}

// POST /api/users — create a new user (used internally; prefer /api/auth for registration)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, role } = body as { name: string; email: string; role: "student" | "admin" };

  if (!name || !email || !role) {
    return NextResponse.json({ error: "name, email, and role are required" }, { status: 400 });
  }

  const user = await createUser({ name, email, role, streak: 0, lastSubmissionDate: null });
  return NextResponse.json({ user }, { status: 201 });
}
