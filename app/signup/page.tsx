"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SignupState = "idle" | "loading" | "error" | "success";

// ─── Real registration via /api/auth (PUT) ───────────────────────────────────
async function registerUser(data: {
  name: string;
  email: string;
  role: "student" | "admin";
}): Promise<{ ok: boolean; user?: { id: string; name: string; role: "student" | "admin" }; error?: string }> {
  const res = await fetch("/api/auth", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.status === 409) return { ok: false, error: "An account with that email already exists." };
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { error?: string };
    return { ok: false, error: json.error ?? "Registration failed. Please try again." };
  }

  const json = await res.json() as { user: { id: string; name: string; role: "student" | "admin" } };
  return { ok: true, user: json.user };
}
// ─────────────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [state, setState] = useState<SignupState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidName = name.trim().length >= 2;
  const canSubmit = isValidEmail && isValidName && state !== "loading" && state !== "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setState("loading");
    setErrorMsg("");

    const result = await registerUser({
      name: name.trim(),
      email: email.trim(),
      role,
    });

    if (!result.ok) {
      setState("error");
      setErrorMsg(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    // Persist session so dashboards can read the current user
    if (result.user) {
      localStorage.setItem("klassroom_user", JSON.stringify(result.user));
    }
    setState("success");

    setTimeout(() => {
      router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/student");
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

        .signup-input {
          width: 100%;
          padding: 10px 14px;
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
        .signup-input::placeholder { color: var(--ink-3); }
        .signup-input:focus {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px rgba(15,14,12,0.06);
        }
        .signup-input.error {
          border-color: var(--red);
          box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
        }

        .role-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .role-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 10px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          background: var(--paper);
          text-align: center;
        }
        .role-option:hover { background: var(--paper-2); }
        .role-option.selected-student {
          border-color: var(--amber);
          background: var(--amber-light);
        }
        .role-option.selected-admin {
          border-color: var(--teal);
          background: var(--teal-light);
        }
        .role-option-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--ink);
        }
        .role-option-desc {
          font-size: 11px;
          color: var(--ink-3);
          font-weight: 300;
        }

        .submit-btn {
          width: 100%;
          padding: 11px;
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
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s, background 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(15,14,12,0.16);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .submit-btn.success-btn { background: var(--teal); }

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

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .scale-in { animation: scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }

        .check-circle {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: rgba(250,248,244,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
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

        .text-link {
          color: var(--ink-2);
          font-size: 13px;
          text-decoration: none;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1px;
          transition: color 0.2s, border-color 0.2s;
        }
        .text-link:hover { color: var(--ink); border-color: var(--ink-3); }
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
        <div className="decorative-grid" />

        {/* Nav */}
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
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
            Already have an account?{" "}
            <a href="/login" className="text-link">
              Sign in
            </a>
          </span>
        </nav>

        {/* Main */}
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
            <div
              className="scale-in"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "1.75rem",
                boxShadow:
                  "0 24px 64px rgba(15,14,12,0.08), 0 4px 16px rgba(15,14,12,0.04)",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "1.25rem" }}>
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
                    marginBottom: "0.75rem",
                    color: "var(--paper)",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
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
                  Join your classroom
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 300,
                    color: "var(--ink-3)",
                    lineHeight: 1.55,
                  }}
                >
                  Create your account in seconds. No password needed.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-2)",
                        marginBottom: 6,
                      }}
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="signup-input"
                      placeholder="Adaeze Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={state === "loading" || state === "success"}
                      autoFocus
                      autoComplete="name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-2)",
                        marginBottom: 6,
                      }}
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={`signup-input${state === "error" ? " error" : ""}`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (state === "error") setState("idle");
                      }}
                      disabled={state === "loading" || state === "success"}
                      autoComplete="email"
                    />
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
                          <path
                            d="M7 4v3.5M7 9.5v.5"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                        </svg>
                        {errorMsg}
                      </div>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-2)",
                        marginBottom: 8,
                      }}
                    >
                      I am a…
                    </label>
                    <div className="role-toggle">
                      <button
                        type="button"
                        className={`role-option${role === "student" ? " selected-student" : ""}`}
                        onClick={() => setRole("student")}
                        disabled={state === "loading" || state === "success"}
                      >
                        <span style={{ fontSize: 22 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></span>
                        <span className="role-option-label">Student</span>
                        <span className="role-option-desc">Submit assignments &amp; track streaks</span>
                      </button>
                      <button
                        type="button"
                        className={`role-option${role === "admin" ? " selected-admin" : ""}`}
                        onClick={() => setRole("admin")}
                        disabled={state === "loading" || state === "success"}
                      >
                        <span style={{ fontSize: 22 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                        <span className="role-option-label">Instructor</span>
                        <span className="role-option-desc">Create assignments &amp; monitor class</span>
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className={`submit-btn${state === "success" ? " success-btn" : ""}`}
                    disabled={!canSubmit}
                    style={{ marginTop: 4 }}
                  >
                    {state === "loading" && <div className="spinner" />}
                    {state === "loading" && "Creating your account…"}

                    {state === "success" && (
                      <>
                        <div className="check-circle">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path
                              d="M2 5.5l2.5 2.5 4.5-4.5"
                              stroke="white"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        Account created — redirecting…
                      </>
                    )}

                    {(state === "idle" || state === "error") && (
                      <>
                        Create account
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M3 7h8M7 3l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div style={{ margin: "1rem 0", borderTop: "1px solid var(--border)" }} />

              {/* Info note */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
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
                  <path
                    d="M7.5 5v.5M7.5 7v3.5"
                    stroke="var(--ink-3)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--ink-3)",
                    lineHeight: 1.55,
                    fontWeight: 300,
                  }}
                >
                  No password required. You&apos;ll sign in with your email address
                  going forward.
                </p>
              </div>
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
