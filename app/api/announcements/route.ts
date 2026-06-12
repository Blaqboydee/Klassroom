import { NextRequest, NextResponse } from "next/server";
import { findAnnouncements, createAnnouncement, findClassroomById, findUsersByIds } from "../../../lib/db";
import { sendAnnouncementEmails, type AnnouncementRecipient } from "../../../lib/email";
import type { Classroom } from "@/models/Classroom";

// GET /api/announcements?classroomId=xxx&classroomId=yyy
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classroomIds = searchParams.getAll("classroomId");
  if (classroomIds.length === 0) {
    return NextResponse.json({ announcements: [] });
  }
  const announcements = await findAnnouncements({ classroomIds });
  return NextResponse.json({ announcements });
}

// POST /api/announcements — instructor posts an announcement to one or more classrooms
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    classroomId?: string;    // legacy single-class shape
    classroomIds?: string[]; // broadcast shape
    authorId: string;
    authorName: string;
    message: string;
  };
  const { classroomId, classroomIds, authorId, authorName, message } = body;

  const ids = [...new Set(classroomIds ?? (classroomId ? [classroomId] : []))];
  if (ids.length === 0 || !authorId || !authorName || !message?.trim()) {
    return NextResponse.json({ error: "classroomIds, authorId, authorName, and message are required" }, { status: 400 });
  }

  const classrooms = (await Promise.all(ids.map((id) => findClassroomById(id))))
    .filter((c): c is Classroom => c !== null);
  if (classrooms.length === 0) {
    return NextResponse.json({ error: "No matching classrooms found" }, { status: 404 });
  }

  const createdAt = new Date().toISOString();
  const announcements = await Promise.all(
    classrooms.map((c) =>
      createAnnouncement({
        classroomId: c.id,
        authorId,
        authorName,
        message: message.trim(),
        createdAt,
      })
    )
  );

  // Fire-and-forget: email opted-in students, once each even if enrolled in
  // several of the selected classrooms.
  (async () => {
    const classNamesByStudent = new Map<string, string[]>();
    for (const c of classrooms) {
      for (const memberId of c.memberIds) {
        classNamesByStudent.set(memberId, [...(classNamesByStudent.get(memberId) ?? []), c.name]);
      }
    }
    if (classNamesByStudent.size === 0) return;
    const students = await findUsersByIds([...classNamesByStudent.keys()]);
    const recipients: AnnouncementRecipient[] = students.map((s) => ({
      email: s.email,
      name: s.name,
      emailOptIn: s.emailOptIn,
      classroomName: (classNamesByStudent.get(s.id) ?? []).join(" & "),
    }));
    await sendAnnouncementEmails(recipients, authorName, message.trim());
  })().catch(() => { /* non-fatal */ });

  return NextResponse.json({ announcements }, { status: 201 });
}
