import { NextRequest, NextResponse } from "next/server";
import { deleteAnnouncement } from "../../../../lib/db";

// DELETE /api/announcements/[id] — instructor deletes an announcement
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteAnnouncement(id);
  if (!deleted) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
