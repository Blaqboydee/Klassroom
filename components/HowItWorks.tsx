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
    <div id="how" className="bg-ink">
      <div className="py-20 px-8 max-w-[1200px] mx-auto">
        <div className="font-mono text-[12px] font-medium text-[rgba(250,248,244,0.4)] tracking-[0.08em] uppercase mb-4">
          How it works
        </div>
        <h2 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] tracking-[-0.5px] text-paper mb-4 max-w-[500px]">
          From assignment to
          <br />
          accountability in four steps
        </h2>

        <div
          className="steps-row grid grid-cols-4 gap-[2px] mt-12 bg-[rgba(250,248,244,0.08)] border border-[rgba(250,248,244,0.08)] rounded-xl overflow-hidden"
        >
          {steps.map((s) => (
            <div key={s.num} className="step-cell">
              <div className="font-serif text-[48px] leading-none text-[rgba(250,248,244,0.07)] absolute top-4 right-5">
                {s.num}
              </div>
              <div className="text-[22px] mb-4 text-paper">{s.icon}</div>
              <div className="text-[15px] font-medium text-paper mb-2">{s.name}</div>
              <div className="text-[13px] text-[rgba(250,248,244,0.5)] leading-[1.6] font-light">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
