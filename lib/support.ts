export type SupportStatus = "open" | "closed" | "all";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
};

export type SupportMessageDto = {
  id: string;
  conversationId: string;
  conversationUserId: string;
  senderUserId: string;
  senderRole: "User" | "Admin" | string;
  message?: string | null;
  imageUrl?: string | null;
  sentAt: string;
};

export type SupportConversationListItemDto = {
  conversationId: string;
  userId: string;
  adminUserId?: string | null;
  isOpen: boolean;
  createdDate: string;
  updatedDate?: string | null;
  lastMessage?: string | null;
  lastSenderRole?: string | null;
  lastMessageAt?: string | null;
  messageCount: number;
};

type ConversationListResponse = {
  items: SupportConversationListItemDto[];
};

type SendMessagePayload = {
  conversationId?: string;
  targetUserId?: string;
  message?: string;
  imageUrl?: string;
  startNewConversation?: boolean;
};

export const SUPPORT_TOKEN_STORAGE_KEY = "klassroom_support_token";

export const SUPPORT_API_BASE_URL =
  (process.env.NEXT_PUBLIC_SUPPORT_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

function unwrapList(body: ConversationListResponse | SupportConversationListItemDto[]) {
  return Array.isArray(body) ? body : body.items ?? [];
}

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPPORT_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !body?.success || body.data === undefined) {
    throw new Error(body?.message || "Support request failed");
  }

  return body.data;
}

export function getStoredSupportToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SUPPORT_TOKEN_STORAGE_KEY) ?? "";
}

export function storeSupportToken(token: string) {
  if (typeof window === "undefined") return;
  if (token.trim()) localStorage.setItem(SUPPORT_TOKEN_STORAGE_KEY, token.trim());
  else localStorage.removeItem(SUPPORT_TOKEN_STORAGE_KEY);
}

export const supportApi = {
  async createConversation(
    token: string,
    payload: { initialMessage?: string; initialImageUrl?: string | null }
  ) {
    return apiFetch<{ conversationId: string }>("/api/support/conversations", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getMyConversations(token: string, status: SupportStatus = "open", page = 1, pageSize = 20) {
    const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
    const data = await apiFetch<ConversationListResponse | SupportConversationListItemDto[]>(
      `/api/support/conversations?${params.toString()}`,
      token
    );
    return unwrapList(data);
  },

  async getUserConversationMessages(token: string, conversationId: string, page = 1, pageSize = 50) {
    const params = new URLSearchParams({ conversationId, page: String(page), pageSize: String(pageSize) });
    return apiFetch<SupportMessageDto[]>(`/api/support/messages?${params.toString()}`, token);
  },

  async getAdminConversations(
    token: string,
    status: SupportStatus = "open",
    page = 1,
    pageSize = 20,
    searchTerm = ""
  ) {
    const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    const data = await apiFetch<ConversationListResponse | SupportConversationListItemDto[]>(
      `/api/support/admin/conversations?${params.toString()}`,
      token
    );
    return unwrapList(data);
  },

  getAdminConversationMessages(token: string, conversationId: string, page = 1, pageSize = 50) {
    return apiFetch<SupportMessageDto[]>(
      `/api/support/admin/conversations/${encodeURIComponent(conversationId)}/messages?page=${page}&pageSize=${pageSize}`,
      token
    );
  },

  sendMessage(token: string, payload: SendMessagePayload) {
    return apiFetch<SupportMessageDto>("/api/support/messages", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  adminReply(token: string, conversationId: string, payload: { message?: string; imageUrl?: string | null }) {
    return apiFetch<SupportMessageDto>(
      `/api/support/admin/conversations/${encodeURIComponent(conversationId)}/messages`,
      token,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  closeConversation(token: string, conversationId: string) {
    return apiFetch<{ conversationId: string; isOpen: boolean }>(
      `/api/support/admin/conversations/${encodeURIComponent(conversationId)}/close`,
      token,
      { method: "POST" }
    );
  },
};
