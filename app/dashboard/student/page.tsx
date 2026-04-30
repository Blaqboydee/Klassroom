"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAssignments } from "@/hooks/useAssignments";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useClassrooms } from "@/hooks/useClassrooms";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

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

  // Real streak fetched from the server (updated after each submission)
  const [streak, setStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(false);

  const fetchStreak = async (id: string) => {
    setStreakLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as { user: { streak: number } };
        setStreak(data.user.streak);
      }
    } finally {
      setStreakLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchStreak(studentId);
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
    fetchStreak(studentId);
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
    fetchStreak(studentId);
  }

  async function handleDeleteSubmission(subId: string) {
    setDeletingSubId(subId);
    await deleteSubmission(subId, studentId);
    setDeletingSubId(null);
    fetchStreak(studentId);
  }

  const [leavingClassroomId, setLeavingClassroomId] = useState<string | null>(null);

  async function handleLeaveClassroom(classroomId: string) {
    if (!studentId) return;
    if (!confirm("Leave this classroom? You will lose access to its assignments.")) return;
    setLeavingClassroomId(classroomId);
    await leaveClassroom(classroomId, studentId);
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
          <button className="nav-signout" onClick={() => { setNavOpen(false); setShowSignOutModal(true); }}>Sign out</button>
        </div>
      )}

      <main className="page">
        {/* Header */}
        <div className="page-header">
          <h1 className="greeting">Hey, {currentUser?.name ?? "Student"}</h1>
          <p className="greeting-sub">Student Dashboard</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card amber-card">
            <div className="stat-num amber flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
              </svg>
              {submissionsLoading || streakLoading ? <span className="skeleton w-6 h-7 inline-block" /> : streak}
            </div>
            <div className="stat-label">day streak</div>
          </div>
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
                  style={{ padding: "6px 10px", fontSize: 12, color: "var(--color-ink-3)" }}
                  onClick={() => { setEditingSubId(null); setEditLinkValue(""); setEditLinkError(null); }}
                >
                  Cancel
                </button>
              </div>
            ) : sub?.link && (
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
                    ? <span style={{ fontSize: 10 }}>…</span>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                  }
                </button>
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
