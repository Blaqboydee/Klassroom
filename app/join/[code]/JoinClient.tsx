"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Classroom } from "@/models/Classroom";

interface Props {
  code: string;
}

export default function JoinClient({ code }: Props) {
  const router = useRouter();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingClassroom, setLoadingClassroom] = useState(true);
  const [status, setStatus] = useState<"idle" | "joining" | "joined" | "error">("idle");

  // 1. Fetch classroom by code
  useEffect(() => {
    fetch(`/api/classrooms?code=${encodeURIComponent(code)}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<{ classroom: Classroom | null }>;
      })
      .then((data) => {
        if (data?.classroom) setClassroom(data.classroom);
        else if (!notFound) setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingClassroom(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // 2. Once classroom is loaded, check if the user is already logged in
  useEffect(() => {
    if (!classroom || status !== "idle") return;
    let user: { id: string; name: string; role: string } | null = null;
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) user = JSON.parse(raw);
    } catch { /* ignore */ }

    if (!user || user.role !== "student") return;

    // Already enrolled → just redirect
    if (classroom.memberIds.includes(user.id)) {
      router.push("/dashboard/student");
      return;
    }

    // Auto-join then redirect
    setStatus("joining");
    fetch("/api/classrooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: classroom.code, userId: user.id }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(() => {
        setStatus("joined");
        setTimeout(() => router.push("/dashboard/student"), 1200);
      })
      .catch(() => setStatus("error"));
  }, [classroom, status, router]);

  // ── Detect admin logged in ──────────────────────────────────────────────────
  let loggedInRole: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("klassroom_user");
      if (raw) loggedInRole = (JSON.parse(raw) as { role: string }).role;
    } catch { /* ignore */ }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loadingClassroom) {
    return (
      <div style={wrapStyle}>
        <div className="card" style={cardStyle}>
          <div className="skeleton" style={{ width: 160, height: 20, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 220, height: 14, borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={wrapStyle}>
        <div className="card" style={cardStyle}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-ink)", marginBottom: 8 }}>
            Invalid invite link
          </h1>
          <p style={{ color: "var(--color-ink)", opacity: 0.6, fontSize: 14, marginBottom: 24 }}>
            This classroom link is expired or doesn&apos;t exist.
          </p>
          <Link href="/" style={linkBtnStyle}>Go home</Link>
        </div>
      </div>
    );
  }

  if (loggedInRole === "admin") {
    return (
      <div style={wrapStyle}>
        <div className="card" style={cardStyle}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏫</div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-ink)", marginBottom: 8 }}>
            {classroom?.name}
          </h1>
          <p style={{ color: "var(--color-ink)", opacity: 0.6, fontSize: 14, marginBottom: 24 }}>
            Instructor accounts can&apos;t join classrooms as a student.
          </p>
          <Link href="/dashboard/admin" style={primaryBtnStyle}>Go to dashboard</Link>
        </div>
      </div>
    );
  }

  if (status === "joining") {
    return (
      <div style={wrapStyle}>
        <div className="card" style={cardStyle}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-ink)", marginBottom: 8 }}>
            Joining {classroom?.name}…
          </h1>
          <p style={{ color: "var(--color-ink)", opacity: 0.6, fontSize: 14 }}>Hang tight.</p>
        </div>
      </div>
    );
  }

  if (status === "joined") {
    return (
      <div style={wrapStyle}>
        <div className="card" style={cardStyle}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-teal)", marginBottom: 8 }}>
            You&apos;re in!
          </h1>
          <p style={{ color: "var(--color-ink)", opacity: 0.6, fontSize: 14 }}>
            Redirecting you to {classroom?.name}…
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={wrapStyle}>
        <div className="card" style={cardStyle}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-ink)", marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: "var(--color-ink)", opacity: 0.6, fontSize: 14, marginBottom: 24 }}>
            Couldn&apos;t join the classroom. Try again from your dashboard.
          </p>
          <Link href="/dashboard/student" style={primaryBtnStyle}>Go to dashboard</Link>
        </div>
      </div>
    );
  }

  // Not logged in — show the invite card
  return (
    <div style={wrapStyle}>
      <div className="card" style={cardStyle}>
        {/* Brand */}
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 700, color: "var(--color-teal)", letterSpacing: "0.04em", marginBottom: 20 }}>
          Klassroom
        </div>

        {/* Classroom info */}
        <div style={{ fontSize: 36, marginBottom: 10 }}>🏫</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--color-ink)", lineHeight: 1.2, marginBottom: 6 }}>
          {classroom?.name}
        </h1>
        <p style={{ color: "var(--color-ink)", opacity: 0.55, fontSize: 14, marginBottom: 28 }}>
          You&apos;ve been invited to join this classroom on Klassroom.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href={`/signup?join=${code}`} style={primaryBtnStyle}>
            Create account &amp; join
          </Link>
          <Link href={`/login?join=${code}`} style={secondaryBtnStyle}>
            Sign in &amp; join
          </Link>
        </div>

        <p style={{ marginTop: 20, fontSize: 14, color: "var(--color-ink)", opacity: 0.4 }}>
          Join code: <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>{code}</span>
        </p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const wrapStyle: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  background: "var(--color-paper)",
};

const cardStyle: React.CSSProperties = {
  maxWidth: 400,
  width: "100%",
  padding: "36px 32px",
  textAlign: "center",
  borderRadius: 16,
};

const primaryBtnStyle: React.CSSProperties = {
  display: "block",
  padding: "11px 20px",
  borderRadius: 10,
  background: "var(--color-teal)",
  color: "#fff",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
  letterSpacing: "0.01em",
};

const secondaryBtnStyle: React.CSSProperties = {
  display: "block",
  padding: "11px 20px",
  borderRadius: 10,
  background: "var(--color-paper-2)",
  color: "var(--color-ink)",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
  letterSpacing: "0.01em",
};

const linkBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 24px",
  borderRadius: 10,
  background: "var(--color-paper-2)",
  color: "var(--color-ink)",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};
