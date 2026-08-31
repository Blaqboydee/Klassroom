import { NextRequest, NextResponse } from "next/server";
import {
  findAttendanceSessionById,
  updateAttendanceSession,
  deleteAttendanceSession,
  findClassroomById,
  findUserById,
} from "../../../../lib/db";
import type { AttendanceRecord, AttendanceStatus } from "@/models/Attendance";

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent"];

// Verify the caller is an admin who owns the classroom this session belongs to.
async function verifyOwner(sessionId: string, adminId?: string) {
  if (!adminId) return { error: NextResponse.json({ error: "adminId is required" }, { status: 401 }) };
  const [session, caller] = await Promise.all([findAttendanceSessionById(sessionId), findUserById(adminId)]);
  if (!session) return { error: NextResponse.json({ error: "Attendance session not found" }, { status: 404 }) };
  if (!caller || caller.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const classroom = await findClassroomById(session.classroomId);
  if (!classroom || classroom.adminId !== adminId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, classroom };
}

// PATCH /api/attendance/:id — correct a saved roll call's marks or note
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as {
    adminId?: string;
    note?: string;
    records?: AttendanceRecord[];
  };

  const check = await verifyOwner(id, body.adminId);
  if ("error" in check) return check.error;

  if (body.note === undefined && body.records === undefined) {
    return NextResponse.json({ error: "At least note or records is required" }, { status: 400 });
  }

  const patch: { note?: string; records?: AttendanceRecord[] } = {};
  if (body.note !== undefined) patch.note = body.note.trim();

  if (body.records !== undefined) {
    if (!Array.isArray(body.records)) {
      return NextResponse.json({ error: "records must be an array" }, { status: 400 });
    }
    const members = new Set(check.classroom.memberIds);
    const seen = new Set<string>();
    const clean: AttendanceRecord[] = [];
    for (const r of body.records) {
      if (!members.has(r?.studentId) || seen.has(r.studentId)) continue;
      if (!VALID_STATUSES.includes(r.status)) {
        return NextResponse.json({ error: `Invalid status "${r.status}"` }, { status: 400 });
      }
      seen.add(r.studentId);
      clean.push({ studentId: r.studentId, status: r.status });
    }
    patch.records = clean;
  }

  const session = await updateAttendanceSession(id, patch);
  if (!session) return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
  return NextResponse.json({ session });
}

// DELETE /api/attendance/:id — remove a roll call entirely
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { adminId?: string };

  const check = await verifyOwner(id, body.adminId);
  if ("error" in check) return check.error;

  const deleted = await deleteAttendanceSession(id);
  if (!deleted) return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
