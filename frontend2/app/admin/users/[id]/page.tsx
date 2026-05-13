"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, AlertTriangle, CheckCircle, Eye, ShoppingCart, Search, Heart, Activity, MessageSquare } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  skinType: string;
  hairType: string;
  skinConcerns: string;
  createdAt: string;
  emailVerified?: boolean;
}

interface ActivitySummary {
  views: number;
  searches: number;
  carts: number;
  wishlists: number;
  recentSignals: any[];
}

interface ChatMessage {
  id: string;
  userMessage: string;
  botMessages: any[];
  createdAt: string;
  suspicious: boolean;
}

function getInitials(name: string) {
  return name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"activity" | "chat">("activity");

  useEffect(() => {
    // Restore original 3-item structure that worked for activity + chat
    Promise.all([
      api.get(`/api/admin/users`).then(res => res.data.data.find((u: any) => u.id === id)),
      api.get(`/api/admin/users/${id}/activity`),
      api.get(`/api/admin/users/${id}/chat`),
    ]).then(([user, act, chat]) => {
      setProfile(user);
      setActivity(act.data.data);
      setMessages(chat.data.data);
    }).finally(() => setLoading(false));

    // Secondary non-blocking scan for skin profile fields.
    // Never delays or blocks the main render.
    const skinSources = [
      `/api/admin/users/${id}`,
      `/api/v1/users/${id}`,
    ];
    (async () => {
      for (const url of skinSources) {
        try {
          const res = await api.get(url);
          const p = res.data?.data ?? res.data;
          const skinType     = p?.skinType     ?? p?.skin_type;
          const hairType     = p?.hairType     ?? p?.hair_type;
          const skinConcerns = p?.skinConcerns ?? p?.skin_concerns;
          if (skinType || hairType || skinConcerns) {
            setProfile(prev => prev ? { ...prev, skinType, hairType, skinConcerns } : prev);
            break;
          }
        } catch { /* try next */ }
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "28px", height: "28px", border: "1px solid #FF5F1F", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.42rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>Loading profile</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>User not found</p>
      </div>
    );
  }

  const suspiciousCount = messages.filter(m => m.suspicious).length;
  const isElevated = profile.role === "admin" || profile.role === "super_admin";
  const initials = getInitials(profile.name);
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const accentColor = isElevated ? "#FF5F1F" : "#00FFFF";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#fff" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&display=swap');
        .ud-tab { background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-family: 'Syncopate', sans-serif; font-size: 0.42rem; letter-spacing: 0.2em; text-transform: uppercase; padding: 0.9rem 0; color: rgba(255,255,255,0.3); transition: color 0.2s, border-color 0.2s; }
        .ud-tab.active { color: #FF5F1F; border-bottom-color: #FF5F1F; }
        .ud-tab:hover:not(.active) { color: rgba(255,255,255,0.6); }
        .ud-row:hover td { background: rgba(255,255,255,0.015) !important; }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 2rem" }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.25)",
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "0.4rem", letterSpacing: "0.2em", textTransform: "uppercase",
            marginBottom: "2.5rem", padding: 0,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#00FFFF")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
        >
          <ArrowLeft size={12} /> Back to users
        </button>

        {/* ── Two-column profile header ────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.07)",
          marginBottom: "1.5rem",
        }}>
          {/* Left — identity */}
          <div style={{ background: "#0D0D13", padding: "2rem", position: "relative", overflow: "hidden" }}>
            {/* Decorative glow */}
            <div style={{
              position: "absolute", top: "-40px", left: "-40px",
              width: "150px", height: "150px",
              background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Role tag */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <div style={{ width: "16px", height: "1px", background: accentColor, opacity: 0.6 }} />
                <span style={{
                  fontFamily: "'Syncopate', sans-serif",
                  fontSize: "0.38rem", letterSpacing: "0.28em",
                  textTransform: "uppercase", color: accentColor, opacity: 0.75,
                }}>
                  {profile.role.replace("_", " ")}
                </span>
              </div>

              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "68px", height: "68px", flexShrink: 0,
                  background: `${accentColor}12`,
                  border: `1px solid ${accentColor}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{
                    fontFamily: "'Syncopate', sans-serif",
                    fontSize: "1.3rem", fontWeight: 700,
                    color: accentColor, letterSpacing: "0.05em",
                  }}>
                    {initials}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{
                    fontFamily: "'Syncopate', sans-serif",
                    fontSize: "0.95rem", fontWeight: 700,
                    color: "#fff", letterSpacing: "0.08em",
                    marginBottom: "0.4rem",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {profile.name}
                  </h1>
                  <p style={{
                    fontFamily: "monospace",
                    fontSize: "0.72rem", color: "#00FFFF",
                    opacity: 0.6, letterSpacing: "0.05em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {profile.email}
                  </p>
                </div>
              </div>

              {/* Meta fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {[
                  { label: "User ID", value: `${profile.id.slice(0, 16).toUpperCase()}…` },
                  { label: "Joined", value: joinDate },
                  { label: "Verified", value: profile.emailVerified ? "Yes" : "Pending" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
                    <span style={{
                      fontFamily: "'Syncopate', sans-serif",
                      fontSize: "0.37rem", letterSpacing: "0.22em",
                      textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                      minWidth: "60px", flexShrink: 0,
                    }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.65)" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — skin profile */}
          <div style={{ background: "#0D0D13", padding: "2rem", position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", bottom: "-30px", right: "-30px",
              width: "120px", height: "120px",
              background: "radial-gradient(circle, rgba(255,95,31,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <div style={{ width: "16px", height: "1px", background: "#FF5F1F", opacity: 0.5 }} />
                <span style={{
                  fontFamily: "'Syncopate', sans-serif",
                  fontSize: "0.38rem", letterSpacing: "0.25em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                }}>
                  Skin Profile
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {[
                  { label: "Skin Type", value: profile.skinType },
                  { label: "Hair Type", value: profile.hairType },
                  { label: "Concerns",  value: profile.skinConcerns },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{
                      fontFamily: "'Syncopate', sans-serif",
                      fontSize: "0.37rem", letterSpacing: "0.22em",
                      textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                      marginBottom: "0.45rem",
                    }}>
                      {label}
                    </p>
                    {value ? (
                      <div style={{
                        display: "inline-block",
                        padding: "0.3rem 0.75rem",
                        background: "rgba(255,95,31,0.07)",
                        border: "1px solid rgba(255,95,31,0.2)",
                        fontFamily: "'Syncopate', sans-serif",
                        fontSize: "0.45rem", letterSpacing: "0.1em",
                        color: "#FF5F1F", textTransform: "uppercase",
                        maxWidth: "100%", wordBreak: "break-word",
                      }}>
                        {value}
                      </div>
                    ) : (
                      <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.18)" }}>
                        — not set
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        {activity && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: "1.5rem",
          }}>
            {[
              { icon: Eye,          label: "Views",     value: activity.views,    color: "#00FFFF" },
              { icon: Search,       label: "Searches",  value: activity.searches, color: "#FF5F1F" },
              { icon: ShoppingCart, label: "Cart Adds", value: activity.carts,    color: "#00FFFF" },
              { icon: Heart,        label: "Wishlist",  value: activity.wishlists,color: "#FF5F1F" },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <div key={label} style={{
                background: "#0D0D13",
                padding: "1.25rem 1.5rem",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "1px",
                  background: color, opacity: 0.3,
                }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <Icon size={14} style={{ color, opacity: 0.5 }} />
                  <span style={{
                    fontFamily: "monospace", fontSize: "0.6rem",
                    color: "rgba(255,255,255,0.12)",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p style={{
                  fontFamily: "'Syncopate', sans-serif",
                  fontSize: "1.8rem", fontWeight: 700,
                  color, lineHeight: 1,
                  marginBottom: "0.35rem",
                }}>
                  {value}
                </p>
                <p style={{
                  fontFamily: "'Syncopate', sans-serif",
                  fontSize: "0.37rem", letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "0" }}>
          <button className={`ud-tab ${activeTab === "activity" ? "active" : ""}`} onClick={() => setActiveTab("activity")} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Activity size={11} /> Activity signals
          </button>
          <button className={`ud-tab ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <MessageSquare size={11} />
            Chat history
            {suspiciousCount > 0 && (
              <span style={{
                background: "rgba(255,80,80,0.12)", color: "#FF5050",
                border: "1px solid rgba(255,80,80,0.25)",
                fontFamily: "'Syncopate', sans-serif", fontSize: "0.35rem",
                letterSpacing: "0.08em", padding: "0.12rem 0.45rem",
              }}>
                {suspiciousCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Activity tab ──────────────────────────────────────────────── */}
        {activeTab === "activity" && activity && (
          <div style={{ background: "#0D0D13", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Type", "Product / Query", "Time"].map(h => (
                    <th key={h} style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.38rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0.85rem 1.5rem", textAlign: "left", fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.recentSignals.slice(0, 20).map((s: any, i: number) => (
                  <tr key={i} className="ud-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.85rem 1.5rem", fontFamily: "'Syncopate', sans-serif", fontSize: "0.38rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#00FFFF", opacity: 0.7 }}>
                      {s.type}
                    </td>
                    <td style={{ padding: "0.85rem 1.5rem", fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
                      {s.productId || s.searchQuery || "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1.5rem", fontFamily: "monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {activity.recentSignals.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "3rem", textAlign: "center", fontFamily: "'Syncopate', sans-serif", fontSize: "0.42rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
                      No signals recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Chat tab ──────────────────────────────────────────────────── */}
        {activeTab === "chat" && (
          <div style={{ background: "#0D0D13", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Time", "User message", "Bot reply", "Status"].map(h => (
                    <th key={h} style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.38rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0.85rem 1.5rem", textAlign: "left", fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {messages.map(msg => (
                  <tr
                    key={msg.id}
                    className="ud-row"
                    style={{
                      background: msg.suspicious ? "rgba(255,80,80,0.03)" : "transparent",
                      borderLeft: msg.suspicious ? "2px solid rgba(255,80,80,0.35)" : "2px solid transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <td style={{ padding: "0.85rem 1.5rem", fontFamily: "monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.22)", whiteSpace: "nowrap" }}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "0.85rem 1.5rem", maxWidth: "240px" }}>
                      <p style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={msg.userMessage}>
                        {msg.userMessage}
                      </p>
                    </td>
                    <td style={{ padding: "0.85rem 1.5rem", maxWidth: "280px" }}>
                      <p style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {msg.botMessages?.[0]?.text || "—"}
                      </p>
                    </td>
                    <td style={{ padding: "0.85rem 1.5rem" }}>
                      {msg.suspicious ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "'Syncopate', sans-serif", fontSize: "0.35rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#FF5050", background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.18)", padding: "0.22rem 0.55rem" }}>
                          <AlertTriangle size={9} /> Suspicious
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "'Syncopate', sans-serif", fontSize: "0.35rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,255,170,0.6)", background: "rgba(0,255,170,0.04)", border: "1px solid rgba(0,255,170,0.1)", padding: "0.22rem 0.55rem" }}>
                          <CheckCircle size={9} /> Clean
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "3rem", textAlign: "center", fontFamily: "'Syncopate', sans-serif", fontSize: "0.42rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
                      No chat history
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}