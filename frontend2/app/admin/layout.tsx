"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Users, Package, Activity, BarChart3,
  Network, MessageSquare, ShoppingBag, Sun, Moon,
} from "lucide-react";
import CustomCursor from "@/components/site/CustomCursor";
import { ThemeProvider, useTheme } from "@/components/ui/ThemeContext";
import { AdminTokensProvider } from "@/components/admin/AdminTokensContext";

const navItems = [
  { href: "/admin/dashboard", label: "Overview",    icon: Activity },
  { href: "/admin/users",     label: "Users",        icon: Users },
  { href: "/admin/products",  label: "Products",     icon: Package },
  { href: "/admin/orders",    label: "Orders",       icon: ShoppingBag },
  { href: "/admin/chat",      label: "Chat Health",  icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics",    icon: BarChart3 },
  { href: "/admin/graph",     label: "User Graph",   icon: Network },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading]       = useState(true);

  const dk = theme === "dark";
  const bg        = dk ? "#0A0A0F"                : "#F4F4F8";
  const sidebarBg = dk ? "#111118"                : "#FFFFFF";
  const border    = dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
  const textMuted = dk ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const textFaint = dk ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";
  const mainText  = dk ? "#fff"                   : "#0F0F1A";

  useEffect(() => {
    api.get("/api/admin/ping")
      .then(() => setAuthorized(true))
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontFamily:"'Syncopate',sans-serif", fontSize:"0.6rem", letterSpacing:"0.4em", textTransform:"uppercase", color:textMuted }}>
        Loading...
      </div>
    </div>
  );

  if (!authorized) return null;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:bg }}>
      <CustomCursor />

      <aside style={{
        width:"240px", background:sidebarBg,
        borderRight:`1px solid ${border}`,
        position:"fixed", left:0, top:0, minHeight:"100vh",
        display:"flex", flexDirection:"column", padding:"2rem 0", zIndex:100,
        transition:"background 0.25s, border-color 0.25s",
      }}>
        <div style={{ padding:"0 2rem 2rem", borderBottom:`1px solid ${border}`, marginBottom:"1.5rem" }}>
          <Link href="/" style={{ textDecoration:"none" }}>
            <p style={{ fontFamily:"'Syncopate',sans-serif", fontSize:"0.85rem", letterSpacing:"0.3em", color:mainText, fontWeight:700 }}>
              LUM<span style={{ color: dk ? "#00FFFF" : "#0077AA" }}>I</span>NA
            </p>
          </Link>
          <p style={{ fontFamily:"'Syncopate',sans-serif", fontSize:"0.5rem", letterSpacing:"0.2em", textTransform:"uppercase", color:textMuted, marginTop:"0.5rem" }}>
            Admin Console
          </p>
        </div>

        <nav style={{ flex:1, overflowY:"auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                style={{
                  display:"flex", alignItems:"center", gap:"0.8rem",
                  padding:"0.85rem 2rem", textDecoration:"none",
                  fontFamily:"'Syncopate',sans-serif", fontSize:"0.55rem",
                  letterSpacing:"0.15em", textTransform:"uppercase",
                  color: isActive ? "#FF5F1F" : textMuted,
                  background: isActive ? "rgba(255,95,31,0.06)" : "transparent",
                  borderLeft:`2px solid ${isActive ? "#FF5F1F" : "transparent"}`,
                  transition:"all 0.2s",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color=mainText; e.currentTarget.style.background=dk?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"; e.currentTarget.style.borderLeftColor="#FF5F1F"; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color=textMuted; e.currentTarget.style.background="transparent"; e.currentTarget.style.borderLeftColor="transparent"; }}}
              >
                <Icon size={15} />{item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding:"1.5rem 2rem", borderTop:`1px solid ${border}`, display:"flex", flexDirection:"column", gap:"1rem" }}>
          <button onClick={toggle} title={dk?"Switch to light":"Switch to dark"}
            style={{
              display:"flex", alignItems:"center", gap:"0.6rem",
              background: dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",
              border:`1px solid ${border}`, borderRadius:"6px",
              padding:"0.55rem 0.9rem", cursor:"pointer",
              transition:"background 0.2s", width:"100%",
            }}
            onMouseEnter={e => { e.currentTarget.style.background=dk?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.10)"; }}
            onMouseLeave={e => { e.currentTarget.style.background=dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"; }}
          >
            {dk ? <Sun size={13} color="#FFD700" /> : <Moon size={13} color="#6366f1" />}
            <span style={{ fontFamily:"'Syncopate',sans-serif", fontSize:"0.48rem", letterSpacing:"0.15em", textTransform:"uppercase", color:textMuted }}>
              {dk ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          <button onClick={() => { localStorage.clear(); router.push("/auth/login"); }}
            style={{ background:"none", border:"none", fontFamily:"'Syncopate',sans-serif", fontSize:"0.5rem", letterSpacing:"0.15em", textTransform:"uppercase", color:textFaint, cursor:"pointer", transition:"color 0.2s", padding:0, textAlign:"left" }}
            onMouseEnter={e => (e.currentTarget.style.color="#FF5F1F")}
            onMouseLeave={e => (e.currentTarget.style.color=textFaint)}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{
        marginLeft:"240px", flex:1, minHeight:"100vh",
        background:bg, padding:"2.5rem 3rem", color:mainText,
        transition:"background 0.25s, color 0.25s",
      }}>
        <AdminTokensProvider>
          {children}
        </AdminTokensProvider>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ThemeProvider>
  );
}
