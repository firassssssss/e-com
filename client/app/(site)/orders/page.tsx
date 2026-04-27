"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { ordersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  variantId?: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  shippingAddress: string;
  paymentMethod: string;
  items: OrderItem[];
  createdAt: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
}

const STATUS_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  pending:    { color: '#F89880', border: 'rgba(255,95,31,0.3)',  bg: 'rgba(255,95,31,0.08)' },
  confirmed:  { color: '#23D5D5', border: 'rgba(35,213,213,0.3)', bg: 'rgba(35,213,213,0.06)' },
  processing: { color: '#23D5D5', border: 'rgba(35,213,213,0.3)', bg: 'rgba(35,213,213,0.06)' },
  shipped:    { color: '#F89880', border: 'rgba(255,95,31,0.3)',  bg: 'rgba(255,95,31,0.06)' },
  delivered:  { color: '#23D5D5', border: 'rgba(35,213,213,0.4)', bg: 'rgba(35,213,213,0.08)' },
  cancelled:  { color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', bg: 'rgba(255,255,255,0.03)' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading, fetchMe } = useAuthStore();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login?from=/orders"); return; }
    ordersApi.getAll()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load your orders."))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07050A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#FF5F1F' }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07050A', paddingTop: '70px' }}>

      {/* Hero header */}
      <div style={{
        height: '28vh',
        background: "url('/images/hero-amber-front.jpg') center/cover no-repeat",
        position: 'relative', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(7,5,10,0.9), rgba(7,5,10,0.5) 60%, rgba(7,5,10,0.85))',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 4rem' }}>
          <p style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: '0.55rem', letterSpacing: '0.35em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
            marginBottom: '0.75rem',
          }}>
            Account
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 300, color: '#fff', lineHeight: 1,
          }}>
            Order History
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>

        {error && (
          <div style={{
            background: 'rgba(255,95,31,0.08)', border: '1px solid rgba(255,95,31,0.3)',
            color: '#F89880', padding: '1rem 1.5rem', marginBottom: '2rem',
          }}>
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '6rem 2rem',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <Package size={48} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 2rem' }} />
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2.5rem', fontWeight: 300, color: '#fff', marginBottom: '1rem',
            }}>
              No orders yet
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
              Your order history will appear here
            </p>
            <Link href="/products" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              background: '#FF5F1F', color: '#000', textDecoration: 'none',
              fontFamily: "'Syncopate', sans-serif",
              fontSize: '0.6rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', padding: '1rem 2.5rem',
            }}>
              Start Shopping <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => {
              const status = order.status.toLowerCase();
              const style  = STATUS_STYLES[status] ?? { color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)', bg: 'transparent' };
              const isOpen = expanded === order.id;

              return (
                <div key={order.id} style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'border-color 0.3s',
                }}>
                  {/* Order header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1.5rem 2rem', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                      {/* Order # */}
                      <div>
                        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.4rem' }}>Order</p>
                        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.65rem', color: '#00FFFF', letterSpacing: '0.05em' }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>

                      {/* Date */}
                      <div>
                        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.4rem' }}>Date</p>
                        <p style={{ fontSize: '0.85rem', color: '#fff' }}>
                          {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>

                      {/* Items */}
                      <div>
                        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.4rem' }}>Items</p>
                        <p style={{ fontSize: '0.85rem', color: '#fff' }}>{order.items?.length ?? 0}</p>
                      </div>

                      {/* Total */}
                      <div>
                        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.4rem' }}>Total</p>
                        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.75rem', color: '#FF5F1F' }}>
                          ${Number(order.totalAmount).toFixed(2)}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        fontFamily: "'Syncopate', sans-serif",
                        fontSize: '0.5rem', letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: style.color,
                        border: `1px solid ${style.border}`,
                        background: style.bg,
                        padding: '0.3rem 0.75rem',
                      }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{
                      padding: '0 2rem 2rem',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '1.25rem' }}>Items</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {order.items?.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{
                                  width: '48px', height: '48px', background: 'rgba(255,95,31,0.08)',
                                  border: '1px solid rgba(255,95,31,0.15)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  <span style={{ opacity: 0.4, fontSize: '1rem' }}>✦</span>
                                </div>
                                <div>
                                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', color: '#fff' }}>{item.productName}</p>
                                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                                    Qty: {item.quantity} × ${Number(item.priceAtPurchase).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.75rem', color: '#fff' }}>
                                ${(item.quantity * Number(item.priceAtPurchase)).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                          <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.75rem' }}>Shipping to</p>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{order.shippingAddress}</p>
                        </div>
                        {order.trackingNumber && (
                          <div>
                            <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.75rem' }}>Tracking</p>
                            <p style={{ fontSize: '0.85rem', color: '#23D5D5' }}>{order.trackingNumber}</p>
                            {order.estimatedDeliveryDate && (
                              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.4rem' }}>
                                Est. {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}