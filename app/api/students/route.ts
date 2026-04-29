import { NextRequest, NextResponse } from "next/server";
import { findStudents, createStudent } from "../../../lib/db";

// GET /api/students — list all students (admin only)
export async function GET(_req: NextRequest) {
  // TODO: verify admin role from auth token
  const students = await findStudents();
  return NextResponse.json({ students });
}

// POST /api/students — create/register a student
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email } = body as { name: string; email: string };

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const student = await createStudent({ name, email, role: "student", streak: 0, lastSubmissionDate: null });
  return NextResponse.json({ student }, { status: 201 });
}
