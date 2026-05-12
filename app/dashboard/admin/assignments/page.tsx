"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useStudents } from "@/hooks/useStudents";
import { useAssignments } from "@/hooks/useAssignments";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useClassrooms } from "@/hooks/useClassrooms";

interface SessionUser { id: string; name: string; role: "student" | "admin"; }

export default function AdminAssignments() {
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
  const { classrooms, loading: classroomsLoading } = useClassrooms({ adminId: currentUser?.id });

  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const { assignments, loading: assignmentsLoading, createAssignment, updateAssignment, deleteAssignment, creating } = useAssignments(
    selectedClassroomId ? { classroomId: selectedClassroomId } : { classroomIds: [] }
  );
  const { submissions, refetch: refetchSubmissions, gradeSubmission } = useSubmissions(
    { classroomIds: classrooms.map((c) => c.id) }
  );

  // Poll submissions every 10 seconds
  const refetchRef = useRef(refetchSubmissions);
  useEffect(() => { refetchRef.current = refetchSubmissions; }, [refetchSubmissions]);
  useEffect(() => {
    const interval = setInterval(() => refetchRef.current(), 10_000);
    return () => clearInterval(interval);
  }, []);

  const submissionMap = new Map(submissions.map((s) => [`${s.studentId}:${s.assignmentId}`, s]));

  const selectedClassroom = classrooms.find((c) => c.id === selectedClassroomId);
  const enrolledStudents = selectedClassroom
    ? students.filter((s) => selectedClassroom.memberIds.includes(s.id))
    : [];

  // Create assignment form
  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });
  const [created, setCreated] = useState(false);

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

  // Edit/delete assignment modal
  type ModalState =
    | { type: "deleteAssignment"; id: string; label: string }
    | { type: "editAssignment"; id: string; currentTitle: string; currentDescription: string; currentDueDate: string }
    | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [modalInput, setModalInput] = useState("");
  const [modalDateInput, setModalDateInput] = useState("");
  const [modalDescInput, setModalDescInput] = useState("");
  const [modalWorking, setModalWorking] = useState(false);

  async function handleModalConfirm() {
    if (!modal) return;
    setModalWorking(true);
    try {
      if (modal.type === "deleteAssignment") {
        await deleteAssignment(modal.id);
      } else if (modal.type === "editAssignment") {
        await updateAssignment(modal.id, {
          title: modalInput.trim() || undefined,
          description: modalDescInput,
          dueDate: modalDateInput || undefined,
        });
      }
    } finally {
      setModalWorking(false);
      setModal(null);
    }
  }

  function openEditAssignment(id: string, title: string, description: string, dueDate: string) {
    setModalInput(title);
    setModalDescInput(description);
    setModalDateInput(dueDate);
    setModal({ type: "editAssignment", id, currentTitle: title, currentDescription: description, currentDueDate: dueDate });
  }
  function openDeleteAssignment(id: string, title: string) {
    setModal({ type: "deleteAssignment", id, label: title });
  }

  // Grade modal
  type GradeModal = { submissionId: string; studentName: string; assignmentTitle: string; link: string; currentGrade: string; currentFeedback: string } | null;
  const [gradeModal, setGradeModal] = useState<GradeModal>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [gradeSaving, setGradeSaving] = useState(false);

  function openGradeModal(sub: { id: string; studentId: string; assignmentId: string; link: string; grade?: string; feedback?: string }) {
    const student = enrolledStudents.find((s) => s.id === sub.studentId);
    const assignment = assignments.find((a) => a.id === sub.assignmentId);
    setGradeInput(sub.grade ?? "");
    setFeedbackInput(sub.feedback ?? "");
    setGradeModal({
      submissionId: sub.id,
      studentName: student?.name ?? "Student",
      assignmentTitle: assignment?.title ?? "Assignment",
      link: sub.link,
      currentGrade: sub.grade ?? "",
      currentFeedback: sub.feedback ?? "",
    });
  }

  async function handleSaveGrade() {
    if (!gradeModal) return;
    setGradeSaving(true);
    await gradeSubmission(gradeModal.submissionId, gradeInput.trim(), feedbackInput.trim());
    setGradeSaving(false);
    setGradeModal(null);
  }

  function exportCSV() {
    if (!selectedClassroom || assignments.length === 0) return;
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const headers = ["Student", "Email", ...assignments.map((a) => a.title), "Total Submitted", "Total Graded"];
    const rows = enrolledStudents.map((s) => {
      const cells = assignments.map((a) => {
        const sub = submissionMap.get(`${s.id}:${a.id}`);
        if (!sub) return "–";
        const parts = [sub.isLate ? "Late" : "Submitted"];
        if (sub.grade) parts.push(`Grade: ${sub.grade}`);
        if (sub.feedback) parts.push(`Feedback: ${sub.feedback}`);
        return parts.join(" | ");
      });
      const totalSub = assignments.filter((a) => submissionMap.has(`${s.id}:${a.id}`)).length;
      const totalGraded = assignments.filter((a) => {
        const sub = submissionMap.get(`${s.id}:${a.id}`);
        return sub?.grade;
      }).length;
      return [s.name, s.email, ...cells, String(totalSub), String(totalGraded)];
    });
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedClassroom.name.replace(/[^a-z0-9]/gi, "_")}_gradebook.csv`;
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
          <Link href="/dashboard/admin/announcements" className={`nav-link-dash${pathname === "/dashboard/admin/announcements" ? " active" : ""}`}>Announcements</Link>
          <Link href="/dashboard/admin/challenges" className={`nav-link-dash${pathname === "/dashboard/admin/challenges" ? " active" : ""}`}>Challenges</Link>
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
          <Link href="/live" className={`nav-link-dash${pathname === "/live" ? " active" : ""}`} onClick={() => setNavOpen(false)}>Live board</Link>
          <button className="nav-signout" onClick={() => { setNavOpen(false); setShowSignOutModal(true); }}>Sign out</button>
        </div>
      )}

      <main className="page">
        <div className="page-header">
          <h1 className="greeting">Assignments</h1>
          <p className="greeting-sub">Create assignments and review submissions</p>
        </div>

        {/* Create Assignment */}
        <div className="section-label">Create assignment</div>
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
            {classrooms.length === 0 && !classroomsLoading && (
              <p className="text-[13px] text-ink-3 mb-[10px]">
                <Link href="/dashboard/admin" className="underline">Create a classroom</Link> first before adding assignments.
              </p>
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
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wide pl-0.5">Due date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    disabled={creating || !selectedClassroomId}
                  />
                </div>
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
        <div className="section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Submission overview</span>
          <button
            className="copy-btn"
            title="Export CSV"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 10px", border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-paper-2)", color: "var(--color-ink-2)", cursor: "pointer", opacity: enrolledStudents.length === 0 || assignments.length === 0 ? 0.4 : 1 }}
            disabled={enrolledStudents.length === 0 || assignments.length === 0}
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
          {studentsLoading || assignmentsLoading ? (
            <div className="flex flex-col gap-3 p-5">
              {[0,1,2,3].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <span className="skeleton h-4 w-32 block" />
                  <span className="skeleton h-4 w-12 block" />
                  <span className="skeleton h-4 w-20 block" />
                  <span className="skeleton h-4 w-10 block" />
                </div>
              ))}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th className="center">Streak</th>
                  <th className="center">Last active</th>
                  {assignments.map((a) => (
                    <th key={a.id} className="center">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{a.title}</span>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <button
                          title="Edit assignment"
                          style={{ color: "var(--color-ink-3)", background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          onClick={() => openEditAssignment(a.id, a.title, a.description ?? "", a.dueDate)}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          title="Delete assignment"
                          style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          onClick={() => openDeleteAssignment(a.id, a.title)}
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
                {enrolledStudents.length === 0 ? (
                  <tr><td colSpan={3 + assignments.length} className="text-center text-ink-3 py-8 text-[13px]">{selectedClassroomId ? "No students enrolled in this classroom yet." : "Select a classroom to see submissions."}</td></tr>
                ) : enrolledStudents.map((s) => (
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
                    {assignments.map((a) => {
                      const submission = submissionMap.get(`${s.id}:${a.id}`);
                      const link = submission?.link;
                      const isGithub = link ? /^https?:\/\/(www\.)?github\.com\//i.test(link) : false;
                      const stackblitzUrl = isGithub ? link!.replace(/^https?:\/\/(www\.)?github\.com\//i, "https://stackblitz.com/github/") : null;
                      return (
                        <td key={a.id} className="center">
                          {link && submission ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="inline-flex items-center gap-1">
                                <a href={link} target="_blank" rel="noopener noreferrer" title={link} className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-teal-light text-teal hover:bg-teal hover:text-white transition-colors">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
                                </a>
                                {stackblitzUrl && (
                                  <a href={stackblitzUrl} target="_blank" rel="noopener noreferrer" title="Open in StackBlitz" className="inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors" style={{ background: "#1a1a2e", color: "#fff" }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                  </a>
                                )}
                                <button
                                  title="Grade submission"
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors"
                                  style={{ background: submission.grade ? "var(--color-teal)" : "var(--color-paper-2)", color: submission.grade ? "#fff" : "var(--color-ink-3)", border: "1px solid var(--color-border)" }}
                                  onClick={() => openGradeModal(submission)}
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                              </div>
                              {submission.grade && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-teal)", fontFamily: "var(--mono)", letterSpacing: "0.04em" }}>{submission.grade}</span>
                              )}
                            </div>
                          ) : (
                            <span className="dot-no">–</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
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

      {/* Edit/delete assignment modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[420px] mx-4 p-6 flex flex-col gap-5">
            {modal.type === "deleteAssignment" && (
              <>
                <div>
                  <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Delete assignment?</h2>
                  <p className="text-[13px] text-ink-3"><span className="font-medium text-ink">&ldquo;{modal.label}&rdquo;</span> will be permanently deleted. This cannot be undone.</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setModal(null)} disabled={modalWorking}>Cancel</button>
                  <button className="btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626", padding: "8px 18px", fontSize: 14 }} onClick={handleModalConfirm} disabled={modalWorking}>{modalWorking ? "Deleting…" : "Delete"}</button>
                </div>
              </>
            )}
            {modal.type === "editAssignment" && (
              <>
                <h2 className="font-serif text-[20px] text-ink leading-tight">Edit assignment</h2>
                <div className="flex flex-col gap-3">
                  <input type="text" className="form-input" value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder="Title" autoFocus />
                  <input type="date" className="form-input" value={modalDateInput} onChange={(e) => setModalDateInput(e.target.value)} />
                  <textarea className="form-textarea" rows={2} value={modalDescInput} onChange={(e) => setModalDescInput(e.target.value)} placeholder="Description (optional)" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setModal(null)} disabled={modalWorking}>Cancel</button>
                  <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 14 }} onClick={handleModalConfirm} disabled={modalWorking || !modalInput.trim()}>{modalWorking ? "Saving…" : "Save"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Grade modal */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]" onClick={(e) => { if (e.target === e.currentTarget) setGradeModal(null); }}>
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[440px] mx-4 p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Grade submission</h2>
              <p className="text-[13px] text-ink-3"><span className="font-medium text-ink">{gradeModal.studentName}</span> &mdash; {gradeModal.assignmentTitle}</p>
            </div>
            <div className="flex items-center gap-2 bg-paper-2 border border-border rounded-lg px-3 py-2">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--color-ink-3)" }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span className="text-[12px] text-ink-2 font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{gradeModal.link}</span>
              <a href={gradeModal.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-teal-light text-teal hover:bg-teal hover:text-white transition-colors flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              {/^https?:\/\/(www\.)?github\.com\//i.test(gradeModal.link) && (
                <a href={gradeModal.link.replace(/^https?:\/\/(www\.)?github\.com\//i, "https://stackblitz.com/github/")} target="_blank" rel="noopener noreferrer" title="Open in StackBlitz" className="inline-flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 transition-colors" style={{ background: "#1a1a2e", color: "#fff" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </a>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wide">Grade</label>
              <input type="text" className="form-input" placeholder="e.g. A, 85/100, 9/10" value={gradeInput} onChange={(e) => setGradeInput(e.target.value)} autoFocus />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wide">Feedback</label>
              <textarea className="form-textarea" rows={3} placeholder="Write feedback for the student (optional)" value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setGradeModal(null)} disabled={gradeSaving}>Cancel</button>
              <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 14 }} onClick={handleSaveGrade} disabled={gradeSaving}>{gradeSaving ? "Saving…" : "Save grade"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
