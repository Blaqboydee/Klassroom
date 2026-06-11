# Support API Integration Guide (React Frontend)

This guide explains how React clients should consume the Support APIs for both user and admin roles, including realtime chat updates using SignalR.

Base URL used in examples: http://localhost:5000

## 1. Authentication

All support endpoints and the support hub require JWT authentication.

For REST:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

For SignalR:

- Connect to hub path: /hubs/support-chat
- Pass token via accessTokenFactory in React SignalR client

## 2. Data Shapes

Common response envelope:

```ts
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
};
```

Support message:

```ts
export type SupportMessageDto = {
  id: string;
  conversationId: string;
  conversationUserId: string;
  senderUserId: string;
  senderRole: string; // "User" or "Admin"
  message?: string | null;
  imageUrl?: string | null;
  sentAt: string;
};
```

Support conversation list item:

```ts
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
```

## 3. User Flow (React)

### 3.1 Create a New Support Case

Use this when the user intentionally starts a separate issue/case.

Endpoint:

- POST /api/support/conversations

Body:

```json
{
  "initialMessage": "I need help with failed payment",
  "initialImageUrl": null
}
```

### 3.2 List User Cases

Endpoint:

- GET /api/support/conversations?status=open&page=1&pageSize=20

Query status values:

- open (default behavior)
- closed
- all

### 3.3 Open Messages for One Case

For exact case chat, use conversationId:

- GET /api/support/messages?conversationId={conversationId}&page=1&pageSize=50

### 3.4 Send a Message in User Chat

Endpoint:

- POST /api/support/messages

Body for normal reply in existing selected case:

```json
{
  "conversationId": "b56f08dd-82a8-4446-a4de-9dd57e6f1e1d",
  "message": "Any update?",
  "imageUrl": null,
  "startNewConversation": false
}
```

Body for forcing a new separate case from message composer:

```json
{
  "message": "I have another issue",
  "imageUrl": null,
  "startNewConversation": true
}
```

## 4. Admin Flow (React)

### 4.1 Open Queue (Active Cases)

Endpoint:

- GET /api/support/admin/conversations?status=open&page=1&pageSize=20

Optional filters:

- searchTerm
- status=open|closed|all

### 4.2 Closed Cases Queue

Endpoints:

- GET /api/support/admin/conversations?status=closed&page=1&pageSize=20
- GET /api/support/admin/conversations/closed?page=1&pageSize=20

### 4.3 Open Case Thread

Endpoint:

- GET /api/support/admin/conversations/{conversationId}/messages?page=1&pageSize=50

### 4.4 Reply to Exact Case

Endpoint:

- POST /api/support/admin/conversations/{conversationId}/messages

Body:

```json
{
  "message": "We are reviewing this now.",
  "imageUrl": null
}
```

### 4.5 Close Case

Endpoint:

- POST /api/support/admin/conversations/{conversationId}/close

Once closed:

- It no longer appears in open queue.
- It appears in closed queue endpoints.

## 5. Realtime Chat (SignalR) in React

Install package:

```bash
npm install @microsoft/signalr
```

Minimal client:

```ts
import * as signalR from "@microsoft/signalr";

const API_BASE_URL = "http://localhost:5000";

export function createSupportConnection(token: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/support-chat`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();
}

export async function startSupportConnection(
  connection: signalR.HubConnection,
  onMessage: (event: SupportMessageDto) => void
) {
  connection.on("SupportMessageReceived", onMessage);

  if (connection.state === signalR.HubConnectionState.Disconnected) {
    await connection.start();
  }

  return async () => {
    connection.off("SupportMessageReceived", onMessage);
    if (connection.state !== signalR.HubConnectionState.Disconnected) {
      await connection.stop();
    }
  };
}
```

Send over hub (optional alternative to HTTP send):

```ts
await connection.invoke("SendSupportMessage", {
  conversationId,              // preferred for exact-case reply
  targetUserId: null,          // admin can pass this when not using conversationId
  message: "Reply from realtime",
  imageUrl: null,
  startNewConversation: false,
});
```

## 6. Recommended React State Model

Use this shape in your support module:

- selectedConversationId: string | null
- openCases: SupportConversationListItemDto[]
- closedCases: SupportConversationListItemDto[]
- messagesByConversationId: Record<string, SupportMessageDto[]>

When SupportMessageReceived arrives:

1. Append message to messagesByConversationId[message.conversationId]
2. Update corresponding case lastMessage, lastSenderRole, lastMessageAt
3. Re-sort list by updatedDate/lastMessageAt desc

## 7. Practical API Helper Examples

```ts
const API_BASE_URL = "http://localhost:5000";

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !body.success || body.data === undefined) {
    throw new Error(body.message || "Request failed");
  }

  return body.data;
}

export const supportApi = {
  createConversation(token: string, payload: { initialMessage?: string; initialImageUrl?: string }) {
    return apiFetch<{ conversationId: string }>(`/api/support/conversations`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMyConversations(token: string, status: "open" | "closed" | "all" = "open", page = 1, pageSize = 20) {
    return apiFetch<{ items: SupportConversationListItemDto[] }>(
      `/api/support/conversations?status=${status}&page=${page}&pageSize=${pageSize}`,
      token
    );
  },

  getAdminConversations(token: string, status: "open" | "closed" | "all" = "open", page = 1, pageSize = 20) {
    return apiFetch<{ items: SupportConversationListItemDto[] }>(
      `/api/support/admin/conversations?status=${status}&page=${page}&pageSize=${pageSize}`,
      token
    );
  },

  getAdminConversationMessages(token: string, conversationId: string, page = 1, pageSize = 50) {
    return apiFetch<SupportMessageDto[]>(
      `/api/support/admin/conversations/${conversationId}/messages?page=${page}&pageSize=${pageSize}`,
      token
    );
  },

  sendMessage(token: string, payload: {
    conversationId?: string;
    targetUserId?: string;
    message?: string;
    imageUrl?: string;
    startNewConversation?: boolean;
  }) {
    return apiFetch<SupportMessageDto>(`/api/support/messages`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  adminReply(token: string, conversationId: string, payload: { message?: string; imageUrl?: string }) {
    return apiFetch<SupportMessageDto>(`/api/support/admin/conversations/${conversationId}/messages`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  closeConversation(token: string, conversationId: string) {
    return apiFetch<{ conversationId: string; isOpen: boolean }>(
      `/api/support/admin/conversations/${conversationId}/close`,
      token,
      { method: "POST" }
    );
  },
};
```

## 8. Suggested UX Rules

- Users:
  - Show Open and Closed tabs.
  - Let user create new case explicitly from a New Case button.
  - Keep selected case id in route/query state.

- Admins:
  - Default to open queue.
  - Show unread/new indicators based on latest message timestamp.
  - Move case out of open queue instantly after close API succeeds.

## 9. Current Endpoint Source of Truth

Backend endpoints and hub are implemented in:

- src/Api/Controllers/SupportController.cs
- src/Api/Hubs/SupportChatHub.cs

If backend contracts change, update this document and frontend client types together.
