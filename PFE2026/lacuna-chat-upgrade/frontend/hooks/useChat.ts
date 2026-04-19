// frontend/hooks/useChat.ts
// LACUNA PFE 2026 — SSE stream reader hook
// ==========================================
// Reads token-by-token SSE stream from Express ChatController.
// Handles: truncation detection, logId capture, error display.

"use client";

import { useState, useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id:        string;
  role:      "user" | "bot";
  text:      string;
  logId?:    string;      // set on bot messages after stream completes
  error?:    boolean;
  timestamp: Date;
}

interface UseChatOptions {
  sessionId: string;
  userId?:   string;
}

// ── Session ID helper ─────────────────────────────────────────────────────────
export function getChatSessionId(userId?: string): string {
  if (userId) return userId;                            // auth user — stable ID
  if (typeof window === "undefined") return "ssr";      // SSR safety

  let id = localStorage.getItem("lacuna_chat_session_id");
  if (!id) {
    id = `anon-${crypto.randomUUID()}`;
    localStorage.setItem("lacuna_chat_session_id", id);
  }
  return id;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useChat({ sessionId, userId }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const appendToken = useCallback((botMsgId: string, token: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === botMsgId ? { ...m, text: m.text + token } : m
      )
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Add user message
      const userMsg: ChatMessage = {
        id:        crypto.randomUUID(),
        role:      "user",
        text:      text.trim(),
        timestamp: new Date(),
      };

      // Placeholder bot message (will be filled token by token)
      const botMsgId = crypto.randomUUID();
      const botMsg: ChatMessage = {
        id:        botMsgId,
        role:      "bot",
        text:      "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setIsLoading(true);

      abortRef.current = new AbortController();
      let receivedDone = false;

      try {
        const res = await fetch("/api/chat/message", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ message: text.trim(), sessionId, userId }),
          signal:  abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        // ── SSE reading loop ──────────────────────────────────────────────
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   buffer  = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";     // keep incomplete tail

          for (const part of parts) {
            if (!part.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(part.slice(6));

              if (payload.token) {
                appendToken(botMsgId, payload.token);
              }

              if (payload.done) {
                receivedDone = true;
                // Attach logId to bot message for feedback
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId ? { ...m, logId: payload.logId } : m
                  )
                );
                break;
              }

              if (payload.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, text: payload.error, error: true }
                      : m
                  )
                );
                receivedDone = true;
                break;
              }
            } catch { /* malformed SSE line — skip */ }
          }

          if (receivedDone) break;
        }

        // Truncation detection
        if (!receivedDone) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, text: m.text + "\n\n_Response was cut short. Please try again._" }
                : m
            )
          );
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? { ...m, text: "Connection error. Please try again.", error: true }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, userId, appendToken]
  );

  const submitFeedback = useCallback(
    async (logId: string, rating: 1 | -1) => {
      try {
        await fetch("/api/chat/feedback", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ logId, sessionId, rating }),
        });
      } catch { /* feedback failure is silent */ }
    },
    [sessionId]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, submitFeedback, reset };
}
