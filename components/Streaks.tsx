const streakStudents = [
  {
    initials: "AJ",
    name: "Adaeze Johnson",
    streak: 12,
    filled: 7,
    avatarBg: "#fef3c7",
    avatarColor: "#92400e",
    dead: false,
  },
  {
    initials: "KO",
    name: "Kofi Osei",
    streak: 9,
    filled: 5,
    avatarBg: "#f0fdf4",
    avatarColor: "#166534",
    dead: false,
  },
  {
    initials: "EM",
    name: "Emeka Madu",
    streak: 0,
    filled: 0,
    avatarBg: "#f0ede6",
    avatarColor: "#7a7770",
    dead: true,
  },
];

const streakFacts = [
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>,
    title: "Submit consecutively → streak grows",
    desc: "Every on-time submission adds to a student's streak count. The number is visible to the whole class.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
    title: "Miss one → it resets to zero",
    desc: "No partial credit. No grace period. Missing a submission resets the streak entirely. Students feel this.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="#0d9488"/></svg>,
    title: "The class board makes it social",
    desc: "When every student's streak is visible on the big screen, it stops being a private habit and becomes a public commitment.",
  },
];

export default function Streaks() {
  return (
    <div id="streaks">
      <div style={{ padding: "80px 2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="streak-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            alignItems: "center",
          }}
        >
          {/* Visual */}
          <div
            style={{
              background: "var(--paper-2)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink-3)",
                marginBottom: 4,
                fontFamily: "var(--mono)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Current streaks
            </div>

            {streakStudents.map((s) => (
              <div key={s.initials} className="streak-row">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: s.avatarBg,
                    color: s.avatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: "var(--mono)",
                    flexShrink: 0,
                  }}
                >
                  {s.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 400, color: "var(--ink)" }}>
                    {s.name}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: i < s.filled ? "var(--amber)" : "var(--paper-3)",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 20 }}>
                  {s.dead
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
                  }
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 16,
                      fontWeight: 500,
                      color: s.dead ? "var(--ink-3)" : "var(--ink)",
                    }}
                  >
                    {s.streak}
                  </span>
                </div>
              </div>
            ))}

            <div
              style={{
                padding: "8px 0",
                textAlign: "center",
                fontSize: 12,
                color: "var(--ink-3)",
                fontFamily: "var(--mono)",
              }}
            >
              Miss one assignment → streak resets to 0
            </div>
          </div>

          {/* Content */}
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
              The streak system
            </div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: 38,
                lineHeight: 1.1,
                letterSpacing: -0.5,
                color: "var(--ink)",
                marginBottom: "1rem",
              }}
            >
              Consistency becomes
              <br />a competition
            </h2>
            <p
              style={{
                fontSize: 16,
                fontWeight: 300,
                color: "var(--ink-2)",
                lineHeight: 1.65,
                marginBottom: "2rem",
              }}
            >
              Streaks are the psychological core of Klassroom. Simple rules,
              powerful outcomes.
            </p>

            {streakFacts.map((f, i) => (
              <div
                key={f.title}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  marginBottom: i < streakFacts.length - 1 ? "1.5rem" : 0,
                  paddingBottom: i < streakFacts.length - 1 ? "1.5rem" : 0,
                  borderBottom:
                    i < streakFacts.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--paper-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginBottom: 3,
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink-2)",
                      fontWeight: 300,
                      lineHeight: 1.55,
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
