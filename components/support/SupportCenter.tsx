"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSupportRealtime } from "@/hooks/useSupportRealtime";
import {
  getStoredSupportToken,
  storeSupportToken,
  supportApi,
  type SupportConversationListItemDto,
  type SupportMessageDto,
  type SupportStatus,
} from "@/lib/support";

type Role = "student" | "admin";

type SessionUser = { id: string; name: string; role: Role };

function formatDate(value?: string | null) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function lastActivity(conversation: SupportConversationListItemDto) {
  return conversation.lastMessageAt ?? conversation.updatedDate ?? conversation.createdDate;
}

function sortConversations(items: SupportConversationListItemDto[]) {
  return [...items].sort(
    (a, b) => new Date(lastActivity(b)).getTime() - new Date(lastActivity(a)).getTime()
  );
}

function appendMessage(
  current: Record<string, SupportMessageDto[]>,
  message: SupportMessageDto
) {
  const existing = current[message.conversationId] ?? [];
  if (existing.some((item) => item.id === message.id)) return current;
  return {
    ...current,
    [message.conversationId]: [...existing, message].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    ),
  };
}

function updateConversationPreview(
  conversations: SupportConversationListItemDto[],
  message: SupportMessageDto
) {
  return sortConversations(
    conversations.map((conversation) =>
      conversation.conversationId === message.conversationId
        ? {
            ...conversation,
            lastMessage: message.message ?? (message.imageUrl ? "Image" : ""),
            lastSenderRole: message.senderRole,
            lastMessageAt: message.sentAt,
            updatedDate: message.sentAt,
            messageCount: conversation.messageCount + 1,
          }
        : conversation
    )
  );
}

function getSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem("klassroom_user");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function SupportCenter({ role }: { role: Role }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navOpen, setNavOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [editingToken, setEditingToken] = useState(false);
  const [status, setStatus] = useState<SupportStatus>("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<SupportConversationListItemDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messagesByConversationId, setMessagesByConversationId] = useState<Record<string, SupportMessageDto[]>>({});
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const [composer, setComposer] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [newCaseMessage, setNewCaseMessage] = useState("");
  const [newCaseImageUrl, setNewCaseImageUrl] = useState("");
  const [creatingCase, setCreatingCase] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(user.role === "admin" ? "/dashboard/admin" : "/dashboard/student");
      return;
    }
    const savedToken = getStoredSupportToken();
    const timer = window.setTimeout(() => {
      setToken(savedToken);
      setTokenDraft(savedToken);
      setEditingToken(!savedToken);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [role, router]);

  const loadConversations = useCallback(async () => {
    if (!token) return;
    setLoadingCases(true);
    setError("");
    try {
      const data =
        role === "admin"
          ? await supportApi.getAdminConversations(token, status, 1, 20, searchTerm)
          : await supportApi.getMyConversations(token, status, 1, 20);
      const sorted = sortConversations(data);
      setConversations(sorted);

      const queryCase = searchParams.get("case");
      const nextSelected =
        queryCase && sorted.some((item) => item.conversationId === queryCase)
          ? queryCase
          : sorted[0]?.conversationId ?? null;
      setSelectedId(nextSelected);
    } catch (err) {
      setConversations([]);
      setSelectedId(null);
      setError(err instanceof Error ? err.message : "Failed to load support cases");
    } finally {
      setLoadingCases(false);
    }
  }, [role, searchParams, searchTerm, status, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadConversations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadConversations]);

  const selectConversation = useCallback(
    (conversationId: string | null) => {
      setSelectedId(conversationId);
      const params = new URLSearchParams(searchParams.toString());
      if (conversationId) params.set("case", conversationId);
      else params.delete("case");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!token || !selectedId || messagesByConversationId[selectedId]) return;
    const timer = window.setTimeout(async () => {
      setLoadingMessages(true);
      setError("");
      try {
        const messages =
          role === "admin"
            ? await supportApi.getAdminConversationMessages(token, selectedId)
            : await supportApi.getUserConversationMessages(token, selectedId);
        setMessagesByConversationId((prev) => ({
          ...prev,
          [selectedId]: messages.sort(
            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
          ),
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [messagesByConversationId, role, selectedId, token]);

  const handleRealtimeMessage = useCallback((message: SupportMessageDto) => {
    setMessagesByConversationId((prev) => appendMessage(prev, message));
    setConversations((prev) => updateConversationPreview(prev, message));
  }, []);

  const realtimeState = useSupportRealtime(token, handleRealtimeMessage);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.conversationId === selectedId) ?? null,
    [conversations, selectedId]
  );
  const messages = selectedId ? messagesByConversationId[selectedId] ?? [] : [];

  function saveToken() {
    const next = tokenDraft.trim();
    storeSupportToken(next);
    setToken(next);
    setEditingToken(false);
    setMessagesByConversationId({});
  }

  async function handleCreateCase(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newCaseMessage.trim() || creatingCase) return;
    setCreatingCase(true);
    setError("");
    try {
      const created = await supportApi.createConversation(token, {
        initialMessage: newCaseMessage.trim(),
        initialImageUrl: newCaseImageUrl.trim() || null,
      });
      setNewCaseMessage("");
      setNewCaseImageUrl("");
      setNewCaseOpen(false);
      await loadConversations();
      selectConversation(created.conversationId);
      setMessagesByConversationId((prev) => {
        const next = { ...prev };
        delete next[created.conversationId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create support case");
    } finally {
      setCreatingCase(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedId || (!composer.trim() && !imageUrl.trim()) || sending) return;
    setSending(true);
    setError("");
    try {
      const payload = { message: composer.trim(), imageUrl: imageUrl.trim() || null };
      const sent =
        role === "admin"
          ? await supportApi.adminReply(token, selectedId, payload)
          : await supportApi.sendMessage(token, {
              conversationId: selectedId,
              message: payload.message,
              imageUrl: payload.imageUrl ?? undefined,
              startNewConversation: false,
            });
      setMessagesByConversationId((prev) => appendMessage(prev, sent));
      setConversations((prev) => updateConversationPreview(prev, sent));
      setComposer("");
      setImageUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  async function handleCloseCase() {
    if (!token || !selectedId || role !== "admin") return;
    setError("");
    try {
      await supportApi.closeConversation(token, selectedId);
      setConversations((prev) => prev.filter((item) => item.conversationId !== selectedId));
      selectConversation(null);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close case");
    }
  }

  function handleSignOut() {
    try {
      localStorage.removeItem("klassroom_user");
    } catch {}
    router.push("/login");
  }

  const realtimeLabel =
    realtimeState === "connected"
      ? "Realtime on"
      : realtimeState === "connecting"
        ? "Connecting"
        : realtimeState === "error"
          ? "Realtime unavailable"
          : "Realtime idle";

  return (
    <>
      <nav className="dash-nav">
        <Link href={role === "admin" ? "/dashboard/admin" : "/dashboard/student"} className="brand">
          Klass<span>room</span>
        </Link>
        <div className="nav-links">
          {role === "admin" ? (
            <>
              <Link href="/dashboard/admin" className={`nav-link-dash${pathname === "/dashboard/admin" ? " active" : ""}`}>Overview</Link>
              <Link href="/dashboard/admin/assignments" className={`nav-link-dash${pathname === "/dashboard/admin/assignments" ? " active" : ""}`}>Assignments</Link>
              <Link href="/dashboard/admin/announcements" className={`nav-link-dash${pathname === "/dashboard/admin/announcements" ? " active" : ""}`}>Announcements</Link>
              <Link href="/dashboard/admin/challenges" className={`nav-link-dash${pathname === "/dashboard/admin/challenges" ? " active" : ""}`}>Challenges</Link>
              <Link href="/dashboard/admin/support" className={`nav-link-dash${pathname === "/dashboard/admin/support" ? " active" : ""}`}>Support</Link>
              <Link href="/live" className={`nav-link-dash${pathname === "/live" ? " active" : ""}`}>Live board</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard/student" className={`nav-link-dash${pathname === "/dashboard/student" ? " active" : ""}`}>My assignments</Link>
              <Link href="/dashboard/student/announcements" className={`nav-link-dash${pathname === "/dashboard/student/announcements" ? " active" : ""}`}>Announcements</Link>
              <Link href="/dashboard/student/history" className={`nav-link-dash${pathname === "/dashboard/student/history" ? " active" : ""}`}>History</Link>
              <Link href="/dashboard/student/support" className={`nav-link-dash${pathname === "/dashboard/student/support" ? " active" : ""}`}>Support</Link>
            </>
          )}
          <button className="nav-signout" onClick={() => setShowSignOutModal(true)}>Sign out</button>
        </div>
        <button className="nav-burger" aria-label={navOpen ? "Close menu" : "Open menu"} onClick={() => setNavOpen((open) => !open)}>
          {navOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          )}
        </button>
      </nav>

      {navOpen && (
        <div className="nav-drawer">
          {role === "admin" ? (
            <>
              <Link href="/dashboard/admin" className="nav-link-dash" onClick={() => setNavOpen(false)}>Overview</Link>
              <Link href="/dashboard/admin/assignments" className="nav-link-dash" onClick={() => setNavOpen(false)}>Assignments</Link>
              <Link href="/dashboard/admin/announcements" className="nav-link-dash" onClick={() => setNavOpen(false)}>Announcements</Link>
              <Link href="/dashboard/admin/challenges" className="nav-link-dash" onClick={() => setNavOpen(false)}>Challenges</Link>
              <Link href="/dashboard/admin/support" className="nav-link-dash active" onClick={() => setNavOpen(false)}>Support</Link>
              <Link href="/live" className="nav-link-dash" onClick={() => setNavOpen(false)}>Live board</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard/student" className="nav-link-dash" onClick={() => setNavOpen(false)}>My assignments</Link>
              <Link href="/dashboard/student/announcements" className="nav-link-dash" onClick={() => setNavOpen(false)}>Announcements</Link>
              <Link href="/dashboard/student/history" className="nav-link-dash" onClick={() => setNavOpen(false)}>History</Link>
              <Link href="/dashboard/student/support" className="nav-link-dash active" onClick={() => setNavOpen(false)}>Support</Link>
            </>
          )}
          <button className="nav-signout" onClick={() => { setNavOpen(false); setShowSignOutModal(true); }}>Sign out</button>
        </div>
      )}

      <main className="page">
        <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 className="greeting">{role === "admin" ? "Support queue" : "Support"}</h1>
            <p className="greeting-sub">
              {role === "admin"
                ? "Reply to open cases and review closed support conversations"
                : "Create a case and keep the conversation tied to the right issue"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className={`status-pill ${realtimeState === "connected" ? "pill-submitted" : "pill-pending"}`}>{realtimeLabel}</span>
            <button className="copy-btn" style={{ border: "1px solid var(--color-border)", padding: "6px 10px", fontSize: 14 }} onClick={() => setEditingToken((open) => !open)}>
              {editingToken ? "Hide token" : token ? "Change token" : "Add token"}
            </button>
          </div>
        </div>

        {(editingToken || !token) && (
          <div className="card">
            <div className="card-body">
              <div className="section-label" style={{ marginTop: 0 }}>Support API token</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="form-input"
                  style={{ flex: "1 1 320px" }}
                  type="password"
                  value={tokenDraft}
                  onChange={(e) => setTokenDraft(e.target.value)}
                  placeholder="Paste the JWT used by the support backend"
                />
                <button className="create-btn" onClick={saveToken} disabled={!tokenDraft.trim()}>Save token</button>
              </div>
              <p className="text-[13px] text-ink-3 mt-2">
                The support service requires a bearer token. This is stored locally in your browser as <span className="font-mono">klassroom_support_token</span>.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="card" style={{ borderColor: "rgba(220,38,38,0.25)", background: "var(--color-red-light)" }}>
            <div className="card-body" style={{ color: "#991b1b", fontSize: 14 }}>{error}</div>
          </div>
        )}

        {token && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)", gap: 16, alignItems: "start" }} className="support-grid">
            <section className="card" style={{ marginBottom: 0 }}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div className="section-label" style={{ margin: 0 }}>{role === "admin" ? "Cases" : "Your cases"}</div>
                  {role === "student" && (
                    <button className="create-btn" style={{ padding: "6px 12px", fontSize: 14 }} onClick={() => setNewCaseOpen((open) => !open)}>
                      {newCaseOpen ? "Cancel" : "New case"}
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                  {(["open", "closed", "all"] as SupportStatus[]).map((item) => (
                    <button
                      key={item}
                      className={`filter-btn${status === item ? " active" : ""}`}
                      onClick={() => {
                        setStatus(item);
                        setMessagesByConversationId({});
                      }}
                    >
                      {item[0].toUpperCase() + item.slice(1)}
                    </button>
                  ))}
                </div>

                {role === "admin" && (
                  <input
                    className="form-input"
                    style={{ marginBottom: 12 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search queue"
                  />
                )}

                {newCaseOpen && role === "student" && (
                  <form onSubmit={handleCreateCase} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={newCaseMessage}
                      onChange={(e) => setNewCaseMessage(e.target.value)}
                      placeholder="Describe the issue"
                    />
                    <input
                      className="form-input"
                      value={newCaseImageUrl}
                      onChange={(e) => setNewCaseImageUrl(e.target.value)}
                      placeholder="Optional image URL"
                    />
                    <button className="create-btn" disabled={!newCaseMessage.trim() || creatingCase}>
                      {creatingCase ? "Creating..." : "Create case"}
                    </button>
                  </form>
                )}

                {loadingCases ? (
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2].map((item) => <span key={item} className="skeleton h-16 w-full block rounded-lg" />)}
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="text-[13px] text-ink-3">No {status === "all" ? "" : status} cases found.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.conversationId}
                        onClick={() => selectConversation(conversation.conversationId)}
                        style={{
                          textAlign: "left",
                          border: "1px solid var(--color-border)",
                          background: selectedId === conversation.conversationId ? "var(--color-teal-light)" : "var(--color-paper-2)",
                          borderRadius: 12,
                          padding: "10px 12px",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>Case {conversation.conversationId.slice(0, 8)}</span>
                          <span className={`status-pill ${conversation.isOpen ? "pill-submitted" : "pill-pending"}`} style={{ fontSize: 12 }}>
                            {conversation.isOpen ? "Open" : "Closed"}
                          </span>
                        </div>
                        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {conversation.lastMessage ?? "No messages yet"}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-ink-3)", fontFamily: "var(--font-mono)" }}>
                          {conversation.messageCount} message{conversation.messageCount === 1 ? "" : "s"} - {formatDate(lastActivity(conversation))}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="card" style={{ marginBottom: 0, minHeight: 560 }}>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", minHeight: 560 }}>
                {selectedConversation ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div className="section-label" style={{ marginTop: 0, marginBottom: 6 }}>Case {selectedConversation.conversationId.slice(0, 8)}</div>
                        <p className="text-[13px] text-ink-3">
                          User {selectedConversation.userId.slice(0, 8)} - {selectedConversation.isOpen ? "Open" : "Closed"}
                        </p>
                      </div>
                      {role === "admin" && selectedConversation.isOpen && (
                        <button className="copy-btn" style={{ color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)", padding: "6px 10px", fontSize: 14 }} onClick={handleCloseCase}>
                          Close case
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: 12, padding: 12, background: "var(--color-paper-2)", minHeight: 320 }}>
                      {loadingMessages ? (
                        <div className="flex flex-col gap-2">
                          {[0, 1, 2].map((item) => <span key={item} className="skeleton h-12 w-full block rounded-lg" />)}
                        </div>
                      ) : messages.length === 0 ? (
                        <p className="text-[13px] text-ink-3">No messages in this case yet.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {messages.map((message) => {
                            const fromAdmin = message.senderRole === "Admin";
                            const mine = role === "admin" ? fromAdmin : !fromAdmin;
                            return (
                              <div key={message.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                                <div style={{
                                  maxWidth: "76%",
                                  borderRadius: 12,
                                  padding: "10px 12px",
                                  background: mine ? "var(--color-ink)" : "var(--color-paper)",
                                  color: mine ? "var(--color-paper)" : "var(--color-ink)",
                                  border: mine ? "none" : "1px solid var(--color-border)",
                                }}>
                                  <div style={{ fontSize: 12, opacity: 0.7, fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                                    {message.senderRole} - {formatDate(message.sentAt)}
                                  </div>
                                  {message.message && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{message.message}</p>}
                                  {message.imageUrl && (
                                    <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 6, fontSize: 13, textDecoration: "underline" }}>
                                      Open image
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={composer}
                        onChange={(e) => setComposer(e.target.value)}
                        disabled={!selectedConversation.isOpen || sending}
                        placeholder={selectedConversation.isOpen ? "Write a reply" : "This case is closed"}
                      />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input
                          className="form-input"
                          style={{ flex: "1 1 220px" }}
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          disabled={!selectedConversation.isOpen || sending}
                          placeholder="Optional image URL"
                        />
                        <button className="create-btn" disabled={!selectedConversation.isOpen || sending || (!composer.trim() && !imageUrl.trim())}>
                          {sending ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div style={{ minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-ink-3)", textAlign: "center", fontSize: 14 }}>
                    Select a support case to open the thread.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        <style jsx global>{`
          @media (max-width: 900px) {
            .support-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>

      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]" onClick={(e) => { if (e.target === e.currentTarget) setShowSignOutModal(false); }}>
          <div className="bg-paper border border-border rounded-2xl shadow-xl w-full max-w-[360px] mx-4 p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-serif text-[20px] text-ink leading-tight mb-1">Sign out?</h2>
              <p className="text-[13px] text-ink-3">You will be returned to the login page.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded-lg border border-border text-ink-2 text-[14px] font-medium bg-paper-2 hover:bg-paper-3 transition-colors" onClick={() => setShowSignOutModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626", padding: "8px 18px", fontSize: 14 }} onClick={handleSignOut}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
