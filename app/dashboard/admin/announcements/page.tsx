"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useAnnouncements } from "@/hooks/useAnnouncements";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

export default function AdminAnnouncements() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch { /* ignore */ }
  }, []);

  const { classrooms, loading: classroomsLoading } = useClassrooms({ adminId: currentUser?.id });
  const { announcements, loading: announcementsLoading, posting, post: postAnnouncement, remove: removeAnnouncement } = useAnnouncements(
    { classroomIds: classrooms.map((c) => c.id) }
  );

  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const [message, setMessage] = useState("");
  const [posted, setPosted] = useState(false);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !selectedClassroomId || !currentUser) return;
    const result = await postAnnouncement({
      classroomId: selectedClassroomId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      message: message.trim(),
    });
    if (result) {
      setMessage("");
      setPosted(true);
      setTimeout(() => setPosted(false), 2500);
    }
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
          <Link href="/dashboard/admin/announcements" className={`nav-link-dash${pathname === "/dashboard/admin/announcements" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Announcements</Link>
          <Link href="/dashboard/admin/challenges" className={`nav-link-dash${pathname === "/dashboard/admin/challenges" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Challenges</Link>
          <Link href="/dashboard/admin/support" className={`nav-link-dash${pathname === "/dashboard/admin/support" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Support</Link>
          <Link href="/live" className={`nav-link-dash${pathname === "/live" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Live board</Link>
          <button className="nav-signout" onClick={() => { setNavOpen(false); setShowSignOutModal(true); }}>Sign out</button>
        </div>
      )}

      <main className="page">
        <div className="page-header">
          <h1 className="greeting">Announcements</h1>
          <p className="greeting-sub">Post messages to your classrooms</p>
        </div>

        {/* Compose */}
        <div className="section-label">New announcement</div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            {classroomsLoading ? (
              <span className="skeleton h-9 w-full block rounded-lg mb-3" />
            ) : classrooms.length === 0 ? (
              <p className="text-[13px] text-ink-3 mb-2">
                <Link href="/dashboard/admin" className="underline">Create a classroom</Link> first.
              </p>
            ) : (
              <form onSubmit={handlePost}>
                {classrooms.length > 1 && (
                  <div className="mb-[10px]">
                    <select className="form-input" value={selectedClassroomId} onChange={(e) => setSelectedClassroomId(e.target.value)}>
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                )}
                <textarea
                  className="form-textarea"
                  placeholder="Write an announcement for your students…"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={posting || !currentUser}
                />
                <div className="form-actions">
                  {posted && (
                    <span className="success-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Announcement posted
                    </span>
                  )}
                  <button className="create-btn" type="submit" disabled={posting || !message.trim() || !currentUser}>
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Feed */}
        <div className="section-label">Posted announcements</div>
        {announcementsLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card" style={{ padding: 0 }}>
                <div className="card-body">
                  <span className="skeleton h-3 w-32 block mb-2" />
                  <span className="skeleton h-4 w-full block" />
                  <span className="skeleton h-4 w-3/4 block mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-[13px] text-ink-3 mt-2">No announcements yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => {
              const classroom = classrooms.find((c) => c.id === a.classroomId);
              return (
                <div key={a.id} className="card" style={{ padding: 0 }}>
                  <div className="card-body" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                        {classroom && <span className="code-badge" style={{ fontSize: 14 }}>{classroom.name}</span>}
                        <span style={{ fontSize: 14, color: "var(--color-ink-3)", fontFamily: "var(--mono)" }}>
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.message}</p>
                    </div>
                    <button
                      className="copy-btn"
                      title="Delete announcement"
                      style={{ color: "#dc2626", flexShrink: 0 }}
                      onClick={() => removeAnnouncement(a.id)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
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
