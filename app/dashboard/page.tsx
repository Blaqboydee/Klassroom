"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "submitted" | "late" | "missing" | "upcoming";
  submittedAt?: string;
  submissionLink?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockStudent = {
  name: "Adaeze Johnson",
  email: "adaeze@class.com",
  streak: 12,
  lastSubmission: "Today, 9:14 AM",
  totalSubmitted: 18,
  totalAssignments: 20,
  className: "React Fundamentals",
  classCode: "REACT24",
};

const mockAssignments: Assignment[] = [
  {
    id: "1",
    title: "Build a Todo App",
    description: "Create a fully functional todo app using React hooks. Must include add, delete, and complete functionality.",
    dueDate: "2026-04-29",
    status: "submitted",
    submittedAt: "Today, 9:14 AM",
    submissionLink: "github.com/adaeze/todo-app",
  },
  {
    id: "2",
    title: "API Integration with useEffect",
    description: "Fetch data from a public API and display it with proper loading and error states.",
    dueDate: "2026-04-27",
    status: "submitted",
    submittedAt: "Apr 27, 8:52 AM",
    submissionLink: "github.com/adaeze/api-effect",
  },
  {
    id: "3",
    title: "React Router Navigation",
    description: "Build a multi-page app with React Router v6. Include nested routes and a 404 page.",
    dueDate: "2026-04-25",
    status: "late",
    submittedAt: "Apr 26, 11:30 PM",
    submissionLink: "github.com/adaeze/router-app",
  },
  {
    id: "4",
    title: "Context API & Global State",
    description: "Refactor a prop-drilling example to use React Context for global state management.",
    dueDate: "2026-04-22",
    status: "missing",
  },
  {
    id: "5",
    title: "Custom Hooks",
    description: "Extract logic from a component into at least two reusable custom hooks with documentation.",
    dueDate: "2026-05-02",
    status: "upcoming",
  },
  {
    id: "6",
    title: "Performance Optimization",
    description: "Use React.memo, useMemo, and useCallback to optimize a slow-rendering component.",
    dueDate: "2026-05-06",
    status: "upcoming",
  },
];

// ─── Submit Modal ─────────────────────────────────────────────────────────────
function SubmitModal({
  assignment,
  onClose,
  onSubmit,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSubmit: (id: string, link: string) => void;
}) {
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const isValid = link.trim().length > 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setDone(true);
    setTimeout(() => {
      onSubmit(assignment.id, link.trim());
      onClose();
    }, 1000);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15,14,12,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "2rem",
          width: "100%", maxWidth: 460,
          boxShadow: "0 32px 80px rgba(15,14,12,0.2)",
          animation: "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Submit assignment</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)", lineHeight: 1.2, letterSpacing: -0.3 }}>{assignment.title}</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "12px 14px", background: "var(--paper-2)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 300, lineHeight: 1.55 }}>{assignment.description}</p>
          <div style={{ marginTop: 8, fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>
            Due: {new Date(assignment.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-2)", marginBottom: 6 }}>
            Submission link
          </label>
          <input
            type="url"
            className="dash-input"
            placeholder="https://github.com/you/project"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={submitting || done}
            autoFocus
          />
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6, fontWeight: 300 }}>
            Paste your GitHub repo, live URL, or any accessible link.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", background: "none", border: "1.5px solid var(--border)", borderRadius: 10, cursor: "pointer", fontSize: 14, fontFamily: "var(--sans)", color: "var(--ink-2)", fontWeight: 400, transition: "background 0.15s" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting || done}
              style={{
                flex: 2, padding: "12px",
                background: done ? "var(--teal)" : "var(--ink)",
                color: "var(--paper)",
                border: "none", borderRadius: 10, cursor: isValid ? "pointer" : "not-allowed",
                fontSize: 14, fontFamily: "var(--sans)", fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: !isValid && !submitting ? 0.45 : 1,
                transition: "background 0.2s, opacity 0.2s",
              }}
            >
              {done ? (
                <><span style={{ fontSize: 16 }}>✓</span> Submitted!</>
              ) : submitting ? (
                <><div className="spinner" /> Submitting…</>
              ) : (
                <>Submit assignment →</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assignment Card ──────────────────────────────────────────────────────────
function AssignmentCard({
  assignment,
  onSubmit,
}: {
  assignment: Assignment;
  onSubmit: (a: Assignment) => void;
}) {
  const statusConfig = {
    submitted: { label: "Submitted", bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
    late: { label: "Late", bg: "#fef9c3", color: "#854d0e", dot: "#f59e0b" },
    missing: { label: "Missing", bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
    upcoming: { label: "Upcoming", bg: "var(--paper-2)", color: "var(--ink-3)", dot: "var(--paper-3)" },
  };
  const cfg = statusConfig[assignment.status];
  const due = new Date(assignment.dueDate);
  const dueStr = due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const isOverdue = due < new Date() && assignment.status === "upcoming";

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        transition: "box-shadow 0.2s, transform 0.15s",
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(15,14,12,0.08)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "none";
      }}
    >
      {/* Status dot */}
      <div style={{ paddingTop: 4, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", marginBottom: 3 }}>{assignment.title}</h3>
            <p style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 300, lineHeight: 1.5, maxWidth: 400 }}>
              {assignment.description.length > 80 ? assignment.description.slice(0, 80) + "…" : assignment.description}
            </p>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: cfg.bg, color: cfg.color, fontSize: 12, fontFamily: "var(--mono)", fontWeight: 500, flexShrink: 0 }}>
            {cfg.label}
          </div>
        </div>

        <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, color: isOverdue ? "#ef4444" : "var(--ink-3)", fontFamily: "var(--mono)", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5.5 3v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Due {dueStr}
            </div>
            {assignment.submittedAt && (
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>
                ✓ {assignment.submittedAt}
              </div>
            )}
            {assignment.submissionLink && (
              <a
                href={`https://${assignment.submissionLink}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "var(--teal)", fontFamily: "var(--mono)", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 8.5l7-7M8.5 8.5V1.5H1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {assignment.submissionLink}
              </a>
            )}
          </div>

          {(assignment.status === "missing" || assignment.status === "upcoming") && (
            <button
              onClick={() => onSubmit(assignment)}
              style={{
                background: assignment.status === "missing" ? "var(--red)" : "var(--ink)",
                color: "var(--paper)",
                border: "none", borderRadius: 8,
                padding: "7px 14px",
                fontSize: 13, fontFamily: "var(--sans)", fontWeight: 500,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "opacity 0.15s, transform 0.15s",
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              {assignment.status === "missing" ? "⚠ Submit now" : "Submit"}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "submitted" | "missing">("all");
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [streak, setStreak] = useState(mockStudent.streak);

  const student = { ...mockStudent, streak };

  const filtered = assignments.filter((a) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "upcoming") return a.status === "upcoming";
    if (activeFilter === "submitted") return a.status === "submitted" || a.status === "late";
    if (activeFilter === "missing") return a.status === "missing";
    return true;
  });

  const counts = {
    submitted: assignments.filter((a) => a.status === "submitted" || a.status === "late").length,
    missing: assignments.filter((a) => a.status === "missing").length,
    upcoming: assignments.filter((a) => a.status === "upcoming").length,
  };

  function handleSubmit(id: string, link: string) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "submitted",
              submittedAt: "Just now",
              submissionLink: link.replace(/^https?:\/\//, ""),
            }
          : a
      )
    );
    setStreak((s) => s + 1);
    setSubmitTarget(null);
  }

  const streakPercent = Math.min((streak / 14) * 100, 100);
  const streakMilestone = streak >= 14 ? "🏆" : streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "🌱";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #0f0e0c; --ink-2: #3a3830; --ink-3: #7a7770;
          --paper: #faf8f4; --paper-2: #f0ede6; --paper-3: #e4e0d8;
          --amber: #d97706; --amber-light: #fef3c7;
          --teal: #0f766e; --teal-light: #ccfbf1;
          --red: #dc2626; --red-light: #fee2e2;
          --border: rgba(15,14,12,0.12);
          --serif: 'DM Serif Display', serif;
          --sans: 'Outfit', sans-serif;
          --mono: 'DM Mono', monospace;
        }
        body { font-family: var(--sans); background: var(--paper-2); color: var(--ink); min-height: 100vh; }

        .dash-input {
          width: 100%; padding: 12px 14px;
          font-family: var(--sans); font-size: 14px; color: var(--ink);
          background: var(--paper); border: 1.5px solid var(--border);
          border-radius: 10px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dash-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,12,0.06); }
        .dash-input::placeholder { color: var(--ink-3); }

        .filter-btn {
          padding: 6px 14px; border-radius: 100px;
          font-size: 13px; font-family: var(--sans); font-weight: 400;
          border: 1px solid var(--border);
          cursor: pointer; transition: all 0.15s;
          background: var(--paper); color: var(--ink-2);
          display: inline-flex; align-items: center; gap: 5px;
        }
        .filter-btn:hover { background: var(--paper-2); }
        .filter-btn.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

        .nav-link { color: var(--ink-3); text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .nav-link:hover { color: var(--ink); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(250,248,244,0.3); border-top-color: var(--paper); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }

        @keyframes streakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .streak-num { animation: streakPulse 3s ease-in-out infinite; display: inline-block; }
      `}</style>

      {/* Submit modal */}
      {submitTarget && (
        <SubmitModal
          assignment={submitTarget}
          onClose={() => setSubmitTarget(null)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Top nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,248,244,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 2rem", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a href="/" style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--ink)", textDecoration: "none", letterSpacing: -0.5 }}>
            Klass<span style={{ color: "var(--amber)" }}>room</span>
          </a>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <span style={{ fontSize: 13, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>{student.className}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--amber)", display: "flex", alignItems: "center", gap: 5 }}>
            🔥 <strong>{streak}</strong> streak
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--amber-light)", color: "#92400e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, fontFamily: "var(--mono)" }}>
              {student.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <span style={{ fontSize: 14, color: "var(--ink-2)" }}>{student.name.split(" ")[0]}</span>
          </div>
          <a href="/login" style={{ fontSize: 13, color: "var(--ink-3)", textDecoration: "none", border: "1px solid var(--border)", padding: "5px 12px", borderRadius: 8, transition: "background 0.15s" }}>
            Sign out
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* ── STREAK HERO ── */}
        <div
          style={{
            background: "var(--ink)",
            borderRadius: 20,
            padding: "2rem 2.5rem",
            marginBottom: "1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "2rem",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* bg texture */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle at 80% 50%, rgba(217,119,6,0.12) 0%, transparent 60%)",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "rgba(250,248,244,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Current streak
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: "1rem" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 72, lineHeight: 1, color: "var(--paper)" }} className="streak-num">
                {streak}
              </div>
              <div style={{ paddingBottom: 10 }}>
                <div style={{ fontSize: 22 }}>{streakMilestone}</div>
                <div style={{ fontSize: 13, color: "rgba(250,248,244,0.5)", fontWeight: 300 }}>days in a row</div>
              </div>
            </div>

            {/* Streak bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "rgba(250,248,244,0.35)" }}>Progress to 14-day milestone</span>
                <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "rgba(250,248,244,0.5)" }}>{streak}/14</span>
              </div>
              <div style={{ height: 5, background: "rgba(250,248,244,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${streakPercent}%`, background: "var(--amber)", borderRadius: 3, transition: "width 0.6s ease" }} />
              </div>
            </div>

            <div style={{ marginTop: "1rem", fontSize: 13, color: "rgba(250,248,244,0.4)", fontWeight: 300 }}>
              Last submission: <span style={{ color: "rgba(250,248,244,0.65)" }}>{student.lastSubmission}</span>
            </div>
          </div>

          {/* Right side — week dots */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "rgba(250,248,244,0.35)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              This week
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
                const filled = i < 5;
                const isToday = i === 1;
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: filled ? "var(--amber)" : "rgba(250,248,244,0.08)",
                      border: isToday ? "2px solid var(--amber)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11,
                    }}>
                      {filled && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "rgba(250,248,244,0.3)" }}>{day}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Submitted", value: counts.submitted, total: assignments.length, color: "var(--teal)", bg: "var(--teal-light)" },
            { label: "Missing", value: counts.missing, total: assignments.length, color: "#dc2626", bg: "#fee2e2" },
            { label: "Upcoming", value: counts.upcoming, total: assignments.length, color: "var(--ink-3)", bg: "var(--paper-2)" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "var(--paper)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "1.25rem 1.5rem",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 36, color: "var(--ink)", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: s.color, background: s.bg, padding: "3px 8px", borderRadius: 100 }}>
                  of {s.total}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ASSIGNMENTS ── */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)", letterSpacing: -0.3 }}>Assignments</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["all", "upcoming", "submitted", "missing"] as const).map((f) => (
                <button
                  key={f}
                  className={`filter-btn${activeFilter === f ? " active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== "all" && (
                    <span style={{
                      background: activeFilter === f ? "rgba(250,248,244,0.2)" : "var(--paper-2)",
                      color: activeFilter === f ? "var(--paper)" : "var(--ink-3)",
                      borderRadius: 100, padding: "1px 6px", fontSize: 11, fontFamily: "var(--mono)",
                    }}>
                      {counts[f as keyof typeof counts]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
                No assignments in this category.
              </div>
            ) : (
              filtered.map((a) => (
                <AssignmentCard key={a.id} assignment={a} onSubmit={setSubmitTarget} />
              ))
            )}
          </div>
        </div>

        {/* Missing warning */}
        {counts.missing > 0 && (
          <div style={{ marginTop: "1rem", padding: "12px 16px", background: "#fee2e2", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M8 2L14.5 13H1.5L8 2z" stroke="#dc2626" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M8 6v3.5M8 11v.5" stroke="#dc2626" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 400 }}>
              You have <strong>{counts.missing}</strong> missing {counts.missing === 1 ? "assignment" : "assignments"} — submitting now will reset your streak risk.
            </p>
          </div>
        )}
      </div>
    </>
  );
}