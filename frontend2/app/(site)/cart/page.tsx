"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X, Minus, Plus, ShoppingBag, Loader2 } from "lucide-react";
import { cartApi, productsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { hdImage } from "@/lib/utils";

interface CartItem {
  productId: string; quantity: number; price: number;
  productName?: string; productImage?: string;
}

export default function CartPage() {
  const { user, loading: authLoading, fetchMe } = useAuthStore();
  const [items, setItems]           = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setCartLoading(false); return; }
    setCartLoading(true);
    cartApi.get().then(async (res) => {
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
    try { await cartApi.remove(productId); await cartApi.add(productId, newQty); }
    catch { const res = await cartApi.get(); setItems(res.data?.data?.items ?? res.data?.items ?? []); }
  };

  const removeItem = async (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    try { await cartApi.remove(productId); }
    catch { const res = await cartApi.get(); setItems(res.data?.data?.items ?? res.data?.items ?? []); }
  };

  if (authLoading || cartLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-primary)" }}>
      <Loader2 size={28} style={{ color:"var(--amber)", animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight:"100vh", background:"var(--bg-primary)", paddingTop:"70px" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"3.5rem 2rem" }}>
        <p className="eyebrow" style={{ marginBottom:"0.75rem" }}>Your Bag</p>
        <h1 style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"clamp(2.5rem,6vw,5rem)", fontWeight:300, color:"var(--text-primary)", marginBottom:"3rem" }}>0 Items</h1>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"6rem 2rem", border:"1px solid var(--border)", background:"var(--bg-card)" }}>
          <ShoppingBag size={48} style={{ color:"var(--border-hover)", marginBottom:"1.5rem" }} />
          <h2 style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"2.5rem", fontWeight:300, color:"var(--text-primary)", marginBottom:"0.75rem" }}>Sign in to see your bag</h2>
          <p style={{ color:"var(--text-secondary)", fontSize:"0.9rem", marginBottom:"2.5rem" }}>Your cart syncs across devices when you are logged in.</p>
          <Link href="/auth/login?from=/cart" className="btn btn-primary" style={{ gap:"0.75rem" }}>SIGN IN <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-primary)" }}>
      <p style={{ color:"var(--amber)", fontFamily:"var(--font-body)" }}>{error}</p>
    </div>
  );

  if (items.length === 0) return (
    <div style={{ minHeight:"100vh", background:"var(--bg-primary)", paddingTop:"70px" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"3.5rem 2rem", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", textAlign:"center" }}>
        <ShoppingBag size={52} style={{ color:"var(--border-hover)", marginBottom:"1.5rem" }} />
        <h2 style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:300, color:"var(--text-primary)", marginBottom:"0.75rem" }}>Your bag is empty</h2>
        <p style={{ color:"var(--text-secondary)", fontSize:"0.9rem", marginBottom:"2.5rem" }}>Discover our collection and find something you love.</p>
        <Link href="/products" className="btn btn-primary" style={{ gap:"0.75rem" }}>SHOP NOW <ArrowRight size={14} /></Link>
      </div>
    </div>
  );

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 75 ? 0 : 8;
  const total    = subtotal + shipping;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-primary)", paddingTop:"70px" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"3.5rem 2rem" }}>

        <div style={{ marginBottom:"3rem" }}>
          <p className="eyebrow" style={{ marginBottom:"0.75rem" }}>Your Bag</p>
          <h1 style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"clamp(2.5rem,6vw,5rem)", fontWeight:300, color:"var(--text-primary)" }}>
            {items.length} Item{items.length !== 1 ? "s" : ""}
          </h1>
        </div>

        <div style={{ height:"1px", background:"linear-gradient(90deg,transparent,var(--amber),transparent)", marginBottom:"3rem", opacity:0.4 }} />

        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"4rem" }} className="cart-grid">

          <div style={{ display:"flex", flexDirection:"column" }}>
            {items.map((item, idx) => (
              <div key={item.productId} style={{ display:"flex", gap:"1.5rem", padding:"2rem 0", borderTop:idx===0?"1px solid var(--border)":undefined, borderBottom:"1px solid var(--border)" }}>

                <div style={{ width:100, height:100, flexShrink:0, overflow:"hidden", background:"var(--bg-secondary)", position:"relative" }}>
                  {item.productImage
                    ? <img src={hdImage(item.productImage)} alt={item.productName??""} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><ShoppingBag size={24} style={{ color:"var(--border-hover)" }} /></div>}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,var(--amber),transparent)", opacity:0.5 }} />
                </div>

                <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <p style={{ fontFamily:"var(--font-label)", fontSize:"0.5rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--amber)", marginBottom:"0.4rem" }}>Lumina</p>
                      <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.25rem", fontWeight:400, color:"var(--text-primary)", lineHeight:1.3, marginBottom:"0.3rem" }}>{item.productName??item.productId}</h3>
                      <p style={{ fontFamily:"var(--font-body)", fontSize:"0.8rem", color:"var(--text-secondary)" }}>{item.price.toFixed(2)} TND each</p>
                    </div>
                    <button onClick={()=>removeItem(item.productId)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", transition:"color 0.2s", padding:"0.25rem" }}
                      onMouseEnter={e=>(e.currentTarget.style.color="var(--amber)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-muted)")}>
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"1rem" }}>
                    <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--border)" }}>
                      <button onClick={()=>updateQty(item.productId,-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-primary)", padding:"0.5rem 0.75rem", transition:"color 0.2s" }}
                        onMouseEnter={e=>(e.currentTarget.style.color="var(--amber)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-primary)")}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontFamily:"var(--font-label)", fontSize:"0.65rem", padding:"0.5rem 1rem", borderLeft:"1px solid var(--border)", borderRight:"1px solid var(--border)", color:"var(--text-primary)", minWidth:40, textAlign:"center" }}>{item.quantity}</span>
                      <button onClick={()=>updateQty(item.productId,1)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-primary)", padding:"0.5rem 0.75rem", transition:"color 0.2s" }}
                        onMouseEnter={e=>(e.currentTarget.style.color="var(--amber)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-primary)")}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <p style={{ fontFamily:"var(--font-display)", fontSize:"1.3rem", fontWeight:400, color:"var(--text-primary)" }}>{(item.price*item.quantity).toFixed(2)} TND</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", padding:"2rem", position:"sticky", top:"90px" }}>
              <div style={{ height:"1px", background:"linear-gradient(90deg,transparent,var(--amber),transparent)", marginBottom:"1.5rem", opacity:0.4 }} />
              <h2 style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"1.75rem", fontWeight:300, color:"var(--text-primary)", marginBottom:"1.5rem" }}>Order Summary</h2>

              <div style={{ display:"flex", flexDirection:"column", gap:"1rem", marginBottom:"1.5rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"var(--font-body)", fontSize:"0.9rem", color:"var(--text-secondary)" }}>
                  <span>Subtotal</span><span>{subtotal.toFixed(2)} TND</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"var(--font-body)", fontSize:"0.9rem", color:"var(--text-secondary)" }}>
                  <span>Shipping</span>
                  <span style={{ color:shipping===0?"var(--cyan)":"var(--text-secondary)" }}>{shipping===0?"Free":`${shipping.toFixed(2)} TND`}</span>
                </div>
                {shipping>0&&<p style={{ fontFamily:"var(--font-body)", fontSize:"0.78rem", color:"var(--amber)" }}>Add {(75-subtotal).toFixed(2)} TND more for free shipping</p>}
              </div>

              <div style={{ borderTop:"1px solid var(--border)", paddingTop:"1.25rem", marginBottom:"1.75rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"1.35rem", fontWeight:300, color:"var(--text-primary)" }}>Total</span>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"1.35rem", fontWeight:300, color:"var(--text-primary)" }}>{total.toFixed(2)} TND</span>
                </div>
              </div>

              <Link href="/checkout" className="btn btn-primary" style={{ width:"100%", gap:"0.75rem", display:"flex", justifyContent:"center" }}>
                CHECKOUT <ArrowRight size={14} />
              </Link>
              <Link href="/products"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", width:"100%", padding:"0.85rem", fontFamily:"var(--font-label)", fontSize:"0.5rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--text-muted)", textDecoration:"none", marginTop:"0.75rem", transition:"color 0.2s" }}
                onMouseEnter={e=>(e.currentTarget.style.color="var(--amber)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-muted)")}>
                <ArrowLeft size={12} /> CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin{to{transform:rotate(360deg)}}
          @media(min-width:1024px){.cart-grid{grid-template-columns:1fr 380px!important}}
        `}</style>
      </div>
    </div>
  );
}