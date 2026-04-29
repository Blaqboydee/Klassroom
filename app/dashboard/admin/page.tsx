"use client";

import { useState, useEffect } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useAssignments } from "@/hooks/useAssignments";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useClassrooms } from "@/hooks/useClassrooms";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  // Read session from localStorage (set by login/signup page)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch { /* ignore */ }
  }, []);

  const { students, loading: studentsLoading } = useStudents();
  const { classrooms, creating: creatingClassroom, createClassroom } = useClassrooms({ adminId: currentUser?.id });

  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  // Auto-select first classroom once loaded
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const { assignments, loading: assignmentsLoading, createAssignment, creating } = useAssignments(
    selectedClassroomId ? { classroomId: selectedClassroomId } : undefined
  );
  const { submissions } = useSubmissions();

  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });
  const [created, setCreated] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [classroomCreated, setClassroomCreated] = useState<string | null>(null); // stores the new code

  // Build submission lookup: `${studentId}:${assignmentId}` → true
  const submittedSet = new Set(submissions.map((s) => `${s.studentId}:${s.assignmentId}`));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate || !selectedClassroomId) return;
    const result = await createAssignment({ classroomId: selectedClassroomId, title: form.title, description: form.description, dueDate: form.dueDate });
    if (result) {
      setForm({ title: "", description: "", dueDate: "" });
      setCreated(true);
      setTimeout(() => setCreated(false), 2500);
    }
  }

  async function handleCreateClassroom(e: React.FormEvent) {
    e.preventDefault();
    if (!classroomName.trim() || !currentUser?.id) return;
    const c = await createClassroom(classroomName.trim(), currentUser.id);
    if (c) {
      setClassroomName("");
      setClassroomCreated(c.code);
      setTimeout(() => setClassroomCreated(null), 5000);
    }
  }

  const totalSubmissions = submissions.length;
  const activeStudents = students.filter((s) => s.streak > 0).length;
  const [navOpen, setNavOpen] = useState(false);

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
        .nav-links { display: flex; align-items: center; gap: 1rem; }
        .nav-link { font-size: 13px; color: var(--ink-3); font-weight: 400; transition: color 0.15s; }
        .nav-link:hover { color: var(--ink); }
        .live-btn {
          font-size: 13px; font-weight: 500; color: var(--paper);
          background: var(--teal); border-radius: 8px;
          padding: 5px 14px; transition: background 0.15s;
        }
        .live-btn:hover { background: #0f766e; }
        .nav-signout {
          font-size: 13px; font-weight: 500; color: var(--ink-2);
          border: 1px solid var(--border); border-radius: 8px;
          padding: 5px 14px; transition: background 0.15s;
        }
        .nav-signout:hover { background: var(--paper-2); }

        .page { max-width: 960px; margin: 0 auto; padding: 2.5rem 2rem 4rem; }
        .page-header { margin-bottom: 2rem; }
        .greeting { font-family: var(--serif); font-size: clamp(26px, 4vw, 36px); line-height: 1.1; letter-spacing: -0.5px; }
        .greeting-sub { font-size: 14px; color: var(--ink-3); margin-top: 4px; }

        .stats-row { display: flex; gap: 12px; margin-bottom: 2rem; flex-wrap: wrap; }
        .stat-card { flex: 1; min-width: 120px; background: var(--paper); border: 1px solid var(--border); border-radius: 14px; padding: 16px 20px; }
        .stat-num { font-family: var(--serif); font-size: 28px; color: var(--ink); line-height: 1; }
        .stat-label { font-size: 12px; color: var(--ink-3); margin-top: 4px; }

        .section-label {
          font-family: var(--mono); font-size: 11px; font-weight: 500;
          color: var(--ink-3); letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 0.75rem; margin-top: 2rem;
        }

        .card {
          background: var(--paper); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden; margin-bottom: 12px;
        }
        .card-body { padding: 20px; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .form-input, .form-textarea {
          width: 100%; padding: 10px 14px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--paper-2);
          font-size: 13px; color: var(--ink); font-family: var(--sans);
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input:focus, .form-textarea:focus {
          border-color: var(--teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.12);
        }
        .form-textarea { resize: none; display: block; }
        .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 10px; }
        .create-btn {
          padding: 9px 20px; border-radius: 10px;
          background: var(--ink); color: var(--paper);
          font-size: 13px; font-weight: 500; font-family: var(--sans);
          border: none; cursor: pointer; transition: background 0.15s;
        }
        .create-btn:hover { background: #2a2824; }
        .create-btn:disabled { opacity: 0.5; cursor: default; }
        .success-msg { font-size: 13px; color: var(--teal); font-family: var(--mono); display: flex; align-items: center; gap: 6px; }

        .code-badge {
          display: inline-block;
          font-family: var(--mono); font-size: 22px; font-weight: 600;
          letter-spacing: 0.18em; color: var(--teal);
          background: #f0fdfa; border: 1px dashed #99f6e4;
          border-radius: 10px; padding: 6px 16px;
        }
        .copy-btn {
          background: none; border: none; cursor: pointer;
          color: var(--ink-3); padding: 4px; border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .copy-btn:hover { color: var(--ink); background: var(--paper-3); }
        .classroom-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; margin-bottom: 12px; }
        .classroom-card { background: var(--paper); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px; }
        .classroom-name { font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 10px; }
        .classroom-meta { font-size: 11px; color: var(--ink-3); margin-top: 8px; }
        thead { border-bottom: 1px solid var(--border); }
        th { padding: 10px 14px; text-align: left; font-family: var(--mono); font-size: 10px; font-weight: 500; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; }
        th.center, td.center { text-align: center; }
        td { padding: 12px 14px; border-bottom: 1px solid var(--paper-2); color: var(--ink-2); }
        tr:last-child td { border-bottom: none; }
        tbody tr:hover td { background: var(--paper-2); }
        .student-name { font-weight: 500; color: var(--ink); margin-bottom: 2px; }
        .student-email { font-size: 11px; color: var(--ink-3); font-family: var(--mono); }

        .streak-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: var(--mono); font-size: 13px; font-weight: 500;
          padding: 2px 8px; border-radius: 100px;
        }
        .streak-active { background: #fef3c7; color: #92400e; }
        .streak-dead { background: var(--paper-2); color: var(--ink-3); }

        .dot-yes { display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: #dcfce7; color: #166534; font-size: 11px; line-height: 20px; text-align: center; }
        .dot-no  { display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: var(--paper-3); color: var(--ink-3); font-size: 11px; line-height: 20px; text-align: center; }

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
          .form-grid { grid-template-columns: 1fr; }
          .card-body { padding: 14px; }
        }
      `}</style>

      {/* Nav */}
      <nav className="dash-nav">
        <a href="/" className="brand">Klass<span>room</span></a>
        <div className="nav-links">
          <a href="/dashboard/admin" className="nav-link">Dashboard</a>
          <a href="/live" className="live-btn">Live board</a>
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
          <a href="/dashboard/admin" className="nav-link" onClick={() => setNavOpen(false)}>Dashboard</a>
          <a href="/live" className="nav-link" onClick={() => setNavOpen(false)}>Live board</a>
          <a href="/login" className="nav-signout" style={{ border: "none", padding: 0 }} onClick={() => setNavOpen(false)}>Sign out</a>
        </div>
      )}

      <main className="page">
        {/* Header */}
        <div className="page-header">
          <h1 className="greeting">Welcome back, {currentUser?.name ?? "Instructor"}</h1>
          <p className="greeting-sub">Instructor Dashboard</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{studentsLoading ? "–" : students.length}</div>
            <div className="stat-label">students enrolled</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{assignmentsLoading ? "–" : assignments.length}</div>
            <div className="stat-label">assignments posted</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{totalSubmissions}</div>
            <div className="stat-label">total submissions</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{activeStudents}</div>
            <div className="stat-label">students with active streak</div>
          </div>
        </div>

        {/* Classrooms */}
        <div className="section-label">Your classrooms</div>
        {classrooms.length > 0 && (
          <div className="classroom-grid">
            {classrooms.map((c) => (
              <div key={c.id} className="classroom-card">
                <div className="classroom-name">{c.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="code-badge">{c.code}</span>
                  <button
                    className="copy-btn"
                    title="Copy join code"
                    onClick={() => navigator.clipboard.writeText(c.code)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  </button>
                </div>
                <div className="classroom-meta">{c.memberIds.length} student{c.memberIds.length !== 1 ? "s" : ""} enrolled</div>
              </div>
            ))}
          </div>
        )}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleCreateClassroom} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                className="form-input"
                placeholder="New classroom name, e.g. CS101 Morning"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                disabled={creatingClassroom || !currentUser}
              />
              <button
                type="submit"
                className="create-btn"
                style={{ whiteSpace: "nowrap" }}
                disabled={creatingClassroom || !classroomName.trim() || !currentUser}
              >
                {creatingClassroom ? "Creating…" : "Create"}
              </button>
            </form>
            {classroomCreated && (
              <p className="success-msg" style={{ marginTop: 10 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Classroom created! Share code <span style={{ fontFamily: "var(--mono)", letterSpacing: "0.1em" }}>{classroomCreated}</span> with your students.
              </p>
            )}
            {!currentUser && (
              <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>Sign in to create classrooms.</p>
            )}
          </div>
        </div>

        {/* Create Assignment */}
        <div className="section-label">Create assignment</div>
        <div className="card">
          <div className="card-body">
            {classrooms.length > 1 && (
              <div style={{ marginBottom: 10 }}>
                <select
                  className="form-input"
                  value={selectedClassroomId ?? ""}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            )}
            {classrooms.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 10 }}>Create a classroom first before adding assignments.</p>
            )}
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  disabled={creating || !selectedClassroomId}
                />
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  disabled={creating || !selectedClassroomId}
                />
              </div>
              <textarea
                className="form-textarea"
                placeholder="Description (optional)"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={creating || !selectedClassroomId}
              />
              <div className="form-actions">
                {created && (
                  <span className="success-msg">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Assignment created
                  </span>
                )}
                <button className="create-btn" type="submit" disabled={creating || !form.title.trim() || !form.dueDate || !selectedClassroomId}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Submission Matrix */}
        <div className="section-label">Submission overview</div>
        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th className="center">Streak</th>
                  <th className="center">Last active</th>
                  {assignments.map((a) => (
                    <th key={a.id} className="center" style={{ maxWidth: 110 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.title}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="student-name">{s.name}</div>
                      <div className="student-email">{s.email}</div>
                    </td>
                    <td className="center">
                      <span className={`streak-badge ${s.streak > 0 ? "streak-active" : "streak-dead"}`}>
                        {s.streak > 0
                          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
                          : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                        }
                        {s.streak}
                      </span>
                    </td>
                    <td className="center" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{s.lastSubmissionDate ?? "–"}</td>
                    {assignments.map((a) => (
                      <td key={a.id} className="center">
                        {submittedSet.has(`${s.id}:${a.id}`)
                          ? <span className="dot-yes"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                          : <span className="dot-no">–</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
