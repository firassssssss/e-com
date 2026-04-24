// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Package, ArrowRight, Loader2, ChevronDown, ChevronUp } from "lucide-react";
// import { ordersApi } from "@/lib/api";
// import { useAuthStore } from "@/lib/authStore";

// interface OrderItem {
//   productId: string;
//   productName: string;
//   quantity: number;
//   priceAtPurchase: number;
//   variantId?: string;
// }

// interface Order {
//   id: string;
//   status: string;
//   totalAmount: string;
//   shippingAddress: string;
//   paymentMethod: string;
//   items: OrderItem[];
//   createdAt: string;
//   trackingNumber?: string;
//   estimatedDeliveryDate?: string;
// }

// const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
//   pending:    { bg: "#FFF8E1", text: "#B8860B" },
//   confirmed:  { bg: "#E8F5E9", text: "#2E7D32" },
//   processing: { bg: "#E3F2FD", text: "#1565C0" },
//   shipped:    { bg: "#F3E5F5", text: "#6A1B9A" },
//   delivered:  { bg: "#E8F5E9", text: "#1B5E20" },
//   cancelled:  { bg: "#FFEBEE", text: "#B71C1C" },
// };

// export default function OrdersPage() {
//   const router = useRouter();
//   const { user, loading: authLoading, fetchMe } = useAuthStore();
//   const [orders, setOrders]       = useState<Order[]>([]);
//   const [loading, setLoading]     = useState(true);
//   const [expanded, setExpanded]   = useState<string | null>(null);
//   const [error, setError]         = useState<string | null>(null);

//   useEffect(() => { fetchMe(); }, []);

//   useEffect(() => {
//     if (authLoading) return;
//     if (!user) { router.replace("/auth/login?from=/orders"); return; }

//     ordersApi.getAll()
//       .then((res) => {
//         const data = res.data?.data ?? res.data ?? [];
//         setOrders(Array.isArray(data) ? data : []);
//       })
//       .catch(() => setError("Failed to load your orders."))
//       .finally(() => setLoading(false));
//   }, [user, authLoading]);

//   if (authLoading || loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF7F2" }}>
//         <Loader2 size={32} className="animate-spin" style={{ color: "#C4786A" }} />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF7F2" }}>
//         <p style={{ color: "#C4786A" }}>{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
//       <div className="max-w-4xl mx-auto px-6 py-14">

//         {/* Header */}
//         <div className="mb-12">
//           <p className="text-xs mb-3" style={{ letterSpacing: "0.3em", color: "#6B4F3A", opacity: 0.5 }}>
//             ACCOUNT
//           </p>
//           <h1 className="text-5xl font-light" style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}>
//             Order History
//           </h1>
//         </div>

//         {/* Empty */}
//         {orders.length === 0 ? (
//           <div className="text-center py-24 border" style={{ borderColor: "#E0D5C8" }}>
//             <Package size={48} className="mx-auto mb-6" style={{ color: "#E0D5C8" }} />
//             <h2 className="text-3xl font-light mb-3" style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}>
//               No orders yet
//             </h2>
//             <p className="text-sm mb-8" style={{ color: "#6B4F3A", opacity: 0.6 }}>
//               Your order history will appear here
//             </p>
//             <Link
//               href="/products"
//               className="inline-flex items-center gap-3 px-8 py-4 text-sm transition-colors"
//               style={{ backgroundColor: "#1A1410", color: "#FAF7F2", letterSpacing: "0.1em" }}
//             >
//               START SHOPPING <ArrowRight size={14} />
//             </Link>
//           </div>
//         ) : (
//           <div className="flex flex-col gap-4">
//             {orders.map((order) => {
//               const statusStyle = STATUS_COLORS[order.status.toLowerCase()] ?? { bg: "#F5F5F5", text: "#666" };
//               const isOpen = expanded === order.id;

//               return (
//                 <div key={order.id} className="border" style={{ borderColor: "#E0D5C8" }}>
//                   {/* Order header row */}
//                   <button
//                     onClick={() => setExpanded(isOpen ? null : order.id)}
//                     className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors"
//                     style={{ backgroundColor: isOpen ? "#F5EFE8" : "transparent" }}
//                   >
//                     <div className="flex items-center gap-6 flex-wrap">
//                       {/* Order ID */}
//                       <div>
//                         <p className="text-xs mb-1" style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.15em" }}>
//                           ORDER
//                         </p>
//                         <p className="text-sm font-medium" style={{ color: "#1A1410" }}>
//                           #{order.id.slice(0, 8).toUpperCase()}
//                         </p>
//                       </div>

//                       {/* Date */}
//                       <div>
//                         <p className="text-xs mb-1" style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.15em" }}>
//                           DATE
//                         </p>
//                         <p className="text-sm" style={{ color: "#1A1410" }}>
//                           {new Date(order.createdAt).toLocaleDateString("en-US", {
//                             year: "numeric", month: "short", day: "numeric"
//                           })}
//                         </p>
//                       </div>

//                       {/* Items count */}
//                       <div>
//                         <p className="text-xs mb-1" style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.15em" }}>
//                           ITEMS
//                         </p>
//                         <p className="text-sm" style={{ color: "#1A1410" }}>
//                           {order.items?.length ?? 0}
//                         </p>
//                       </div>

//                       {/* Total */}
//                       <div>
//                         <p className="text-xs mb-1" style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.15em" }}>
//                           TOTAL
//                         </p>
//                         <p className="text-sm font-medium" style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}>
//                           ${Number(order.totalAmount).toFixed(2)}
//                         </p>
//                       </div>

//                       {/* Status badge */}
//                       <span
//                         className="text-xs px-3 py-1"
//                         style={{
//                           backgroundColor: statusStyle.bg,
//                           color: statusStyle.text,
//                           letterSpacing: "0.1em",
//                           fontWeight: 500,
//                         }}
//                       >
//                         {order.status.toUpperCase()}
//                       </span>
//                     </div>

//                     {isOpen ? <ChevronUp size={16} style={{ color: "#6B4F3A" }} /> : <ChevronDown size={16} style={{ color: "#6B4F3A" }} />}
//                   </button>

//                   {/* Expanded detail */}
//                   {isOpen && (
//                     <div className="px-6 pb-6 border-t" style={{ borderColor: "#E0D5C8" }}>

//                       {/* Items */}
//                       <div className="mt-6 mb-6">
//                         <p className="text-xs mb-4" style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.15em" }}>
//                           ITEMS
//                         </p>
//                         <div className="flex flex-col gap-3">
//                           {order.items?.map((item, i) => (
//                             <div key={i} className="flex items-center justify-between">
//                               <div className="flex items-center gap-4">
//                                 <div
//                                   className="w-12 h-12 flex items-center justify-center relative overflow-hidden"
//                                   style={{ backgroundColor: "#E8C4B8" }}
//                                 >
//                                   <div className="w-5 h-8 rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.5)" }} />
//                                 </div>
//                                 <div>
//                                   <p className="text-sm" style={{ color: "#1A1410" }}>
//                                     {item.productName}
//                                   </p>
//                                   <p className="text-xs" style={{ color: "#6B4F3A", opacity: 0.5 }}>
//                                     Qty: {item.quantity} × ${Number(item.priceAtPurchase).toFixed(2)}
//                                   </p>
//                                 </div>
//                               </div>
//                               <p className="text-sm" style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}>
//                                 ${(item.quantity * Number(item.priceAtPurchase)).toFixed(2)}
//                               </p>
//                             </div>
//                           ))}
//                         </div>
//                       </div>

//                       {/* Shipping + tracking */}
//                       <div className="grid grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: "#E0D5C8" }}>
//                         <div>
//                           <p className="text-xs mb-2" style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.15em" }}>
//                             SHIPPING TO
//                           </p>
//                           <p className="text-sm leading-relaxed" style={{ color: "#1A1410" }}>
//                             {order.shippingAddress}
//                           </p>
//                         </div>
//                         {order.trackingNumber && (
//                           <div>
//                             <p className="text-xs mb-2" style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.15em" }}>
//                               TRACKING
//                             </p>
//                             <p className="text-sm" style={{ color: "#C4786A" }}>
//                               {order.trackingNumber}
//                             </p>
//                             {order.estimatedDeliveryDate && (
//                               <p className="text-xs mt-1" style={{ color: "#6B4F3A", opacity: 0.5 }}>
//                                 Est. {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
//                               </p>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

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