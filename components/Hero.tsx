const students = [
  {
    initials: "AJ",
    name: "Adaeze Johnson",
    time: "Submitted 2 min ago",
    streak: 12,
    status: "done",
    rank: 1,
    avatarBg: "#fef3c7",
    avatarColor: "#92400e",
  },
  {
    initials: "KO",
    name: "Kofi Osei",
    time: "Submitted 8 min ago",
    streak: 9,
    status: "done",
    rank: 2,
    avatarBg: "#f0fdf4",
    avatarColor: "#166534",
  },
  {
    initials: "TN",
    name: "Temi Nwosu",
    time: "Submitted 15 min ago",
    streak: 6,
    status: "done",
    rank: 3,
    avatarBg: "#ede9fe",
    avatarColor: "#5b21b6",
  },
  {
    initials: "ZB",
    name: "Zara Bakare",
    time: "Submitted 1 hr ago (late)",
    streak: 3,
    status: "late",
    rank: 4,
    avatarBg: "#fef9c3",
    avatarColor: "#854d0e",
  },
  {
    initials: "EM",
    name: "Emeka Madu",
    time: "No submission yet",
    streak: 0,
    status: "missing",
    rank: 5,
    avatarBg: "#f0ede6",
    avatarColor: "#7a7770",
  },
];

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    done: "#22c55e",
    late: "#f59e0b",
    missing: "#e5e7eb",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[status] ?? "#e5e7eb",
        flexShrink: 0,
      }}
    />
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "var(--mono)",
          fontSize: 12,
          fontWeight: 500,
          padding: "3px 8px",
          borderRadius: 100,
          background: "#f0ede6",
          color: "#dc2626",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
        {" "}0
      </span>
    );
  const isHigh = streak >= 8;
  const isMid = streak >= 5 && streak < 8;
  const bg = isHigh ? "#fef3c7" : isMid ? "#f0fdf4" : "#f0ede6";
  const color = isHigh ? "#92400e" : isMid ? "#166534" : "#7a7770";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: 100,
        background: bg,
        color,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
      {" "}{streak}
    </span>
  );
}

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        padding: "120px 2rem 80px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div
        className="hero-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
        }}
      >
        {/* LEFT */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--mono)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--amber)",
              background: "var(--amber-light)",
              padding: "4px 12px",
              borderRadius: 100,
              marginBottom: "1.5rem",
              letterSpacing: "0.02em",
            }}
          >
            <span className="eyebrow-dot" />
            Live classroom engagement
          </div>

          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(42px, 5vw, 68px)",
              lineHeight: 1.05,
              letterSpacing: -1,
              color: "var(--ink)",
              marginBottom: "1.25rem",
            }}
          >
            Make every
            <br />
            submission{" "}
            <em style={{ fontStyle: "italic", color: "var(--amber)" }}>
              matter
            </em>
          </h1>

          <p
            style={{
              fontSize: 18,
              fontWeight: 300,
              color: "var(--ink-2)",
              lineHeight: 1.65,
              marginBottom: "2.5rem",
              maxWidth: 460,
            }}
          >
            A live class board that makes student progress visible in real
            time. Streaks create accountability. Submissions take under 10
            seconds.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <a href="/signup" className="btn-primary">
              Start free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7h8M7 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a href="#how" className="btn-secondary">
              See how it works
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2 11L11 2M11 2H5M11 2v6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <div
            style={{
              display: "flex",
              gap: "2.5rem",
              marginTop: "3rem",
              paddingTop: "2rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            {[
              { num: "10s", label: "to submit an assignment" },
              { num: "Live", label: "board updates in class" },
              { num: "100%", label: "visibility for instructors" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 32,
                    color: "var(--ink)",
                    lineHeight: 1,
                  }}
                >
                  {s.num}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — BOARD MOCKUP */}
        <div className="hero-visual" style={{ position: "relative" }}>
          {/* Float card top-right */}
          <div
            className="float-card"
            style={{ right: -24, top: 24, animationDelay: "0.8s" }}
          >
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
              Class avg. streak
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 26,
                color: "var(--amber)",
                lineHeight: 1,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
              {" "}8
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
              days consecutive
            </div>
          </div>

          {/* Board card */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow:
                "0 24px 64px rgba(15,14,12,0.10), 0 4px 12px rgba(15,14,12,0.06)",
            }}
          >
            {/* Board header */}
            <div
              style={{
                background: "var(--ink)",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: "var(--paper)", fontSize: 14, fontWeight: 500 }}>
                  Live Class Board
                </div>
                <div style={{ color: "rgba(250,248,244,0.5)", fontSize: 12 }}>
                  React Fundamentals — Week 4
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(250,248,244,0.1)",
                  border: "1px solid rgba(250,248,244,0.15)",
                  borderRadius: 100,
                  padding: "3px 10px",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(250,248,244,0.7)",
                }}
              >
                <div className="live-dot" />
                LIVE
              </div>
            </div>

            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr auto auto auto",
                gap: 10,
                padding: "6px 20px 8px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div />
              {["Student", "Streak", "Status", ""].map((h, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 10,
                    color: "var(--ink-3)",
                    fontFamily: "var(--mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {students.map((s, i) => (
              <div
                key={s.initials}
                className="board-row"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: s.avatarBg,
                    color: s.avatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: "var(--mono)",
                  }}
                >
                  {s.initials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: "var(--ink)" }}>
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-3)",
                      fontFamily: "var(--mono)",
                      marginTop: 1,
                    }}
                  >
                    {s.time}
                  </div>
                </div>
                <StreakBadge streak={s.streak} />
                <StatusDot status={s.status} />
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--ink-3)",
                  }}
                >
                  #{s.rank}
                </span>
              </div>
            ))}

            {/* Footer */}
            <div
              style={{
                background: "var(--paper-2)",
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-3)",
                  fontFamily: "var(--mono)",
                }}
              >
                5 of 6 students submitted
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 100,
                    height: 4,
                    background: "var(--paper-3)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "83%",
                      height: "100%",
                      background: "var(--teal)",
                      borderRadius: 2,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "var(--teal)",
                    fontWeight: 500,
                  }}
                >
                  83%
                </div>
              </div>
            </div>
          </div>

          {/* Float card bottom-left */}
          <div
            className="float-card"
            style={{ left: -24, bottom: 40, animationDelay: "1s" }}
          >
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
              New submission
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--teal)",
                marginTop: 2,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }}><polyline points="20 6 9 17 4 12"/></svg>
              Adaeze submitted
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--ink-3)",
                marginTop: 4,
              }}
            >
              github.com/ada/react-hw4
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
