import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "../../../lib/db";

// POST /api/auth/login — look up a user by email, return their profile
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body as { email: string };

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
  }

  // TODO: replace with real JWT signing via lib/auth.ts
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

// PUT /api/auth/register — create a new user account
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { name, email, role } = body as { name: string; email: string; role: "student" | "admin" };

  if (!name || !email || !role) {
    return NextResponse.json({ error: "name, email, and role are required" }, { status: 400 });
  }

  if (!["student", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check for existing account
  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const user = await createUser({ name, email, role, streak: 0, lastSubmissionDate: null });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}
