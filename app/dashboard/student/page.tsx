"use client";

import { useState, useEffect } from "react";
import { useAssignments } from "@/hooks/useAssignments";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useClassrooms } from "@/hooks/useClassrooms";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  // Read session from localStorage (set by login/signup page)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch { /* ignore */ }
  }, []);

  const studentId = currentUser?.id ?? "";

  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments();
  const { submissions, submit, submitting: submitPending } = useSubmissions({ studentId: studentId || undefined });
  const { classrooms, joining, joinClassroom, refetch: refetchClassrooms } = useClassrooms({ memberId: studentId || undefined });

  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const [navOpen, setNavOpen] = useState(false);

  // Build a quick lookup: assignmentId → submission
  const submissionMap = Object.fromEntries(submissions.map((s) => [s.assignmentId, s]));

  async function handleSubmit(assignmentId: string, dueDate: string) {
    const link = linkValues[assignmentId]?.trim();
    if (!link || !studentId) return;
    setSubmittingId(assignmentId);
    await submit({ studentId, assignmentId, link });
    setLinkValues((v) => { const next = { ...v }; delete next[assignmentId]; return next; });
    setSubmittingId(null);
    void dueDate; // isLate computed server-side
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
  const streak = currentUser ? (submissions.length > 0 ? 1 : 0) : 0; // streak comes from user record; simplified here

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #0f0e0c;
          --ink-2: #3a3830;
          --ink-3: #7a7770;
          --paper: #faf8f4;
          --paper-2: #f0ede6;
          --paper-3: #e4e0d8;
          --amber: #d97706;
          --teal: #0d9488;
          --border: #e4e0d8;
          --serif: 'DM Serif Display', Georgia, serif;
          --mono: 'DM Mono', 'Courier New', monospace;
          --sans: 'Outfit', system-ui, sans-serif;
        }
        body { font-family: var(--sans); background: var(--paper); color: var(--ink); }
        a { color: inherit; text-decoration: none; }

        .dash-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(250,248,244,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2rem; height: 56px;
        }
        .brand { font-family: var(--serif); font-size: 18px; color: var(--ink); letter-spacing: -0.3px; }
        .brand span { color: var(--amber); }
        .nav-links { display: flex; align-items: center; gap: 1.5rem; }
        .nav-link { font-size: 13px; color: var(--ink-3); font-weight: 400; transition: color 0.15s; }
        .nav-link:hover { color: var(--ink); }
        .nav-signout {
          font-size: 13px; font-weight: 500; color: var(--ink-2);
          border: 1px solid var(--border); border-radius: 8px;
          padding: 5px 14px; transition: background 0.15s, color 0.15s;
        }
        .nav-signout:hover { background: var(--paper-2); }

        .page { max-width: 780px; margin: 0 auto; padding: 2.5rem 2rem 4rem; }

        .page-header { margin-bottom: 2rem; }
        .greeting { font-family: var(--serif); font-size: clamp(26px, 4vw, 36px); line-height: 1.1; letter-spacing: -0.5px; color: var(--ink); }
        .greeting-sub { font-size: 14px; color: var(--ink-3); margin-top: 4px; font-weight: 400; }

        .stats-row { display: flex; gap: 12px; margin-bottom: 2rem; flex-wrap: wrap; }
        .stat-card {
          flex: 1; min-width: 120px;
          background: var(--paper); border: 1px solid var(--border);
          border-radius: 14px; padding: 16px 20px;
        }
        .stat-card.amber-card { background: #fef3c7; border-color: #fde68a; }
        .stat-num { font-family: var(--serif); font-size: 28px; color: var(--ink); line-height: 1; }
        .stat-num.amber { color: #92400e; }
        .stat-label { font-size: 12px; color: var(--ink-3); margin-top: 4px; font-weight: 400; }

        .section-label {
          font-family: var(--mono); font-size: 11px; font-weight: 500;
          color: var(--ink-3); letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 0.75rem;
        }

        .assignment-card {
          background: var(--paper); border: 1px solid var(--border);
          border-radius: 14px; padding: 20px; margin-bottom: 10px;
          transition: box-shadow 0.15s;
        }
        .assignment-card:hover { box-shadow: 0 4px 16px rgba(15,14,12,0.06); }

        .assign-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 8px; }
        .assign-title { font-size: 15px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
        .assign-desc { font-size: 13px; color: var(--ink-3); font-weight: 300; line-height: 1.5; }

        .status-pill {
          flex-shrink: 0; font-size: 11px; font-weight: 500;
          font-family: var(--mono); padding: 3px 10px;
          border-radius: 100px; border: 1px solid transparent;
        }
        .pill-submitted { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
        .pill-late { background: #fefce8; color: #854d0e; border-color: #fde68a; }
        .pill-pending { background: var(--paper-2); color: var(--ink-3); border-color: var(--border); }

        .assign-meta { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--ink-3); margin-bottom: 12px; }

        .submit-form { display: flex; gap: 8px; margin-top: 4px; }
        .submit-input {
          flex: 1; padding: 9px 13px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--paper-2);
          font-size: 13px; color: var(--ink); font-family: var(--sans);
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .submit-input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }
        .submit-btn {
          padding: 9px 18px; border-radius: 10px;
          background: var(--ink); color: var(--paper);
          font-size: 13px; font-weight: 500; font-family: var(--sans);
          border: none; cursor: pointer; transition: background 0.15s; white-space: nowrap;
        }
        .submit-btn:hover { background: #2a2824; }
        .submit-btn:disabled { opacity: 0.5; cursor: default; }

        .join-form { display: flex; gap: 8px; }
        .join-input {
          flex: 1; padding: 9px 13px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--paper-2);
          font-size: 13px; font-family: var(--mono); letter-spacing: 0.12em;
          color: var(--ink); outline: none; text-transform: uppercase;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .join-input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }
        .join-btn {
          padding: 9px 18px; border-radius: 10px;
          background: var(--teal); color: var(--paper);
          font-size: 13px; font-weight: 500; font-family: var(--sans);
          border: none; cursor: pointer; transition: background 0.15s; white-space: nowrap;
        }
        .join-btn:hover { background: #0f766e; }
        .join-btn:disabled { opacity: 0.5; cursor: default; }

        .nav-burger {
          display: none; background: none; border: none;
          cursor: pointer; padding: 6px; color: var(--ink);
        }
        .nav-drawer {
          position: fixed; top: 56px; left: 0; right: 0; z-index: 49;
          background: rgba(250,248,244,0.98); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 1rem 2rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .nav-drawer a { font-size: 16px; padding: 6px 0; }
        @media (max-width: 640px) {
          .nav-links { display: none !important; }
          .nav-burger { display: block !important; }
          .page { padding: 1.5rem 1rem 3rem; }
          .stats-row { gap: 8px; }
          .stat-card { min-width: 80px; padding: 12px 14px; }
          .stat-num { font-size: 22px; }
          .assignment-card { padding: 14px; }
          .submit-form { flex-direction: column; }
          .join-form { flex-direction: column; }
        }
        .classroom-chip {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--paper-2); border: 1px solid var(--border);
          border-radius: 100px; padding: 5px 14px;
          font-size: 13px; font-weight: 500; color: var(--ink-2);
          margin: 0 6px 6px 0;
        }
        .classroom-chip-code { font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
      `}</style>

      {/* Nav */}
      <nav className="dash-nav">
        <a href="/" className="brand">Klass<span>room</span></a>
        <div className="nav-links">
          <a href="/dashboard/student" className="nav-link">My assignments</a>
          <a href="/live" className="nav-link">Live board</a>
          <a href="/login" className="nav-signout">Sign out</a>
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
          <a href="/dashboard/student" className="nav-link" onClick={() => setNavOpen(false)}>My assignments</a>
          <a href="/live" className="nav-link" onClick={() => setNavOpen(false)}>Live board</a>
          <a href="/login" className="nav-signout" style={{ border: "none", padding: 0 }} onClick={() => setNavOpen(false)}>Sign out</a>
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
            <div className="stat-num amber" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
              </svg>
              {streak}
            </div>
            <div className="stat-label">day streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{submittedCount}</div>
            <div className="stat-label">submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{pendingCount}</div>
            <div className="stat-label">pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{assignments.length}</div>
            <div className="stat-label">total assignments</div>
          </div>
        </div>

        {/* Classrooms */}
        <div className="section-label">My classrooms</div>
        {classrooms.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {classrooms.map((c) => (
              <span key={c.id} className="classroom-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {c.name}
                <span className="classroom-chip-code">{c.code}</span>
              </span>
            ))}
          </div>
        )}
        <div className="assignment-card" style={{ marginBottom: "2rem" }}>
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
          {joinError && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{joinError}</p>}
          {joinSuccess && <p style={{ color: "var(--teal)", fontSize: 13, marginTop: 8 }}>Joined! You’re now enrolled in that classroom.</p>}
          {!currentUser && <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 8 }}>Sign in to join a classroom.</p>}
        </div>

        {/* Assignments */}
        <div className="section-label">Assignments</div>

        {assignmentsLoading && <p style={{ color: "var(--ink-3)", fontSize: 14 }}>Loading…</p>}
        {assignmentsError && <p style={{ color: "#dc2626", fontSize: 14 }}>{assignmentsError}</p>}

        {assignments.map((a) => {
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

            {sub?.link && (
              <div className="submitted-link">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                {sub.link}
              </div>
            )}

            {!sub && (
              <div className="submit-form">
                <input
                  type="url"
                  className="submit-input"
                  placeholder="https://github.com/you/project"
                  value={linkValues[a.id] ?? ""}
                  onChange={(e) => setLinkValues((v) => ({ ...v, [a.id]: e.target.value }))}
                  disabled={submittingId === a.id || submitPending}
                />
                <button
                  className="submit-btn"
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
    </>
  );
}
