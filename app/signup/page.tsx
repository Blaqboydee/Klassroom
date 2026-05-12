"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type SignupState = "idle" | "loading" | "error" | "success";

// ─── Real registration via /api/auth (PUT) ───────────────────────────────────
async function registerUser(data: {
  name: string;
  email: string;
  role: "student" | "admin";
  password?: string;
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, setState] = useState<SignupState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get("join");
    if (code) setJoinCode(code.toUpperCase());
  }, []);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidName = name.trim().length >= 2;
  const isValidPassword = role === "student" || (password.length >= 6 && password === confirmPassword);
  const canSubmit = isValidEmail && isValidName && isValidPassword && state !== "loading" && state !== "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (role === "admin" && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMsg("");

    const result = await registerUser({
      name: name.trim(),
      email: email.trim(),
      role,
      password: role === "admin" ? password : undefined,
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

    // If arriving from an invite link, join the classroom first
    if (joinCode && result.user?.role === "student") {
      await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode, userId: result.user.id }),
      }).catch(() => { /* non-fatal */ });
    }

    setTimeout(() => {
      router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/student");
    }, 1400);
  }

  return (
    <>


      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <div className="decorative-grid" />

        {/* Nav */}
        <nav className="px-8 h-[60px] flex items-center justify-between relative z-10 border-b border-border">
          <a href="/" className="brand-link">
            Klass<span>room</span>
          </a>
          <span className="nav-signin-row">
            Already have an account?{" "}
            <a href="/login" className="text-link ml-1">
              Sign in
            </a>
          </span>
          <button className="auth-burger" aria-label={navOpen ? "Close menu" : "Open menu"} onClick={() => setNavOpen((o) => !o)}>
            {navOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            }
          </button>
        </nav>
        {navOpen && (
          <div className="auth-drawer">
            <span className="text-[14px] text-ink-3">
              Already have an account?{" "}
              <a href="/login" className="text-link" onClick={() => setNavOpen(false)}>Sign in</a>
            </span>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-[420px]">
            <div className="animate-scale-in bg-paper border border-border rounded-[20px] p-7 shadow-[0_24px_64px_rgba(15,14,12,0.08),0_4px_16px_rgba(15,14,12,0.04)]">
              {/* Header */}
              <div className="mb-5">
                <div className="w-12 h-12 rounded-[14px] bg-ink flex items-center justify-center text-[22px] mb-3 text-paper">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </div>
                <h1 className="font-serif text-[30px] leading-[1.1] tracking-[-0.5px] text-ink mb-2">
                  Join your classroom
                </h1>
                <p className="text-[14px] font-light text-ink-3 leading-[1.55]">
                  {role === "admin" ? "Create your instructor account. Set a password to protect it." : "Create your account in seconds. No password needed."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-3">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-[13px] font-medium text-ink-2 mb-[6px]">
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
                    <label htmlFor="email" className="block text-[13px] font-medium text-ink-2 mb-[6px]">
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
                      <div className="animate-slide-up mt-2 flex items-start gap-[6px] text-[13px] text-red">
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
                    <label className="block text-[13px] font-medium text-ink-2 mb-2">
                      I am a…
                    </label>
                    <div className="role-toggle">
                      <button
                        type="button"
                        className={`role-option${role === "student" ? " selected-student" : ""}`}
                        onClick={() => { setRole("student"); setPassword(""); setConfirmPassword(""); }}
                        disabled={state === "loading" || state === "success"}
                      >
                        <span className="text-[22px]"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></span>
                        <span className="role-option-label">Student</span>
                        <span className="role-option-desc">Submit assignments &amp; track streaks</span>
                      </button>
                      <button
                        type="button"
                        className={`role-option${role === "admin" ? " selected-admin" : ""}`}
                        onClick={() => setRole("admin")}
                        disabled={state === "loading" || state === "success"}
                      >
                        <span className="text-[22px]"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                        <span className="role-option-label">Instructor</span>
                        <span className="role-option-desc">Create assignments &amp; monitor class</span>
                      </button>
                    </div>
                  </div>

                  {/* Password fields — admin only */}
                  {role === "admin" && (
                    <>
                      <div>
                        <label htmlFor="password" className="block text-[13px] font-medium text-ink-2 mb-[6px]">
                          Password <span className="text-ink-3 font-normal">(min. 6 characters)</span>
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="signup-input pr-10"
                            placeholder="Create a secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={state === "loading" || state === "success"}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword
                              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            }
                          </button>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="confirm-password" className="block text-[13px] font-medium text-ink-2 mb-[6px]">
                          Confirm password
                        </label>
                        <div className="relative">
                          <input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            className={`signup-input pr-10${confirmPassword && password !== confirmPassword ? " error" : ""}`}
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={state === "loading" || state === "success"}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword
                              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            }
                          </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                          <p className="text-[12px] text-red mt-1">Passwords do not match</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    className={`submit-btn${state === "success" ? " success-btn" : ""}`}
                    disabled={!canSubmit}
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
              <div className="my-4 border-t border-border" />

              {/* Info note */}
              <div className="flex items-start gap-[10px] p-[10px_12px] bg-paper-2 rounded-[10px] border border-border">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="mt-[2px] shrink-0">
                  <circle cx="7.5" cy="7.5" r="6.5" stroke="var(--ink-3)" strokeWidth="1.2" />
                  <path
                    d="M7.5 5v.5M7.5 7v3.5"
                    stroke="var(--ink-3)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-[12px] text-ink-3 leading-[1.55] font-light">
                  {role === "admin"
                    ? "Instructors sign in with their email and password."
                    : "Students sign in with email only \u2014 no password needed."}
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-5 text-center border-t border-border relative z-10">
          <p className="text-[12px] text-ink-3 font-mono">
          </p>
        </footer>
      </div>
    </>
  );
}
