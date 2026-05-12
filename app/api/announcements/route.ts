import { NextRequest, NextResponse } from "next/server";
import { findAnnouncements, createAnnouncement, findClassroomById, findUsersByIds } from "../../../lib/db";
import { sendAnnouncementEmails } from "../../../lib/email";

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

// POST /api/announcements — instructor posts an announcement
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    classroomId: string;
    authorId: string;
    authorName: string;
    message: string;
  };
  const { classroomId, authorId, authorName, message } = body;

  if (!classroomId || !authorId || !authorName || !message?.trim()) {
    return NextResponse.json({ error: "classroomId, authorId, authorName, and message are required" }, { status: 400 });
  }

  const announcement = await createAnnouncement({
    classroomId,
    authorId,
    authorName,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  });

  // Fire-and-forget: email enrolled students who opted in
  findClassroomById(classroomId).then(async (classroom) => {
    if (!classroom || classroom.memberIds.length === 0) return;
    const students = await findUsersByIds(classroom.memberIds);
    sendAnnouncementEmails(students, classroom, authorName, message.trim()).catch(() => { /* non-fatal */ });
  }).catch(() => { /* non-fatal */ });

  return NextResponse.json({ announcement }, { status: 201 });
}
