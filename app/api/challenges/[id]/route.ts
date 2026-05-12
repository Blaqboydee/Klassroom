import { NextRequest, NextResponse } from "next/server";
import { findChallengeById, updateChallenge, findChallengeSubmissions } from "../../../../lib/db";

// GET /api/challenges/[id] — get challenge + submissions
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [challenge, submissions] = await Promise.all([
    findChallengeById(id),
    findChallengeSubmissions(id),
  ]);
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  return NextResponse.json({ challenge, submissions });
}

// PATCH /api/challenges/[id] — close challenge and/or declare winner
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as {
    status?: "closed";
    winnerId?: string;
    winnerName?: string;
  };

  const updates: Record<string, unknown> = {};
  if (body.status === "closed") {
    updates.status = "closed";
    updates.closedAt = new Date().toISOString();
  }
  if (body.winnerId) {
    updates.winnerId = body.winnerId;
    updates.winnerName = body.winnerName ?? "";
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const challenge = await updateChallenge(id, updates as Parameters<typeof updateChallenge>[1]);
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  return NextResponse.json({ challenge });
}
