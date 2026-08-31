import { NextRequest, NextResponse } from "next/server";
import { getStudentClassroomAttendance, getClassroomAttendance } from "../../../../lib/db";

// GET /api/attendance/summary — derive attendance stats on read (see lib/attendance.ts).
// Summaries are per-class, exactly like streaks: a (student, classroom) pair.
//   ?studentId=Y   → that student's attendance in each class they're enrolled in
//   ?classroomId=X → every member's attendance within classroom X
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const classroomId = searchParams.get("classroomId");

  if (studentId) {
    return NextResponse.json({ summaries: await getStudentClassroomAttendance(studentId) });
  }
  if (classroomId) {
    return NextResponse.json({ summaries: await getClassroomAttendance(classroomId) });
  }
  return NextResponse.json({ error: "studentId or classroomId is required" }, { status: 400 });
}
