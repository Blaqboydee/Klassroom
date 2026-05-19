"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useAnnouncements } from "@/hooks/useAnnouncements";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

export default function StudentAnnouncements() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch { /* ignore */ }
  }, []);

  const { classrooms, loading: classroomsLoading } = useClassrooms({ memberId: currentUser?.id });
  const { announcements, loading: announcementsLoading } = useAnnouncements(
    { classroomIds: classrooms.map((c) => c.id) }
  );

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
          <h1 className="greeting">Announcements</h1>
          <p className="greeting-sub">Messages from your instructors</p>
        </div>

        {classroomsLoading || announcementsLoading ? (
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
          <p className="text-[13px] text-ink-3 mt-2">No announcements yet. Check back later.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => {
              const classroom = classrooms.find((c) => c.id === a.classroomId);
              return (
                <div key={a.id} className="card" style={{ padding: 0 }}>
                  <div className="card-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      {classroom && <span className="code-badge" style={{ fontSize: 14 }}>{classroom.name}</span>}
                      <span style={{ fontSize: 14, color: "var(--color-ink-3)", fontFamily: "var(--mono)" }}>
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 14, color: "var(--color-ink-3)", marginLeft: "auto" }}>
                        Posted by <strong style={{ color: "var(--color-ink-2)" }}>{a.authorName}</strong>
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.message}</p>
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
