import { NextRequest, NextResponse } from "next/server";
import {
  findAttendanceSessions,
  upsertAttendanceSession,
  findClassroomById,
  findUserById,
} from "../../../lib/db";
import type { AttendanceRecord, AttendanceStatus } from "@/models/Attendance";

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent"];

// GET /api/attendance?classroomId=xxx&classroomId=yyy — roll calls for those classrooms.
// Requires at least one classroomId — returns an empty array otherwise so an
// unfiltered call can never leak another instructor's register.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classroomIds = searchParams.getAll("classroomId");
  if (classroomIds.length === 0) {
    return NextResponse.json({ sessions: [] });
  }
  const sessions = await findAttendanceSessions({ classroomIds });
  return NextResponse.json({ sessions });
}

// POST /api/attendance — instructor saves the roll for one class day.
// Upserts on (classroomId, date): saving a date twice corrects it rather than
// creating a second session.
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    classroomId?: string;
    adminId?: string;
    date?: string;
    note?: string;
    records?: AttendanceRecord[];
  };
  const { classroomId, adminId, date, note, records } = body;

  if (!classroomId || !adminId || !date || !Array.isArray(records)) {
    return NextResponse.json(
      { error: "classroomId, adminId, date, and records are required" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be an ISO date (YYYY-MM-DD)" }, { status: 400 });
  }

  const [classroom, caller] = await Promise.all([findClassroomById(classroomId), findUserById(adminId)]);
  if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  if (!caller || caller.role !== "admin" || classroom.adminId !== adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only mark students actually on the roster, once each, with a known status.
  const members = new Set(classroom.memberIds);
  const seen = new Set<string>();
  const clean: AttendanceRecord[] = [];
  for (const r of records) {
    if (!members.has(r?.studentId) || seen.has(r.studentId)) continue;
    if (!VALID_STATUSES.includes(r.status)) {
      return NextResponse.json({ error: `Invalid status "${r.status}"` }, { status: 400 });
    }
    seen.add(r.studentId);
    clean.push({ studentId: r.studentId, status: r.status });
  }

  const session = await upsertAttendanceSession({
    classroomId,
    adminId,
    date,
    note: note?.trim() ?? "",
    records: clean,
  });

  return NextResponse.json({ session }, { status: 201 });
}
