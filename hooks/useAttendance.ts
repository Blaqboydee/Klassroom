"use client";

import { useState, useEffect, useCallback } from "react";
import type { AttendanceRecord, AttendanceSession } from "@/models/Attendance";

interface UseAttendanceOptions {
  classroomIds?: string[];
}

interface UseAttendanceReturn {
  sessions: AttendanceSession[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  saveSession: (data: {
    classroomId: string;
    adminId: string;
    date: string;
    note?: string;
    records: AttendanceRecord[];
  }) => Promise<AttendanceSession | null>;
  deleteSession: (id: string) => Promise<boolean>;
  saving: boolean;
}

export function useAttendance({ classroomIds }: UseAttendanceOptions = {}): UseAttendanceReturn {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Stable key so the fetch only re-runs when the list actually changes
  const classroomIdsKey = classroomIds?.join(",") ?? "";

  const fetchSessions = useCallback(async () => {
    // No classrooms means nothing to fetch — never call the API unfiltered.
    if (!classroomIds?.length) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      classroomIds.forEach((id) => params.append("classroomId", id));
      const res = await fetch(`/api/attendance?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load attendance (${res.status})`);
      const data = await res.json() as { sessions: AttendanceSession[] };
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomIdsKey]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const saveSession = useCallback(async (data: {
    classroomId: string;
    adminId: string;
    date: string;
    note?: string;
    records: AttendanceRecord[];
  }): Promise<AttendanceSession | null> => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Failed to save attendance (${res.status})`);
      }
      const body = await res.json() as { session: AttendanceSession };
      // The API upserts on (classroomId, date) — replace in place if this date
      // was already recorded, otherwise insert newest-date-first.
      setSessions((prev) => {
        const without = prev.filter((s) => s.id !== body.session.id);
        return [...without, body.session].sort((a, b) => b.date.localeCompare(a.date));
      });
      return body.session;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    const adminId = (() => { try { const u = localStorage.getItem("klassroom_user"); return u ? (JSON.parse(u) as { id: string }).id : undefined; } catch { return undefined; } })();
    try {
      const res = await fetch(`/api/attendance/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      if (!res.ok) return false;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { sessions, loading, error, refetch: fetchSessions, saveSession, deleteSession, saving };
}
