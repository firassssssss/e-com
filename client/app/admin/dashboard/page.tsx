// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import api from "@/lib/api";
// import {
//   MessageSquare, Users, ThumbsDown, AlertTriangle,
//   ShieldAlert, Activity, ArrowRight, Info,
// } from "lucide-react";

// interface MiniHealth {
//   totalConversations: number;
//   uniqueUsers: number;
//   anonSessions: number;
//   negativeFeedbackRate: number;
//   hallucinationRate: number;
//   avgConfidence: number;
// }

// function StatPill({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
//   return (
//     <div className={`flex flex-col gap-0.5 px-4 py-3 rounded-sm border
//       ${warn ? "bg-red-50 border-red-200" : "bg-[#FAF7F4] border-[#E0D5C8]"}`}>
//       <span className={`text-xl font-extralight ${warn ? "text-red-600" : "text-[#1A1410]"}`}>{value}</span>
//       <span className="text-[10px] text-[#6B4F3A]/45 uppercase tracking-wide">{label}</span>
//     </div>
//   );
// }

// const GUIDE_CARDS = [
//   {
//     icon: ShieldAlert,
//     title: "Suspicious messages",
//     color: "text-red-500",
//     bg: "bg-red-50 border-red-200",
//     body: "Flagged automatically when a user message matches known injection patterns: XSS (<script, javascript:), SQL injection (SELECT, UNION, DROP), path traversal (../), or system file probes (etc/passwd). A single flag is not always an attack — context and repetition matter.",
//   },
//   {
//     icon: Users,
//     title: "Anonymous visitors",
//     color: "text-blue-500",
//     bg: "bg-blue-50 border-blue-200",
//     body: "Users who chat without an account. Identified by a random session ID saved in their browser's localStorage. Clearing the browser or using private mode creates a new anonymous identity — they cannot be linked to orders or profiles.",
//   },
//   {
//     icon: Activity,
//     title: "Confidence score",
//     color: "text-amber-500",
//     bg: "bg-amber-50 border-amber-200",
//     body: "How well-grounded the bot's reply is in the product catalogue returned by the RAG pipeline. ≥ 80 % = high (green), 60–79 % = medium (amber), < 60 % = low (red, review for hallucinations). Defaults to 50 % when not set by the model.",
//   },
//   {
//     icon: AlertTriangle,
//     title: "Hallucination estimate",
//     color: "text-orange-500",
//     bg: "bg-orange-50 border-orange-200",
//     body: "Estimated as: low confidence (< 70 %) AND a negative thumbs-down on the same message. It is a heuristic — not every low-confidence reply is wrong, and not every wrong reply receives feedback. Use it as a triage signal, not a hard metric.",
//   },
//   {
//     icon: Info,
//     title: "Admin markers",
//     color: "text-[#C4786A]",
//     bg: "bg-[#FAF7F4] border-[#E0D5C8]",
//     body: "In the Chat Monitor, hover any message and click the flag icon to annotate it with a colour (Critical / Review / Noted) and an optional note. Markers are stored in your browser only — private to your session, not saved to the database.",
//   },
// ];

// export default function AdminDashboardPage() {
//   const router = useRouter();
//   const [authorized, setAuthorized] = useState(false);
//   const [loading, setLoading]       = useState(true);
//   const [health, setHealth]         = useState<MiniHealth | null>(null);

//   useEffect(() => {
//     api.get("/api/admin/ping")
//       .then(() => {
//         setAuthorized(true);
//         return api.get("/api/admin/chat/health");
//       })
//       .then(r => setHealth(r.data.data))
//       .catch(() => router.push("/auth/login"))
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading)      return <div className="p-8 text-[#6B4F3A]/40">Checking permissions…</div>;
//   if (!authorized)  return null;

//   return (
//     <div className="p-8 space-y-10 max-w-5xl">

//       {/* Welcome */}
//       <div>
//         <h1 className="text-3xl font-light text-[#1A1410]">Admin Dashboard</h1>
//         <p className="text-sm text-[#6B4F3A]/50 mt-1">
//           Welcome. Use the sidebar to manage users, products, and monitor the chatbot.
//         </p>
//       </div>

//       {/* Chat health widget */}
//       <section>
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center gap-2">
//             <MessageSquare size={15} className="text-[#C4786A]" />
//             <h2 className="text-sm font-semibold text-[#1A1410]">Chatbot · last 24 h</h2>
//             <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
//           </div>
//           <Link href="/admin/chat"
//             className="flex items-center gap-1 text-[11px] text-[#C4786A] hover:underline">
//             Full monitor <ArrowRight size={11} />
//           </Link>
//         </div>

//         {health ? (
//           <div className="grid grid-cols-5 gap-3">
//             <StatPill label="Conversations"    value={health.totalConversations} />
//             <StatPill label="Unique chatters"  value={health.uniqueUsers}
//               warn={false} />
//             <StatPill label="Anonymous"        value={health.anonSessions} />
//             <StatPill label="Avg confidence"
//               value={`${(health.avgConfidence * 100).toFixed(0)}%`}
//               warn={health.avgConfidence < 0.6} />
//             <StatPill label="Negative feedback"
//               value={`${health.negativeFeedbackRate.toFixed(1)}%`}
//               warn={health.negativeFeedbackRate > 20} />
//           </div>
//         ) : (
//           <div className="text-[11px] text-[#6B4F3A]/35">Loading health data…</div>
//         )}
//       </section>

//       {/* Guide */}
//       <section>
//         <div className="flex items-center gap-2 mb-4">
//           <Info size={14} className="text-[#6B4F3A]/50" />
//           <h2 className="text-sm font-semibold text-[#1A1410]">How to read the monitor</h2>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           {GUIDE_CARDS.map(g => (
//             <div key={g.title} className={`rounded-sm border p-5 ${g.bg}`}>
//               <div className="flex items-center gap-2 mb-2">
//                 <g.icon size={14} className={g.color} />
//                 <h3 className="text-[12px] font-semibold text-[#1A1410]">{g.title}</h3>
//               </div>
//               <p className="text-[11px] text-[#6B4F3A]/65 leading-relaxed">{g.body}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  MessageSquare, Users, ThumbsDown, AlertTriangle,
  ShieldAlert, Activity, ArrowRight, Info,
} from "lucide-react";

interface MiniHealth {
  totalConversations: number;
  uniqueUsers: number;
  anonSessions: number;
  negativeFeedbackRate: number;
  hallucinationRate: number;
  avgConfidence: number;
}

const D = {
  bg:       "#0A0A0F",
  panel:    "#111118",
  border:   "rgba(255,255,255,0.07)",
  text:     "#fff",
  muted:    "rgba(255,255,255,0.5)",
  dim:      "rgba(255,255,255,0.25)",
  orange:   "#FF5F1F",
  cyan:     "#00FFFF",
  red:      "rgba(255,80,80,0.85)",
  green:    "#00FFAA",
  font:     "'Syncopate', sans-serif",
  mono:     "monospace",
};

function label(s: string): React.CSSProperties {
  return {
    fontFamily: D.font,
    fontSize: "0.45rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: D.dim,
  };
}

function StatPill({ l, value, warn }: { l: string; value: string | number; warn?: boolean }) {
  return (
    <div style={{
      background: D.panel,
      border: `1px solid ${warn ? "rgba(255,80,80,0.3)" : D.border}`,
      borderRadius: 4,
      padding: "1rem 1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}>
      <span style={{
        fontFamily: D.mono,
        fontSize: "1.5rem",
        fontWeight: 700,
        color: warn ? D.red : D.orange,
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={label(l)}>{l}</span>
    </div>
  );
}

const GUIDE_CARDS = [
  {
    icon: ShieldAlert,
    title: "Suspicious messages",
    color: D.red,
    body: "Flagged automatically when a user message matches known injection patterns: XSS (<script, javascript:), SQL injection (SELECT, UNION, DROP), path traversal (../), or system file probes (etc/passwd). A single flag is not always an attack — context and repetition matter.",
  },
  {
    icon: Users,
    title: "Anonymous visitors",
    color: D.cyan,
    body: "Users who chat without an account. Identified by a random session ID saved in their browser's localStorage. Clearing the browser or using private mode creates a new anonymous identity — they cannot be linked to orders or profiles.",
  },
  {
    icon: Activity,
    title: "Confidence score",
    color: "#FFD700",
    body: "How well-grounded the bot's reply is in the product catalogue returned by the RAG pipeline. ≥ 80 % = high, 60–79 % = medium, < 60 % = low (review for hallucinations). Defaults to 50 % when not set by the model.",
  },
  {
    icon: AlertTriangle,
    title: "Hallucination estimate",
    color: D.orange,
    body: "Estimated as: low confidence (< 70 %) AND a negative thumbs-down on the same message. It is a heuristic — not every low-confidence reply is wrong, and not every wrong reply receives feedback. Use it as a triage signal, not a hard metric.",
  },
  {
    icon: Info,
    title: "Admin markers",
    color: D.orange,
    body: "In the Chat Monitor, hover any message and click the flag icon to annotate it with a colour (Critical / Review / Noted) and an optional note. Markers are stored in your browser only — private to your session, not saved to the database.",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [health, setHealth]         = useState<MiniHealth | null>(null);

  useEffect(() => {
    api.get("/api/admin/ping")
      .then(() => {
        setAuthorized(true);
        return api.get("/api/admin/chat/health");
      })
      .then(r => setHealth(r.data.data))
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ color: D.dim, fontFamily: D.font, fontSize: "0.5rem", letterSpacing: "0.3em" }}>
      Checking permissions…
    </div>
  );
  if (!authorized) return null;

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Title */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: D.font, fontSize: "1.1rem", letterSpacing: "0.25em", fontWeight: 700, color: D.text, marginBottom: "0.4rem" }}>
          Admin Dashboard
        </p>
        <p style={{ fontFamily: D.font, fontSize: "0.48rem", letterSpacing: "0.18em", color: D.dim }}>
          Welcome. Use the sidebar to manage users, products, and monitor the chatbot.
        </p>
      </div>

      {/* Chat health */}
      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <MessageSquare size={14} color={D.orange} />
            <span style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.muted }}>
              Chatbot · last 24h
            </span>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: D.green,
              boxShadow: `0 0 6px ${D.green}`,
              display: "inline-block",
            }} />
          </div>
          <Link href="/admin/chat" style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.15em",
            color: D.orange, textDecoration: "none",
          }}>
            Full monitor <ArrowRight size={10} />
          </Link>
        </div>

        {health ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.75rem" }}>
            <StatPill l="Conversations"    value={health.totalConversations} />
            <StatPill l="Unique chatters"  value={health.uniqueUsers} />
            <StatPill l="Anonymous"        value={health.anonSessions} />
            <StatPill l="Avg confidence"   value={`${(health.avgConfidence * 100).toFixed(0)}%`} warn={health.avgConfidence < 0.6} />
            <StatPill l="Negative feedback" value={`${health.negativeFeedbackRate.toFixed(1)}%`} warn={health.negativeFeedbackRate > 20} />
          </div>
        ) : (
          <p style={{ fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.15em", color: D.dim }}>
            Loading health data…
          </p>
        )}
      </section>

      {/* Guide */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <Info size={13} color={D.dim} />
          <span style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.muted }}>
            How to read the monitor
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {GUIDE_CARDS.map(g => (
            <div key={g.title} style={{
              background: D.panel,
              border: `1px solid ${D.border}`,
              borderRadius: 4,
              padding: "1.25rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <g.icon size={13} color={g.color} />
                <span style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text }}>
                  {g.title}
                </span>
              </div>
              <p style={{ fontSize: "0.78rem", color: D.muted, lineHeight: 1.65, margin: 0 }}>
                {g.body}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}