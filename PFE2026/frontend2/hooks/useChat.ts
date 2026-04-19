"use client";
import { useState, useCallback, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  logId?: string;
}

function getSessionId(userId?: string | null): string {
  if (userId) return userId;
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("lacuna_chat_session_id");
  if (!id) { id = `anon-${crypto.randomUUID()}`; localStorage.setItem("lacuna_chat_session_id", id); }
  return id;
}

export function useChat(userId?: string | null) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const sessionId = getSessionId(userId);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsLoading(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat/message", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text, session_id: sessionId }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Chat service unavailable");
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer       = "";
      let receivedDone = false;

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(part.slice(6));
            if (payload.token) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, content: last.content + payload.token };
                return updated;
              });
            }
            if (payload.done) {
              receivedDone = true;
              if (payload.logId) {
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") updated[updated.length - 1] = { ...last, logId: payload.logId };
                  return updated;
                });
              }
            }
            if (payload.error) { setError(payload.error); }
          } catch { /* malformed chunk */ }
        }
      }

      if (!receivedDone) {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") updated[updated.length - 1] = { ...last, content: last.content + "\n\n Response was cut short." };
          return updated;
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError(err.message ?? "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoading]);

  const abort        = useCallback(() => { abortRef.current?.abort(); setIsLoading(false); }, []);
  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, error, sendMessage, abort, clearMessages };
}
