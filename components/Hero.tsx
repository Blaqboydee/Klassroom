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
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: colors[status] ?? "#e5e7eb" }}
    />
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0)
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[12px] font-medium px-2 py-[3px] rounded-full bg-[#f0ede6] text-[#dc2626]">
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
      className="inline-flex items-center gap-1 font-mono text-[12px] font-medium px-2 py-[3px] rounded-full"
      style={{ background: bg, color }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
      {" "}{streak}
    </span>
  );
}

export default function Hero() {
  return (
    <section className="min-h-screen pt-[120px] pb-[80px] px-8 max-w-[1200px] mx-auto">
      <div
        className="hero-grid grid grid-cols-2 gap-16 items-center"
      >
        {/* LEFT */}
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[12px] font-medium text-amber bg-amber-light px-[12px] py-[4px] rounded-full mb-6 tracking-[0.02em]">
            <span className="eyebrow-dot" />
            Live classroom engagement
          </div>

          <h1 className="font-serif text-[clamp(42px,5vw,68px)] leading-[1.05] tracking-[-1px] text-ink mb-5">
            Make every
            <br />
            submission{" "}
            <em className="italic text-amber">
              matter
            </em>
          </h1>

          <p className="text-[18px] font-light text-ink-2 leading-[1.65] mb-10 max-w-[460px]">
            A live class board that makes student progress visible in real
            time. Streaks create accountability. Submissions take under 10
            seconds.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
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

          <div className="flex gap-10 mt-12 pt-8 border-t border-border">
            {[
              { num: "10s", label: "to submit an assignment" },
              { num: "Live", label: "board updates in class" },
              { num: "100%", label: "visibility for instructors" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-serif text-[32px] text-ink leading-none">{s.num}</div>
                <div className="text-[13px] text-ink-3 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — BOARD MOCKUP */}
        <div className="hero-visual relative">
          {/* Float card top-right */}
          <div className="float-card" style={{ right: -24, top: 24, animationDelay: "0.8s" }}>
            <div className="text-[11px] text-ink-3 mb-1">Class avg. streak</div>
            <div className="font-serif text-[26px] text-amber leading-none flex items-center gap-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
              {" "}8
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5">days consecutive</div>
          </div>

          {/* Board card */}
          <div className="bg-paper border border-border rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(15,14,12,0.10),0_4px_12px_rgba(15,14,12,0.06)]">
            {/* Board header */}
            <div className="bg-ink px-5 py-[14px] flex items-center justify-between">
              <div>
                <div className="text-paper text-[14px] font-medium">Live Class Board</div>
                <div className="text-[rgba(250,248,244,0.5)] text-[12px]">React Fundamentals — Week 4</div>
              </div>
              <div className="flex items-center gap-[5px] bg-[rgba(250,248,244,0.1)] border border-[rgba(250,248,244,0.15)] rounded-full px-[10px] py-[3px] font-mono text-[11px] font-medium text-[rgba(250,248,244,0.7)]">
                <div className="live-dot" />
                LIVE
              </div>
            </div>

            {/* Column headers */}
            <div className="grid [grid-template-columns:36px_1fr_auto_auto_auto] gap-[10px] px-5 py-[6px] pb-2 border-b border-border">
              <div />
              {["Student", "Streak", "Status", ""].map((h, i) => (
                <div key={i} className="text-[10px] text-ink-3 font-mono uppercase tracking-[0.06em]">{h}</div>
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium font-mono"
                  style={{ background: s.avatarBg, color: s.avatarColor }}
                >
                  {s.initials}
                </div>
                <div>
                  <div className="text-[14px] font-normal text-ink">{s.name}</div>
                  <div className="text-[11px] text-ink-3 font-mono mt-[1px]">{s.time}</div>
                </div>
                <StreakBadge streak={s.streak} />
                <StatusDot status={s.status} />
                <span className="font-mono text-[11px] text-ink-3">#{s.rank}</span>
              </div>
            ))}

            {/* Footer */}
            <div className="bg-paper-2 px-5 py-[10px] flex items-center justify-between">
              <div className="text-[12px] text-ink-3 font-mono">5 of 6 students submitted</div>
              <div className="flex items-center gap-2">
                <div className="w-[100px] h-1 bg-paper-3 rounded-[2px] overflow-hidden">
                  <div className="w-[83%] h-full bg-teal rounded-[2px]" />
                </div>
                <div className="font-mono text-[12px] text-teal font-medium">83%</div>
              </div>
            </div>
          </div>

          {/* Float card bottom-left */}
          <div className="float-card" style={{ left: -24, bottom: 40, animationDelay: "1s" }}>
            <div className="text-[11px] text-ink-3 mb-1">New submission</div>
            <div className="text-[14px] font-medium text-teal mt-0.5 flex items-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline align-middle mr-[3px]"><polyline points="20 6 9 17 4 12"/></svg>
              Adaeze submitted
            </div>
            <div className="font-mono text-[11px] text-ink-3 mt-1">github.com/ada/react-hw4</div>
          </div>
        </div>
      </div>
    </section>
  );
}
