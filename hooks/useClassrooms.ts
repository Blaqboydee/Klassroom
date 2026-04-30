"use client";

import { useState, useEffect, useCallback } from "react";
import type { Classroom } from "@/models/Classroom";

interface UseClassroomsOptions {
  adminId?: string;
  memberId?: string;
}

interface UseClassroomsReturn {
  classrooms: Classroom[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createClassroom: (name: string, adminId: string) => Promise<Classroom | null>;
  joinClassroom: (code: string, userId: string) => Promise<{ classroom: Classroom | null; error?: string }>;
  leaveClassroom: (classroomId: string, userId: string) => Promise<boolean>;
  updateClassroom: (id: string, name: string) => Promise<boolean>;
  deleteClassroom: (id: string) => Promise<boolean>;
  creating: boolean;
  joining: boolean;
  leaving: boolean;
}

export function useClassrooms({ adminId, memberId }: UseClassroomsOptions = {}): UseClassroomsReturn {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const userId = adminId ?? memberId;

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!userId) { setClassrooms([]); setLoading(false); return; }
    setLoading(true);
    let cancelled = false;
    const qs = adminId
      ? `?adminId=${encodeURIComponent(adminId)}`
      : `?memberId=${encodeURIComponent(memberId!)}`;
    fetch(`/api/classrooms${qs}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load classrooms (${res.status})`);
        return res.json() as Promise<{ classrooms: Classroom[] }>;
      })
      .then((data) => { if (!cancelled) { setClassrooms(data.classrooms); setLoading(false); } })
      .catch((err: unknown) => { if (!cancelled) { setError(err instanceof Error ? err.message : "Unknown error"); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, userId]);

  const createClassroom = useCallback(async (name: string, adminId: string): Promise<Classroom | null> => {
    setCreating(true);
    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, adminId }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { classroom: Classroom };
      setClassrooms((prev) => [data.classroom, ...prev]);
      return data.classroom;
    } finally {
      setCreating(false);
    }
  }, []);

  const joinClassroom = useCallback(async (code: string, userId: string): Promise<{ classroom: Classroom | null; error?: string }> => {
    setJoining(true);
    try {
      const res = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId }),
      });
      if (res.status === 404) return { classroom: null, error: "No classroom found with that code." };
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        return { classroom: null, error: json.error ?? "Failed to join classroom." };
      }
      const data = await res.json() as { classroom: Classroom };
      setClassrooms((prev) => {
        const exists = prev.some((c) => c.id === data.classroom.id);
        return exists
          ? prev.map((c) => (c.id === data.classroom.id ? data.classroom : c))
          : [...prev, data.classroom];
      });
      return { classroom: data.classroom };
    } finally {
      setJoining(false);
    }
  }, []);

  const leaveClassroom = useCallback(async (classroomId: string, userId: string): Promise<boolean> => {
    setLeaving(true);
    try {
      const res = await fetch("/api/classrooms/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId, userId }),
      });
      if (!res.ok) return false;
      setClassrooms((prev) => prev.filter((c) => c.id !== classroomId));
      return true;
    } finally {
      setLeaving(false);
    }
  }, []);

  const updateClassroom = useCallback(async (id: string, name: string): Promise<boolean> => {
    const adminId = (() => { try { const u = localStorage.getItem("klassroom_user"); return u ? (JSON.parse(u) as { id: string }).id : undefined; } catch { return undefined; } })();
    const res = await fetch(`/api/classrooms/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, adminId }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { classroom: Classroom };
    setClassrooms((prev) => prev.map((c) => (c.id === id ? data.classroom : c)));
    return true;
  }, []);

  const deleteClassroom = useCallback(async (id: string): Promise<boolean> => {
    const adminId = (() => { try { const u = localStorage.getItem("klassroom_user"); return u ? (JSON.parse(u) as { id: string }).id : undefined; } catch { return undefined; } })();
    const res = await fetch(`/api/classrooms/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId }),
    });
    if (!res.ok) return false;
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
    return true;
  }, []);

  return { classrooms, loading, error, refetch, createClassroom, joinClassroom, leaveClassroom, updateClassroom, deleteClassroom, creating, joining, leaving };
}
