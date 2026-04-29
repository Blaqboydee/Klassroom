import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser, hashPassword, verifyAdminPassword } from "../../../lib/db";

// POST /api/auth/login — look up a user by email, return their profile
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body as { email: string; password?: string };

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
  }

  // Admins must supply a correct password
  if (user.role === "admin") {
    if (!password) {
      return NextResponse.json({ error: "Password required for admin accounts", needsPassword: true }, { status: 401 });
    }
    const verified = await verifyAdminPassword(email, password);
    if (!verified) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
  }

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

// PUT /api/auth/register — create a new user account
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { name, email, role, password } = body as { name: string; email: string; role: "student" | "admin"; password?: string };

  if (!name || !email || !role) {
    return NextResponse.json({ error: "name, email, and role are required" }, { status: 400 });
  }

  if (!["student", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Admins must set a password (min 6 characters)
  if (role === "admin") {
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Admin accounts require a password of at least 6 characters" }, { status: 400 });
    }
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = role === "admin" && password ? await hashPassword(password) : undefined;
  const user = await createUser({ name, email, role, streak: 0, lastSubmissionDate: null, ...(passwordHash ? { passwordHash } : {}) });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
}
