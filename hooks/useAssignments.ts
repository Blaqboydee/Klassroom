"use client";

import { useState, useEffect, useCallback } from "react";
import type { Assignment } from "@/models/Assignment";

interface UseAssignmentsReturn {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createAssignment: (data: { classroomId: string; title: string; description?: string; dueDate: string }) => Promise<Assignment | null>;
  updateAssignment: (id: string, data: { title?: string; description?: string; dueDate?: string }) => Promise<boolean>;
  deleteAssignment: (id: string) => Promise<boolean>;
  creating: boolean;
}

export function useAssignments(filter?: { classroomId?: string; classroomIds?: string[] }): UseAssignmentsReturn {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const classroomIdsKey = filter?.classroomIds?.join(",") ?? "";

  const fetchAssignments = useCallback(async () => {
    // If classroomIds array is provided but empty, student has no classrooms yet — skip fetch
    if (filter?.classroomIds !== undefined && filter.classroomIds.length === 0) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let qs = "";
      if (filter?.classroomId) {
        qs = `?classroomId=${encodeURIComponent(filter.classroomId)}`;
      } else if (filter?.classroomIds && filter.classroomIds.length > 0) {
        const params = new URLSearchParams();
        filter.classroomIds.forEach((id) => params.append("classroomId", id));
        qs = `?${params.toString()}`;
      }
      const res = await fetch(`/api/assignments${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load assignments (${res.status})`);
      const data = await res.json() as { assignments: Assignment[] };
      setAssignments(data.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.classroomId, classroomIdsKey]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const createAssignment = useCallback(async (data: { classroomId: string; title: string; description?: string; dueDate: string }): Promise<Assignment | null> => {
    setCreating(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Failed to create assignment (${res.status})`);
      }
      const body = await res.json() as { assignment: Assignment };
      setAssignments((prev) => [body.assignment, ...prev]);
      return body.assignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  const updateAssignment = useCallback(async (id: string, data: { title?: string; description?: string; dueDate?: string }): Promise<boolean> => {
    const adminId = (() => { try { const u = localStorage.getItem("klassroom_user"); return u ? (JSON.parse(u) as { id: string }).id : undefined; } catch { return undefined; } })();
    const res = await fetch(`/api/assignments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, adminId }),
    });
    if (!res.ok) return false;
    const body = await res.json() as { assignment: Assignment };
    setAssignments((prev) => prev.map((a) => (a.id === id ? body.assignment : a)));
    return true;
  }, []);

  const deleteAssignment = useCallback(async (id: string): Promise<boolean> => {
    const adminId = (() => { try { const u = localStorage.getItem("klassroom_user"); return u ? (JSON.parse(u) as { id: string }).id : undefined; } catch { return undefined; } })();
    const res = await fetch(`/api/assignments/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId }),
    });
    if (!res.ok) return false;
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    return true;
  }, []);

  return { assignments, loading, error, refetch: fetchAssignments, createAssignment, updateAssignment, deleteAssignment, creating };
}
