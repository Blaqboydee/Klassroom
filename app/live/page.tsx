"use client";

// Live Class Board — polls every 5 seconds for real-time classroom display

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { Classroom } from "@/models/Classroom";
import type { User } from "@/models/User";
import type { Assignment } from "@/models/Assignment";
import type { Submission } from "@/models/Submission";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

interface BoardRow {
  id: string;
  name: string;
  streak: number;
  submission: Submission | null;
}

function useLiveBoard(classroomId: string | null, memberIds: string[]) {
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const memberIdsKey = memberIds.join(",");

  const poll = useCallback(async () => {
    if (!classroomId) return;
    try {
      const [usersRes, assignmentsRes] = await Promise.all([
        fetch("/api/users?role=student", { cache: "no-store" }),
        fetch(`/api/assignments?classroomId=${encodeURIComponent(classroomId)}`, { cache: "no-store" }),
      ]);
      if (!usersRes.ok || !assignmentsRes.ok) throw new Error("Failed to load data");

      const { users } = await usersRes.json() as { users: User[] };
      const { assignments } = await assignmentsRes.json() as { assignments: Assignment[] };

      const latest = assignments.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] ?? null;

      setAllStudents(users);
      setAssignment(latest);

      if (latest) {
        const subRes = await fetch(`/api/submissions?assignmentId=${encodeURIComponent(latest.id)}`, { cache: "no-store" });
        if (subRes.ok) {
          const { submissions: subs } = await subRes.json() as { submissions: Submission[] };
          setSubmissions(subs);
        }
      } else {
        setSubmissions([]);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, memberIdsKey]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [poll]);

  const memberSet = new Set(memberIds);
  const students = allStudents.filter((s) => memberSet.has(s.id));

  const rows: BoardRow[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    streak: s.streak,
    submission: submissions.find((sub) => sub.studentId === s.id) ?? null,
  }));

  rows.sort((a, b) => {
    if (a.submission && b.submission)
      return new Date(a.submission.submittedAt).getTime() - new Date(b.submission.submittedAt).getTime();
    if (a.submission) return -1;
    if (b.submission) return 1;
    return 0;
  });

  return { rows, assignment, lastUpdated, error };
}

export default function LiveBoardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [classroomsLoading, setClassroomsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) {
        const user = JSON.parse(raw) as SessionUser;
        if (user.role !== "admin") {
          router.replace("/dashboard/student");
          return;
        }
        setCurrentUser(user);
      }
    } catch { /* ignore */ }
  }, [router]);

  useEffect(() => {
    if (!currentUser?.id) return;
    setClassroomsLoading(true);
    fetch(`/api/classrooms?adminId=${encodeURIComponent(currentUser.id)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<{ classrooms: Classroom[] }>)
      .then(({ classrooms: cls }) => {
        setClassrooms(cls);
        if (cls.length > 0) setSelectedId(cls[0].id);
      })
      .catch(() => { /* ignore */ })
      .finally(() => setClassroomsLoading(false));
  }, [currentUser?.id]);

  const selectedClassroom = classrooms.find((c) => c.id === selectedId) ?? null;
  const memberIds = selectedClassroom?.memberIds ?? [];

  const { rows, assignment, lastUpdated, error } = useLiveBoard(selectedId, memberIds);

  const submittedCount = rows.filter((r) => r.submission).length;
  const lateCount = rows.filter((r) => r.submission?.isLate).length;
  const total = rows.length;
  const pct = total > 0 ? (submittedCount / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-paper flex flex-col">

      {/* Nav */}
      <nav className="dash-nav">
        <Link href="/dashboard/admin" className="brand">Klass<span>room</span></Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin"
            className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors nav-link-dash${pathname === "/dashboard/admin" ? " active" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </Link>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 bg-[rgba(13,148,136,0.08)] border border-[rgba(13,148,136,0.2)] rounded-full px-3 py-1.5">
            <div className="live-dot" />
            <span className="font-mono text-[11px] font-medium text-teal tracking-widest uppercase">Live</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto w-full px-8 py-10 flex flex-col gap-8">

        {/* Classroom selector */}
        {classroomsLoading ? (
          <span className="skeleton h-9 w-56 block rounded-xl" />
        ) : classrooms.length > 1 ? (
          <div className="flex items-center gap-3">
            <label className="font-mono text-[11px] text-ink-3 uppercase tracking-widest">Classroom</label>
            <select
              className="form-input max-w-[280px]"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="section-label" style={{ marginTop: 0 }}>
              {selectedClassroom ? selectedClassroom.name : "Class board"}
            </p>
            <h1 className="font-serif text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-0.5px] text-ink">
              {assignment ? assignment.title : "No active assignment"}
            </h1>
            {assignment && (
              <p className="text-[14px] text-ink-3 mt-1">Due {assignment.dueDate}</p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="stat-card text-center min-w-[90px]">
              <div className="stat-num">{submittedCount}</div>
              <div className="stat-label">submitted</div>
            </div>
            <div className="stat-card text-center min-w-[90px]">
              <div className="stat-num">{total - submittedCount}</div>
              <div className="stat-label">pending</div>
            </div>
            {lateCount > 0 && (
              <div className="stat-card amber-card text-center min-w-[90px]">
                <div className="stat-num amber">{lateCount}</div>
                <div className="stat-label">late</div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red text-[13px] bg-red-light border border-[rgba(220,38,38,0.2)] rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        {!classroomsLoading && classrooms.length === 0 && (
          <p className="text-ink-3 text-[14px] text-center py-16">No classrooms found. Create one from the admin dashboard first.</p>
        )}

        {selectedClassroom && (
          <>
            <div className="w-full h-2 bg-paper-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            {total === 0 ? (
              <p className="text-ink-3 text-[14px] text-center py-16">No students enrolled in this classroom yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {rows.map((s) => {
                  const submitted = !!s.submission;
                  const late = s.submission?.isLate ?? false;
                  return (
                    <div
                      key={s.id}
                      className={`rounded-[14px] p-4 flex flex-col gap-2 border transition-all ${
                        submitted
                          ? late
                            ? "bg-[#fefce8] border-[#fde68a]"
                            : "bg-[#f0fdf4] border-[#bbf7d0]"
                          : "bg-paper border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[14px] text-ink leading-tight truncate min-w-0">{s.name}</p>
                        <span
                          className={`shrink-0 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            submitted
                              ? late
                                ? "bg-[#fefce8] text-[#854d0e] border-[#fde68a]"
                                : "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]"
                              : "bg-paper-2 text-ink-3 border-border"
                          }`}
                        >
                          {submitted ? (late ? "Late" : "✓") : "–"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={s.streak > 0 ? "#d97706" : "#d1d5db"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
                        </svg>
                        <span className={`font-mono text-[13px] font-medium ${s.streak > 0 ? "text-amber" : "text-ink-3"}`}>
                          {s.streak}
                        </span>
                        <span className="text-ink-3 text-[11px]">streak</span>
                      </div>

                      {s.submission && (
                        <p className="text-[11px] text-ink-3 font-mono">
                          {new Date(s.submission.submittedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <p className="text-[12px] text-ink-3 font-mono text-center">
          Refreshes every 5 seconds
          {lastUpdated && (
            <> · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</>
          )}
        </p>

      </main>
    </div>
  );
}
