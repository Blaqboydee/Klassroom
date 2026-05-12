import { NextRequest, NextResponse } from "next/server";
import {
  createChallenge, findChallenges, findClassroomById, findUsersByIds,
} from "../../../lib/db";
import { sendChallengeEmail } from "../../../lib/email";

// GET /api/challenges?classroomId=xxx — list challenges for a classroom
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");
  if (!classroomId) return NextResponse.json({ challenges: [] });

  const challenges = await findChallenges({ classroomId });
  return NextResponse.json({ challenges });
}

// POST /api/challenges — admin posts a new challenge
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    classroomId: string;
    adminId: string;
    title: string;
    description?: string;
    windowMinutes: number;
    prize?: string;
  };

  const { classroomId, adminId, title, description, windowMinutes, prize } = body;
  if (!classroomId || !adminId || !title?.trim() || !windowMinutes) {
    return NextResponse.json({ error: "classroomId, adminId, title, and windowMinutes are required" }, { status: 400 });
  }

  const challenge = await createChallenge({
    classroomId,
    adminId,
    title: title.trim(),
    description: description?.trim() ?? "",
    windowMinutes: Number(windowMinutes),
    prize: prize?.trim() ?? "",
    status: "active",
    createdAt: new Date().toISOString(),
  });

  // Fire-and-forget: email enrolled students who opted in
  findClassroomById(classroomId).then(async (classroom) => {
    if (!classroom || classroom.memberIds.length === 0) return;
    const students = await findUsersByIds(classroom.memberIds);
    sendChallengeEmail(students, classroom, challenge).catch(() => { /* non-fatal */ });
  }).catch(() => { /* non-fatal */ });

  return NextResponse.json({ challenge }, { status: 201 });
}
