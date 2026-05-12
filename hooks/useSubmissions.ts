"use client";

import { useState, useEffect, useCallback } from "react";
import type { Submission } from "@/models/Submission";

interface UseSubmissionsOptions {
  studentId?: string;
  assignmentId?: string;
  classroomIds?: string[];
}

interface UseSubmissionsReturn {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  submit: (data: { studentId: string; assignmentId: string; link: string }) => Promise<Submission | null>;
  updateSubmission: (id: string, link: string, studentId: string) => Promise<Submission | null>;
  deleteSubmission: (id: string, studentId: string) => Promise<boolean>;
  gradeSubmission: (id: string, grade: string, feedback: string) => Promise<Submission | null>;
  submitting: boolean;
}

export function useSubmissions(options: UseSubmissionsOptions = {}): UseSubmissionsReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { studentId, assignmentId, classroomIds } = options;
  // Stable key so useCallback only re-runs when the list actually changes
  const classroomIdsKey = classroomIds?.join(",") ?? "";

  const fetchSubmissions = useCallback(async () => {
    // If a classroomIds filter is provided but empty, there is nothing to fetch.
    if (classroomIds !== undefined && classroomIds.length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (studentId) params.set("studentId", studentId);
      if (assignmentId) params.set("assignmentId", assignmentId);
      if (classroomIds?.length) classroomIds.forEach((id) => params.append("classroomId", id));
      const res = await fetch(`/api/submissions?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load submissions (${res.status})`);
      const data = await res.json() as { submissions: Submission[] };
      setSubmissions(data.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, assignmentId, classroomIdsKey]);

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

  const updateSubmission = useCallback(async (id: string, link: string, studentId: string): Promise<Submission | null> => {
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link, studentId }),
      });
      if (!res.ok) return null;
      const body = await res.json() as { submission: Submission };
      setSubmissions((prev) => prev.map((s) => s.id === id ? body.submission : s));
      return body.submission;
    } catch {
      return null;
    }
  }, []);

  const deleteSubmission = useCallback(async (id: string, studentId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) return false;
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const gradeSubmission = useCallback(async (id: string, grade: string, feedback: string): Promise<Submission | null> => {
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, feedback }),
      });
      if (!res.ok) return null;
      const body = await res.json() as { submission: Submission };
      setSubmissions((prev) => prev.map((s) => s.id === id ? body.submission : s));
      return body.submission;
    } catch {
      return null;
    }
  }, []);

  return { submissions, loading, error, refetch: fetchSubmissions, submit, updateSubmission, deleteSubmission, gradeSubmission, submitting };
}
