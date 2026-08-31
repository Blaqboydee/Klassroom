"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAssignments } from "@/hooks/useAssignments";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useClassrooms } from "@/hooks/useClassrooms";
import type { Challenge, ChallengeSubmission } from "@/models/Challenge";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }
interface ClassStreak { classroomId: string; classroomName: string; streak: number; lastSubmissionDate: string | null; }
interface ClassAttendance {
  classroomId: string;
  classroomName: string;
  sessionsRecorded: number;
  present: number;
  absent: number;
  rate: number | null;
  lastPresentDate: string | null;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const pathname = usePathname();

  // Read session from localStorage (set by login/signup page)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch { /* ignore */ }
  }, []);

  const studentId = currentUser?.id ?? "";

  const { classrooms, loading: classroomsLoading, joining, joinClassroom, leaveClassroom, leaving, refetch: refetchClassrooms } = useClassrooms({ memberId: studentId || undefined });

  // Only load assignments for classrooms this student is enrolled in.
  // Always pass classroomIds (even when empty) so the hook never falls back to fetching all assignments.
  // Also block the fetch until classrooms have finished loading (classroomsLoading guard).
  const enrolledClassroomIds = classrooms.map((c) => c.id);
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments(
    !classroomsLoading || enrolledClassroomIds.length > 0 ? { classroomIds: enrolledClassroomIds } : { classroomIds: [] }
  );
  const { submissions, loading: submissionsLoading, submit, updateSubmission, deleteSubmission } = useSubmissions({ studentId: studentId || undefined });

  // Per-class streaks, derived on read (refreshed after each submission)
  const [streaks, setStreaks] = useState<ClassStreak[]>([]);
  const [streakLoading, setStreakLoading] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState<boolean | null>(null);
  const [togglingEmail, setTogglingEmail] = useState(false);

  const fetchStreaks = async (id: string) => {
    setStreakLoading(true);
    try {
      const res = await fetch(`/api/streaks?studentId=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as { streaks: ClassStreak[] };
        setStreaks(data.streaks);
      }
    } finally {
      setStreakLoading(false);
    }
  };

  // Per-class attendance, derived on read (see lib/attendance.ts)
  const [attendance, setAttendance] = useState<ClassAttendance[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const fetchAttendance = async (id: string) => {
    setAttendanceLoading(true);
    try {
      const res = await fetch(`/api/attendance/summary?studentId=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as { summaries: ClassAttendance[] };
        setAttendance(data.summaries);
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchProfile = async (id: string) => {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json() as { user: { emailOptIn?: boolean } };
      setEmailOptIn(data.user.emailOptIn ?? false);
    }
  };

  async function handleEmailOptInToggle() {
    if (!studentId || togglingEmail) return;
    const next = !emailOptIn;
    setTogglingEmail(true);
    try {
      const res = await fetch(`/api/users/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOptIn: next }),
      });
      if (res.ok) setEmailOptIn(next);
    } finally {
      setTogglingEmail(false);
    }
  }

  useEffect(() => {
    if (studentId) { fetchStreaks(studentId); fetchProfile(studentId); fetchAttendance(studentId); }
  }, [studentId]);

  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Edit/delete submission state
  const [editingSubId, setEditingSubId] = useState<string | null>(null); // submissionId being edited
  const [editLinkValue, setEditLinkValue] = useState("");
  const [editLinkError, setEditLinkError] = useState<string | null>(null);
  const [savingSubId, setSavingSubId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  function validateLink(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) return null;
    let parsed: URL;
    try { parsed = new URL(trimmed); } catch { return "Enter a valid URL (e.g. https://github.com/you/project)"; }
    if (parsed.protocol !== "https:") return "Link must start with https://";
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return "Localhost links are not allowed";
    if (parsed.hostname === "github.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return "GitHub link must include a repository (e.g. github.com/user/repo)";
    }
    return null;
  }
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const [navOpen, setNavOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // ── Active challenge polling ────────────────────────────────────────────────
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [challengeLink, setChallengeLink] = useState("");
  const [challengeLinkError, setChallengeLinkError] = useState("");
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  const [myChallengeSub, setMyChallengeSub] = useState<ChallengeSubmission | null>(null);
  const [challengeSubmitSuccess, setChallengeSubmitSuccess] = useState(false);

  const pollChallenge = useCallback(async () => {
    if (enrolledClassroomIds.length === 0) return;
    try {
      const results = await Promise.all(
        enrolledClassroomIds.map((id) =>
          fetch(`/api/challenges?classroomId=${encodeURIComponent(id)}`, { cache: "no-store" })
            .then((r) => r.ok ? r.json() as Promise<{ challenges: Challenge[] }> : { challenges: [] })
        )
      );
      const allActive = results.flatMap((r) => r.challenges).filter((c) => c.status === "active");
      const found = allActive[0] ?? null;
      setActiveChallenge(found);
      if (!found) { setMyChallengeSub(null); return; }
      // Check if student already submitted
      const subRes = await fetch(`/api/challenges/${found.id}`, { cache: "no-store" });
      if (subRes.ok) {
        const { submissions } = await subRes.json() as { submissions: ChallengeSubmission[] };
        const mine = submissions.find((s) => s.studentId === studentId) ?? null;
        setMyChallengeSub(mine);
      }
    } catch { /* ignore */ }
  }, [enrolledClassroomIds, studentId]);

  useEffect(() => {
    pollChallenge();
    const iv = setInterval(pollChallenge, 8000);
    return () => clearInterval(iv);
  }, [pollChallenge]);

  async function handleChallengeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChallenge || !currentUser) return;
    const err = validateLink(challengeLink);
    if (err) { setChallengeLinkError(err); return; }
    setChallengeLinkError("");
    setChallengeSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${activeChallenge.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser.id, studentName: currentUser.name, link: challengeLink.trim() }),
      });
      if (res.status === 409) { setChallengeLinkError("You already submitted or the window has closed."); return; }
      if (!res.ok) { setChallengeLinkError("Submission failed. Try again."); return; }
      const { submission } = await res.json() as { submission: ChallengeSubmission };
      setMyChallengeSub(submission);
      setChallengeLink("");
      setChallengeSubmitSuccess(true);
      setTimeout(() => setChallengeSubmitSuccess(false), 3000);
    } finally {
      setChallengeSubmitting(false);
    }
  }

  function handleSignOut() {
    try { localStorage.removeItem("klassroom_user"); } catch { /* ignore */ }
    router.push("/login");
  }

  // Build a quick lookup: assignmentId → submission
  const submissionMap = Object.fromEntries(submissions.map((s) => [s.assignmentId, s]));

  async function handleSubmit(assignmentId: string, dueDate: string) {
    const link = linkValues[assignmentId]?.trim();
    if (!link || !studentId) return;
    const err = validateLink(link);
    if (err) { setLinkErrors((v) => ({ ...v, [assignmentId]: err })); return; }
    setLinkErrors((v) => { const next = { ...v }; delete next[assignmentId]; return next; });
    setSubmittingId(assignmentId);
    await submit({ studentId, assignmentId, link });
    setLinkValues((v) => { const next = { ...v }; delete next[assignmentId]; return next; });
    setSubmittingId(null);
    void dueDate; // isLate computed server-side
    // Refresh streak from server after submission
    fetchStreaks(studentId);
  }

  async function handleEditSave(sub: { id: string }) {
    const err = validateLink(editLinkValue);
    if (err) { setEditLinkError(err); return; }
    setSavingSubId(sub.id);
    await updateSubmission(sub.id, editLinkValue.trim(), studentId);
    setSavingSubId(null);
    setEditingSubId(null);
    setEditLinkValue("");
    setEditLinkError(null);
    fetchStreaks(studentId);
  }

  async function handleDeleteSubmission(subId: string) {
    setDeletingSubId(subId);
    await deleteSubmission(subId, studentId);
    setDeletingSubId(null);
    fetchStreaks(studentId);
  }

  const [leavingClassroomId, setLeavingClassroomId] = useState<string | null>(null);
  const [leaveConfirmId, setLeaveConfirmId] = useState<string | null>(null);

  async function handleLeaveClassroom(classroomId: string) {
    if (!studentId) return;
    setLeaveConfirmId(classroomId);
  }

  async function confirmLeaveClassroom() {
    if (!leaveConfirmId || !studentId) return;
    const id = leaveConfirmId;
    setLeaveConfirmId(null);
    setLeavingClassroomId(id);
    await leaveClassroom(id, studentId);
    setLeavingClassroomId(null);
  }

  async function handleJoinClassroom(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(false);
    if (!joinCode.trim() || !studentId) return;
    const result = await joinClassroom(joinCode.trim(), studentId);
    if (result.error) {
      setJoinError(result.error);
    } else {
      setJoinCode("");
      setJoinSuccess(true);
      refetchClassrooms();
      setTimeout(() => setJoinSuccess(false), 3000);
    }
  }

  const pendingCount = assignments.filter((a) => !submissionMap[a.id]).length;
  const submittedCount = assignments.filter((a) => !!submissionMap[a.id]).length;

  return (
    <>


      {/* Nav */}
      <nav className="dash-nav">
        <Link href="/dashboard/student" className="brand">Klass<span>room</span></Link>
        <div className="nav-links">
          <Link href="/dashboard/student" className={`nav-link-dash${pathname === "/dashboard/student" ? " active" : ""}`}>My assignments</Link>
          <Link href="/dashboard/student/announcements" className={`nav-link-dash${pathname === "/dashboard/student/announcements" ? " active" : ""}`}>Announcements</Link>
          <Link href="/dashboard/student/history" className={`nav-link-dash${pathname === "/dashboard/student/history" ? " active" : ""}`}>History</Link>
          <Link href="/dashboard/student/support" className={`nav-link-dash${pathname === "/dashboard/student/support" ? " active" : ""}`}>Support</Link>
          <button className="nav-signout" onClick={() => setShowSignOutModal(true)}>Sign out</button>
        </div>
        <button className="nav-burger" aria-label={navOpen ? "Close menu" : "Open menu"} onClick={() => setNavOpen((o) => !o)}>
          {navOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          }
        </button>
      </nav>
      {navOpen && (
        <div className="nav-drawer">
          <Link href="/dashboard/student" className={`nav-link-dash${pathname === "/dashboard/student" ? " active" : ""}`} onClick={() => setNavOpen(false)}>My assignments</Link>
          <Link href="/dashboard/student/announcements" className={`nav-link-dash${pathname === "/dashboard/student/announcements" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Announcements</Link>
          <Link href="/dashboard/student/history" className={`nav-link-dash${pathname === "/dashboard/student/history" ? " active" : ""}`} onClick={() => setNavOpen(false)}>History</Link>
          <Link href="/dashboard/student/support" className={`nav-link-dash${pathname === "/dashboard/student/support" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Support</Link>
          <button className="nav-signout" onClick={() => { setNavOpen(false); setShowSignOutModal(true); }}>Sign out</button>
        </div>
      )}

      <main className="page">
        {/* Header */}
        <div className="page-header">
          <h1 className="greeting">Hey, {currentUser?.name ?? "Student"}</h1>
          <p className="greeting-sub">Student Dashboard</p>
        </div>

        {/* Per-class streaks — each enrolled class has its own independent streak */}
        {classrooms.length > 0 && (
          <div className="stats-row" style={{ marginBottom: 12 }}>
            {classrooms.map((c) => {
              const cs = streaks.find((s) => s.classroomId === c.id);
              const value = cs?.streak ?? 0;
              const active = value > 0;
              return (
                <div key={c.id} className={`stat-card${active ? " amber-card" : ""}`}>
                  <div className={`stat-num flex items-center gap-2${active ? " amber" : ""}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#92400e" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
                    </svg>
                    {streakLoading && !cs ? <span className="skeleton w-6 h-7 inline-block" /> : value}
                  </div>
                  <div className="stat-label">{c.name}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Per-class attendance — only classes whose instructor has taken a roll */}
        {(() => {
          const recorded = attendance.filter((a) => a.sessionsRecorded > 0);
          if (attendanceLoading && recorded.length === 0) return null;
          if (recorded.length === 0) return null;
          return (
            <>
              <div className="section-label">Attendance</div>
              <div className="stats-row" style={{ marginBottom: 24 }}>
                {recorded.map((a) => {
                  const rate = a.rate ?? 0;
                  const good = rate >= 75;
                  return (
                    <div key={a.classroomId} className="stat-card">
                      <div className="stat-num flex items-center gap-2" style={{ color: good ? "#166534" : "#991b1b" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <path d="M3 10h18M8 2v4M16 2v4" />
                          {good ? <path d="m9 15 2 2 4-4" /> : <path d="m10 14 4 4m0-4-4 4" />}
                        </svg>
                        {rate}%
                      </div>
                      <div className="stat-label">{a.classroomName}</div>
                      <div className="stat-label" style={{ marginTop: 2 }}>
                        {a.present} of {a.sessionsRecorded} class{a.sessionsRecorded !== 1 ? "es" : ""} attended
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{(submissionsLoading || assignmentsLoading) ? <span className="skeleton w-8 h-7 inline-block" /> : submittedCount}</div>
            <div className="stat-label">submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{(submissionsLoading || assignmentsLoading) ? <span className="skeleton w-8 h-7 inline-block" /> : pendingCount}</div>
            <div className="stat-label">pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{assignmentsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : assignments.length}</div>
            <div className="stat-label">total assignments</div>
          </div>
        </div>

        {/* Active challenge banner */}
        {activeChallenge && (
          <div style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.3)", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--color-teal)", boxShadow: "0 0 0 3px rgba(13,148,136,0.25)" }} />
              <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-teal)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Challenge</span>
            </div>
            <p style={{ margin: "0 0 4px", fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: "var(--color-ink)" }}>{activeChallenge.title}</p>
            {activeChallenge.description && <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--color-ink)", opacity: 0.6 }}>{activeChallenge.description}</p>}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14, fontSize: 14, color: "var(--color-ink)", opacity: 0.55 }}>
              <span>⏱ {activeChallenge.windowMinutes} min</span>
              {activeChallenge.prize && <span>🏆 {activeChallenge.prize}</span>}
            </div>
            {myChallengeSub ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(13,148,136,0.1)", borderRadius: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-teal)" }}>✓ Submitted!</span>
                <a href={myChallengeSub.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "var(--color-teal)", fontFamily: "var(--font-mono)", textDecoration: "none", opacity: 0.7 }}>
                  {myChallengeSub.link.length > 50 ? myChallengeSub.link.slice(0, 50) + "…" : myChallengeSub.link}
                </a>
              </div>
            ) : (
              <form onSubmit={handleChallengeSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 220 }}
                  placeholder="https://github.com/you/solution"
                  value={challengeLink}
                  onChange={(e) => { setChallengeLink(e.target.value); if (challengeLinkError) setChallengeLinkError(""); }}
                  disabled={challengeSubmitting}
                />
                <button type="submit" className="btn-primary" disabled={challengeSubmitting || !challengeLink.trim()}>
                  {challengeSubmitting ? "Submitting…" : "Submit"}
                </button>
              </form>
            )}
            {challengeLinkError && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#dc2626" }}>{challengeLinkError}</p>}
            {challengeSubmitSuccess && <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-teal)", fontWeight: 600 }}>Submitted! Good luck 🎉</p>}
          </div>
        )}

        {/* Email notification toggle */}
        {currentUser && emailOptIn !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 16px", background: "var(--color-paper-2)", borderRadius: 12, border: "1px solid var(--color-border)", width: "fit-content" }}>
            <button
              type="button"
              role="switch"
              aria-checked={emailOptIn}
              disabled={togglingEmail}
              onClick={handleEmailOptInToggle}
              style={{
                width: 36, height: 20, borderRadius: 10, border: "none", cursor: togglingEmail ? "wait" : "pointer",
                background: emailOptIn ? "var(--color-teal)" : "var(--color-border)",
                position: "relative", flexShrink: 0, transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: emailOptIn ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
            <span style={{ fontSize: 14, color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}>Email notifications</span>
          </div>
        )}

        {/* Classrooms */}
        <div className="section-label">My classrooms</div>
        {classroomsLoading ? (
          <div className="flex gap-2 mb-[10px] flex-wrap">
            <span className="skeleton h-7 w-32 inline-block rounded-full" />
            <span className="skeleton h-7 w-28 inline-block rounded-full" />
          </div>
        ) : classrooms.length > 0 && (
          <div className="mb-[10px]">
            {classrooms.map((c) => (
              <span key={c.id} className="classroom-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {c.name}
                <span className="classroom-chip-code">{c.code}</span>
                <button
                  type="button"
                  className="classroom-chip-leave"
                  title="Leave classroom"
                  disabled={leaving || leavingClassroomId === c.id}
                  onClick={() => handleLeaveClassroom(c.id)}
                  aria-label={`Leave ${c.name}`}
                >
                  {leavingClassroomId === c.id
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  }
                </button>
              </span>
            ))}
          </div>
        )}
          <div className="assignment-card mb-8">
          <form className="join-form" onSubmit={handleJoinClassroom}>
            <input
              type="text"
              className="join-input"
              placeholder="Enter classroom code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={joining || !currentUser}
            />
            <button
              type="submit"
              className="join-btn"
              disabled={joining || joinCode.length < 4 || !currentUser}
            >
              {joining ? "Joining…" : "Join classroom"}
            </button>
          </form>
          {joinError && <p className="text-red text-[13px] mt-2">{joinError}</p>}
          {joinSuccess && <p className="text-teal text-[13px] mt-2">Joined! You're now enrolled in that classroom.</p>}
          {!currentUser && <p className="text-ink-3 text-[12px] mt-2">Sign in to join a classroom.</p>}
        </div>

        {/* Assignments */}
        <div className="section-label">Assignments</div>

        {assignmentsError && <p className="text-red text-[14px]">{assignmentsError}</p>}

        {assignmentsLoading ? (
          <div className="flex flex-col gap-3">
            {[0,1,2].map((i) => (
              <div key={i} className="assignment-card">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="skeleton h-4 w-48 block" />
                    <span className="skeleton h-3 w-72 block" />
                  </div>
                  <span className="skeleton h-6 w-20 block rounded-full" />
                </div>
                <span className="skeleton h-3 w-24 block mt-3" />
              </div>
            ))}
          </div>
        ) : assignments.map((a) => {
          const sub = submissionMap[a.id];
          return (
          <div key={a.id} className="assignment-card">
            <div className="assign-top">
              <div>
                <div className="assign-title">{a.title}</div>
                <div className="assign-desc">{a.description}</div>
              </div>
              <span className={`status-pill ${sub ? (sub.isLate ? "pill-late" : "pill-submitted") : "pill-pending"}`}>
                {sub ? (sub.isLate ? "Late" : "Submitted") : "Pending"}
              </span>
            </div>

            <div className="assign-meta">
              <span>Due {a.dueDate}</span>
              {sub?.submittedAt && (
                <span>Submitted {new Date(sub.submittedAt).toLocaleString()}</span>
              )}
            </div>

            {sub && editingSubId === sub.id ? (
              <div className="submit-form mt-3">
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="url"
                    className={`submit-input${editLinkError ? " error" : ""}`}
                    value={editLinkValue}
                    onChange={(e) => { setEditLinkValue(e.target.value); setEditLinkError(null); }}
                    disabled={savingSubId === sub.id}
                    autoFocus
                  />
                  {editLinkError && <p className="text-[12px] text-red">{editLinkError}</p>}
                </div>
                <button
                  className="submit-btn-dash"
                  onClick={() => handleEditSave(sub)}
                  disabled={!editLinkValue.trim() || savingSubId === sub.id}
                >
                  {savingSubId === sub.id ? "Saving…" : "Save"}
                </button>
                <button
                  className="copy-btn"
                  style={{ padding: "6px 10px", fontSize: 14, color: "var(--color-ink-3)" }}
                  onClick={() => { setEditingSubId(null); setEditLinkValue(""); setEditLinkError(null); }}
                >
                  Cancel
                </button>
              </div>
            ) : sub?.link && (
              <div className="flex flex-col gap-2">
                <div className="submitted-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.link}</span>
                <button
                  className="copy-btn"
                  title="Edit submission"
                  onClick={() => { setEditingSubId(sub.id); setEditLinkValue(sub.link); setEditLinkError(null); }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  className="copy-btn"
                  title="Delete submission"
                  style={{ color: "#dc2626" }}
                  disabled={deletingSubId === sub.id}
                  onClick={() => handleDeleteSubmission(sub.id)}
                >
                  {deletingSubId === sub.id
                    ? <span style={{ fontSize: 14 }}>…</span>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                  }
                </button>
              </div>
                {(sub.grade || sub.feedback) && (
                  <div style={{ background: "var(--color-paper-2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                    {sub.grade && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Grade</span>
                        <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "var(--color-teal)" }}>{sub.grade}</span>
                      </div>
                    )}
                    {sub.feedback && (
                      <p style={{ fontSize: 14, color: "var(--color-ink-2)", margin: 0, lineHeight: 1.5 }}>{sub.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!sub && (
              <div className="submit-form">
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="url"
                    className={`submit-input${linkErrors[a.id] ? " error" : ""}`}
                    placeholder="https://github.com/you/project or deployment URL"
                    value={linkValues[a.id] ?? ""}
                    onChange={(e) => {
                      setLinkValues((v) => ({ ...v, [a.id]: e.target.value }));
                      if (linkErrors[a.id]) setLinkErrors((v) => { const next = { ...v }; delete next[a.id]; return next; });
                    }}
                    disabled={submittingId === a.id}
                  />
                  {linkErrors[a.id] && (
                    <p className="text-[12px] text-red">{linkErrors[a.id]}</p>
                  )}
                </div>
                <button
                  className="submit-btn-dash"
                  onClick={() => handleSubmit(a.id, a.dueDate)}
                  disabled={!linkValues[a.id]?.trim() || submittingId === a.id}
                >
                  {submittingId === a.id ? "Submitting…" : "Submit"}
                </button>
              </div>
            )}
          </div>
          );
        })}
      </main>

      {/* Leave classroom confirmation modal */}
      {leaveConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]"
          onClick={(e) => { if (e.target === e.currentTarget) setLeaveConfirmId(null); }}
        >
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[380px] mx-4 p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Leave classroom?</h2>
              <p className="text-[13px] text-ink-3">You will lose access to this classroom&apos;s assignments. You can rejoin later with the class code.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setLeaveConfirmId(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626", padding: "8px 18px", fontSize: 14 }} onClick={confirmLeaveClassroom}>Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Sign-out confirmation modal */}
      {showSignOutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSignOutModal(false); }}
        >
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[360px] mx-4 p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Sign out?</h2>
              <p className="text-[13px] text-ink-3">You will be returned to the login page.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setShowSignOutModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626", padding: "8px 18px", fontSize: 14 }} onClick={handleSignOut}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
