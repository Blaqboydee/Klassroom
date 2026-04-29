"use client";

import { useState, useEffect, useCallback } from "react";

export interface StreakEntry {
  studentId: string;
  name?: string;
  streak: number;
  lastSubmissionDate: string | null;
}

interface UseStreaksReturn {
  streaks: StreakEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStreaks(studentId?: string): UseStreaksReturn {
  const [streaks, setStreaks] = useState<StreakEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreaks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = studentId ? `?studentId=${studentId}` : "";
      const res = await fetch(`/api/streaks${params}`);
      if (!res.ok) throw new Error(`Failed to load streaks (${res.status})`);
      const data = await res.json() as { streaks: StreakEntry[] };
      setStreaks(data.streaks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchStreaks(); }, [fetchStreaks]);

  return { streaks, loading, error, refetch: fetchStreaks };
}
