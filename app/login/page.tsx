"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginState = "idle" | "loading" | "error" | "success";

// ─── Auth API call ────────────────────────────────────────────────────────────
async function loginUser(
  email: string, password?: string
): Promise<
  | { ok: true; user: { id: string; name: string; role: "student" | "admin" } }
  | { ok: false; needsPassword?: boolean; error: string }
> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 404) return { ok: false, error: "No account found with that email. Check with your instructor." };
  if (res.status === 401) {
    const json = await res.json().catch(() => ({})) as { error?: string; needsPassword?: boolean };
    return { ok: false, needsPassword: json.needsPassword, error: json.error ?? "Incorrect password." };
  }
  if (!res.ok) return { ok: false, error: "Something went wrong. Please try again." };

  const json = await res.json() as { user: { id: string; name: string; role: "student" | "admin" } };
  return { ok: true, user: json.user };
}
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [state, setState] = useState<LoginState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail || state === "loading") return;
    if (step === "password" && !password) return;

    setState("loading");
    setErrorMsg("");

    const result = await loginUser(email.trim(), step === "password" ? password : undefined);

    if (!result.ok) {
      if (result.needsPassword) {
        // Admin account detected — ask for password
        setState("idle");
        setStep("password");
        return;
      }
      setState("error");
      setErrorMsg(result.error);
      return;
    }

    const user = result.user;
    localStorage.setItem("klassroom_user", JSON.stringify({ id: user.id, name: user.name, role: user.role }));
    setState("success");

    setTimeout(() => {
      router.push(user.role === "admin" ? "/dashboard/admin" : "/dashboard/student");
    }, 1400);
  }

  return (
    <>


      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <div className="decorative-grid" />

        {/* Nav bar */}
        <nav className="px-8 h-[60px] flex items-center justify-between relative z-10 border-b border-border">
          <a href="/" className="brand-link">
            Klass<span>room</span>
          </a>
          <div className="nav-links-row">
            <a href="/signup" className="help-link">Create account</a>
            <a href="mailto:support@klassroom.com" className="help-link">Need help?</a>
          </div>
          <button className="auth-burger" aria-label={navOpen ? "Close menu" : "Open menu"} onClick={() => setNavOpen((o) => !o)}>
            {navOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            }
          </button>
        </nav>
        {navOpen && (
          <div className="auth-drawer">
            <a href="/signup" className="help-link" onClick={() => setNavOpen(false)}>Create account</a>
            <a href="mailto:support@klassroom.com" className="help-link" onClick={() => setNavOpen(false)}>Need help?</a>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-[420px]">

            {/* Card */}
            <div className="animate-scale-in bg-paper border border-border rounded-[20px] p-10 shadow-[0_24px_64px_rgba(15,14,12,0.08),0_4px_16px_rgba(15,14,12,0.04)]">
              {/* Header */}
              <div className="mb-8">
                <div className="w-12 h-12 rounded-[14px] bg-ink flex items-center justify-center text-[22px] mb-5 text-paper">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                </div>
                <h1 className="font-serif text-[30px] leading-[1.1] tracking-[-0.5px] text-ink mb-2">
                  Welcome back
                </h1>
                <p className="text-[14px] font-light text-ink-3 leading-[1.55]">
                  {step === "email"
                    ? "Enter your email — we\u2019ll find your account automatically."
                    : "Enter your instructor password to continue."}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-[13px] font-medium text-ink-2 mb-[6px] tracking-[0.01em]">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`login-input${state === "error" && step === "email" ? " error" : ""}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === "error") setState("idle");
                      if (step === "password") { setStep("email"); setPassword(""); }
                    }}
                    disabled={state === "loading" || state === "success"}
                    autoFocus={step === "email"}
                    autoComplete="email"
                  />
                </div>

                {step === "password" && (
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-[13px] font-medium text-ink-2 mb-[6px] tracking-[0.01em]">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      className={`login-input${state === "error" ? " error" : ""}`}
                      placeholder="Your instructor password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (state === "error") setState("idle");
                      }}
                      disabled={state === "loading" || state === "success"}
                      autoFocus
                      autoComplete="current-password"
                    />
                  </div>
                )}

                  {/* Error message */}
                  {state === "error" && (
                    <div className="animate-slide-up mb-3 flex items-start gap-[6px] text-[13px] text-red">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-[2px] shrink-0">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      {errorMsg}
                    </div>
                  )}

                {/* Submit button */}
                <button
                  type="submit"
                  className={`submit-btn${state === "success" ? " success-btn" : ""}`}
                  disabled={!isValidEmail || (step === "password" && !password) || state === "loading" || state === "success"}
                >
                  {state === "loading" && <div className="spinner" />}
                  {state === "loading" && "Checking…"}

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
                      {step === "email" ? "Continue" : "Sign in"}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-7 border-t border-border" />

              {/* Info note */}
              <div className="flex items-start gap-[10px] p-[12px_14px] bg-paper-2 rounded-[10px] border border-border">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="mt-[2px] shrink-0">
                  <circle cx="7.5" cy="7.5" r="6.5" stroke="var(--ink-3)" strokeWidth="1.2" />
                  <path d="M7.5 5v.5M7.5 7v3.5" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <p className="text-[12px] text-ink-3 leading-[1.55] font-light">
                  Students sign in with email only. Instructors also need their password.
                  No account yet? <a href="/signup" className="underline">Sign up</a>.
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