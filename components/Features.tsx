const features = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
    name: "Assignment management",
    desc: "Instructors create assignments with title, description, and due date. Posted in seconds from the admin dashboard.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    name: "10-second submissions",
    desc: "Students paste a GitHub link or live URL. Done. Submission time and late status are recorded automatically.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>,
    name: "Streak tracking",
    desc: "Consecutive submissions build a streak. One miss and it resets. Simple rules that drive consistent behavior.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    name: "Student dashboard",
    desc: "Each student sees their own assignments, submission status, and current streak — all in one view.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    name: "Admin oversight",
    desc: "Instructors see every student, every assignment, every streak. Inactive students are immediately visible.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
    name: "Live class board",
    desc: "A live-updating display designed for classroom projection. Names, streaks, and status — updated every 5–10s.",
  },
];

export default function Features() {
  return (
    <div
      id="features"
      style={{
        background: "var(--paper-2)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ padding: "80px 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-3)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              What you get
            </div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: "clamp(32px, 4vw, 48px)",
                lineHeight: 1.1,
                letterSpacing: -0.5,
                color: "var(--ink)",
              }}
            >
              Everything a classroom
              <br />
              needs, nothing it doesn&apos;t
            </h2>
          </div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 300,
              color: "var(--ink-2)",
              lineHeight: 1.65,
              maxWidth: 360,
            }}
          >
            No bloat. No complex setup. Just the tools that change behavior.
          </p>
        </div>

        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5px",
            background: "var(--border)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {features.map((f) => (
            <div key={f.name} className="feature-cell">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--paper-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                  fontSize: 18,
                }}
              >
                {f.icon}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: "0.5rem",
                }}
              >
                {f.name}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--ink-2)",
                  lineHeight: 1.6,
                  fontWeight: 300,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
