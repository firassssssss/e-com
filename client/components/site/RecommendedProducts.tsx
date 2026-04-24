"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useSignal } from "@/hooks/useSignal";
import Link from "next/link";
import { profileEvents } from "@/lib/profileEvents";
import { useAuthStore } from "@/lib/authStore";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string | null;
  brand: string;
  images: string[];
  averageRating: string;
}

export default function RecommendedProducts() {
  const { user, loading: authLoading } = useAuthStore();
  const [products, setProducts]        = useState<Product[]>([]);
  const [loading, setLoading]          = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchRecs = () => {
      setLoading(true);
      api.get("/api/v1/recommendations?limit=12")
        .then(res => setProducts(res.data?.data ?? []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    };
    fetchRecs();
    return profileEvents.on(fetchRecs);
  }, [user]);

  // ── shared section header ────────────────────────────────────────────────
  const SectionHeader = ({ subtitle }: { subtitle: string }) => (
    <div style={{ marginBottom: "2.5rem", textAlign: "center", padding: "0 2rem" }}>
      <p style={{
        fontFamily: "var(--font-label)", fontSize: "0.6rem",
        letterSpacing: "0.4em", textTransform: "uppercase",
        color: "var(--cyan-soft)", marginBottom: "1rem", opacity: 0.85,
      }}>
        Personalised For You
      </p>
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(2rem, 4vw, 3.5rem)",
        fontWeight: 300, color: "var(--text-primary)",
        margin: "0 0 0.6rem", letterSpacing: "0.05em",
      }}>
        Recommended
      </h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
        {subtitle}
      </p>
    </div>
  );

  // ── still resolving auth ─────────────────────────────────────────────────
  if (authLoading) return null;

  // ── GUEST: show login prompt ─────────────────────────────────────────────
  if (!user) {
    return (
      <section style={{ padding: "4rem 2rem", overflow: "hidden" }}>
        <SectionHeader subtitle="Sign in to unlock your personalised routine" />

        <div style={{
          maxWidth: 480,
          margin: "0 auto",
          textAlign: "center",
          padding: "2.5rem 2rem",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1.25rem",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(12px)",
        }}>
          {/* icon */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--amber-honey), var(--cyan-soft))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.4rem", fontSize: "1.5rem",
          }}>
            ✦
          </div>

          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.35rem", fontWeight: 300,
            color: "var(--text-primary)",
            marginBottom: "0.75rem", letterSpacing: "0.03em",
          }}>
            Your skin deserves better
          </p>

          <p style={{
            fontSize: "0.82rem", color: "var(--text-muted)",
            lineHeight: 1.7, marginBottom: "1.8rem",
            letterSpacing: "0.03em",
          }}>
            Create a free account and we'll recommend products
            matched to your skin type, concerns, and routine.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/auth/register"
              style={{
                display: "inline-block",
                padding: "0.65rem 1.6rem",
                background: "linear-gradient(135deg, var(--amber-honey), var(--amber-soft))",
                color: "#000",
                borderRadius: "2rem",
                fontFamily: "var(--font-label)",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              style={{
                display: "inline-block",
                padding: "0.65rem 1.6rem",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--text-primary)",
                borderRadius: "2rem",
                fontFamily: "var(--font-label)",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── LOGGED IN but still loading or no results yet ────────────────────────
  if (loading || products.length === 0) return null;

  const doubled = [...products, ...products];

  return (
    <section style={{ padding: "4rem 0", overflow: "hidden" }}>
      <SectionHeader subtitle="Based on your skin profile · hover to pause" />

      <div className="marquee-container">
        <div className="marquee-track">
          {doubled.map((p, i) => (
            <div key={`${p.id}-${i}`} className="marquee-card">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Crystal Product Card  (3-D tilt + image parallax + glow)
───────────────────────────────────────────────────────────────────────────── */
function ProductCard({ product }: { product: Product }) {
  const cardRef    = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const glowRef    = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);

  const { track } = useSignal();
  useEffect(() => { track("view", product.id); }, [product.id]);

  const mx = useRef(0.5); const my = useRef(0.5);
  const tx = useRef(0.5); const ty = useRef(0.5);
  const inside = useRef(false);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      mx.current = lerp(mx.current, tx.current, 0.1);
      my.current = lerp(my.current, ty.current, 0.1);
      const dx = mx.current - 0.5;
      const dy = my.current - 0.5;
      const sc = inside.current ? 1.03 : 1.0;

      if (cardRef.current)
        cardRef.current.style.transform =
          `rotateX(${-dy * 16}deg) rotateY(${dx * 20}deg) scale(${sc})`;

      if (imgWrapRef.current)
        imgWrapRef.current.style.transform =
          `translate(${dx * 10}px, ${dy * 8}px)`;

      if (glowRef.current) {
        glowRef.current.style.background =
          `radial-gradient(ellipse 42% 36% at ${46 + dx * 22}% ${38 + dy * 18}%,
           rgba(255,200,120,0.14) 0%, transparent 72%)`;
        glowRef.current.style.opacity = inside.current ? "1" : "0";
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{ perspective: "900px", perspectiveOrigin: "50% 45%" }}
      onMouseEnter={() => { inside.current = true; }}
      onMouseLeave={() => { inside.current = false; tx.current = 0.5; ty.current = 0.5; }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        tx.current = (e.clientX - r.left) / r.width;
        ty.current = (e.clientY - r.top) / r.height;
      }}
    >
      <Link href={`/products/${product.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div
          ref={cardRef}
          className="crystal-card"
          style={{ willChange: "transform", transition: "box-shadow 0.3s, outline-color 0.3s" }}
        >
          <div style={{
            width: "100%", aspectRatio: "1", overflow: "hidden",
            background: "var(--bg-secondary)", position: "relative",
          }}>
            <div ref={imgWrapRef} style={{ width: "110%", height: "110%", marginLeft: "-5%", marginTop: "-5%" }}>
              {product.images?.[0] ? (
                <img
                  src={product.images[0]} alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: "linear-gradient(135deg, var(--amber-honey), transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "2rem", opacity: 0.25 }}>✦</span>
                </div>
              )}
            </div>

            <div ref={glowRef} style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              opacity: 0, transition: "opacity 0.35s",
            }} />

            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
              background: "linear-gradient(to top, rgba(0,0,0,0.22), transparent)",
              pointerEvents: "none",
            }} />
          </div>

          <div className="crystal-card__depth" />

          <div style={{ padding: "1rem 1.2rem 1.4rem", position: "relative", zIndex: 3 }}>
            <p style={{
              fontFamily: "var(--font-label)", fontSize: "0.52rem",
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "var(--amber-soft)", marginBottom: "0.35rem",
            }}>
              {product.brand}
            </p>
            <p style={{
              fontFamily: "var(--font-display)", fontSize: "1.1rem",
              fontWeight: 400, color: "var(--text-primary)",
              marginBottom: "0.6rem", lineHeight: 1.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {product.name}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {product.price && (
                <p style={{
                  fontFamily: "var(--font-label)", fontSize: "0.72rem",
                  color: "var(--text-primary)", letterSpacing: "0.05em",
                }}>
                  {parseFloat(product.price).toFixed(2)} TND
                </p>
              )}
              {parseFloat(product.averageRating) > 0 && (
                <p style={{ fontSize: "0.72rem", color: "var(--amber)", letterSpacing: "0.03em" }}>
                  ★ {parseFloat(product.averageRating).toFixed(1)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
