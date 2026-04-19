// "use client";
// import { useEffect, useState } from "react";
// import api from "@/lib/api";
// import {
//   Plus, Edit, Trash2, Search, Eye, EyeOff,
//   Star, Package, Layers, AlertCircle,
// } from "lucide-react";
// import ProductModal from "@/components/admin/ProductModal";

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface Product {
//   id: string;
//   name: string;
//   description: string;
//   price: string | number | null;
//   stock: number | null;
//   isActive: boolean;
//   brand: string;
//   sku: string;
//   categoryId: string;
//   images: string[];
//   ingredients?: string[];
//   skinType?: string[];
//   hasVariants: boolean;
//   averageRating?: string | number;
//   reviewCount?: number;
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// function fmtPrice(p: string | number | null) {
//   if (p == null) return "—";
//   const n = typeof p === "string" ? parseFloat(p) : p;
//   return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
// }

// function Stars({ rating }: { rating?: string | number }) {
//   const n = Math.round(parseFloat(String(rating ?? 0)));
//   return (
//     <span className="flex gap-0.5">
//       {[1, 2, 3, 4, 5].map((i) => (
//         <Star
//           key={i}
//           size={10}
//           className={i <= n ? "text-[#C4786A] fill-[#C4786A]" : "text-[#E0D5C8]"}
//         />
//       ))}
//     </span>
//   );
// }

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default function AdminProductsPage() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading]   = useState(true);
//   const [search,  setSearch]    = useState("");
//   const [filter,  setFilter]    = useState<"all" | "active" | "inactive">("all");
//   const [modalOpen, setModalOpen]           = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
//   const [deletingId, setDeletingId]         = useState<string | null>(null);

//   const fetchProducts = () => {
//     setLoading(true);
//     api.get("/api/admin/products")
//       .then((r) => setProducts(r.data.data ?? r.data ?? []))
//       .finally(() => setLoading(false));
//   };

//   useEffect(fetchProducts, []);

//   const toggleActive = async (p: Product) => {
//     await api.patch(`/api/admin/products/${p.id}`, { isActive: !p.isActive });
//     fetchProducts();
//   };

//   const deleteProduct = async (id: string) => {
//     if (!confirm("Permanently delete this product?")) return;
//     setDeletingId(id);
//     try {
//       await api.delete(`/api/admin/products/${id}`);
//       fetchProducts();
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const visible = products.filter((p) => {
//     const matchSearch =
//       !search ||
//       p.name.toLowerCase().includes(search.toLowerCase()) ||
//       p.brand?.toLowerCase().includes(search.toLowerCase()) ||
//       p.sku?.toLowerCase().includes(search.toLowerCase());
//     const matchFilter =
//       filter === "all" ||
//       (filter === "active" && p.isActive) ||
//       (filter === "inactive" && !p.isActive);
//     return matchSearch && matchFilter;
//   });

//   return (
//     <div className="min-h-screen bg-[#FAF7F2]">
//       {/* ── Top bar ──────────────────────────────────────────────────────── */}
//       <div className="sticky top-0 z-20 bg-white border-b border-[#E0D5C8] px-8 py-4 flex items-center justify-between gap-4">
//         <div>
//           <h1 className="text-xl font-light text-[#1A1410] tracking-wide">Products</h1>
//           <p className="text-xs text-[#6B4F3A]/40 mt-0.5">{products.length} total</p>
//         </div>
//         <div className="flex items-center gap-3 flex-1 max-w-xl">
//           {/* Search */}
//           <div className="relative flex-1">
//             <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B4F3A]/30" />
//             <input
//               type="text"
//               placeholder="Search name, brand, SKU…"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full pl-9 pr-4 py-2 text-sm border border-[#E0D5C8] rounded-sm bg-white text-[#1A1410] placeholder:text-[#6B4F3A]/30 focus:outline-none focus:border-[#C4786A] transition-colors"
//             />
//           </div>
//           {/* Filter */}
//           <div className="flex gap-1">
//             {(["all", "active", "inactive"] as const).map((f) => (
//               <button
//                 key={f}
//                 onClick={() => setFilter(f)}
//                 className={`px-3 py-2 text-xs uppercase tracking-wider rounded-sm transition-colors ${
//                   filter === f
//                     ? "bg-[#1A1410] text-white"
//                     : "border border-[#E0D5C8] text-[#6B4F3A] hover:bg-[#F0EAE2]"
//                 }`}
//               >
//                 {f}
//               </button>
//             ))}
//           </div>
//         </div>
//         <button
//           onClick={() => { setEditingProduct(null); setModalOpen(true); }}
//           className="flex items-center gap-2 px-4 py-2 bg-[#1A1410] text-white text-sm rounded-sm hover:bg-[#C4786A] transition-colors whitespace-nowrap"
//         >
//           <Plus size={15} /> Add Product
//         </button>
//       </div>

//       {/* ── Table ────────────────────────────────────────────────────────── */}
//       <div className="p-8">
//         <div className="bg-white border border-[#E0D5C8] rounded-sm overflow-hidden">
//           <table className="w-full text-sm min-w-[900px]">
//             <thead>
//               <tr className="bg-[#FAF7F2] border-b border-[#E0D5C8]">
//                 <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium w-12">Image</th>
//                 <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">Product</th>
//                 <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">SKU</th>
//                 <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">Price</th>
//                 <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">Stock</th>
//                 <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">Rating</th>
//                 <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">Status</th>
//                 <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-[#E0D5C8]">
//               {loading ? (
//                 Array.from({ length: 5 }).map((_, i) => (
//                   <tr key={i}>
//                     <td className="px-5 py-4"><div className="w-10 h-10 bg-[#E0D5C8]/40 rounded animate-pulse" /></td>
//                     <td className="px-4 py-4">
//                       <div className="h-3 w-36 bg-[#E0D5C8]/60 rounded animate-pulse mb-2" />
//                       <div className="h-2.5 w-24 bg-[#E0D5C8]/40 rounded animate-pulse" />
//                     </td>
//                     {[...Array(5)].map((_, j) => (
//                       <td key={j} className="px-4 py-4">
//                         <div className="h-3 w-16 bg-[#E0D5C8]/40 rounded animate-pulse mx-auto" />
//                       </td>
//                     ))}
//                     <td />
//                   </tr>
//                 ))
//               ) : visible.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="text-center py-20 text-sm text-[#6B4F3A]/30">
//                     <Package size={32} className="mx-auto mb-3 opacity-20" />
//                     No products found
//                   </td>
//                 </tr>
//               ) : (
//                 visible.map((p) => (
//                   <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors group">
//                     {/* Image */}
//                     <td className="px-5 py-3.5">
//                       {p.images?.[0] ? (
//                         <img
//                           src={p.images[0]}
//                           alt={p.name}
//                           className="w-10 h-10 object-cover rounded-sm border border-[#E0D5C8]"
//                           onError={(e) => {
//                             (e.target as HTMLImageElement).style.display = "none";
//                           }}
//                         />
//                       ) : (
//                         <div className="w-10 h-10 bg-[#F0EAE2] rounded-sm border border-[#E0D5C8] flex items-center justify-center">
//                           <Package size={14} className="text-[#6B4F3A]/30" />
//                         </div>
//                       )}
//                     </td>

//                     {/* Name + brand */}
//                     <td className="px-4 py-3.5">
//                       <p className="font-medium text-[#1A1410]">{p.name}</p>
//                       <p className="text-xs text-[#6B4F3A]/40 mt-0.5">{p.brand}</p>
//                       {p.hasVariants && (
//                         <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-[#9B8EA0] uppercase tracking-wider">
//                           <Layers size={9} /> Variants
//                         </span>
//                       )}
//                     </td>

//                     {/* SKU */}
//                     <td className="px-4 py-3.5 font-mono text-xs text-[#6B4F3A]/60">{p.sku}</td>

//                     {/* Price */}
//                     <td className="px-4 py-3.5 text-right font-medium text-[#1A1410] tabular-nums">
//                       {fmtPrice(p.price)}
//                     </td>

//                     {/* Stock */}
//                     <td className="px-4 py-3.5 text-right">
//                       {p.hasVariants ? (
//                         <span className="text-xs text-[#9B8EA0]">—</span>
//                       ) : p.stock != null ? (
//                         <span className={`tabular-nums font-medium ${
//                           p.stock === 0 ? "text-red-500" : p.stock < 10 ? "text-amber-500" : "text-[#1A1410]"
//                         }`}>
//                           {p.stock === 0 && <AlertCircle size={11} className="inline mr-1" />}
//                           {p.stock}
//                         </span>
//                       ) : (
//                         <span className="text-xs text-[#6B4F3A]/30">—</span>
//                       )}
//                     </td>

//                     {/* Rating */}
//                     <td className="px-4 py-3.5 text-center">
//                       <Stars rating={p.averageRating} />
//                       {(p.reviewCount ?? 0) > 0 && (
//                         <p className="text-[10px] text-[#6B4F3A]/30 mt-0.5">{p.reviewCount} reviews</p>
//                       )}
//                     </td>

//                     {/* Status */}
//                     <td className="px-4 py-3.5 text-center">
//                       <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium ${
//                         p.isActive
//                           ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
//                           : "bg-[#F0EAE2] text-[#6B4F3A]/40 border border-[#E0D5C8]"
//                       }`}>
//                         {p.isActive ? "Active" : "Inactive"}
//                       </span>
//                     </td>

//                     {/* Actions */}
//                     <td className="px-5 py-3.5 text-right">
//                       <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                         <button
//                           onClick={() => toggleActive(p)}
//                           className="p-1.5 rounded-sm hover:bg-[#F0EAE2] text-[#6B4F3A]/40 hover:text-[#6B4F3A] transition-colors"
//                           title={p.isActive ? "Deactivate" : "Activate"}
//                         >
//                           {p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
//                         </button>
//                         <button
//                           onClick={() => { setEditingProduct(p); setModalOpen(true); }}
//                           className="p-1.5 rounded-sm hover:bg-[#F0EAE2] text-[#6B4F3A]/40 hover:text-[#C4786A] transition-colors"
//                           title="Edit"
//                         >
//                           <Edit size={14} />
//                         </button>
//                         <button
//                           onClick={() => deleteProduct(p.id)}
//                           disabled={deletingId === p.id}
//                           className="p-1.5 rounded-sm hover:bg-red-50 text-[#6B4F3A]/40 hover:text-red-500 transition-colors disabled:opacity-50"
//                           title="Delete"
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {modalOpen && (
//         <ProductModal
//           product={editingProduct}
//           onClose={() => setModalOpen(false)}
//           onSave={fetchProducts}
//         />
//       )}
//     </div>
//   );
// }
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Plus, Edit, Trash2, Search, Eye, EyeOff,
  Star, Package, Layers, AlertCircle,
} from "lucide-react";
import ProductModal from "@/components/admin/ProductModal";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string | number | null;
  stock: number | null;
  isActive: boolean;
  brand: string;
  sku: string;
  categoryId: string;
  images: string[];
  ingredients?: string[];
  skinType?: string[];
  hasVariants: boolean;
  averageRating?: string | number;
  reviewCount?: number;
}

const D = {
  bg:     "#0A0A0F",
  panel:  "#111118",
  border: "rgba(255,255,255,0.07)",
  text:   "#fff",
  muted:  "rgba(255,255,255,0.5)",
  dim:    "rgba(255,255,255,0.22)",
  orange: "#FF5F1F",
  cyan:   "#00FFFF",
  green:  "#00FFAA",
  red:    "rgba(255,80,80,0.85)",
  font:   "'Syncopate', sans-serif",
  mono:   "monospace",
};

function fmtPrice(p: string | number | null) {
  if (p == null) return "—";
  const n = typeof p === "string" ? parseFloat(p) : p;
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

function Stars({ rating }: { rating?: string | number }) {
  const n = Math.round(parseFloat(String(rating ?? 0)));
  return (
    <span style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={10} color={i <= n ? D.orange : D.dim} fill={i <= n ? D.orange : "none"} />
      ))}
    </span>
  );
}

const th: React.CSSProperties = {
  fontFamily: D.font,
  fontSize: "0.45rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: D.dim,
  padding: "0.85rem 1rem",
  textAlign: "left",
  fontWeight: 400,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "0.9rem 1rem",
  borderBottom: `1px solid ${D.border}`,
  color: D.muted,
  fontSize: "0.8rem",
  verticalAlign: "middle",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [filter,  setFilter]    = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [searchFocused, setSearchFocused]   = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    api.get("/api/admin/products")
      .then((r) => setProducts(r.data.data ?? r.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);

  const toggleActive = async (p: Product) => {
    await api.patch(`/api/admin/products/${p.id}`, { isActive: !p.isActive });
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Permanently delete this product?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/products/${id}`);
      fetchProducts();
    } finally {
      setDeletingId(null);
    }
  };

  const visible = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "active" && p.isActive) ||
      (filter === "inactive" && !p.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: "100vh", background: D.bg, color: D.text }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "#0d0d14",
        borderBottom: `1px solid ${D.border}`,
        padding: "1rem 2.5rem",
        display: "flex", alignItems: "center", gap: "1.5rem",
      }}>
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontFamily: D.font, fontSize: "0.75rem", letterSpacing: "0.2em", color: D.text, fontWeight: 700 }}>
            Products
          </p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim, marginTop: 4 }}>
            {products.length} total
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, maxWidth: 520 }}>
          {/* Search */}
          <div style={{
            position: "relative", flex: 1,
            display: "flex", alignItems: "center",
            background: D.panel,
            border: `1px solid ${searchFocused ? "rgba(255,95,31,0.5)" : D.border}`,
            borderRadius: 4,
            padding: "0.55rem 0.85rem",
            gap: "0.6rem",
          }}>
            <Search size={12} color={D.dim} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search name, brand, SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                background: "none", border: "none", outline: "none",
                fontFamily: D.font, fontSize: "0.48rem", letterSpacing: "0.12em",
                color: D.text, width: "100%",
              }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? D.orange : "transparent",
                  border: `1px solid ${filter === f ? D.orange : D.border}`,
                  borderRadius: 3,
                  padding: "0.45rem 0.8rem",
                  fontFamily: D.font,
                  fontSize: "0.42rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: filter === f ? "#fff" : D.dim,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setEditingProduct(null); setModalOpen(true); }}
          style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: D.orange,
            border: "none",
            borderRadius: 3,
            padding: "0.6rem 1.2rem",
            fontFamily: D.font,
            fontSize: "0.48rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={13} /> Add Product
        </button>
      </div>

      {/* Table */}
      <div style={{ padding: "2rem 2.5rem" }}>
        <div style={{
          background: D.panel,
          border: `1px solid ${D.border}`,
          borderRadius: 4,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                <th style={{ ...th, width: 56 }}>Image</th>
                <th style={th}>Product</th>
                <th style={th}>SKU</th>
                <th style={{ ...th, textAlign: "right" }}>Price</th>
                <th style={{ ...th, textAlign: "right" }}>Stock</th>
                <th style={{ ...th, textAlign: "center" }}>Rating</th>
                <th style={{ ...th, textAlign: "center" }}>Status</th>
                <th style={{ ...th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td style={td}><div style={{ width: 40, height: 40, background: D.border, borderRadius: 3 }} /></td>
                    <td style={td}>
                      <div style={{ height: 10, width: 140, background: D.border, borderRadius: 2, marginBottom: 6 }} />
                      <div style={{ height: 8, width: 90, background: D.border, borderRadius: 2 }} />
                    </td>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} style={td}><div style={{ height: 10, width: 60, background: D.border, borderRadius: 2, marginLeft: "auto" }} /></td>
                    ))}
                    <td style={td} />
                  </tr>
                ))
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...td, textAlign: "center", padding: "4rem", border: "none" }}>
                    <Package size={28} color={D.dim} style={{ margin: "0 auto 0.75rem" }} />
                    <p style={{ fontFamily: D.font, fontSize: "0.5rem", letterSpacing: "0.2em", color: D.dim }}>
                      No products found
                    </p>
                  </td>
                </tr>
              ) : (
                visible.map((p) => (
                  <ProductRow
                    key={p.id}
                    p={p}
                    deletingId={deletingId}
                    onToggle={toggleActive}
                    onEdit={(prod) => { setEditingProduct(prod); setModalOpen(true); }}
                    onDelete={deleteProduct}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSave={fetchProducts}
        />
      )}
    </div>
  );
}

function ProductRow({ p, deletingId, onToggle, onEdit, onDelete }: {
  p: Product;
  deletingId: string | null;
  onToggle: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const stockColor = () => {
    if (p.stock === 0) return D.red;
    if (p.stock != null && p.stock < 10) return "#FFD700";
    return D.muted;
  };

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "rgba(255,255,255,0.025)" : "transparent", transition: "background 0.15s" }}
    >
      {/* Image */}
      <td style={{ ...td, paddingLeft: "1.25rem" }}>
        {p.images?.[0] ? (
          <img
            src={p.images[0]}
            alt={p.name}
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 3, border: `1px solid ${D.border}` }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div style={{
            width: 40, height: 40,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${D.border}`,
            borderRadius: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package size={14} color={D.dim} />
          </div>
        )}
      </td>

      {/* Name + brand */}
      <td style={td}>
        <p style={{ color: D.text, fontWeight: 600, fontSize: "0.82rem", marginBottom: 3 }}>{p.name}</p>
        <p style={{ color: D.dim, fontSize: "0.72rem" }}>{p.brand}</p>
        {p.hasVariants && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
            fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em",
            color: "#9B59FF",
          }}>
            <Layers size={9} /> Variants
          </span>
        )}
      </td>

      {/* SKU */}
      <td style={{ ...td, fontFamily: D.mono, fontSize: "0.72rem", color: D.dim }}>{p.sku}</td>

      {/* Price */}
      <td style={{ ...td, textAlign: "right", color: D.text, fontFamily: D.mono }}>{fmtPrice(p.price)}</td>

      {/* Stock */}
      <td style={{ ...td, textAlign: "right", fontFamily: D.mono, color: stockColor() }}>
        {p.hasVariants ? (
          <span style={{ color: D.dim }}>—</span>
        ) : p.stock != null ? (
          <span>
            {p.stock === 0 && <AlertCircle size={11} style={{ display: "inline", marginRight: 4 }} />}
            {p.stock}
          </span>
        ) : (
          <span style={{ color: D.dim }}>—</span>
        )}
      </td>

      {/* Rating */}
      <td style={{ ...td, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Stars rating={p.averageRating} />
        </div>
        {(p.reviewCount ?? 0) > 0 && (
          <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim, marginTop: 3 }}>
            {p.reviewCount} reviews
          </p>
        )}
      </td>

      {/* Status */}
      <td style={{ ...td, textAlign: "center" }}>
        <span style={{
          display: "inline-block",
          padding: "0.2rem 0.6rem",
          borderRadius: 2,
          fontFamily: D.font,
          fontSize: "0.4rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          background: p.isActive ? "rgba(0,255,170,0.1)" : "rgba(255,255,255,0.04)",
          color: p.isActive ? D.green : D.dim,
          border: `1px solid ${p.isActive ? "rgba(0,255,170,0.25)" : D.border}`,
        }}>
          {p.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      {/* Actions */}
      <td style={{ ...td, textAlign: "right", paddingRight: "1.25rem" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
        }}>
          <IconBtn onClick={() => onToggle(p)} title={p.isActive ? "Deactivate" : "Activate"}>
            {p.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
          </IconBtn>
          <IconBtn onClick={() => onEdit(p)} title="Edit" hoverColor="#FF5F1F">
            <Edit size={13} />
          </IconBtn>
          <IconBtn onClick={() => onDelete(p.id)} title="Delete" hoverColor="rgba(255,80,80,0.9)" disabled={deletingId === p.id}>
            <Trash2 size={13} />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
}

function IconBtn({ onClick, title, children, hoverColor, disabled }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  hoverColor?: string;
  disabled?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer",
        padding: "0.35rem",
        color: h && !disabled ? (hoverColor ?? "rgba(255,255,255,0.7)") : "rgba(255,255,255,0.2)",
        transition: "color 0.15s",
        display: "flex", alignItems: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}