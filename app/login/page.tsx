"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginState = "idle" | "loading" | "error" | "success";

// ─── Real user lookup via /api/auth (POST) ───────────────────────────────────
async function lookupUserByEmail(
  email: string
): Promise<{ id: string; name: string; role: "student" | "admin" } | null> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const json = await res.json() as { user: { id: string; name: string; role: "student" | "admin" } };
  return { id: json.user.id, name: json.user.name, role: json.user.role };
}
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [detectedRole, setDetectedRole] = useState<"student" | "admin" | null>(null);
  const [detectedName, setDetectedName] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail || state === "loading") return;

    setState("loading");
    setErrorMsg("");

    const user = await lookupUserByEmail(email.trim());

    if (!user) {
      setState("error");
      setErrorMsg("No account found with that email. Check with your instructor.");
      return;
    }

    setDetectedRole(user.role);
    setDetectedName(user.name);
    // Persist session so dashboards can read the current user
    localStorage.setItem("klassroom_user", JSON.stringify({ id: user.id, name: user.name, role: user.role }));
    setState("success");

    // Brief pause so user sees the success state, then redirect
    setTimeout(() => {
      if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/student");
      }
    }, 1400);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #0f0e0c;
          --ink-2: #3a3830;
          --ink-3: #7a7770;
          --paper: #faf8f4;
          --paper-2: #f0ede6;
          --paper-3: #e4e0d8;
          --amber: #d97706;
          --amber-light: #fef3c7;
          --teal: #0f766e;
          --teal-light: #ccfbf1;
          --red: #dc2626;
          --red-light: #fee2e2;
          --border: rgba(15,14,12,0.12);
          --serif: 'DM Serif Display', serif;
          --sans: 'Outfit', sans-serif;
          --mono: 'DM Mono', monospace;
        }

        body {
          font-family: var(--sans);
          background: var(--paper);
          color: var(--ink);
          font-size: 16px;
          line-height: 1.6;
          min-height: 100vh;
        }

        .login-input {
          width: 100%;
          padding: 13px 16px;
          font-family: var(--sans);
          font-size: 15px;
          font-weight: 400;
          color: var(--ink);
          background: var(--paper);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .login-input::placeholder { color: var(--ink-3); }
        .login-input:focus {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px rgba(15,14,12,0.06);
        }
        .login-input.error {
          border-color: var(--red);
          box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
        }

        .submit-btn {
          width: 100%;
          padding: 13px;
          background: var(--ink);
          color: var(--paper);
          font-family: var(--sans);
          font-size: 15px;
          font-weight: 500;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          position: relative;
          overflow: hidden;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(15,14,12,0.16);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .submit-btn.success-btn {
          background: var(--teal);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(250,248,244,0.3);
          border-top-color: var(--paper);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.35s ease both; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .scale-in { animation: scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }

        .role-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 100px;
          font-family: var(--mono);
          font-size: 12px;
          font-weight: 500;
        }
        .role-pill.student {
          background: var(--amber-light);
          color: #92400e;
        }
        .role-pill.admin {
          background: var(--teal-light);
          color: #134e4a;
        }

        .decorative-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
          pointer-events: none;
        }

        .brand-link {
          font-family: var(--serif);
          font-size: 20px;
          color: var(--ink);
          text-decoration: none;
          letter-spacing: -0.5px;
        }
        .brand-link span { color: var(--amber); }

        .help-link {
          color: var(--ink-3);
          font-size: 13px;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: color 0.2s, border-color 0.2s;
        }
        .help-link:hover { color: var(--ink-2); border-color: var(--border); }

        .nav-links-row { display: flex; align-items: center; gap: 1.5rem; }
        .nav-burger {
          display: none; background: none; border: none;
          cursor: pointer; padding: 6px; color: var(--ink);
        }
        .nav-drawer {
          position: fixed; top: 60px; left: 0; right: 0; z-index: 49;
          background: rgba(250,248,244,0.98); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 1rem 2rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .nav-drawer a { font-size: 16px; padding: 6px 0; }
        @media (max-width: 600px) {
          .nav-links-row { display: none !important; }
          .nav-burger { display: block !important; }
        }

        .check-circle {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: rgba(250,248,244,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--paper)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background grid */}
        <div className="decorative-grid" />

        {/* Nav bar */}
        <nav
          style={{
            padding: "0 2rem",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 10,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <a href="/" className="brand-link">
            Klass<span>room</span>
          </a>
          <div className="nav-links-row">
            <a href="/signup" className="help-link">Create account</a>
            <a href="mailto:support@klassroom.com" className="help-link">Need help?</a>
          </div>
          <button className="nav-burger" aria-label={navOpen ? "Close menu" : "Open menu"} onClick={() => setNavOpen((o) => !o)}>
            {navOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            }
          </button>
        </nav>
        {navOpen && (
          <div className="nav-drawer">
            <a href="/signup" className="help-link" onClick={() => setNavOpen(false)}>Create account</a>
            <a href="mailto:support@klassroom.com" className="help-link" onClick={() => setNavOpen(false)}>Need help?</a>
          </div>
        )}

        {/* Main content */}
        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>

            {/* Card */}
            <div
              className="scale-in"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "2.5rem",
                boxShadow: "0 24px 64px rgba(15,14,12,0.08), 0 4px 16px rgba(15,14,12,0.04)",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "2rem" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    marginBottom: "1.25rem",
                    color: "var(--paper)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <h1
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 30,
                    lineHeight: 1.1,
                    letterSpacing: -0.5,
                    color: "var(--ink)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Welcome back
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 300,
                    color: "var(--ink-3)",
                    lineHeight: 1.55,
                  }}
                >
                  Enter your email — we&apos;ll find your account automatically.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    htmlFor="email"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink-2)",
                      marginBottom: 6,
                      letterSpacing: "0.01em",
                    }}
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`login-input${state === "error" ? " error" : ""}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === "error") setState("idle");
                    }}
                    disabled={state === "loading" || state === "success"}
                    autoFocus
                    autoComplete="email"
                  />

                  {/* Error message */}
                  {state === "error" && (
                    <div
                      className="slide-up"
                      style={{
                        marginTop: 8,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                        fontSize: 13,
                        color: "var(--red)",
                        fontWeight: 400,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        style={{ marginTop: 2, flexShrink: 0 }}
                      >
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      {errorMsg}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className={`submit-btn${state === "success" ? " success-btn" : ""}`}
                  disabled={!isValidEmail || state === "loading" || state === "success"}
                >
                  {state === "loading" && <div className="spinner" />}
                  {state === "loading" && "Checking your email…"}

                  {state === "success" && (
                    <>
                      <div className="check-circle">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      Redirecting you now…
                    </>
                  )}

                  {(state === "idle" || state === "error") && (
                    <>
                      Continue
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Success role reveal */}
              {state === "success" && detectedRole && (
                <div
                  className="slide-up"
                  style={{
                    marginTop: "1.25rem",
                    padding: "14px 16px",
                    background: detectedRole === "admin" ? "var(--teal-light)" : "var(--amber-light)",
                    border: `1px solid ${detectedRole === "admin" ? "rgba(15,118,110,0.2)" : "rgba(217,119,6,0.2)"}`,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: detectedRole === "admin" ? "#0f766e" : "#d97706",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {detectedRole === "admin"
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    }
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      {detectedName}
                    </div>
                    <div style={{ marginTop: 3 }}>
                      <span
                        className={`role-pill ${detectedRole}`}
                        style={{ fontSize: 11, padding: "2px 8px" }}
                      >
                        {detectedRole === "admin" ? "Instructor" : "Student"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div
                style={{
                  margin: "1.75rem 0",
                  borderTop: "1px solid var(--border)",
                }}
              />

              {/* Info note */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 14px",
                  background: "var(--paper-2)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  style={{ marginTop: 2, flexShrink: 0 }}
                >
                  <circle cx="7.5" cy="7.5" r="6.5" stroke="var(--ink-3)" strokeWidth="1.2" />
                  <path d="M7.5 5v.5M7.5 7v3.5" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--ink-3)",
                    lineHeight: 1.55,
                    fontWeight: 300,
                  }}
                >
                  Your role is detected automatically from your email. If you
                  don&apos;t have an account yet, ask your instructor to add you.
                </p>
              </div>
            </div>

            {/* Below card — demo hint */}
            <div
              style={{
                marginTop: "1.5rem",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-3)",
                  fontFamily: "var(--mono)",
                }}
              >
                Demo accounts →{" "}
                <button
                  onClick={() => setEmail("adaeze@class.com")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--amber)",
                    cursor: "pointer",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  student
                </button>
                {" · "}
                <button
                  onClick={() => setEmail("admin@class.com")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--teal)",
                    cursor: "pointer",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  instructor
                </button>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            padding: "1.25rem 2rem",
            textAlign: "center",
            borderTop: "1px solid var(--border)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              fontFamily: "var(--mono)",
            }}
          >
            © 2026 Klassroom · Built for real classrooms
          </p>
        </footer>
      </div>
    </>
  );
}