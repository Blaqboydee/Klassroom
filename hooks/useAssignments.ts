"use client";

import { useState, useEffect, useCallback } from "react";
import type { Assignment } from "@/models/Assignment";

interface UseAssignmentsReturn {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createAssignment: (data: { classroomId: string; title: string; description?: string; dueDate: string }) => Promise<Assignment | null>;
  creating: boolean;
}

export function useAssignments(filter?: { classroomId?: string }): UseAssignmentsReturn {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter?.classroomId ? `?classroomId=${encodeURIComponent(filter.classroomId)}` : "";
      const res = await fetch(`/api/assignments${qs}`);
      if (!res.ok) throw new Error(`Failed to load assignments (${res.status})`);
      const data = await res.json() as { assignments: Assignment[] };
      setAssignments(data.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.classroomId]);

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

  return { assignments, loading, error, refetch: fetchAssignments, createAssignment, creating };
}
