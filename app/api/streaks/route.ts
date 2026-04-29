import { NextRequest, NextResponse } from "next/server";
import { findStudents, findStudentById, updateStudent } from "../../../lib/db";

// GET /api/streaks — fetch streak info for all students or a specific one
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (studentId) {
    const student = await findStudentById(studentId);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json({ streaks: [{ studentId: student.id, streak: student.streak, lastSubmissionDate: student.lastSubmissionDate }] });
  }

  const students = await findStudents();
  const streaks = students.map((s) => ({ studentId: s.id, name: s.name, streak: s.streak, lastSubmissionDate: s.lastSubmissionDate }));
  return NextResponse.json({ streaks });
}

// POST /api/streaks — recalculate streak for a student
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId } = body as { studentId: string };

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  const student = await findStudentById(studentId);
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const last = student.lastSubmissionDate;
  let streak = student.streak;

  if (!last) {
    streak = 1;
  } else {
    const gap = (new Date(today).getTime() - new Date(last).getTime()) / 86_400_000;
    streak = gap <= 1 ? streak + 1 : 1;
  }

  const updated = await updateStudent(studentId, { streak, lastSubmissionDate: today });
  return NextResponse.json({ studentId, streak: updated?.streak ?? streak, lastSubmissionDate: today });
}
