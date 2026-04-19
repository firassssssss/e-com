// "use client";

// import React from "react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import { MessageCircle, X, RotateCcw, Send, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
// import { useAuthStore } from "@/lib/authStore";

// type FeedbackValue = 1 | -1;

// interface ChatMessage {
//   id: string;
//   role: "user" | "bot";
//   text: string;
//   logId: string | null;
//   feedback: FeedbackValue | null;
//   isStreaming: boolean;
//   isError: boolean;
// }

// function getOrCreateAnonSessionId(): string {
//   if (typeof window === "undefined") return "ssr";
//   const KEY = "lacuna_chat_session_id";
//   const stored = window.localStorage.getItem(KEY);
//   if (stored) return stored;
//   const id = "anon-" + "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
//   });
//   window.localStorage.setItem(KEY, id);
//   return id;
// }

// const WELCOME: ChatMessage = {
//   id: "welcome",
//   role: "bot",
//   text: "Bonjour! I'm your Lumiere beauty advisor. Ask me about skincare, product recommendations, or your order status.",
//   logId: null,
//   feedback: null,
//   isStreaming: false,
//   isError: false,
// };

// const MAX_LEN = 500;

// export default function ChatbotWidget() {
//   const [open, setOpen] = useState(false);
//   const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const endRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLTextAreaElement>(null);
//   const abortRef = useRef<AbortController | null>(null);
//   const sessionId = useRef<string>("ssr");

//   const { user, fetchMe } = useAuthStore();

//   useEffect(() => { fetchMe(); }, []);

//   useEffect(() => {
//     sessionId.current = user?.id ?? getOrCreateAnonSessionId();
//   }, [user?.id]);

//   useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

//   useEffect(() => {
//     if (open) {
//       const t = setTimeout(() => inputRef.current?.focus(), 150);
//       return () => clearTimeout(t);
//     }
//   }, [open]);

//   const reset = () => {
//     abortRef.current?.abort();
//     abortRef.current = null;
//     setMessages([WELCOME]);
//     setInput("");
//     setIsLoading(false);
//   };

//   const patchMsg = (id: string, patch: Partial<ChatMessage>) =>
//     setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

//   const sendMessage = useCallback(async () => {
//     const text = input.trim();
//     if (!text || isLoading) return;
//     setInput("");
//     setIsLoading(true);
//     const ts = Date.now();
//     const botId = `${ts}_bot`;
//     setMessages((prev) => [
//       ...prev,
//       { id: `${ts}_user`, role: "user", text, logId: null, feedback: null, isStreaming: false, isError: false },
//       { id: botId, role: "bot", text: "", logId: null, feedback: null, isStreaming: true, isError: false },
//     ]);
//     const controller = new AbortController();
//     abortRef.current = controller;
//     try {
//       const res = await fetch("/api/chat/message", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text, sessionId: sessionId.current }),
//         signal: controller.signal,
//       });
//       if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
//       const reader = res.body.getReader();
//       const decoder = new TextDecoder();
//       let buffer = "", fullText = "", receivedDone = false, finalLogId: string | null = null;
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         buffer += decoder.decode(value, { stream: true });
//         const parts = buffer.split("\n\n");
//         buffer = parts.pop() ?? "";
//         for (const part of parts) {
//           const raw = part.startsWith("data: ") ? part.slice(6) : part.trim();
//           if (!raw) continue;
//           let payload: Record<string, unknown>;
//           try { payload = JSON.parse(raw); } catch { continue; }
//           if (typeof payload.token === "string") { fullText += payload.token; patchMsg(botId, { text: fullText }); }
//           if (payload.done === true) { receivedDone = true; finalLogId = typeof payload.logId === "string" ? payload.logId : null; }
//           if (typeof payload.error === "string") { patchMsg(botId, { text: payload.error, isStreaming: false, isError: true }); setIsLoading(false); return; }
//         }
//         if (receivedDone) break;
//       }
//       patchMsg(botId, { text: fullText || "Sorry, empty response. Please try again.", logId: finalLogId, isStreaming: false, isError: false });
//     } catch (err) {
//       if (err instanceof Error && err.name === "AbortError") return;
//       patchMsg(botId, { text: "Connection error - please try again.", isStreaming: false, isError: true });
//     } finally {
//       setIsLoading(false);
//       abortRef.current = null;
//     }
//   }, [input, isLoading]);

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
//   };

//   const submitFeedback = async (logId: string, rating: FeedbackValue, msgId: string) => {
//     patchMsg(msgId, { feedback: rating });
//     try {
//       await fetch("/api/chat/feedback", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ logId, sessionId: sessionId.current, rating }),
//       });
//     } catch {}
//   };

//   return (
//     <>
//       {open && (
//         <div role="dialog" aria-label="Lumiere beauty advisor chat"
//           className="fixed bottom-24 right-6 z-50 flex flex-col bg-[#FAF7F2] border border-[#E0D5C8] shadow-2xl"
//           style={{ width: "370px", maxHeight: "580px", borderRadius: "2px" }}>
//           <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0D5C8] flex-shrink-0">
//             <div>
//               <p className="text-[10px] tracking-[0.3em] text-[#6B4F3A]/50 uppercase mb-0.5">Lumiere</p>
//               <p className="font-display text-sm font-light text-[#1A1410] tracking-wide">Beauty Advisor</p>
//             </div>
//             <div className="flex items-center gap-1">
//               <button onClick={reset} title="Reset conversation" className="p-1.5 text-[#6B4F3A]/40 hover:text-[#C4786A] transition-colors"><RotateCcw size={14} /></button>
//               <button onClick={() => setOpen(false)} title="Close chat" className="p-1.5 text-[#6B4F3A]/40 hover:text-[#C4786A] transition-colors"><X size={16} /></button>
//             </div>
//           </div>
//           <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
//             {messages.map((msg) => (
//               <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
//                 <div className="max-w-[85%]">
//                   <div className={["px-4 py-2.5 text-sm leading-relaxed",
//                     msg.role === "user" ? "bg-[#1A1410] text-[#FAF7F2]"
//                     : msg.isError ? "bg-[#F5E8E5] text-[#8B3A2A] border border-[#E0C0B8]"
//                     : "bg-[#F0EAE2] text-[#1A1410]"].join(" ")} style={{ borderRadius: "2px" }}>
//                     {msg.text}
//                     {msg.isStreaming && (
//                       <span className="inline-flex gap-0.5 ml-1.5 align-middle">
//                         {[0, 150, 300].map((delay) => (
//                           <span key={delay} className="block w-1 h-1 bg-[#C4786A] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
//                         ))}
//                       </span>
//                     )}
//                   </div>
//                   {msg.role === "bot" && msg.logId && !msg.isStreaming && !msg.isError && (
//                     <div className="flex gap-1 mt-1 justify-end">
//                       <button onClick={() => void submitFeedback(msg.logId as string, 1, msg.id)} disabled={msg.feedback !== null} title="Helpful"
//                         className={`p-1 transition-colors ${msg.feedback === 1 ? "text-[#8A9E8A]" : "text-[#6B4F3A]/30 hover:text-[#8A9E8A]"}`}><ThumbsUp size={11} /></button>
//                       <button onClick={() => void submitFeedback(msg.logId as string, -1, msg.id)} disabled={msg.feedback !== null} title="Not helpful"
//                         className={`p-1 transition-colors ${msg.feedback === -1 ? "text-[#C4786A]" : "text-[#6B4F3A]/30 hover:text-[#C4786A]"}`}><ThumbsDown size={11} /></button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//             <div ref={endRef} />
//           </div>
//           <div className="border-t border-[#E0D5C8] px-4 py-3 flex-shrink-0">
//             <div className="flex items-end gap-2">
//               <textarea ref={inputRef} value={input} rows={1} disabled={isLoading} maxLength={MAX_LEN}
//                 placeholder="Ask about skincare, products, orders..."
//                 onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
//                 className="flex-1 resize-none bg-transparent text-sm text-[#1A1410] placeholder-[#6B4F3A]/40 focus:outline-none leading-relaxed py-1 max-h-24 overflow-y-auto disabled:opacity-50"
//                 style={{ minHeight: "28px" }} />
//               <button onClick={() => void sendMessage()} disabled={!input.trim() || isLoading} title="Send"
//                 className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1A1410] text-[#FAF7F2] hover:bg-[#C4786A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
//                 style={{ borderRadius: "2px" }}>
//                 {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
//               </button>
//             </div>
//             <div className="flex justify-between mt-1.5">
//               <span className="text-[10px] text-[#6B4F3A]/30">Enter to send - Shift+Enter for newline</span>
//               <span className={`text-[10px] ${input.length > MAX_LEN * 0.9 ? "text-[#C4786A]" : "text-[#6B4F3A]/30"}`}>{input.length}/{MAX_LEN}</span>
//             </div>
//           </div>
//         </div>
//       )}
//       <button onClick={() => setOpen((o: any) => !o)} aria-label={open ? "Close chat" : "Open beauty advisor"}
//         className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1A1410] text-[#FAF7F2] flex items-center justify-center shadow-xl hover:bg-[#C4786A] transition-colors duration-300"
//         style={{ borderRadius: "2px" }}>
//         {open ? <X size={20} /> : <MessageCircle size={20} />}
//       </button>
//     </>
//   );
// }

"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/lib/authStore";

const MAX_LEN = 500;
type FeedbackValue = 1 | -1;

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  isStreaming?: boolean;
  isError?: boolean;
  logId?: string | null;
  feedback?: FeedbackValue | null;
}

export default function ChatbotWidget() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages]   = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hello! I'm your LUMINA beauty advisor. How can I help you today?",
    },
  ]);

  const endRef      = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const sessionId   = useRef(`sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const abortRef    = useRef<AbortController | null>(null);
  const { user }    = useAuthStore();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const patchMsg = (id: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([{ id: "welcome", role: "bot", text: "Hello! I'm your LUMINA beauty advisor. How can I help you today?" }]);
    setInput("");
    setIsLoading(false);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput("");
    setIsLoading(true);

    const userId = `msg_${Date.now()}`;
    const botId  = `bot_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text: userText },
      { id: botId,  role: "bot",  text: "",         isStreaming: true },
    ]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          sessionId: sessionId.current,
          userId: user?.id ?? null,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullText = "", receivedDone = false, finalLogId: string | null = null;

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
          if (typeof payload.token === "string")  { fullText += payload.token; patchMsg(botId, { text: fullText }); }
          if (payload.done === true)               { receivedDone = true; finalLogId = typeof payload.logId === "string" ? payload.logId : null; }
          if (typeof payload.error === "string")   { patchMsg(botId, { text: payload.error, isStreaming: false, isError: true }); setIsLoading(false); return; }
        }
        if (receivedDone) break;
      }
      patchMsg(botId, { text: fullText || "Sorry, empty response.", logId: finalLogId, isStreaming: false, isError: false });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      patchMsg(botId, { text: "Connection error — please try again.", isStreaming: false, isError: true });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, user]);

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
      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="LUMINA beauty advisor chat"
          style={{
            position: 'fixed', bottom: '6rem', right: '1.5rem',
            zIndex: 50,
            width: '380px', maxHeight: '600px',
            display: 'flex', flexDirection: 'column',
            background: '#0D0A05',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255,95,31,0.05)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0,
          }}>
            <div>
              <p style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: '0.5rem', letterSpacing: '0.3em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
                marginBottom: '0.25rem',
              }}>
                LUMINA
              </p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1rem', fontWeight: 300, color: '#fff',
              }}>
                Beauty Advisor
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={reset}
                title="Reset conversation"
                style={{
                  background: 'none', border: 'none', padding: '0.4rem',
                  color: 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F89880')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close chat"
                style={{
                  background: 'none', border: 'none', padding: '0.4rem',
                  color: 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FF5F1F')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: '85%' }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    background: msg.role === "user"
                      ? 'rgba(255,95,31,0.2)'
                      : msg.isError
                      ? 'rgba(255,95,31,0.05)'
                      : 'rgba(255,255,255,0.04)',
                    border: msg.role === "user"
                      ? '1px solid rgba(255,95,31,0.3)'
                      : msg.isError
                      ? '1px solid rgba(255,95,31,0.2)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: msg.isError ? '#F89880' : '#fff',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {msg.text}
                    {msg.isStreaming && (
                      <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '6px', verticalAlign: 'middle' }}>
                        {[0, 150, 300].map((delay) => (
                          <span key={delay} style={{
                            width: '4px', height: '4px', background: '#FF5F1F',
                            borderRadius: '50%', display: 'block',
                            animation: 'bounce 1s ease infinite',
                            animationDelay: `${delay}ms`,
                          }} />
                        ))}
                      </span>
                    )}
                  </div>

                  {/* Feedback buttons */}
                  {msg.role === "bot" && msg.logId && !msg.isStreaming && !msg.isError && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => void submitFeedback(msg.logId as string, 1, msg.id)}
                        disabled={msg.feedback !== null}
                        title="Helpful"
                        style={{
                          background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                          color: msg.feedback === 1 ? '#23D5D5' : 'rgba(255,255,255,0.2)',
                          transition: 'color 0.2s',
                        }}
                      >
                        <ThumbsUp size={11} />
                      </button>
                      <button
                        onClick={() => void submitFeedback(msg.logId as string, -1, msg.id)}
                        disabled={msg.feedback !== null}
                        title="Not helpful"
                        style={{
                          background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                          color: msg.feedback === -1 ? '#FF5F1F' : 'rgba(255,255,255,0.2)',
                          transition: 'color 0.2s',
                        }}
                      >
                        <ThumbsDown size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input area */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '0.85rem 1rem',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.01)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                disabled={isLoading}
                maxLength={MAX_LEN}
                placeholder="Ask about skincare, products, orders..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1, resize: 'none',
                  background: 'transparent',
                  border: 'none', outline: 'none',
                  color: '#fff', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.875rem', lineHeight: 1.5,
                  padding: '0.35rem 0',
                  maxHeight: '96px', overflowY: 'auto',
                  minHeight: '28px',
                  opacity: isLoading ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isLoading}
                title="Send"
                style={{
                  flexShrink: 0, width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#FF5F1F', border: 'none', cursor: 'pointer',
                  opacity: (!input.trim() || isLoading) ? 0.3 : 1,
                  transition: 'all 0.3s', color: '#000',
                }}
                onMouseEnter={e => { if (input.trim() && !isLoading) e.currentTarget.style.boxShadow = '0 0 20px rgba(255,95,31,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
              <span style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.45rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}>
                Enter to send · Shift+Enter for newline
              </span>
              <span style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: '0.45rem', letterSpacing: '0.1em',
                color: input.length > MAX_LEN * 0.9 ? '#F89880' : 'rgba(255,255,255,0.2)',
              }}>
                {input.length}/{MAX_LEN}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open beauty advisor"}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          zIndex: 50,
          width: '56px', height: '56px', borderRadius: '50%',
          background: '#FF5F1F', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(255,95,31,0.4)',
          color: '#000',
          transition: 'all 0.3s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 0 50px rgba(255,95,31,0.6)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 30px rgba(255,95,31,0.4)';
        }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
}