export default function CTA() {
  return (
    <div
      id="get-started"
      className="bg-amber-light border-t border-[rgba(217,119,6,0.15)] border-b border-b-[rgba(217,119,6,0.15)]"
    >
      <div className="py-20 px-8 max-w-[1200px] mx-auto text-center flex flex-col items-center">
        <div className="font-mono text-[12px] font-medium text-amber tracking-[0.08em] uppercase mb-4">
          Start today
        </div>
        <h2 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] tracking-[-0.5px] text-ink mb-4 max-w-[600px]">
          Your classroom is one board away from full participation
        </h2>
        <p className="text-[17px] font-light text-ink-2 leading-[1.65] max-w-[440px]">
          No long setup. No onboarding calls. Get your class submitting on day one.
        </p>
        <div className="flex gap-4 mt-10 items-center flex-wrap justify-center">
          <a href="/signup" className="btn-amber">
            Create your classroom
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
          <a href="#features" className="btn-secondary">
            See all features
          </a>
        </div>
      </div>
    </div>
  );
}
