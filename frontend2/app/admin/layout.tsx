"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Users, Package, Activity, BarChart3, Network, MessageSquare, Shield } from "lucide-react";
import CustomCursor from "@/components/site/CustomCursor";

const navItems = [
  { href: "/admin/dashboard", label: "Overview",   icon: Activity },
  { href: "/admin/users",     label: "Users",       icon: Users },
  { href: "/admin/products",  label: "Products",    icon: Package },
  { href: "/admin/chat",      label: "Chat Health", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics",   icon: BarChart3 },
  { href: "/admin/graph",     label: "User Graph",  icon: Network },
  { href: "/admin/security",  label: "Security",    icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get("/api/admin/ping")
      .then(() => setAuthorized(true))
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0A0F",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: "'Syncopate', sans-serif",
          fontSize: "0.6rem", letterSpacing: "0.4em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0A0F" }}>

      {/* Custom cursor — same as the site layout */}
      <CustomCursor />

      {/* Sidebar */}
      <aside style={{
        width: "240px",
        background: "#111118",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        position: "fixed", left: 0, top: 0,
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        padding: "2rem 0",
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: "0 2rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "1.5rem",
        }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <p style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: "0.85rem",
              letterSpacing: "0.3em",
              color: "#fff",
              fontWeight: 700,
            }}>
              LUM<span style={{ color: "#00FFFF" }}>I</span>NA
            </p>
          </Link>
          <p style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginTop: "0.5rem",
          }}>
            Admin Console
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon     = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  padding: "0.85rem 2rem",
                  textDecoration: "none",
                  fontFamily: "'Syncopate', sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: isActive ? "#FF5F1F" : "rgba(255,255,255,0.55)",
                  background: isActive ? "rgba(255,95,31,0.06)" : "transparent",
                  borderLeft: `2px solid ${isActive ? "#FF5F1F" : "transparent"}`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderLeftColor = "#FF5F1F";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderLeftColor = "transparent";
                  }
                }}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/auth/login");
            }}
            style={{
              background: "none",
              border: "none",
              fontFamily: "'Syncopate', sans-serif",
              fontSize: "0.5rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              cursor: "pointer",
              transition: "color 0.2s",
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#FF5F1F")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        marginLeft: "240px",
        flex: 1,
        minHeight: "100vh",
        background: "#0A0A0F",
        padding: "2.5rem 3rem",
        color: "#fff",
      }}>
        {children}
      </main>
    </div>
  );
}