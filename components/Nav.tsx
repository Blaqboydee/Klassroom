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
      <nav className={`fixed top-0 left-0 right-0 z-[100] px-8 h-[60px] flex items-center justify-between border-b border-border backdrop-blur-[12px] transition-[background] duration-300 bg-[var(--color-paper)]`}>
        <a href="/" className="font-serif text-[22px] text-ink tracking-[-0.5px]">
          Klass<span className="text-amber">room</span>
        </a>

        <div className="nav-links-desktop">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
          ))}
          <a href="/signup" className="nav-cta nav-link">Get started</a>
        </div>

        <button
          className="landing-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
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

      {open && (
        <div className="landing-nav-drawer">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link text-base py-[6px]" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="/signup" className="nav-cta nav-link mt-[6px] text-center" onClick={() => setOpen(false)}>
            Get started
          </a>
        </div>
      )}
    </>
  );
}
