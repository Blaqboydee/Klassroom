export default function CTA() {
  return (
    <div
      id="get-started"
      style={{
        background: "var(--amber-light)",
        borderTop: "1px solid rgba(217,119,6,0.15)",
        borderBottom: "1px solid rgba(217,119,6,0.15)",
      }}
    >
      <div
        style={{
          padding: "80px 2rem",
          maxWidth: 1200,
          margin: "0 auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--amber)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Start today
        </div>
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(32px, 4vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: -0.5,
            color: "var(--ink)",
            marginBottom: "1rem",
            maxWidth: 600,
          }}
        >
          Your classroom is one board away from full participation
        </h2>
        <p
          style={{
            fontSize: 17,
            fontWeight: 300,
            color: "var(--ink-2)",
            lineHeight: 1.65,
            maxWidth: 440,
          }}
        >
          No long setup. No onboarding calls. Get your class submitting on day one.
        </p>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "2.5rem",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
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
