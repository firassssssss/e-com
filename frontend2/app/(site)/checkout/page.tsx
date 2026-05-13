"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Lock, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { cartApi, ordersApi, productsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { hdImage } from "@/lib/utils";

const schema = z.object({
  firstName:  z.string().min(1, "Required"),
  lastName:   z.string().min(1, "Required"),
  email:      z.string().email("Invalid email"),
  phone:      z.string().min(8, "Invalid phone"),
  address:    z.string().min(5, "Required"),
  city:       z.string().min(1, "Required"),
  country:    z.string().min(1, "Required"),
  zip:        z.string().min(3, "Required"),
  cardNumber: z.string().min(16, "Invalid card number"),
  expiry:     z.string().min(5, "Invalid expiry"),
  cvv:        z.string().min(3, "Invalid CVV"),
});

type FormData = z.infer<typeof schema>;

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  padding: "0.9rem 1rem",
  fontSize: "0.9rem",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Syncopate', sans-serif",
  fontSize: "0.5rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: "0.4rem",
};

const errorStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.75rem",
  color: "var(--amber)",
  marginTop: "0.3rem",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading, fetchMe } = useAuthStore();
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [placing, setPlacing] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login?from=/checkout"); return; }
    cartApi.get()
      .then(async (res) => {
        const items: CartItem[] = res.data?.data?.items ?? res.data?.items ?? [];
        const enriched = await Promise.all(
          items.map(async (item) => {
            try {
              const p = await productsApi.getById(item.productId);
              const d = p.data?.data ?? p.data;
              return { ...item, productName: d?.name, productImage: d?.images?.[0] };
            } catch { return item; }
          })
        );
        setCartItems(enriched);
      })
      .catch(() => setApiError("Failed to load cart."))
      .finally(() => setCartLoading(false));
  }, [user, authLoading]);

  const handleNextStep = async () => {
    const valid = await trigger(["firstName", "lastName", "email", "phone", "address", "city", "country", "zip"]);
    if (valid) setStep("payment");
  };

  const onSubmit = async (data: FormData) => {
    setPlacing(true);
    setApiError(null);
    try {
      const shippingAddress = `${data.firstName} ${data.lastName}, ${data.address}, ${data.city} ${data.zip}, ${data.country}`;
      await ordersApi.checkout({ shippingAddress, paymentMethod: "stripe", currency: "TND" });
      router.push("/orders");
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? "Order failed. Please try again.");
      setPlacing(false);
    }
  };

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 75 ? 0 : 8;
  const total = subtotal + shipping;

  if (authLoading || cartLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <Loader2 size={32} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const getFocusStyle = (name: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focusedField === name ? "var(--amber)" : "var(--border)",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", paddingTop: "70px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.85rem", letterSpacing: "0.3em", fontWeight: 700, color: "var(--text-primary)" }}>
              LUM<span style={{ color: "var(--cyan)" }}>I</span>NA
            </p>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.15em", color: "var(--text-muted)" }}>
            <Lock size={12} /> SECURE CHECKOUT
          </div>
        </div>

        {/* Shimmer line */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--amber), transparent)", marginBottom: "3rem", opacity: 0.4 }} />

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3rem" }}>
          {(["Shipping", "Payment"] as const).map((s, i) => {
            const active = (i === 0 && step === "shipping") || (i === 1 && step === "payment");
            const done = i === 0 && step === "payment";
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Syncopate', sans-serif", fontSize: "0.6rem",
                  background: done ? "rgba(0,255,255,0.15)" : active ? "var(--amber)" : "transparent",
                  border: done ? "1px solid var(--cyan)" : active ? "1px solid var(--amber)" : "1px solid var(--border)",
                  color: done ? "var(--cyan)" : active ? "#000" : "var(--text-muted)",
                  transition: "all 0.3s",
                }}>
                  {done ? <Check size={12} /> : i + 1}
                </div>
                <span style={{
                  fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "color 0.3s",
                }}>
                  {s}
                </span>
                {i === 0 && <div style={{ width: 48, height: 1, background: "var(--border)", margin: "0 0.5rem" }} />}
              </div>
            );
          })}
        </div>

        {apiError && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem 1.25rem", border: "1px solid var(--amber)", background: "rgba(255,95,31,0.05)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "var(--amber)" }}>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "grid", gap: "4rem" }} className="checkout-grid">

            {/* ── Form ── */}
            <div>
              {step === "shipping" && (
                <div>
                  <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--amber)", marginBottom: "0.75rem" }}>
                    Step 1
                  </p>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2.5rem", fontWeight: 300, color: "var(--text-primary)", marginBottom: "2rem" }}>
                    Shipping Details
                  </h2>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    {(["firstName", "lastName"] as const).map((f) => (
                      <div key={f}>
                        <label style={labelStyle}>{f === "firstName" ? "First Name" : "Last Name"}</label>
                        <input {...register(f)} placeholder={f === "firstName" ? "Firas" : "Rahal"} style={getFocusStyle(f)}
                          onFocus={() => setFocusedField(f)} onBlur={() => setFocusedField(null)} />
                        {errors[f] && <p style={errorStyle}>{errors[f]?.message}</p>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    {(["email", "phone"] as const).map((f) => (
                      <div key={f}>
                        <label style={labelStyle}>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                        <input {...register(f)} type={f === "email" ? "email" : "text"} placeholder={f === "email" ? "you@email.com" : "+216 XX XXX XXX"} style={getFocusStyle(f)}
                          onFocus={() => setFocusedField(f)} onBlur={() => setFocusedField(null)} />
                        {errors[f] && <p style={errorStyle}>{errors[f]?.message}</p>}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={labelStyle}>Address</label>
                    <input {...register("address")} placeholder="123 Rue de la Paix" style={getFocusStyle("address")}
                      onFocus={() => setFocusedField("address")} onBlur={() => setFocusedField(null)} />
                    {errors.address && <p style={errorStyle}>{errors.address.message}</p>}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
                    {(["city", "zip", "country"] as const).map((f) => (
                      <div key={f}>
                        <label style={labelStyle}>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                        <input {...register(f)} placeholder={f === "city" ? "Tunis" : f === "zip" ? "1000" : "Tunisia"} style={getFocusStyle(f)}
                          onFocus={() => setFocusedField(f)} onBlur={() => setFocusedField(null)} />
                        {errors[f] && <p style={errorStyle}>{errors[f]?.message}</p>}
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={handleNextStep} style={{
                    width: "100%", padding: "1rem",
                    fontFamily: "'Syncopate', sans-serif", fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase",
                    background: "var(--amber)", color: "#000", border: "none", cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    CONTINUE TO PAYMENT →
                  </button>
                </div>
              )}

              {step === "payment" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                    <button type="button" onClick={() => setStep("shipping")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--amber)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--amber)", marginBottom: "0.4rem" }}>Step 2</p>
                      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2.5rem", fontWeight: 300, color: "var(--text-primary)" }}>Payment</h2>
                    </div>
                  </div>

                  <div style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: "1.75rem", marginBottom: "1.5rem" }}>
                    {/* amber shimmer */}
                    <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--amber), transparent)", marginBottom: "1.5rem", opacity: 0.4 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      <Lock size={13} style={{ color: "var(--cyan)" }} />
                      <span style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.45rem", letterSpacing: "0.2em", color: "var(--text-muted)" }}>
                        YOUR PAYMENT INFO IS ENCRYPTED
                      </span>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={labelStyle}>Card Number</label>
                      <input {...register("cardNumber")} placeholder="1234 5678 9012 3456" style={getFocusStyle("cardNumber")}
                        onFocus={() => setFocusedField("cardNumber")} onBlur={() => setFocusedField(null)} />
                      {errors.cardNumber && <p style={errorStyle}>{errors.cardNumber.message}</p>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={labelStyle}>Expiry</label>
                        <input {...register("expiry")} placeholder="MM / YY" style={getFocusStyle("expiry")}
                          onFocus={() => setFocusedField("expiry")} onBlur={() => setFocusedField(null)} />
                        {errors.expiry && <p style={errorStyle}>{errors.expiry.message}</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>CVV</label>
                        <input {...register("cvv")} placeholder="•••" style={getFocusStyle("cvv")}
                          onFocus={() => setFocusedField("cvv")} onBlur={() => setFocusedField(null)} />
                        {errors.cvv && <p style={errorStyle}>{errors.cvv.message}</p>}
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={placing} style={{
                    width: "100%", padding: "1rem",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                    fontFamily: "'Syncopate', sans-serif", fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase",
                    background: placing ? "rgba(255,95,31,0.5)" : "var(--amber)", color: "#000",
                    border: "none", cursor: placing ? "not-allowed" : "pointer",
                    transition: "opacity 0.2s",
                  }}
                    onMouseEnter={(e) => { if (!placing) e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    {placing
                      ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> PROCESSING...</>
                      : `PLACE ORDER — ${total.toFixed(2)} TND`}
                  </button>
                </div>
              )}
            </div>

            {/* ── Order Summary ── */}
            <div>
              <div style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: "2rem", position: "sticky", top: "90px" }}>
                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--amber), transparent)", marginBottom: "1.5rem", opacity: 0.4 }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.5rem", fontWeight: 300, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                  Order Summary
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
                  {cartItems.map((item) => (
                    <div key={item.productId} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 52, height: 52, flexShrink: 0, background: "var(--bg-secondary)", overflow: "hidden", position: "relative" }}>
                        {item.productImage ? (
                          <img src={hdImage(item.productImage)} alt={item.productName ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShoppingBag size={16} style={{ color: "var(--border)" }} />
                          </div>
                        )}
                        <span style={{
                          position: "absolute", top: -6, right: -6,
                          width: 18, height: 18, borderRadius: "50%",
                          background: "var(--amber)", color: "#000",
                          fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {item.quantity}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.3 }}>
                          {item.productName ?? item.productId}
                        </p>
                      </div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "var(--text-secondary)", flexShrink: 0 }}>
                        {(item.price * item.quantity).toFixed(2)} TND
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <span>Subtotal</span><span>{subtotal.toFixed(2)} TND</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <span>Shipping</span>
                    <span style={{ color: shipping === 0 ? "var(--cyan)" : "var(--text-secondary)" }}>
                      {shipping === 0 ? "Free" : `${shipping.toFixed(2)} TND`}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.25rem" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", color: "var(--text-primary)" }}>Total</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", color: "var(--text-primary)" }}>{total.toFixed(2)} TND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <style>{`
          @media (min-width: 1024px) {
            .checkout-grid { grid-template-columns: 1fr 380px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}