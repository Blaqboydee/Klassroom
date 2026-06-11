"use client";

import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { SUPPORT_API_BASE_URL, type SupportMessageDto } from "@/lib/support";

type RealtimeState = "idle" | "connecting" | "connected" | "error";

export function useSupportRealtime(
  token: string,
  onMessage: (message: SupportMessageDto) => void
) {
  const [state, setState] = useState<RealtimeState>("idle");

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setState("idle"));
      return;
    }

    let disposed = false;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SUPPORT_API_BASE_URL}/hubs/support-chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    const handleMessage = (message: SupportMessageDto) => {
      onMessage(message);
    };

    queueMicrotask(() => setState("connecting"));
    connection.on("SupportMessageReceived", handleMessage);
    connection.onreconnecting(() => setState("connecting"));
    connection.onreconnected(() => setState("connected"));
    connection.onclose(() => {
      if (!disposed) setState("error");
    });

    connection
      .start()
      .then(() => {
        if (!disposed) setState("connected");
      })
      .catch(() => {
        if (!disposed) setState("error");
      });

    return () => {
      disposed = true;
      connection.off("SupportMessageReceived", handleMessage);
      connection.stop().catch(() => {});
    };
  }, [token, onMessage]);

  return state;
}
