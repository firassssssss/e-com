"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { cartApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading, fetchMe } = useAuthStore();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve auth on first render
  useEffect(() => {
    fetchMe();
  }, []);

  // Load cart once auth is known
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCartLoading(false);
      return;
    }
    setCartLoading(true);
    cartApi
      .get()
      .then((res) => setItems(res.data?.data?.items ?? res.data?.items ?? []))
      .catch(() => setError("Failed to load your cart."))
      .finally(() => setCartLoading(false));
  }, [user, authLoading]);

  // ── Quantity update ──────────────────────────────────────────────────────────
  const updateQty = async (productId: string, delta: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) return removeItem(productId);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: newQty } : i
      )
    );
    try {
      // Backend has no patch-qty, so remove then re-add
      await cartApi.remove(productId);
      await cartApi.add(productId, newQty);
    } catch {
      // Revert on failure
      const res = await cartApi.get();
      setItems(res.data?.data?.items ?? res.data?.items ?? []);
    }
  };

  // ── Remove item ─────────────────────────────────────────────────────────────
  const removeItem = async (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    try {
      await cartApi.remove(productId);
    } catch {
      const res = await cartApi.get();
      setItems(res.data?.data?.items ?? res.data?.items ?? []);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF7F2" }}>
        <Loader2 size={32} style={{ color: "#C4786A" }} className="animate-spin" />
      </div>
    );
  }

  // ── Not logged in — show empty bag + login CTA (don't block the page) ───────
  if (!user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="mb-12">
            <p className="text-xs tracking-widest mb-3" style={{ color: "#6B4F3A", opacity: 0.5 }}>
              YOUR BAG
            </p>
            <h1 className="text-5xl font-light" style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}>
              0 Items
            </h1>
          </div>
          <div
            className="flex flex-col items-center justify-center py-24 border"
            style={{ borderColor: "#E0D5C8" }}
          >
            <ShoppingBag size={48} className="mb-6" style={{ color: "#E0D5C8" }} />
            <h2
              className="text-3xl font-light mb-3"
              style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
            >
              Sign in to see your bag
            </h2>
            <p className="text-sm mb-8" style={{ color: "#6B4F3A", opacity: 0.6 }}>
              Your cart syncs across devices when you're logged in.
            </p>
            <Link
              href="/auth/login?from=/cart"
              className="inline-flex items-center gap-3 px-8 py-4 text-sm tracking-widest transition-colors"
              style={{ backgroundColor: "#1A1410", color: "#FAF7F2" }}
            >
              SIGN IN <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF7F2" }}>
        <p style={{ color: "#C4786A" }}>{error}</p>
      </div>
    );
  }

  // ── Empty cart ───────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF7F2" }}>
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-6" style={{ color: "#E0D5C8" }} />
          <h2
            className="text-4xl font-light mb-3"
            style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
          >
            Your bag is empty
          </h2>
          <p className="mb-8 text-sm" style={{ color: "#6B4F3A", opacity: 0.6 }}>
            Add some products to get started
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-3 px-8 py-4 text-sm tracking-widest transition-colors"
            style={{ backgroundColor: "#1A1410", color: "#FAF7F2" }}
          >
            SHOP NOW <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 75 ? 0 : 8;
  const total = subtotal + shipping;

  // ── Cart with items ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-12">
          <p
            className="text-xs tracking-widest mb-3"
            style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.3em" }}
          >
            YOUR BAG
          </p>
          <h1
            className="text-5xl font-light"
            style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
          >
            {items.length} Item{items.length !== 1 ? "s" : ""}
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-16">
          {/* ── Items list ── */}
          <div className="lg:col-span-2 flex flex-col divide-y" style={{ borderColor: "#E0D5C8" }}>
            {items.map((item) => (
              <div key={item.productId} className="flex gap-6 py-8">
                {/* Product image placeholder */}
                <div
                  className="w-24 h-24 flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: "#E8C4B8" }}
                >
                  <div
                    className="w-8 h-14 rounded-sm shadow-md absolute"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.4)",
                      transform: "rotate(-3deg)",
                    }}
                  />
                  <div
                    className="w-7 h-12 rounded-sm absolute"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.6)",
                      transform: "rotate(1deg)",
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div>
                      <h3
                        className="text-xl font-light"
                        style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
                      >
                        {item.productName ?? item.productId}
                      </h3>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.1em" }}
                      >
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="self-start transition-colors"
                      style={{ color: "#6B4F3A", opacity: 0.4 }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "#C4786A";
                        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "#6B4F3A";
                        (e.currentTarget as HTMLButtonElement).style.opacity = "0.4";
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity stepper */}
                    <div
                      className="flex items-center border"
                      style={{ borderColor: "#E0D5C8" }}
                    >
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="px-3 py-2 transition-colors"
                        style={{ color: "#1A1410" }}
                      >
                        <Minus size={12} />
                      </button>
                      <span
                        className="px-4 py-2 text-sm border-x min-w-[40px] text-center"
                        style={{ borderColor: "#E0D5C8", color: "#1A1410" }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="px-3 py-2 transition-colors"
                        style={{ color: "#1A1410" }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <p
                      className="text-xl font-light"
                      style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
                    >
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order summary ── */}
          <div className="lg:col-span-1">
            <div
              className="border p-8 sticky top-24"
              style={{ borderColor: "#E0D5C8" }}
            >
              <h2
                className="text-2xl font-light mb-8"
                style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
              >
                Order Summary
              </h2>

              <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between text-sm" style={{ color: "#6B4F3A" }}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: "#6B4F3A" }}>
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? "#8A9E8A" : "#6B4F3A" }}>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs" style={{ color: "#C4786A" }}>
                    Add ${(75 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
              </div>

              <div className="border-t pt-6 mb-8" style={{ borderColor: "#E0D5C8" }}>
                <div className="flex justify-between">
                  <span
                    className="text-xl font-light"
                    style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
                  >
                    Total
                  </span>
                  <span
                    className="text-xl font-light"
                    style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
                  >
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-3 py-4 text-sm tracking-widest transition-colors"
                style={{ backgroundColor: "#1A1410", color: "#FAF7F2" }}
              >
                CHECKOUT <ArrowRight size={14} />
              </Link>

              <Link
                href="/products"
                className="w-full flex items-center justify-center gap-2 mt-4 text-xs tracking-widest transition-colors"
                style={{ color: "#6B4F3A", opacity: 0.6 }}
              >
                <ArrowLeft size={12} /> CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}