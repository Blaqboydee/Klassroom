"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const { classrooms, loading: classroomsLoading, creating: creatingClassroom, createClassroom, updateClassroom, deleteClassroom } = useClassrooms({ adminId: currentUser?.id });

  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  // Auto-select first classroom once loaded
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  const { assignments, loading: assignmentsLoading, createAssignment, updateAssignment, deleteAssignment, creating } = useAssignments(
    selectedClassroomId ? { classroomId: selectedClassroomId } : undefined
  );
  const { submissions } = useSubmissions();

  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });
  const [created, setCreated] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [classroomCreated, setClassroomCreated] = useState<string | null>(null); // stores the new code

  // Modal state
  type ModalState =
    | { type: "deleteClassroom"; id: string; label: string }
    | { type: "deleteAssignment"; id: string; label: string }
    | { type: "editClassroom"; id: string; currentName: string }
    | { type: "editAssignment"; id: string; currentTitle: string; currentDescription: string; currentDueDate: string }
    | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [modalInput, setModalInput] = useState("");
  const [modalDateInput, setModalDateInput] = useState("");
  const [modalDescInput, setModalDescInput] = useState("");
  const [modalWorking, setModalWorking] = useState(false);

  // Build submission lookup: `${studentId}:${assignmentId}` → true
  const submittedSet = new Set(submissions.map((s) => `${s.studentId}:${s.assignmentId}`));

  // Only show students enrolled in the selected classroom
  const selectedClassroom = classrooms.find((c) => c.id === selectedClassroomId);
  const enrolledStudents = selectedClassroom
    ? students.filter((s) => selectedClassroom.memberIds.includes(s.id))
    : [];

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
  const activeStudents = enrolledStudents.filter((s) => s.streak > 0).length;
  const [navOpen, setNavOpen] = useState(false);

  async function handleModalConfirm() {
    if (!modal) return;
    setModalWorking(true);
    try {
      if (modal.type === "deleteClassroom") {
        await deleteClassroom(modal.id);
      } else if (modal.type === "deleteAssignment") {
        await deleteAssignment(modal.id);
      } else if (modal.type === "editClassroom") {
        if (modalInput.trim()) await updateClassroom(modal.id, modalInput.trim());
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

  function openEditClassroom(id: string, name: string) {
    setModalInput(name);
    setModal({ type: "editClassroom", id, currentName: name });
  }
  function openDeleteClassroom(id: string, name: string) {
    setModal({ type: "deleteClassroom", id, label: name });
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

  return (
    <>


      {/* Nav */}
      <nav className="dash-nav">
        <Link href="/" className="brand">Klass<span>room</span></Link>
        <div className="nav-links">
          <Link href="/dashboard/admin" className="nav-link-dash">Dashboard</Link>
          <Link href="/live" className="live-btn">Live board</Link>
          <Link href="/login" className="nav-signout">Sign out</Link>
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
          <Link href="/dashboard/admin" className="nav-link-dash" onClick={() => setNavOpen(false)}>Dashboard</Link>
          <Link href="/live" className="nav-link-dash" onClick={() => setNavOpen(false)}>Live board</Link>
          <Link href="/login" className="nav-signout" onClick={() => setNavOpen(false)}>Sign out</Link>
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
            <div className="stat-num">{studentsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : enrolledStudents.length}</div>
            <div className="stat-label">students enrolled</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{assignmentsLoading ? <span className="skeleton w-8 h-7 inline-block" /> : assignments.length}</div>
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
        {classroomsLoading ? (
          <div className="classroom-grid mb-4">
            {[0,1,2].map((i) => (
              <div key={i} className="classroom-card">
                <span className="skeleton h-5 w-32 block mb-2" />
                <span className="skeleton h-6 w-16 block rounded-full" />
                <span className="skeleton h-3 w-24 block mt-2" />
              </div>
            ))}
          </div>
        ) : classrooms.length > 0 && (
          <div className="classroom-grid">
            {classrooms.map((c) => (
             <div key={c.id} className="classroom-card" style={{ minWidth: 0, overflow: "hidden" }}>
  <div
    className="classroom-name"
    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
  >
    {c.name}
  </div>

  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "6px" }}>
    <span className="code-badge">{c.code}</span>

    <button className="copy-btn" title="Copy join code" onClick={() => navigator.clipboard.writeText(c.code)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
    </button>

    <button className="copy-btn" title="Rename classroom" onClick={() => openEditClassroom(c.id, c.name)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>

    <button
      className="copy-btn"
      title="Delete classroom"
      style={{ color: "#dc2626" }}
      onClick={() => openDeleteClassroom(c.id, c.name)}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    </button>
  </div>

  <div className="classroom-meta" style={{ marginTop: "8px" }}>
    {c.memberIds.length} student{c.memberIds.length !== 1 ? "s" : ""} enrolled
  </div>
</div>
            ))}
          </div>
        )}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleCreateClassroom} className="flex gap-2">
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
                className="create-btn whitespace-nowrap"
                disabled={creatingClassroom || !classroomName.trim() || !currentUser}
              >
                {creatingClassroom ? "Creating…" : "Create"}
              </button>
            </form>
            {classroomCreated && (
              <p className="success-msg mt-[10px]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Classroom created! Share code <span className="font-mono tracking-[0.1em]">{classroomCreated}</span> with your students.
              </p>
            )}
            {!currentUser && (
              <p className="text-[12px] text-ink-3 mt-2">Sign in to create classrooms.</p>
            )}
          </div>
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
            {classrooms.length === 0 && (
              <p className="text-[13px] text-ink-3 mb-[10px]">Create a classroom first before adding assignments.</p>
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
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                        {a.title}
                      </span>
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
            )}
        </div>
      </main>

      {/* Confirm / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[420px] mx-4 p-6 flex flex-col gap-5">
            {/* Delete modals */}
            {(modal.type === "deleteClassroom" || modal.type === "deleteAssignment") && (
              <>
                <div>
                  <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">
                    Delete {modal.type === "deleteClassroom" ? "classroom" : "assignment"}?
                  </h2>
                  <p className="text-[13px] text-ink-3">
                    <span className="font-medium text-ink">&ldquo;{modal.label}&rdquo;</span> will be permanently deleted. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setModal(null)} disabled={modalWorking}>Cancel</button>
                  <button
                    className="btn-primary"
                    style={{ background: "#dc2626", borderColor: "#dc2626", padding: "8px 18px", fontSize: 14 }}
                    onClick={handleModalConfirm}
                    disabled={modalWorking}
                  >
                    {modalWorking ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </>
            )}

            {/* Edit classroom modal */}
            {modal.type === "editClassroom" && (
              <>
                <div>
                  <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Rename classroom</h2>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder="Classroom name"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setModal(null)} disabled={modalWorking}>Cancel</button>
                  <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 14 }} onClick={handleModalConfirm} disabled={modalWorking || !modalInput.trim()}>
                    {modalWorking ? "Saving…" : "Save"}
                  </button>
                </div>
              </>
            )}

            {/* Edit assignment modal */}
            {modal.type === "editAssignment" && (
              <>
                <div>
                  <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Edit assignment</h2>
                </div>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    className="form-input"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    placeholder="Title"
                    autoFocus
                  />
                  <input
                    type="date"
                    className="form-input"
                    value={modalDateInput}
                    onChange={(e) => setModalDateInput(e.target.value)}
                  />
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={modalDescInput}
                    onChange={(e) => setModalDescInput(e.target.value)}
                    placeholder="Description (optional)"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setModal(null)} disabled={modalWorking}>Cancel</button>
                  <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 14 }} onClick={handleModalConfirm} disabled={modalWorking || !modalInput.trim()}>
                    {modalWorking ? "Saving…" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
