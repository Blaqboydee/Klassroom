const steps = [
  {
    num: "01",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
    name: "Instructor creates assignment",
    desc: "Title, description, and due date. Posted in seconds from the admin dashboard.",
  },
  {
    num: "02",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    name: "Students see it instantly",
    desc: "All active assignments appear on the student dashboard immediately after creation.",
  },
  {
    num: "03",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    name: "Submit a link",
    desc: "Students paste their GitHub or live URL. Submission timestamp and late status are logged automatically.",
  },
  {
    num: "04",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
    name: "Class board updates live",
    desc: "The name, status, and streak appear on the board within seconds. Everyone in class can see it.",
  },
];

export default function HowItWorks() {
  return (
    <div id="how" style={{ background: "var(--ink)" }}>
      <div style={{ padding: "80px 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(250,248,244,0.4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          How it works
        </div>
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(32px, 4vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: -0.5,
            color: "var(--paper)",
            marginBottom: "1rem",
            maxWidth: 500,
          }}
        >
          From assignment to
          <br />
          accountability in four steps
        </h2>

        <div
          className="steps-row"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "2px",
            marginTop: "3rem",
            background: "rgba(250,248,244,0.08)",
            border: "1px solid rgba(250,248,244,0.08)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {steps.map((s) => (
            <div key={s.num} className="step-cell">
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 48,
                  lineHeight: 1,
                  color: "rgba(250,248,244,0.07)",
                  position: "absolute",
                  top: "1rem",
                  right: "1.25rem",
                }}
              >
                {s.num}
              </div>
              <div style={{ fontSize: 22, marginBottom: "1rem", color: "var(--paper)" }}>{s.icon}</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--paper)",
                  marginBottom: "0.5rem",
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(250,248,244,0.5)",
                  lineHeight: 1.6,
                  fontWeight: 300,
                }}
              >
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
