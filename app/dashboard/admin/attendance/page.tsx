"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useStudents } from "@/hooks/useStudents";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useAttendance } from "@/hooks/useAttendance";
import { computeAttendanceSummary } from "@/lib/attendance";
import type { AttendanceStatus } from "@/models/Attendance";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

/** Today in the instructor's own timezone — not UTC, which can be a day off. */
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-08-31" → "Mon 31 Aug" */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export default function AdminAttendance() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [date, setDate] = useState("");

  // Session + today's date are read after mount so server and client render alike.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch { /* ignore */ }
    setDate(todayLocal());
  }, []);

  const { students, loading: studentsLoading } = useStudents();
  const { classrooms, loading: classroomsLoading } = useClassrooms({ adminId: currentUser?.id });

  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const { sessions, loading: sessionsLoading, saveSession, deleteSession, saving, error } = useAttendance({
    classroomIds: selectedClassroomId ? [selectedClassroomId] : [],
  });

  const selectedClassroom = classrooms.find((c) => c.id === selectedClassroomId);
  const roster = useMemo(
    () => (selectedClassroom ? students.filter((s) => selectedClassroom.memberIds.includes(s.id)) : []),
    [selectedClassroom, students],
  );

  // The roll being edited: studentId → present/absent.
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const existingSession = sessions.find((s) => s.date === date) ?? null;

  // Load the picked date's roll whenever the class, date, or roster changes.
  // A fresh day starts everyone present — the instructor flags the absentees.
  useEffect(() => {
    if (!date || roster.length === 0) { setMarks({}); setNote(""); return; }
    const saved = sessions.find((s) => s.date === date);
    const byStudent = new Map(saved?.records.map((r) => [r.studentId, r.status]) ?? []);
    setMarks(Object.fromEntries(roster.map((s) => [s.id, byStudent.get(s.id) ?? "present"])));
    setNote(saved?.note ?? "");
  }, [date, roster, sessions]);

  const presentCount = roster.filter((s) => marks[s.id] === "present").length;

  function setAll(status: AttendanceStatus) {
    setMarks(Object.fromEntries(roster.map((s) => [s.id, status])));
  }

  function toggle(studentId: string) {
    setMarks((m) => ({ ...m, [studentId]: m[studentId] === "present" ? "absent" : "present" }));
  }

  async function handleSave() {
    if (!selectedClassroomId || !currentUser?.id || !date) return;
    const result = await saveSession({
      classroomId: selectedClassroomId,
      adminId: currentUser.id,
      date,
      note,
      records: roster.map((s) => ({ studentId: s.id, status: marks[s.id] ?? "present" })),
    });
    if (result) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  // ── Register (students × session dates) ─────────────────────────────────────
  const classSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions],
  );
  const markLookup = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const s of classSessions) {
      for (const r of s.records) map.set(`${r.studentId}:${s.id}`, r.status);
    }
    return map;
  }, [classSessions]);

  const summaries = useMemo(
    () => new Map(roster.map((s) => [s.id, computeAttendanceSummary(classSessions, s.id)])),
    [roster, classSessions],
  );

  // Class-wide average of each student's own attendance rate (students with no
  // recorded session yet are excluded so they don't drag the average to zero).
  const averageRate = useMemo(() => {
    const rates = [...summaries.values()].map((s) => s.rate).filter((r): r is number => r !== null);
    if (rates.length === 0) return null;
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, [summaries]);

  // Students missing the last 2+ roll calls in a row.
  const atRisk = [...summaries.values()].filter((s) => s.absentStreak >= 2).length;

  const [deleteModal, setDeleteModal] = useState<{ id: string; date: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteModal) return;
    setDeleting(true);
    await deleteSession(deleteModal.id);
    setDeleting(false);
    setDeleteModal(null);
  }

  function exportCSV() {
    if (!selectedClassroom || classSessions.length === 0) return;
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const ordered = [...classSessions].reverse(); // oldest → newest reads better in a sheet
    const headers = ["Student", "Email", ...ordered.map((s) => s.date), "Present", "Absent", "Attendance %"];
    const rows = roster.map((s) => {
      const cells = ordered.map((session) => {
        const status = markLookup.get(`${s.id}:${session.id}`);
        return status === "present" ? "Present" : status === "absent" ? "Absent" : "–";
      });
      const summary = summaries.get(s.id);
      return [
        s.name,
        s.email,
        ...cells,
        String(summary?.present ?? 0),
        String(summary?.absent ?? 0),
        summary?.rate === null || summary === undefined ? "–" : `${summary.rate}%`,
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedClassroom.name.replace(/[^a-z0-9]/gi, "_")}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const [navOpen, setNavOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  function handleSignOut() {
    try { localStorage.removeItem("klassroom_user"); } catch { /* ignore */ }
    router.push("/login");
  }

  return (
    <>
      {/* Nav */}
      <nav className="dash-nav">
        <Link href="/dashboard/admin" className="brand">Klass<span>room</span></Link>
        <div className="nav-links">
          <Link href="/dashboard/admin" className={`nav-link-dash${pathname === "/dashboard/admin" ? " active" : ""}`}>Overview</Link>
          <Link href="/dashboard/admin/assignments" className={`nav-link-dash${pathname === "/dashboard/admin/assignments" ? " active" : ""}`}>Assignments</Link>
          <Link href="/dashboard/admin/attendance" className={`nav-link-dash${pathname === "/dashboard/admin/attendance" ? " active" : ""}`}>Attendance</Link>
          <Link href="/dashboard/admin/announcements" className={`nav-link-dash${pathname === "/dashboard/admin/announcements" ? " active" : ""}`}>Announcements</Link>
          <Link href="/dashboard/admin/challenges" className={`nav-link-dash${pathname === "/dashboard/admin/challenges" ? " active" : ""}`}>Challenges</Link>
          <Link href="/dashboard/admin/support" className={`nav-link-dash${pathname === "/dashboard/admin/support" ? " active" : ""}`}>Support</Link>
          <Link href="/live" className={`nav-link-dash${pathname === "/live" ? " active" : ""}`}>Live board</Link>
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
          <Link href="/dashboard/admin" className={`nav-link-dash${pathname === "/dashboard/admin" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Overview</Link>
          <Link href="/dashboard/admin/assignments" className={`nav-link-dash${pathname === "/dashboard/admin/assignments" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Assignments</Link>
          <Link href="/dashboard/admin/attendance" className={`nav-link-dash${pathname === "/dashboard/admin/attendance" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Attendance</Link>
          <Link href="/dashboard/admin/announcements" className={`nav-link-dash${pathname === "/dashboard/admin/announcements" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Announcements</Link>
          <Link href="/dashboard/admin/challenges" className={`nav-link-dash${pathname === "/dashboard/admin/challenges" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Challenges</Link>
          <Link href="/dashboard/admin/support" className={`nav-link-dash${pathname === "/dashboard/admin/support" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Support</Link>
          <Link href="/live" className={`nav-link-dash${pathname === "/live" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Live board</Link>
          <button className="nav-signout" onClick={() => { setNavOpen(false); setShowSignOutModal(true); }}>Sign out</button>
        </div>
      )}

      <main className="page">
        <div className="page-header">
          <h1 className="greeting">Attendance</h1>
          <p className="greeting-sub">Take the roll each class day and track who keeps showing up</p>
        </div>

        {classrooms.length === 0 && !classroomsLoading && (
          <p className="text-[13px] text-ink-3 mb-4">
            <Link href="/dashboard/admin" className="underline">Create a classroom</Link> first before taking attendance.
          </p>
        )}

        {/* Class-wide numbers */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{sessionsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : classSessions.length}</div>
            <div className="stat-label">classes held</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{studentsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : roster.length}</div>
            <div className="stat-label">on the roster</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{sessionsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : averageRate === null ? "–" : `${averageRate}%`}</div>
            <div className="stat-label">average attendance</div>
          </div>
          <div className={`stat-card${atRisk > 0 ? " amber-card" : ""}`}>
            <div className={`stat-num${atRisk > 0 ? " amber" : ""}`}>{sessionsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : atRisk}</div>
            <div className="stat-label">missed 2+ in a row</div>
          </div>
        </div>

        {/* Take the roll */}
        <div className="section-label">Take attendance</div>
        <div className="card">
          <div className="card-body">
            {classrooms.length > 1 && (
              <div className="mb-[10px]">
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

            <div className="form-grid">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wide pl-0.5">Class date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  max={todayLocal()}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!selectedClassroomId}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wide pl-0.5">Topic (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Week 3 — React hooks"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={!selectedClassroomId}
                />
              </div>
            </div>

            {existingSession && (
              <p className="text-[13px] text-ink-3 mb-[10px]">
                Attendance for <span className="font-medium text-ink">{formatDate(date)}</span> was already recorded — saving again will correct it.
              </p>
            )}

            {roster.length === 0 ? (
              <p className="text-[13px] text-ink-3">
                {selectedClassroomId
                  ? "No students enrolled in this classroom yet."
                  : "Select a classroom to take attendance."}
              </p>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <p className="text-[13px] text-ink-3" style={{ margin: 0 }}>
                    <span className="font-medium text-ink">{presentCount} of {roster.length}</span> present — tap a student to flag them absent.
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setAll("present")}
                      style={{ padding: "4px 10px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-paper-2)", color: "var(--color-ink-2)", cursor: "pointer" }}
                    >
                      All present
                    </button>
                    <button
                      type="button"
                      onClick={() => setAll("absent")}
                      style={{ padding: "4px 10px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-paper-2)", color: "var(--color-ink-2)", cursor: "pointer" }}
                    >
                      All absent
                    </button>
                  </div>
                </div>

                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 8 }}>
                  {roster.map((s) => {
                    const present = marks[s.id] === "present";
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => toggle(s.id)}
                          aria-pressed={present}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: "10px 12px",
                            textAlign: "left",
                            borderRadius: 10,
                            cursor: "pointer",
                            transition: "background 0.15s, border-color 0.15s",
                            background: present ? "#f0fdf4" : "var(--color-red-light)",
                            border: `1px solid ${present ? "#bbf7d0" : "rgba(220,38,38,0.28)"}`,
                          }}
                        >
                          <span style={{ minWidth: 0 }}>
                            <span className="student-name" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                            <span className="student-email" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</span>
                          </span>
                          <span className={`status-pill ${present ? "pill-submitted" : ""}`} style={present ? undefined : { background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}>
                            {present ? "Present" : "Absent"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="form-actions">
                  {error && <span style={{ fontSize: 14, color: "#dc2626" }}>{error}</span>}
                  {saved && (
                    <span className="success-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Attendance saved
                    </span>
                  )}
                  <button className="create-btn" onClick={handleSave} disabled={saving || !date || !selectedClassroomId}>
                    {saving ? "Saving…" : existingSession ? "Update attendance" : "Save attendance"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Register */}
        <div className="section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Register</span>
          <button
            className="copy-btn"
            title="Export CSV"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600, padding: "4px 10px", border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-paper-2)", color: "var(--color-ink-2)", cursor: "pointer", opacity: roster.length === 0 || classSessions.length === 0 ? 0.4 : 1 }}
            disabled={roster.length === 0 || classSessions.length === 0}
            onClick={exportCSV}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto border border-border rounded-2xl mb-3">
          {studentsLoading || sessionsLoading ? (
            <div className="flex flex-col gap-3 p-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <span className="skeleton h-4 w-32 block" />
                  <span className="skeleton h-4 w-12 block" />
                  <span className="skeleton h-4 w-12 block" />
                  <span className="skeleton h-4 w-12 block" />
                </div>
              ))}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th className="center">Attendance</th>
                  <th className="center">Present</th>
                  <th className="center">Absent</th>
                  {classSessions.map((s) => (
                    <th key={s.id} className="center" style={{ maxWidth: 110 }}>
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={s.note || s.date}>{formatDate(s.date)}</span>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <button
                          title="Edit this roll call"
                          style={{ color: "var(--color-ink-3)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                          onClick={() => setDate(s.date)}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          title="Delete this roll call"
                          style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                          onClick={() => setDeleteModal({ id: s.id, date: s.date })}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.length === 0 ? (
                  <tr><td colSpan={4 + classSessions.length} className="text-center text-ink-3 py-8 text-[13px]">
                    {selectedClassroomId ? "No students enrolled in this classroom yet." : "Select a classroom to see the register."}
                  </td></tr>
                ) : classSessions.length === 0 ? (
                  <tr><td colSpan={4 + classSessions.length} className="text-center text-ink-3 py-8 text-[13px]">
                    No attendance taken yet. Take the roll above to start the register.
                  </td></tr>
                ) : roster.map((s) => {
                  const summary = summaries.get(s.id);
                  const rate = summary?.rate ?? null;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="student-name">{s.name}</div>
                        <div className="student-email">{s.email}</div>
                      </td>
                      <td className="center">
                        <span
                          className="streak-badge"
                          style={
                            rate === null
                              ? { background: "var(--color-paper-2)", color: "var(--color-ink-3)" }
                              : rate >= 75
                                ? { background: "#dcfce7", color: "#166534" }
                                : { background: "#fee2e2", color: "#991b1b" }
                          }
                        >
                          {rate === null ? "–" : `${rate}%`}
                        </span>
                      </td>
                      <td className="center" style={{ fontFamily: "var(--mono)", fontSize: 14 }}>{summary?.present ?? 0}</td>
                      <td className="center" style={{ fontFamily: "var(--mono)", fontSize: 14 }}>{summary?.absent ?? 0}</td>
                      {classSessions.map((session) => {
                        const status = markLookup.get(`${s.id}:${session.id}`);
                        return (
                          <td key={session.id} className="center">
                            {status === "present" ? (
                              <span className="dot-yes" title={`Present — ${formatDate(session.date)}`}>✓</span>
                            ) : status === "absent" ? (
                              <span className="dot-no" title={`Absent — ${formatDate(session.date)}`} style={{ background: "#fee2e2", color: "#991b1b" }}>✕</span>
                            ) : (
                              <span className="dot-no" title="Not on the roster for this class">–</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Sign-out modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]" onClick={(e) => { if (e.target === e.currentTarget) setShowSignOutModal(false); }}>
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

      {/* Delete roll call modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]" onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(null); }}>
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[420px] mx-4 p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Delete this roll call?</h2>
              <p className="text-[13px] text-ink-3">
                Attendance for <span className="font-medium text-ink">{formatDate(deleteModal.date)}</span> will be permanently removed and every student&apos;s rate recalculated. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setDeleteModal(null)} disabled={deleting}>Cancel</button>
              <button className="btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626", padding: "8px 18px", fontSize: 14 }} onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
