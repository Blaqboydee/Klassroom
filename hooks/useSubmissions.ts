"use client";

import { useState, useEffect, useCallback } from "react";
import type { Submission } from "@/models/Submission";

interface UseSubmissionsOptions {
  studentId?: string;
  assignmentId?: string;
}

interface UseSubmissionsReturn {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  submit: (data: { studentId: string; assignmentId: string; link: string }) => Promise<Submission | null>;
  submitting: boolean;
}

export function useSubmissions(options: UseSubmissionsOptions = {}): UseSubmissionsReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { studentId, assignmentId } = options;

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (studentId) params.set("studentId", studentId);
      if (assignmentId) params.set("assignmentId", assignmentId);
      const res = await fetch(`/api/submissions?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load submissions (${res.status})`);
      const data = await res.json() as { submissions: Submission[] };
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [studentId, assignmentId]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const submit = useCallback(async (data: { studentId: string; assignmentId: string; link: string }): Promise<Submission | null> => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Submission failed (${res.status})`);
      }
      const body = await res.json() as { submission: Submission };
      setSubmissions((prev) => [body.submission, ...prev]);
      return body.submission;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submissions, loading, error, refetch: fetchSubmissions, submit, submitting };
}
