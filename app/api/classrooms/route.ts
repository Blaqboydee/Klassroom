import { NextRequest, NextResponse } from "next/server";
import { findClassrooms, createClassroom, findClassroomByCode } from "../../../lib/db";

// Generates a 6-character uppercase alphanumeric join code (no ambiguous chars)
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/classrooms?adminId=X  — list classrooms the instructor owns
// GET /api/classrooms?memberId=X — list classrooms the student has joined
// GET /api/classrooms?code=X     — look up a single classroom by join code
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get("adminId") ?? undefined;
  const memberId = searchParams.get("memberId") ?? undefined;
  const code = searchParams.get("code");

  if (code) {
    const classroom = await findClassroomByCode(code.trim().toUpperCase());
    if (!classroom) return NextResponse.json({ classroom: null }, { status: 404 });
    return NextResponse.json({ classroom });
  }

  const classrooms = await findClassrooms({ adminId, memberId });
  return NextResponse.json({ classrooms });
}

// POST /api/classrooms — instructor creates a new classroom
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, adminId } = body as { name: string; adminId: string };

  if (!name?.trim() || !adminId) {
    return NextResponse.json({ error: "name and adminId are required" }, { status: 400 });
  }

  // Ensure code is unique (retry up to 5 times — collision extremely unlikely)
  let code = generateCode();
  for (let i = 0; i < 4; i++) {
    const existing = await findClassroomByCode(code);
    if (!existing) break;
    code = generateCode();
  }

  const classroom = await createClassroom({
    name: name.trim(),
    code,
    adminId,
    memberIds: [],
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ classroom }, { status: 201 });
}
