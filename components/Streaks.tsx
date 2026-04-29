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
      <div className="py-20 px-8 max-w-[1200px] mx-auto">
        <div
          className="streak-grid grid grid-cols-2 gap-12 items-center"
        >
          {/* Visual */}
          <div className="bg-paper-2 border border-border rounded-2xl p-8 flex flex-col gap-3">
            <div className="text-[13px] font-medium text-ink-3 mb-1 font-mono uppercase tracking-[0.06em]">
              Current streaks
            </div>

            {streakStudents.map((s) => (
              <div key={s.initials} className="streak-row">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium font-mono flex-shrink-0"
                  style={{ background: s.avatarBg, color: s.avatarColor }}
                >
                  {s.initials}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-normal text-ink">{s.name}</div>
                  <div className="flex gap-1 mt-[6px]">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: i < s.filled ? "var(--color-amber)" : "var(--color-paper-3)" }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[20px]">
                  {s.dead
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
                  }
                  <span className="font-mono text-[16px] font-medium" style={{ color: s.dead ? "var(--color-ink-3)" : "var(--color-ink)" }}>
                    {s.streak}
                  </span>
                </div>
              </div>
            ))}

            <div className="py-2 text-center text-[12px] text-ink-3 font-mono">
              Miss one assignment → streak resets to 0
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="font-mono text-[12px] font-medium text-ink-3 tracking-[0.08em] uppercase mb-4">
              The streak system
            </div>
            <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.5px] text-ink mb-4">
              Consistency becomes
              <br />a competition
            </h2>
            <p className="text-[16px] font-light text-ink-2 leading-[1.65] mb-8">
              Streaks are the psychological core of Klassroom. Simple rules,
              powerful outcomes.
            </p>

            {streakFacts.map((f, i) => (
              <div
                key={f.title}
                className={`flex items-start gap-4${i < streakFacts.length - 1 ? " mb-6 pb-6 border-b border-border" : ""}`}
              >
                <div className="w-9 h-9 rounded-lg bg-paper-2 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="text-[15px] font-medium text-ink mb-[3px]">{f.title}</div>
                  <div className="text-[13px] text-ink-2 font-light leading-[1.55]">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
