"use client";

import { useState, useEffect } from "react";

export default function Nav() {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
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
        background: navScrolled
          ? "rgba(250,248,244,0.96)"
          : "rgba(250,248,244,0.92)",
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

      <div
        className="nav-links-desktop"
        style={{ display: "flex", alignItems: "center", gap: "2rem" }}
      >
        <a href="#features" className="nav-link">Features</a>
        <a href="#how" className="nav-link">How it works</a>
        <a href="#streaks" className="nav-link">Streaks</a>
        <a href="/login" className="nav-link">Sign in</a>
        <a href="/signup" className="nav-cta nav-link">Get started</a>
      </div>
    </nav>
  );
}
