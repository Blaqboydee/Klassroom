"use client";

import { useState, useEffect } from "react";

export default function Nav() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 600) setOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#streaks", label: "Streaks" },
    { href: "/login", label: "Sign in" },
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 2rem",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: navScrolled ? "rgba(250,248,244,0.96)" : "rgba(250,248,244,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          transition: "background 0.3s",
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "var(--serif)",
            fontSize: 22,
            color: "var(--ink)",
            letterSpacing: -0.5,
            textDecoration: "none",
          }}
        >
          Klass<span style={{ color: "var(--amber)" }}>room</span>
        </a>

        {/* Desktop links */}
        <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
          ))}
          <a href="/signup" className="nav-cta nav-link">Get started</a>
        </div>

        {/* Burger button — mobile only */}
        <button
          className="nav-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            color: "var(--ink)",
          }}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          className="nav-drawer"
          style={{
            position: "fixed",
            top: 60,
            left: 0,
            right: 0,
            zIndex: 99,
            background: "rgba(250,248,244,0.98)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
            padding: "1rem 2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link"
              style={{ fontSize: 16, padding: "6px 0" }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/signup"
            className="nav-cta nav-link"
            style={{ marginTop: 6, textAlign: "center" }}
            onClick={() => setOpen(false)}
          >
            Get started
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .nav-links-desktop { display: none !important; }
          .nav-burger { display: block !important; }
        }
      `}</style>
    </>
  );
}
