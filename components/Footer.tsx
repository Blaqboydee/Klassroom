"use client";

const links = ["Features", "How it works", "Streaks", "Get started"];

export default function Footer() {
  return (
    <footer style={{ background: "var(--ink)", padding: "3rem 2rem" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 20,
            color: "var(--paper)",
            letterSpacing: -0.5,
          }}
        >
          Klass<span style={{ color: "var(--amber)" }}>room</span>
        </div>

        <div style={{ display: "flex", gap: "2rem" }}>
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                fontSize: 13,
                color: "rgba(250,248,244,0.4)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.color = "rgba(250,248,244,0.8)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.color = "rgba(250,248,244,0.4)")
              }
            >
              {l}
            </a>
          ))}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "rgba(250,248,244,0.25)",
            fontFamily: "var(--mono)",
          }}
        >
          © 2026 Klassroom
        </div>
      </div>
    </footer>
  );
}
