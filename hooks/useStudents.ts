"use client";

import { useState, useEffect, useCallback } from "react";
import type { Student } from "@/models/Student";

interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStudents(): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true); // true on mount — no sync setState in effect
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Called from event handlers / user actions — not inside an effect, so setState is fine
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users?role=student")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
        return res.json() as Promise<{ users: Student[] }>;
      })
      .then((data) => { if (!cancelled) { setStudents(data.users); setLoading(false); } })
      .catch((err: unknown) => { if (!cancelled) { setError(err instanceof Error ? err.message : "Unknown error"); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tick]);

  return { students, loading, error, refetch };
}

