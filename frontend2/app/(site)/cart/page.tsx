"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X, Minus, Plus, ShoppingBag, Loader2 } from "lucide-react";
import { cartApi, productsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { hdImage } from "@/lib/utils";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
}

const HERO_IMAGES = [
  "/images/hero-A.jpg",
  "/images/hero-amber-front.jpg",
  "/images/hero-amber-side.jpg",
  "/images/hero-cyan-close.jpg",
  "/images/hero-cyan-dark.jpg",
  "/images/hero-y.jpg",
  "/images/hero_z.jpg",
];

const SLIDE_DURATION = 5000;
const FADE_DURATION  = 1800;

function HeroCycler() {
  const [current, setCurrent] = useState(0);
  const [next,    setNext]    = useState(1);
  const [fading,  setFading]  = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const nextIdx = (current + 1) % HERO_IMAGES.length;
      setNext(nextIdx);
      setFading(true);
      setTimeout(() => {
        setCurrent(nextIdx);
        setFading(false);
      }, FADE_DURATION);
    }, SLIDE_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current]);

  const parallax = `translate(${mousePos.x * -14}px, ${mousePos.y * -14}px) scale(1.1)`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>

      {/* Current image */}
      <div style={{
        position: "absolute", inset: "-6%",
        backgroundImage: `url('${HERO_IMAGES[current]}')`,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: parallax,
        transition: `transform 0.15s cubic-bezier(0.25,0.46,0.45,0.94), opacity ${FADE_DURATION}ms ease`,
        opacity: fading ? 0 : 1,
        willChange: "transform, opacity",
      }} />

      {/* Next image fading in */}
      <div style={{
        position: "absolute", inset: "-6%",
        backgroundImage: `url('${HERO_IMAGES[next]}')`,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: parallax,
        transition: `transform 0.15s cubic-bezier(0.25,0.46,0.45,0.94), opacity ${FADE_DURATION}ms ease`,
        opacity: fading ? 1 : 0,
        willChange: "transform, opacity",
      }} />

      {/* Heavy veil — almost opaque, just a ghost of image bleeds through */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(7,5,10,0.93) 0%, rgba(7,5,10,0.78) 40%, rgba(7,5,10,0.91) 100%)",
      }} />

      {/* Futuristic scanlines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,255,0.012) 3px, rgba(0,255,255,0.012) 4px)",
        pointerEvents: "none",
      }} />

      {/* Cyan corner bloom — follows mouse */}
      <div style={{
        position: "absolute", top: "-10%", right: "-10%",
        width: "60vw", height: "60vw",
        background: "radial-gradient(circle, rgba(0,255,255,0.055) 0%, transparent 60%)",
        pointerEvents: "none",
        transition: "transform 0.6s ease",
        transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)`,
      }} />

      {/* Amber bottom bloom — opposite direction */}
      <div style={{
        position: "absolute", bottom: "-15%", left: "-10%",
        width: "50vw", height: "50vw",
        background: "radial-gradient(circle, rgba(255,95,31,0.045) 0%, transparent 60%)",
        pointerEvents: "none",
        transition: "transform 0.8s ease",
        transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
      }} />

      {/* Horizontal light streak */}
      <div style={{
        position: "absolute", top: "28%", left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.12) 30%, rgba(0,255,255,0.22) 50%, rgba(0,255,255,0.12) 70%, transparent 100%)",
        pointerEvents: "none",
        animation: "streakFade 6s ease-in-out infinite",
      }} />

      <style>{`
        @keyframes streakFade {
          0%, 100% { opacity: 0; }
          40%, 60%  { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading, fetchMe } = useAuthStore();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setCartLoading(false); return; }
    setCartLoading(true);
    cartApi
      .get()
      .then(async (res) => {
        const cartItems: CartItem[] = res.data?.data?.items ?? res.data?.items ?? [];
        const enriched = await Promise.all(
          cartItems.map(async (item) => {
            try {
              const p = await productsApi.getById(item.productId);
              const d = p.data?.data ?? p.data;
              return { ...item, productName: d?.name, productImage: d?.images?.[0] };
            } catch { return item; }
          })
        );
        setItems(enriched);
      })
      .catch(() => setError("Failed to load your cart."))
      .finally(() => setCartLoading(false));
  }, [user, authLoading]);

  const updateQty = async (productId: string, delta: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) return removeItem(productId);
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: newQty } : i));
    try {
      await cartApi.remove(productId);
      await cartApi.add(productId, newQty);
    } catch {
      const res = await cartApi.get();
      setItems(res.data?.data?.items ?? res.data?.items ?? []);
    }
  };

  const removeItem = async (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    try { await cartApi.remove(productId); }
    catch {
      const res = await cartApi.get();
      setItems(res.data?.data?.items ?? res.data?.items ?? []);
    }
  };

  const glassCard: React.CSSProperties = {
    background: "rgba(7,5,10,0.55)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    border: "1px solid rgba(255,255,255,0.07)",
  };

  if (authLoading || cartLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07050A", position: "relative" }}>
        <HeroCycler />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Loader2 size={28} style={{ color: "#FF5F1F", animation: "spin 1s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#07050A", paddingTop: "70px", position: "relative" }}>
        <HeroCycler />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "3.5rem 2rem" }}>
          <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.55rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#FF5F1F", marginBottom: "0.75rem" }}>Your Bag</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 300, color: "#fff", marginBottom: "3rem" }}>
            0 Items
          </h1>
          <div style={{ ...glassCard, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 2rem" }}>
            <ShoppingBag size={48} style={{ color: "rgba(255,255,255,0.12)", marginBottom: "1.5rem" }} />
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2.5rem", fontWeight: 300, color: "#fff", marginBottom: "0.75rem" }}>
              Sign in to see your bag
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.35)", marginBottom: "2.5rem" }}>
              Your cart syncs across devices when you're logged in.
            </p>
            <Link href="/auth/login?from=/cart" style={{
              display: "inline-flex", alignItems: "center", gap: "0.75rem", padding: "1rem 2.5rem",
              fontFamily: "'Syncopate', sans-serif", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase",
              background: "#FF5F1F", color: "#000", textDecoration: "none", transition: "box-shadow 0.25s",
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 40px rgba(255,95,31,0.5)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              SIGN IN <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07050A", position: "relative" }}>
        <HeroCycler />
        <p style={{ color: "#FF5F1F", fontFamily: "'DM Sans', sans-serif", position: "relative", zIndex: 1 }}>{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#07050A", paddingTop: "70px", position: "relative" }}>
        <HeroCycler />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "3.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", textAlign: "center" }}>
          <ShoppingBag size={52} style={{ color: "rgba(255,255,255,0.1)", marginBottom: "1.5rem" }} />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 300, color: "#fff", marginBottom: "0.75rem" }}>
            Your bag is empty
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem", marginBottom: "2.5rem", fontFamily: "'DM Sans', sans-serif" }}>
            Discover our collection and find something you love.
          </p>
          <Link href="/products" style={{
            display: "inline-flex", alignItems: "center", gap: "0.75rem", padding: "1rem 2.5rem",
            fontFamily: "'Syncopate', sans-serif", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase",
            background: "#FF5F1F", color: "#000", textDecoration: "none", transition: "box-shadow 0.25s",
          }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 40px rgba(255,95,31,0.5)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            SHOP NOW <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 75 ? 0 : 8;
  const total    = subtotal + shipping;

  return (
    <div style={{ minHeight: "100vh", background: "#07050A", paddingTop: "70px", position: "relative" }}>
      <HeroCycler />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.55rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#FF5F1F", marginBottom: "0.75rem" }}>
            Your Bag
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 300, color: "#fff" }}>
            {items.length} Item{items.length !== 1 ? "s" : ""}
          </h1>
        </div>

        {/* Shimmer divider */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.35), rgba(255,95,31,0.35), transparent)", marginBottom: "3rem" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4rem" }} className="cart-grid">

          {/* Items */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((item, idx) => (
              <div key={item.productId} style={{
                display: "flex", gap: "1.5rem", padding: "2rem 0",
                borderTop: idx === 0 ? "1px solid rgba(255,255,255,0.07)" : undefined,
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ width: 100, height: 100, flexShrink: 0, overflow: "hidden", background: "rgba(255,255,255,0.02)", position: "relative" }}>
                  {item.productImage ? (
                    <img src={hdImage(item.productImage)} alt={item.productName ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShoppingBag size={24} style={{ color: "rgba(255,255,255,0.12)" }} />
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.5), transparent)" }} />
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#FF5F1F", marginBottom: "0.4rem" }}>
                        Lumina
                      </p>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", fontWeight: 400, color: "#fff", lineHeight: 1.3, marginBottom: "0.3rem" }}>
                        {item.productName ?? item.productId}
                      </h3>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>
                        {item.price.toFixed(2)} TND each
                      </p>
                    </div>
                    <button onClick={() => removeItem(item.productId)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", transition: "color 0.2s", padding: "0.25rem" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#FF5F1F")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <button onClick={() => updateQty(item.productId, -1)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: "0.5rem 0.75rem", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#FF5F1F")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#fff")}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.65rem", padding: "0.5rem 1rem", borderLeft: "1px solid rgba(255,255,255,0.07)", borderRight: "1px solid rgba(255,255,255,0.07)", color: "#fff", minWidth: 40, textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQty(item.productId, 1)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: "0.5rem 0.75rem", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#FF5F1F")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#fff")}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 400, color: "#fff" }}>
                      {(item.price * item.quantity).toFixed(2)} TND
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div>
            <div style={{ ...glassCard, padding: "2rem", position: "sticky", top: "90px" }}>
              <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.4), transparent)", marginBottom: "1.5rem" }} />

              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.75rem", fontWeight: 300, color: "#fff", marginBottom: "1.5rem" }}>
                Order Summary
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)" }}>
                  <span>Subtotal</span><span>{subtotal.toFixed(2)} TND</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)" }}>
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? "#00FFFF" : "rgba(255,255,255,0.4)" }}>
                    {shipping === 0 ? "Free" : `${shipping.toFixed(2)} TND`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#FF5F1F" }}>
                    Add {(75 - subtotal).toFixed(2)} TND more for free shipping
                  </p>
                )}
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.25rem", marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.35rem", fontWeight: 300, color: "#fff" }}>Total</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.35rem", fontWeight: 300, color: "#fff" }}>{total.toFixed(2)} TND</span>
                </div>
              </div>

              <Link href="/checkout" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                width: "100%", padding: "1rem",
                fontFamily: "'Syncopate', sans-serif", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase",
                background: "#FF5F1F", color: "#000", textDecoration: "none", transition: "box-shadow 0.3s",
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 40px rgba(255,95,31,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                CHECKOUT <ArrowRight size={14} />
              </Link>

              <Link href="/products" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                width: "100%", padding: "0.85rem",
                fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)", textDecoration: "none", marginTop: "0.75rem", transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#00FFFF")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
              >
                <ArrowLeft size={12} /> CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (min-width: 1024px) {
            .cart-grid { grid-template-columns: 1fr 380px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}