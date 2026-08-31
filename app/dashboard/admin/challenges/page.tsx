"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useClassrooms } from "@/hooks/useClassrooms";
import type { Challenge, ChallengeSubmission } from "@/models/Challenge";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

export default function AdminChallenges() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) {
        const u = JSON.parse(raw) as SessionUser;
        if (u.role !== "admin") { router.replace("/dashboard/student"); return; }
        setCurrentUser(u);
      } else {
        router.replace("/login");
      }
    } catch { /* ignore */ }
  }, [router]);

  const { classrooms, loading: classroomsLoading } = useClassrooms({ adminId: currentUser?.id });

  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroomId) setSelectedClassroomId(classrooms[0].id);
  }, [classrooms, selectedClassroomId]);

  // ── Challenge list ──────────────────────────────────────────────────────────
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, ChallengeSubmission[]>>({});

  const fetchChallenges = useCallback(async (classroomId: string) => {
    setChallengesLoading(true);
    try {
      const res = await fetch(`/api/challenges?classroomId=${encodeURIComponent(classroomId)}`, { cache: "no-store" });
      if (res.ok) {
        const { challenges: data } = await res.json() as { challenges: Challenge[] };
        setChallenges(data);
      }
    } finally {
      setChallengesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassroomId) fetchChallenges(selectedClassroomId);
  }, [selectedClassroomId, fetchChallenges]);

  async function fetchSubmissions(challengeId: string) {
    if (submissions[challengeId]) return;
    const res = await fetch(`/api/challenges/${encodeURIComponent(challengeId)}`, { cache: "no-store" });
    if (res.ok) {
      const { submissions: subs } = await res.json() as { submissions: ChallengeSubmission[] };
      setSubmissions((prev) => ({ ...prev, [challengeId]: subs }));
    }
  }

  // ── Create form ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [windowMinutes, setWindowMinutes] = useState(15);
  const [prize, setPrize] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !selectedClassroomId || !currentUser) return;
    setPosting(true);
    setPostError("");
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          adminId: currentUser.id,
          title: title.trim(),
          description: description.trim(),
          windowMinutes,
          prize: prize.trim(),
        }),
      });
      if (!res.ok) {
        const { error } = await res.json() as { error?: string };
        throw new Error(error ?? "Failed to post challenge");
      }
      setTitle(""); setDescription(""); setPrize(""); setWindowMinutes(15);
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
      fetchChallenges(selectedClassroomId);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  }

  // ── Close challenge ─────────────────────────────────────────────────────────
  async function handleClose(challengeId: string) {
    await fetch(`/api/challenges/${challengeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    fetchChallenges(selectedClassroomId);
  }

  // ── Declare winner ──────────────────────────────────────────────────────────
  const [declaringWinner, setDeclaringWinner] = useState<string | null>(null);

  async function handleDeclareWinner(challengeId: string, sub: ChallengeSubmission) {
    setDeclaringWinner(challengeId);
    try {
      await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: sub.studentId, winnerName: sub.studentName }),
      });
      // Also close the challenge
      await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      fetchChallenges(selectedClassroomId);
      setSubmissions((prev) => { const n = { ...prev }; delete n[challengeId]; return n; });
    } finally {
      setDeclaringWinner(null);
    }
  }

  function handleSignOut() {
    try { localStorage.removeItem("klassroom_user"); } catch { /* ignore */ }
    router.push("/login");
  }

  const activeChallenge = challenges.find((c) => c.status === "active") ?? null;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
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
        <button className="nav-burger" aria-label="Menu" onClick={() => setNavOpen((o) => !o)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {navOpen ? <><path d="M18 6 6 18"/><path d="M6 6l12 12"/></> : <><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></>}
          </svg>
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
          <h1 className="greeting">Challenges</h1>
          <p className="greeting-sub">Post a timed challenge — fastest/best solution wins a prize</p>
        </div>

        {/* Classroom selector */}
        {classrooms.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <select
              className="form-input"
              style={{ maxWidth: 320 }}
              value={selectedClassroomId}
              onChange={(e) => { setSelectedClassroomId(e.target.value); setChallenges([]); }}
            >
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Active challenge banner */}
        {activeChallenge && (
          <div style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.3)", borderRadius: 14, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--color-teal)", boxShadow: "0 0 0 3px rgba(13,148,136,0.25)", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-teal)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Active</span>
              </div>
              <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: "var(--color-ink)" }}>{activeChallenge.title}</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--color-ink)", opacity: 0.6 }}>
                {activeChallenge.windowMinutes} min window
                {activeChallenge.prize ? ` · 🏆 ${activeChallenge.prize}` : ""}
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ background: "#dc2626", fontSize: 14 }}
              onClick={() => handleClose(activeChallenge.id)}
            >
              Close challenge
            </button>
          </div>
        )}

        {/* Post new challenge */}
        {!activeChallenge && (
          <div className="card" style={{ marginBottom: 32, padding: "24px 24px 20px" }}>
            <div className="section-label" style={{ marginTop: 0 }}>Post a challenge</div>
            <form onSubmit={handlePost}>
              <div className="form-grid">
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--color-ink)", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Title *</label>
                  <input className="form-input" placeholder="e.g. Build a counter in 15 minutes" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--color-ink)", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Time window (minutes) *</label>
                  <input className="form-input" type="number" min={1} max={120} value={windowMinutes} onChange={(e) => setWindowMinutes(Number(e.target.value))} required />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--color-ink)", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description (optional)</label>
                <textarea className="form-textarea" placeholder="Describe the challenge requirements…" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "var(--color-ink)", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prize (optional)</label>
                <input className="form-input" placeholder="e.g. Extra credit, $10 gift card…" value={prize} onChange={(e) => setPrize(e.target.value)} />
              </div>
              {postError && <p style={{ marginTop: 10, fontSize: 14, color: "#dc2626" }}>{postError}</p>}
              {postSuccess && <p style={{ marginTop: 10, fontSize: 14, color: "var(--color-teal)", fontWeight: 600 }}>Challenge posted! Students have been notified.</p>}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={posting || !title.trim() || !selectedClassroomId}>
                  {posting ? "Posting…" : "⚡ Launch challenge"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Past challenges */}
        <div className="section-label">Challenge history</div>
        {challengesLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
          </div>
        ) : challenges.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "36px 24px", color: "var(--color-ink)", opacity: 0.5, fontSize: 14 }}>
            No challenges yet. Post one above!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {challenges.map((ch) => (
              <div key={ch.id} className="card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>{ch.title}</span>
                      <span style={{
                        fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono)",
                        padding: "2px 8px", borderRadius: 99, border: "1px solid",
                        color: ch.status === "active" ? "var(--color-teal)" : "var(--color-ink)",
                        borderColor: ch.status === "active" ? "var(--color-teal)" : "var(--color-border)",
                        opacity: ch.status === "active" ? 1 : 0.5,
                      }}>
                        {ch.status}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 14, color: "var(--color-ink)", opacity: 0.5, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>⏱ {ch.windowMinutes} min</span>
                      {ch.prize && <span>🏆 {ch.prize}</span>}
                      {ch.winnerId && <span style={{ color: "var(--color-teal)", opacity: 1, fontWeight: 600 }}>Winner: {ch.winnerName}</span>}
                    </div>
                  </div>
                  <button
                    style={{ fontSize: 14, fontWeight: 600, color: "var(--color-teal)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "var(--font-sans)" }}
                    onClick={() => {
                      const isOpen = expandedId === ch.id;
                      setExpandedId(isOpen ? null : ch.id);
                      if (!isOpen) fetchSubmissions(ch.id);
                    }}
                  >
                    {expandedId === ch.id ? "Hide submissions" : "View submissions"}
                  </button>
                </div>

                {/* Submissions list */}
                {expandedId === ch.id && (
                  <div style={{ marginTop: 14, borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
                    {!submissions[ch.id] ? (
                      <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
                    ) : submissions[ch.id].length === 0 ? (
                      <p style={{ fontSize: 14, color: "var(--color-ink)", opacity: 0.5 }}>No submissions yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {submissions[ch.id].map((sub, i) => (
                          <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", background: "var(--color-paper-2)", borderRadius: 10, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--color-teal)" : "var(--color-ink)", opacity: i === 0 ? 1 : 0.4, minWidth: 20 }}>#{i + 1}</span>
                              <div>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>{sub.studentName}</p>
                                <a href={sub.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "var(--color-teal)", textDecoration: "none", fontFamily: "var(--font-mono)" }}>{sub.link.length > 50 ? sub.link.slice(0, 50) + "…" : sub.link}</a>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14, color: "var(--color-ink)", opacity: 0.4 }}>
                                {new Date(sub.submittedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </span>
                              {!ch.winnerId && (
                                <button
                                  className="btn-primary"
                                  style={{ fontSize: 14, padding: "4px 12px" }}
                                  disabled={declaringWinner === ch.id}
                                  onClick={() => handleDeclareWinner(ch.id, sub)}
                                >
                                  {declaringWinner === ch.id ? "…" : "🏆 Declare winner"}
                                </button>
                              )}
                              {ch.winnerId === sub.studentId && (
                                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-teal)", fontFamily: "var(--font-mono)" }}>WINNER 🏆</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sign out modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]" onClick={(e) => { if (e.target === e.currentTarget) setShowSignOutModal(false); }}>
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[360px] mx-4 p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Sign out?</h2>
              <p className="text-[13px] text-ink-3">You&apos;ll need to sign in again to access your dashboard.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button className="copy-btn" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 14 }} onClick={() => setShowSignOutModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ fontSize: 14 }} onClick={handleSignOut}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
