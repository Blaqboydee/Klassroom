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
      className="bg-paper-2 border-t border-border border-b border-b-border"
    >
      <div className="py-20 px-8 max-w-[1200px] mx-auto">
        <div className="flex justify-between items-end flex-wrap gap-4 mb-12">
          <div>
            <div className="font-mono text-[12px] font-medium text-ink-3 tracking-[0.08em] uppercase mb-4">
              What you get
            </div>
            <h2 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] tracking-[-0.5px] text-ink">
              Everything a classroom
              <br />
              needs, nothing it doesn&apos;t
            </h2>
          </div>
          <p className="text-[15px] font-light text-ink-2 leading-[1.65] max-w-[360px]">
            No bloat. No complex setup. Just the tools that change behavior.
          </p>
        </div>

        <div
          className="features-grid grid grid-cols-3 gap-[1.5px] bg-border border border-border rounded-2xl overflow-hidden"
        >
          {features.map((f) => (
            <div key={f.name} className="feature-cell">
              <div className="w-10 h-10 rounded-[10px] bg-paper-2 flex items-center justify-center mb-5">
                {f.icon}
              </div>
              <div className="text-[16px] font-medium text-ink mb-2">{f.name}</div>
              <div className="text-[14px] text-ink-2 leading-[1.6] font-light">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
