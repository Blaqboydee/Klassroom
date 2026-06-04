import { NextRequest, NextResponse } from "next/server";
import { getStudentClassroomStreaks, getClassroomStreaks } from "../../../lib/db";

// GET /api/streaks — derive streaks on read (see lib/streak.ts). Streaks are
// per-class: a (student, classroom) pair, never pooled across classes.
//   ?studentId=Y   → that student's streak in each class they're enrolled in
//   ?classroomId=X → every member's streak within classroom X
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const classroomId = searchParams.get("classroomId");

  if (studentId) {
    return NextResponse.json({ streaks: await getStudentClassroomStreaks(studentId) });
  }
  if (classroomId) {
    return NextResponse.json({ streaks: await getClassroomStreaks(classroomId) });
  }
  return NextResponse.json({ error: "studentId or classroomId is required" }, { status: 400 });
}
