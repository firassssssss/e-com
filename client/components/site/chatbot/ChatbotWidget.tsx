"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, RotateCcw, Send, ThumbsUp, ThumbsDown, Loader2, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type FeedbackValue = 1 | -1;

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  logId: string | null;
  feedback: FeedbackValue | null;
  isStreaming: boolean;
  isError: boolean;
  showConfirm?: boolean;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const KEY = "lacuna_chat_session_id";
  const stored = window.localStorage.getItem(KEY);
  if (stored) return stored;
  const id = "anon-" + "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
  window.localStorage.setItem(KEY, id);
  return id;
}

// Detect if a bot message is asking a profile confirmation question
function isProfileQuestion(text: string): boolean {
  return /i thought your (skin|hair)|is your (skin|hair)|you mentioned (oily|dry|normal|combination|sensitive|curly|fine)|your profile says|update your (skin|hair)|confirm your/i.test(text);
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Bonjour! I'm your Lumiere beauty advisor. Ask me about skincare, product recommendations, or your order status.",
  logId: null,
  feedback: null,
  isStreaming: false,
  isError: false,
};

const MAX_LEN = 500;

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profileToast, setProfileToast] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionId = useRef<string>("ssr");

  useEffect(() => { sessionId.current = getOrCreateSessionId(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (open) { const t = setTimeout(() => inputRef.current?.focus(), 150); return () => clearTimeout(t); }
  }, [open]);

  // Auto-dismiss profile toast
  useEffect(() => {
    if (!profileToast) return;
    const t = setTimeout(() => setProfileToast(null), 3500);
    return () => clearTimeout(t);
  }, [profileToast]);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([WELCOME]);
    setInput("");
    setIsLoading(false);
  };

  const patchMsg = (id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const sendRaw = useCallback(async (text: string) => {
    setInput("");
    setIsLoading(true);
    const ts = Date.now();
    const botId = `${ts}_bot`;

    setMessages((prev) => [
      ...prev,
      { id: `${ts}_user`, role: "user", text, logId: null, feedback: null, isStreaming: false, isError: false },
      { id: botId, role: "bot", text: "", logId: null, feedback: null, isStreaming: true, isError: false },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionId.current }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let receivedDone = false;
      let finalLogId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const raw = part.startsWith("data: ") ? part.slice(6) : part.trim();
          if (!raw) continue;
          let payload: Record<string, unknown>;
          try { payload = JSON.parse(raw); } catch { continue; }

          if (typeof payload.token === "string") {
            fullText += payload.token;
            patchMsg(botId, { text: fullText });
          }
          if (payload.done === true) {
            receivedDone = true;
            finalLogId = typeof payload.logId === "string" ? payload.logId : null;
          }
          if (typeof payload.error === "string") {
            patchMsg(botId, { text: payload.error, isStreaming: false, isError: true });
            setIsLoading(false);
            return;
          }
        }
        if (receivedDone) break;
      }

      const finalText = fullText || "Sorry, I received an empty response. Please try again.";
      // Check if this bot response is a profile confirmation question
      const needsConfirm = isProfileQuestion(finalText);
      patchMsg(botId, { text: finalText, logId: finalLogId, isStreaming: false, isError: false, showConfirm: needsConfirm });

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      patchMsg(botId, { text: "Connection error — please try again.", isStreaming: false, isError: true });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    await sendRaw(text);
  }, [input, isLoading, sendRaw]);

  const handleQuickReply = useCallback(async (msgId: string, reply: "yes" | "no") => {
    // Dismiss the confirm buttons immediately
    patchMsg(msgId, { showConfirm: false });
    if (reply === "yes") { setProfileToast("Profile updated!"); window.dispatchEvent(new CustomEvent("lumina:profile-updated")); }
    await sendRaw(reply === "yes" ? "Yes, that's correct" : "No, that's not right");
  }, [sendRaw]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  };

  const submitFeedback = async (logId: string, rating: FeedbackValue, msgId: string) => {
    patchMsg(msgId, { feedback: rating });
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, sessionId: sessionId.current, rating }),
      });
    } catch {}
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Lumiere beauty advisor chat"
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-[#FAF7F2] border border-[#E0D5C8] shadow-2xl"
          style={{ width: "370px", maxHeight: "580px", borderRadius: "2px" }}
        >
          {/* Profile updated toast */}
          {profileToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-[#8A9E8A] text-white text-xs px-3 py-1.5 shadow-md" style={{ borderRadius: "2px" }}>
              <CheckCircle2 size={12} />
              {profileToast}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0D5C8] flex-shrink-0">
            <div>
              <p className="text-[10px] tracking-[0.3em] text-[#6B4F3A]/50 uppercase mb-0.5">Lumiere</p>
              <p className="font-display text-sm font-light text-[#1A1410] tracking-wide">Beauty Advisor</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset} title="Reset conversation" className="p-1.5 text-[#6B4F3A]/40 hover:text-[#C4786A] transition-colors">
                <RotateCcw size={14} />
              </button>
              <button onClick={() => setOpen(false)} title="Close chat" className="p-1.5 text-[#6B4F3A]/40 hover:text-[#C4786A] transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  <div
                    className={["px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user" ? "bg-[#1A1410] text-[#FAF7F2]"
                      : msg.isError ? "bg-[#F5E8E5] text-[#8B3A2A] border border-[#E0C0B8]"
                      : "bg-[#F0EAE2] text-[#1A1410]"].join(" ")}
                    style={{ borderRadius: "2px" }}
                  >
                    {msg.role === "bot" && !msg.isError ? (
                      <ReactMarkdown
                        components={{
                          p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          ul:     ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                          ol:     ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                          li:     ({ children }) => <li className="leading-snug">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em:     ({ children }) => <em className="italic">{children}</em>,
                          code:   ({ children }) => <code className="bg-black/10 px-1 rounded text-xs font-mono">{children}</code>,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                    {msg.isStreaming && (
                      <span className="inline-flex gap-0.5 ml-1.5 align-middle">
                        {[0, 150, 300].map((delay) => (
                          <span key={delay} className="block w-1 h-1 bg-[#C4786A] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                        ))}
                      </span>
                    )}
                  </div>

                  {/* Profile confirmation quick replies */}
                  {msg.showConfirm && !msg.isStreaming && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => void handleQuickReply(msg.id, "yes")}
                        className="flex-1 text-xs py-1.5 bg-[#1A1410] text-[#FAF7F2] hover:bg-[#8A9E8A] transition-colors"
                        style={{ borderRadius: "2px" }}
                      >
                        Yes, correct
                      </button>
                      <button
                        onClick={() => void handleQuickReply(msg.id, "no")}
                        className="flex-1 text-xs py-1.5 border border-[#E0D5C8] text-[#6B4F3A] hover:border-[#C4786A] hover:text-[#C4786A] transition-colors"
                        style={{ borderRadius: "2px" }}
                      >
                        No, that&apos;s wrong
                      </button>
                    </div>
                  )}

                  {/* Feedback */}
                  {msg.role === "bot" && msg.logId && !msg.isStreaming && !msg.isError && (
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={() => void submitFeedback(msg.logId as string, 1, msg.id)} disabled={msg.feedback !== null} title="Helpful"
                        className={`p-1 transition-colors ${msg.feedback === 1 ? "text-[#8A9E8A]" : "text-[#6B4F3A]/30 hover:text-[#8A9E8A]"}`}>
                        <ThumbsUp size={11} />
                      </button>
                      <button onClick={() => void submitFeedback(msg.logId as string, -1, msg.id)} disabled={msg.feedback !== null} title="Not helpful"
                        className={`p-1 transition-colors ${msg.feedback === -1 ? "text-[#C4786A]" : "text-[#6B4F3A]/30 hover:text-[#C4786A]"}`}>
                        <ThumbsDown size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#E0D5C8] px-4 py-3 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                disabled={isLoading}
                maxLength={MAX_LEN}
                placeholder="Ask about skincare, products, orders..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none bg-transparent text-sm text-[#1A1410] placeholder-[#6B4F3A]/40 focus:outline-none leading-relaxed py-1 max-h-24 overflow-y-auto disabled:opacity-50"
                style={{ minHeight: "28px" }}
              />
              <button onClick={() => void sendMessage()} disabled={!input.trim() || isLoading} title="Send"
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1A1410] text-[#FAF7F2] hover:bg-[#C4786A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ borderRadius: "2px" }}>
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-[#6B4F3A]/30">Enter to send · Shift+Enter for newline</span>
              <span className={`text-[10px] ${input.length > MAX_LEN * 0.9 ? "text-[#C4786A]" : "text-[#6B4F3A]/30"}`}>{input.length}/{MAX_LEN}</span>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setOpen((o: any) => !o)} aria-label={open ? "Close chat" : "Open beauty advisor"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1A1410] text-[#FAF7F2] flex items-center justify-center shadow-xl hover:bg-[#C4786A] transition-colors duration-300"
        style={{ borderRadius: "2px" }}>
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
}
