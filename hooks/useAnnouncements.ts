"use client";

import { useState, useEffect, useCallback } from "react";
import type { Announcement } from "@/models/Announcement";

interface UseAnnouncementsOptions {
  classroomIds?: string[];
}

interface UseAnnouncementsReturn {
  announcements: Announcement[];
  loading: boolean;
  post: (data: { classroomIds: string[]; authorId: string; authorName: string; message: string }) => Promise<Announcement[] | null>;
  remove: (id: string) => Promise<boolean>;
  posting: boolean;
}

export function useAnnouncements(options: UseAnnouncementsOptions = {}): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const { classroomIds } = options;
  const classroomIdsKey = classroomIds?.join(",") ?? "";

  const fetchAnnouncements = useCallback(async () => {
    if (classroomIds !== undefined && classroomIds.length === 0) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      classroomIds?.forEach((id) => params.append("classroomId", id));
      const res = await fetch(`/api/announcements?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load announcements");
      const data = await res.json() as { announcements: Announcement[] };
      setAnnouncements(data.announcements);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomIdsKey]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const post = useCallback(async (data: { classroomIds: string[]; authorId: string; authorName: string; message: string }): Promise<Announcement[] | null> => {
    setPosting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const body = await res.json() as { announcements: Announcement[] };
      setAnnouncements((prev) => [...body.announcements, ...prev]);
      return body.announcements;
    } catch {
      return null;
    } finally {
      setPosting(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/announcements/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return false;
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { announcements, loading, post, remove, posting };
}
