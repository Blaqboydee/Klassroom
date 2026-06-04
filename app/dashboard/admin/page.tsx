"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useStudents } from "@/hooks/useStudents";
import { useAssignments } from "@/hooks/useAssignments";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useClassrooms } from "@/hooks/useClassrooms";
import { computeStreak } from "@/lib/streak";
import type { Submission } from "@/models/Submission";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) setCurrentUser(JSON.parse(raw) as SessionUser);
    } catch { /* ignore */ }
  }, []);

  const { students, loading: studentsLoading } = useStudents();
  const { classrooms, loading: classroomsLoading, creating: creatingClassroom, createClassroom, updateClassroom, deleteClassroom, addMember, removeMember, refetch: refetchClassrooms } = useClassrooms({ adminId: currentUser?.id });

  const classroomIds = classrooms.map((c) => c.id);
  const { assignments, loading: assignmentsLoading } = useAssignments({ classroomIds });
  const { submissions } = useSubmissions({ classroomIds });

  const allMemberIds = new Set(classrooms.flatMap((c) => c.memberIds));
  const totalStudents = studentsLoading ? null : students.filter((s) => allMemberIds.has(s.id)).length;
  // Count active per-class streaks across the admin's classrooms, derived with the
  // same computeStreak used server-side (single source of truth). A student in two
  // classes can contribute up to two active streaks.
  const activeStreaks = (studentsLoading || assignmentsLoading || classroomsLoading) ? null : (() => {
    const subsByStudent = new Map<string, Submission[]>();
    for (const sub of submissions) {
      const list = subsByStudent.get(sub.studentId) ?? [];
      list.push(sub);
      subsByStudent.set(sub.studentId, list);
    }
    let count = 0;
    for (const c of classrooms) {
      const classAssignments = assignments.filter((a) => a.classroomId === c.id);
      if (classAssignments.length === 0) continue;
      for (const memberId of c.memberIds) {
        if (computeStreak(classAssignments, subsByStudent.get(memberId) ?? []).streak > 0) count++;
      }
    }
    return count;
  })();

  const [classroomName, setClassroomName] = useState("");
  const [classroomCreated, setClassroomCreated] = useState<string | null>(null);
  const [showCreateClassroom, setShowCreateClassroom] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  type ModalState =
    | { type: "deleteClassroom"; id: string; label: string }
    | { type: "editClassroom"; id: string; currentName: string }
    | { type: "removeStudent"; userId: string; name: string }
    | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [modalInput, setModalInput] = useState("");
  const [modalWorking, setModalWorking] = useState(false);

  const [rosterClassroomId, setRosterClassroomId] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleCreateClassroom(e: React.FormEvent) {
    e.preventDefault();
    if (!classroomName.trim() || !currentUser?.id) return;
    const c = await createClassroom(classroomName.trim(), currentUser.id);
    if (c) {
      setClassroomName("");
      setClassroomCreated(c.code);
      setShowCreateClassroom(false);
      setTimeout(() => setClassroomCreated(null), 5000);
    }
  }

  async function handleModalConfirm() {
    if (!modal) return;
    setModalWorking(true);
    try {
      if (modal.type === "deleteClassroom") {
        await deleteClassroom(modal.id);
      } else if (modal.type === "editClassroom") {
        if (modalInput.trim()) await updateClassroom(modal.id, modalInput.trim());
      }
    } finally {
      setModalWorking(false);
      setModal(null);
    }
  }

  function handleCopyCode(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCopyLink(id: string, code: string) {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  }

  const rosterClassroom = classrooms.find((c) => c.id === rosterClassroomId);
  const rosterStudents = rosterClassroom
    ? students.filter((s) => rosterClassroom.memberIds.includes(s.id))
    : [];

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.trim() || !rosterClassroomId || !currentUser?.id) return;
    setAddError(null);
    setAddSuccess(null);
    setAddingMember(true);
    const result = await addMember(rosterClassroomId, currentUser.id, addEmail.trim());
    setAddingMember(false);
    if (result.error) {
      setAddError(result.error);
    } else {
      setAddEmail("");
      setAddSuccess(`${result.student?.name ?? "Student"} added to class.`);
      refetchClassrooms();
      setTimeout(() => setAddSuccess(null), 3000);
    }
  }

  async function handleRemoveMember(userId: string, name: string) {
    if (!rosterClassroomId || !currentUser?.id) return;
    setModal({ type: "removeStudent", userId, name });
  }

  async function confirmRemoveMember() {
    if (modal?.type !== "removeStudent" || !rosterClassroomId || !currentUser?.id) return;
    const { userId } = modal;
    setModal(null);
    setRemovingId(userId);
    await removeMember(rosterClassroomId, currentUser.id, userId);
    setRemovingId(null);
    refetchClassrooms();
  }

  function handleSignOut() {
    try { localStorage.removeItem("klassroom_user"); } catch { /* ignore */ }
    router.push("/login");
  }

  return (
    <>
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
          <h1 className="greeting">Welcome back, {currentUser?.name ?? "Instructor"}</h1>
          <p className="greeting-sub">Instructor Dashboard</p>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{classroomsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : classrooms.length}</div>
            <div className="stat-label">classrooms</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{studentsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : totalStudents ?? 0}</div>
            <div className="stat-label">students enrolled</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{assignmentsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : assignments.length}</div>
            <div className="stat-label">assignments</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{submissions.length}</div>
            <div className="stat-label">total submissions</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{activeStreaks === null ? <span className="skeleton w-8 h-7 inline-block" /> : activeStreaks}</div>
            <div className="stat-label">active streaks</div>
          </div>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Link href="/dashboard/admin/assignments" className="create-btn" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New assignment
          </Link>
          <Link href="/dashboard/admin/announcements" className="create-btn" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, background: "var(--color-paper-2)", color: "var(--color-ink-2)", borderColor: "var(--color-border)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Post announcement
          </Link>
        </div>

        <div className="section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Your classrooms</span>
          <button
            className="create-btn"
            style={{ fontSize: 14, padding: "4px 12px", marginBottom: 0 }}
            onClick={() => { setShowCreateClassroom((v) => !v); setClassroomName(""); }}
            disabled={!currentUser}
          >
            {showCreateClassroom ? "Cancel" : "+ New classroom"}
          </button>
        </div>

        {showCreateClassroom && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-body">
              <form onSubmit={handleCreateClassroom} className="flex gap-2">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Classroom name, e.g. CS101 Morning"
                  value={classroomName}
                  onChange={(e) => setClassroomName(e.target.value)}
                  disabled={creatingClassroom || !currentUser}
                  autoFocus
                />
                <button type="submit" className="create-btn whitespace-nowrap" disabled={creatingClassroom || !classroomName.trim() || !currentUser}>
                  {creatingClassroom ? "Creating..." : "Create"}
                </button>
              </form>
            </div>
          </div>
        )}

        {classroomCreated && (
          <p className="success-msg" style={{ marginBottom: 10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Classroom created! Share code <span className="font-mono tracking-widest">{classroomCreated}</span> with your students.
          </p>
        )}

        {classroomsLoading ? (
          <div className="classroom-grid mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="classroom-card">
                <span className="skeleton h-5 w-32 block mb-2" />
                <span className="skeleton h-6 w-16 block rounded-full" />
                <span className="skeleton h-3 w-24 block mt-2" />
              </div>
            ))}
          </div>
        ) : classrooms.length === 0 ? (
          <p className="text-[13px] text-ink-3 mt-2">No classrooms yet. Create one above to get started.</p>
        ) : (
          <div className="classroom-grid">
            {classrooms.map((c) => (
              <div key={c.id} className="classroom-card" style={{ minWidth: 0, overflow: "hidden" }}>
                <div className="classroom-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                  <span className="code-badge">{c.code}</span>
                  <button className="copy-btn" title="Copy join code" onClick={() => handleCopyCode(c.id, c.code)}>
                    {copiedId === c.id
                      ? <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.02em", color: "var(--color-teal)" }}>Copied!</span>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    }
                  </button>
                  <button className="copy-btn" title="Copy invite link" onClick={() => handleCopyLink(c.id, c.code)}>
                    {copiedLinkId === c.id
                      ? <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.02em", color: "var(--color-teal)" }}>Link copied!</span>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    }
                  </button>
                  <button className="copy-btn" title="Rename classroom" onClick={() => { setModalInput(c.name); setModal({ type: "editClassroom", id: c.id, currentName: c.name }); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="copy-btn" title="Delete classroom" style={{ color: "#dc2626" }} onClick={() => setModal({ type: "deleteClassroom", id: c.id, label: c.name })}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                  <button
                    className="copy-btn"
                    title="Manage roster"
                    style={{ color: rosterClassroomId === c.id ? "var(--color-teal)" : undefined }}
                    onClick={() => { setRosterClassroomId((id) => id === c.id ? null : c.id); setAddEmail(""); setAddError(null); setAddSuccess(null); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </button>
                </div>
                <div className="classroom-meta" style={{ marginTop: "8px" }}>{c.memberIds.length} student{c.memberIds.length !== 1 ? "s" : ""} enrolled</div>
              </div>
            ))}
          </div>
        )}

        {/* Roster panel — shown when a classroom card's roster button is clicked */}
        {rosterClassroomId && rosterClassroom && (
          <div style={{ marginTop: 24 }}>
            <div className="section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Roster — {rosterClassroom.name}</span>
              <button
                className="create-btn"
                style={{ fontSize: 14, padding: "4px 12px", marginBottom: 0, background: "var(--color-paper-2)", color: "var(--color-ink-2)", borderColor: "var(--color-border)" }}
                onClick={() => { setRosterClassroomId(null); setAddEmail(""); setAddError(null); setAddSuccess(null); }}
              >
                Close
              </button>
            </div>
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleAddMember} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  <input
                    type="email"
                    className="form-input"
                    style={{ flex: 1, minWidth: 220 }}
                    placeholder="Student email address"
                    value={addEmail}
                    onChange={(e) => { setAddEmail(e.target.value); setAddError(null); }}
                    disabled={addingMember}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={addingMember || !addEmail.trim()}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {addingMember ? "Adding\u2026" : "Add student"}
                  </button>
                </form>
                {addError && <p style={{ fontSize: 14, color: "#dc2626", marginTop: -10, marginBottom: 10 }}>{addError}</p>}
                {addSuccess && <p style={{ fontSize: 14, color: "var(--color-teal)", fontWeight: 600, marginTop: -10, marginBottom: 10 }}>{addSuccess}</p>}
                {studentsLoading ? (
                  <div className="flex flex-col gap-2">
                    {[0,1,2].map((i) => <span key={i} className="skeleton h-9 w-full block rounded-lg" />)}
                  </div>
                ) : rosterStudents.length === 0 ? (
                  <p style={{ fontSize: 14, color: "var(--color-ink-3)" }}>No students enrolled yet. Add one above or share the join code.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {rosterStudents.map((s) => (
                      <li key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 12px", background: "var(--color-paper-2)", border: "1px solid var(--color-border)", borderRadius: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>{s.name}</div>
                          <div style={{ fontSize: 14, color: "var(--color-ink-3)", fontFamily: "var(--font-mono)" }}>{s.email}</div>
                        </div>
                        <button
                          title="Remove from this classroom"
                          disabled={removingId === s.id}
                          onClick={() => handleRemoveMember(s.id, s.name)}
                          style={{ flexShrink: 0, padding: "5px 12px", fontSize: 14, fontWeight: 600, color: "#dc2626", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, cursor: "pointer", opacity: removingId === s.id ? 0.5 : 1 }}
                        >
                          {removingId === s.id ? "Removing\u2026" : "Remove"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[420px] mx-4 p-6 flex flex-col gap-5">
            {modal.type === "deleteClassroom" && (
              <>
                <div>
                  <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Delete classroom?</h2>
                  <p className="text-[13px] text-ink-3"><span className="font-medium text-ink">&ldquo;{modal.label}&rdquo;</span> will be permanently deleted. This cannot be undone.</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setModal(null)} disabled={modalWorking}>Cancel</button>
                  <button className="btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626", padding: "8px 18px", fontSize: 14 }} onClick={handleModalConfirm} disabled={modalWorking}>{modalWorking ? "Deleting..." : "Delete"}</button>
                </div>
              </>
            )}
            {modal.type === "editClassroom" && (
              <>
                <h2 className="font-serif text-[20px] text-ink leading-tight">Rename classroom</h2>
                <input type="text" className="form-input" value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder="Classroom name" autoFocus />
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setModal(null)} disabled={modalWorking}>Cancel</button>
                  <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 14 }} onClick={handleModalConfirm} disabled={modalWorking || !modalInput.trim()}>{modalWorking ? "Saving..." : "Save"}</button>
                </div>
              </>
            )}
            {modal.type === "removeStudent" && (
              <>
                <div>
                  <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Remove student?</h2>
                  <p className="text-[13px] text-ink-3"><span className="font-medium text-ink">{modal.name}</span> will lose access to this classroom&apos;s assignments. They will remain in any other classrooms they belong to.</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setModal(null)}>Cancel</button>
                  <button className="btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626", padding: "8px 18px", fontSize: 14 }} onClick={confirmRemoveMember}>Remove</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
