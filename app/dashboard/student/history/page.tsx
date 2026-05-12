"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useAssignments } from "@/hooks/useAssignments";
import { useSubmissions } from "@/hooks/useSubmissions";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

type Filter = "all" | "on-time" | "late" | "graded";

export default function StudentHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch { /* ignore */ }
  }, []);

  const studentId = currentUser?.id ?? "";

  const { classrooms, loading: classroomsLoading } = useClassrooms({ memberId: studentId || undefined });
  const classroomIds = classrooms.map((c) => c.id);

  const { assignments, loading: assignmentsLoading } = useAssignments(
    !classroomsLoading && classroomIds.length > 0 ? { classroomIds } : { classroomIds: [] }
  );
  const { submissions, loading: submissionsLoading } = useSubmissions({ studentId: studentId || undefined });

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Build enriched submission list
  const enriched = useMemo(() => {
    return submissions
      .map((sub) => {
        const assignment = assignments.find((a) => a.id === sub.assignmentId);
        const classroom = classrooms.find((c) => c.id === assignment?.classroomId);
        return {
          ...sub,
          assignmentTitle: assignment?.title ?? "Unknown assignment",
          assignmentDueDate: assignment?.dueDate ?? "",
          classroomName: classroom?.name ?? "",
        };
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [submissions, assignments, classrooms]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (filter === "on-time") list = list.filter((s) => !s.isLate);
    else if (filter === "late") list = list.filter((s) => s.isLate);
    else if (filter === "graded") list = list.filter((s) => !!s.grade);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.assignmentTitle.toLowerCase().includes(q) ||
          s.classroomName.toLowerCase().includes(q) ||
          s.grade?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enriched, filter, search]);

  const totalSubmissions = enriched.length;
  const onTimeCount = enriched.filter((s) => !s.isLate).length;
  const lateCount = enriched.filter((s) => s.isLate).length;
  const gradedCount = enriched.filter((s) => !!s.grade).length;

  const loading = classroomsLoading || assignmentsLoading || submissionsLoading;

  function handleSignOut() {
    try { localStorage.removeItem("klassroom_user"); } catch { /* ignore */ }
    router.push("/login");
  }

  return (
    <>
      {/* Nav */}
      <nav className="dash-nav">
        <Link href="/dashboard/student" className="brand">Klass<span>room</span></Link>
        <div className="nav-links">
          <Link href="/dashboard/student" className={`nav-link-dash${pathname === "/dashboard/student" ? " active" : ""}`}>My assignments</Link>
          <Link href="/dashboard/student/announcements" className={`nav-link-dash${pathname === "/dashboard/student/announcements" ? " active" : ""}`}>Announcements</Link>
          <Link href="/dashboard/student/history" className={`nav-link-dash${pathname === "/dashboard/student/history" ? " active" : ""}`}>History</Link>
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
          <button className="nav-signout" onClick={() => { setNavOpen(false); setShowSignOutModal(true); }}>Sign out</button>
        </div>
      )}

      <main className="page">
        <div className="page-header">
          <h1 className="greeting">Submission history</h1>
          <p className="greeting-sub">Every assignment you&apos;ve submitted, across all classrooms</p>
        </div>

        {/* Stats row */}
        <div className="stats-row" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-num">{loading ? <span className="skeleton w-8 h-7 inline-block" /> : totalSubmissions}</div>
            <div className="stat-label">total submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: "var(--color-teal)" }}>{loading ? <span className="skeleton w-8 h-7 inline-block" /> : onTimeCount}</div>
            <div className="stat-label">on time</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: "#dc2626" }}>{loading ? <span className="skeleton w-8 h-7 inline-block" /> : lateCount}</div>
            <div className="stat-label">late</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{loading ? <span className="skeleton w-8 h-7 inline-block" /> : gradedCount}</div>
            <div className="stat-label">graded</div>
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-ink-3)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Search by assignment or classroom…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(["all", "on-time", "late", "graded"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                  background: filter === f ? "var(--color-teal)" : "var(--color-paper-2)",
                  color: filter === f ? "#fff" : "var(--color-ink-2)",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {f === "all" ? "All" : f === "on-time" ? "On time" : f === "late" ? "Late" : "Graded"}
              </button>
            ))}
          </div>
        </div>

        {/* History list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: 0 }}>
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                    <span className="skeleton h-4 w-48 block" />
                    <span className="skeleton h-5 w-20 block rounded-full" />
                  </div>
                  <span className="skeleton h-3 w-32 block mb-2" />
                  <span className="skeleton h-3 w-full block" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-ink-3)", fontSize: 14 }}>
            {enriched.length === 0
              ? "No submissions yet. Submit an assignment to see your history here."
              : "No submissions match your filter."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((sub) => {
              const isGithub = /^https?:\/\/(www\.)?github\.com\//i.test(sub.link);
              const stackblitzUrl = isGithub
                ? sub.link.replace(/^https?:\/\/(www\.)?github\.com\//i, "https://stackblitz.com/github/")
                : null;
              return (
                <div key={sub.id} className="card" style={{ padding: 0 }}>
                  <div className="card-body">
                    {/* Top row: title + pill */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-ink)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sub.assignmentTitle}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {sub.classroomName && (
                            <span className="code-badge" style={{ fontSize: 10 }}>{sub.classroomName}</span>
                          )}
                          {sub.assignmentDueDate && (
                            <span style={{ fontSize: 11, color: "var(--color-ink-3)", fontFamily: "var(--mono)" }}>
                              Due {sub.assignmentDueDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`status-pill ${sub.isLate ? "pill-late" : "pill-submitted"}`}
                        style={{ flexShrink: 0 }}
                      >
                        {sub.isLate ? "Late" : "On time"}
                      </span>
                    </div>

                    {/* Submitted at */}
                    <div style={{ fontSize: 11, color: "var(--color-ink-3)", fontFamily: "var(--mono)", marginBottom: 8 }}>
                      Submitted {new Date(sub.submittedAt).toLocaleString()}
                    </div>

                    {/* Link row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--color-paper-2)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "6px 10px", marginBottom: sub.grade || sub.feedback ? 10 : 0 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--color-ink-3)" }}>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      <span style={{ flex: 1, fontSize: 12, color: "var(--color-ink-2)", fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sub.link}
                      </span>
                      <a
                        href={sub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open link"
                        className="copy-btn"
                        style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, background: "var(--color-teal-light, rgba(20,184,166,0.1))", color: "var(--color-teal)" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                      {stackblitzUrl && (
                        <a
                          href={stackblitzUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in StackBlitz"
                          className="copy-btn"
                          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, background: "#1a1a2e", color: "#fff" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        </a>
                      )}
                    </div>

                    {/* Grade + feedback */}
                    {(sub.grade || sub.feedback) && (
                      <div style={{ background: "var(--color-paper-2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                        {sub.grade && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Grade</span>
                            <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13, color: "var(--color-teal)" }}>{sub.grade}</span>
                          </div>
                        )}
                        {sub.feedback && (
                          <p style={{ fontSize: 13, color: "var(--color-ink-2)", margin: 0, lineHeight: 1.5 }}>{sub.feedback}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
    </>
  );
}
