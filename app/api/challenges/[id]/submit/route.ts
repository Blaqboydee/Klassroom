import { NextRequest, NextResponse } from "next/server";
import {
  findChallengeById, createChallengeSubmission, findChallengeSubmissionByStudent,
} from "../../../../../lib/db";

// POST /api/challenges/[id]/submit — student submits a solution link
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { studentId: string; studentName: string; link: string };
  const { studentId, studentName, link } = body;

  if (!studentId || !studentName || !link?.trim()) {
    return NextResponse.json({ error: "studentId, studentName, and link are required" }, { status: 400 });
  }

  const challenge = await findChallengeById(id);
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  if (challenge.status === "closed") return NextResponse.json({ error: "Challenge is closed" }, { status: 409 });

  // Check time window
  const elapsed = (Date.now() - new Date(challenge.createdAt).getTime()) / 60000;
  if (elapsed > challenge.windowMinutes) {
    return NextResponse.json({ error: "Submission window has closed" }, { status: 409 });
  }

  // One submission per student
  const existing = await findChallengeSubmissionByStudent(id, studentId);
  if (existing) return NextResponse.json({ error: "You have already submitted" }, { status: 409 });

  const submission = await createChallengeSubmission({
    challengeId: id,
    studentId,
    studentName,
    link: link.trim(),
    submittedAt: new Date().toISOString(),
  });

  return NextResponse.json({ submission }, { status: 201 });
}
