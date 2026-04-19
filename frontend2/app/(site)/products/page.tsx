// // "use client";

// // import { useState, useEffect, useCallback } from "react";
// // import Link from "next/link";
// // import { productsApi, categoriesApi } from "@/lib/api";

// // export default function ProductsPage() {
// //   const [products, setProducts] = useState<any[]>([]);
// //   const [categories, setCategories] = useState<any[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [search, setSearch] = useState("");
// //   const [categoryId, setCategoryId] = useState("");
// //   const [skinType, setSkinType] = useState("");

// //   useEffect(() => {
// //     categoriesApi.getAll()
// //       .then((res) => setCategories(res.data?.data ?? res.data ?? []))
// //       .catch(() => {});
// //   }, []);

// //   const fetchProducts = useCallback(() => {
// //     setLoading(true);
// //     setError(null);
// //     productsApi.getAll({
// //       ...(search && { search }),
// //       ...(categoryId && { categoryId }),
// //       ...(skinType && { skinType }),
// //     })
// //       .then((res) => {
// //         const raw = res.data?.data ?? res.data;
// //         setProducts(Array.isArray(raw) ? raw : raw?.products ?? []);
// //       })
// //       .catch((err) => setError(err?.response?.data?.error ?? "Failed to load products"))
// //       .finally(() => setLoading(false));
// //   }, [search, categoryId, skinType]);

// //   useEffect(() => {
// //     fetchProducts();
// //   }, [fetchProducts]);

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       <div className="max-w-7xl mx-auto px-4 py-8">
// //         <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>

// //         {/* Filters */}
// //         <div className="flex flex-wrap gap-3 mb-8">
// //           <input
// //             type="text"
// //             placeholder="Search…"
// //             value={search}
// //             onChange={(e) => setSearch(e.target.value)}
// //             className="border rounded-lg px-4 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-black"
// //           />
// //           <select
// //             value={categoryId}
// //             onChange={(e) => setCategoryId(e.target.value)}
// //             className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
// //           >
// //             <option value="">All categories</option>
// //             {categories.map((c: any) => (
// //               <option key={c.id} value={c.id}>{c.name}</option>
// //             ))}
// //           </select>
// //           <select
// //             value={skinType}
// //             onChange={(e) => setSkinType(e.target.value)}
// //             className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
// //           >
// //             <option value="">All skin types</option>
// //             {["oily", "dry", "combination", "sensitive", "normal"].map((t) => (
// //               <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
// //             ))}
// //           </select>
// //         </div>

// //         {/* States */}
// //         {loading && (
// //           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
// //             {Array.from({ length: 8 }).map((_, i) => (
// //               <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64" />
// //             ))}
// //           </div>
// //         )}
// //         {error && <p className="text-center py-20 text-red-500">{error}</p>}

// //         {/* Grid */}
// //         {!loading && !error && (
// //           products.length === 0
// //             ? <p className="text-center py-20 text-gray-400">No products found.</p>
// //             : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
// //                 {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
// //               </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // function ProductCard({ product }: { product: any }) {
// //   const price = product.price ?? product.variants?.[0]?.price ?? "—";
// //   const image = product.images?.[0];

// //   return (
// //     <Link href={`/products/${product.id}`} className="group block bg-white rounded-xl overflow-hidden border hover:shadow-md transition-shadow">
// //       <div className="aspect-square bg-gray-100 overflow-hidden">
// //         {image
// //           ? <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
// //           : <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🧴</div>
// //         }
// //       </div>
// //       <div className="p-3">
// //         <p className="text-xs text-gray-400 mb-1">{product.brand}</p>
// //         <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
// //         <p className="mt-2 font-bold text-gray-900">{price} TND</p>
// //       </div>
// //     </Link>
// //   );
// // }
// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { useSearchParams } from "next/navigation";
// import { ShoppingBag, Loader2 } from "lucide-react";
// import { productsApi, categoriesApi, cartApi } from "@/lib/api";
// import { useAuthStore } from "@/lib/authStore";
// import { useRouter } from "next/navigation";

// interface Product {
//   id: string;
//   name: string;
//   description: string;
//   price: string | null;
//   brand: string;
//   categoryId: string;
//   images: string[];
//   skinType: string[] | null;
//   averageRating: string;
//   reviewCount: number;
//   hasVariants: boolean;
//   stock: number | null;
//   isActive: boolean;
// }

// interface Category {
//   id: string;
//   name: string;
//   slug: string;
// }

// // Warm palette per index — used when no image
// const CARD_COLORS = [
//   "#E8C4B8", "#D4C5B5", "#C8D4C0", "#E0D5C8",
//   "#D9C9C0", "#C5D0C5", "#E8E0D5", "#D0DDD0",
// ];

// const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low", "Best Rated"];

// export default function ProductsPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const { user } = useAuthStore();

//   const [products, setProducts]     = useState<Product[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading]       = useState(true);
//   const [activeCategory, setActiveCategory] = useState("All");
//   const [sort, setSort]   = useState("Newest");
//   const [search, setSearch] = useState("");

//   // Load products + categories in parallel
//   useEffect(() => {
//     Promise.all([
//       productsApi.getAll(),
//       categoriesApi.getAll(),
//     ])
//       .then(([pRes, cRes]) => {
//         const prods = pRes.data?.data ?? pRes.data ?? [];
//         const cats  = cRes.data?.data ?? cRes.data ?? [];
//         setProducts(Array.isArray(prods) ? prods : []);
//         setCategories(Array.isArray(cats) ? cats : []);
//       })
//       .catch(() => {})
//       .finally(() => setLoading(false));
//   }, []);

//   // Sync category from URL param
//   useEffect(() => {
//     const cat = searchParams.get("category");
//     if (cat) {
//       const matched = categories.find(
//         (c) => c.slug.toLowerCase() === cat.toLowerCase() ||
//                c.name.toLowerCase() === cat.toLowerCase()
//       );
//       if (matched) setActiveCategory(matched.name);
//     }
//   }, [searchParams, categories]);

//   // Filter + sort
//   const filtered = products
//     .filter((p) => p.isActive)
//     .filter((p) => activeCategory === "All" ||
//       categories.find((c) => c.name === activeCategory)?.id === p.categoryId)
//     .filter((p) => !search ||
//       p.name.toLowerCase().includes(search.toLowerCase()) ||
//       p.brand.toLowerCase().includes(search.toLowerCase()))
//     .sort((a, b) => {
//       if (sort === "Price: Low to High")
//         return Number(a.price ?? 0) - Number(b.price ?? 0);
//       if (sort === "Price: High to Low")
//         return Number(b.price ?? 0) - Number(a.price ?? 0);
//       if (sort === "Best Rated")
//         return Number(b.averageRating) - Number(a.averageRating);
//       return 0; // Newest — server order
//     });

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF7F2" }}>
//         <Loader2 size={32} className="animate-spin" style={{ color: "#C4786A" }} />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
//       {/* Header */}
//       <div className="border-b" style={{ borderColor: "#E0D5C8" }}>
//         <div className="max-w-7xl mx-auto px-6 py-14">
//           <p className="text-xs mb-3" style={{ letterSpacing: "0.3em", color: "#6B4F3A", opacity: 0.5 }}>
//             COLLECTION
//           </p>
//           <h1 className="text-6xl font-light" style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}>
//             All Products
//           </h1>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-10">
//         {/* Controls */}
//         <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
//           {/* Category pills */}
//           <div className="flex flex-wrap gap-2">
//             {["All", ...categories.map((c) => c.name)].map((cat) => (
//               <button
//                 key={cat}
//                 onClick={() => setActiveCategory(cat)}
//                 className="text-xs px-4 py-2 border transition-all duration-200"
//                 style={{
//                   letterSpacing: "0.1em",
//                   backgroundColor: activeCategory === cat ? "#1A1410" : "transparent",
//                   color: activeCategory === cat ? "#FAF7F2" : "#6B4F3A",
//                   borderColor: activeCategory === cat ? "#1A1410" : "#E0D5C8",
//                 }}
//               >
//                 {cat.toUpperCase()}
//               </button>
//             ))}
//           </div>

//           {/* Search + Sort */}
//           <div className="flex items-center gap-3">
//             <input
//               type="text"
//               placeholder="Search..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="text-sm px-4 py-2 w-44 focus:outline-none"
//               style={{ border: "1px solid #E0D5C8", backgroundColor: "transparent", color: "#1A1410" }}
//             />
//             <select
//               value={sort}
//               onChange={(e) => setSort(e.target.value)}
//               className="text-xs px-4 py-2 cursor-pointer focus:outline-none"
//               style={{ border: "1px solid #E0D5C8", backgroundColor: "transparent", color: "#6B4F3A", letterSpacing: "0.05em" }}
//             >
//               {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
//             </select>
//           </div>
//         </div>

//         {/* Count */}
//         <p className="text-xs mb-8" style={{ color: "#6B4F3A", opacity: 0.5, letterSpacing: "0.2em" }}>
//           {filtered.length} PRODUCT{filtered.length !== 1 ? "S" : ""}
//         </p>

//         {/* Grid */}
//         {filtered.length === 0 ? (
//           <div className="text-center py-24">
//             <p className="text-3xl font-light mb-3" style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}>
//               No products found
//             </p>
//             <p className="text-sm" style={{ color: "#6B4F3A", opacity: 0.5 }}>
//               Try adjusting your filters
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
//             {filtered.map((product, i) => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 color={CARD_COLORS[i % CARD_COLORS.length]}
//                 user={user}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function ProductCard({
//   product,
//   color,
//   user,
// }: {
//   product: Product;
//   color: string;
//   user: any;
// }) {
//   const router = useRouter();
//   const [hovered, setHovered] = useState(false);
//   const [adding, setAdding]   = useState(false);
//   const [added, setAdded]     = useState(false);

//   const displayPrice = product.price ? `$${Number(product.price).toFixed(2)}` : "See options";

//   const handleAddToCart = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (!user) { router.push("/auth/login?from=/products"); return; }
//     if (product.hasVariants) { router.push(`/products/${product.id}`); return; }
//     setAdding(true);
//     try {
//       await cartApi.add(selectedVariant?.id ?? product.id, 1);
//       setAdded(true);
//       setTimeout(() => setAdded(false), 2000);
//     } catch {
//       router.push(`/products/${product.id}`);
//     } finally {
//       setAdding(false);
//     }
//   };

//   return (
//     <div
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       <Link href={`/products/${product.id}`} className="block">
//         <div
//           className="aspect-[3/4] mb-4 relative overflow-hidden flex items-end p-6"
//           style={{
//             backgroundColor: color,
//             transform: hovered ? "scale(1.02)" : "scale(1)",
//             transition: "transform 0.5s ease",
//           }}
//         >
//           {/* Product image or placeholder */}
//           {product.images?.[0] ? (
//             <img
//               src={product.images[0]}
//               alt={product.name}
//               className="absolute inset-0 w-full h-full object-cover"
//             />
//           ) : (
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div
//                 className="w-16 h-28 rounded-sm shadow-xl"
//                 style={{
//                   backgroundColor: "rgba(255,255,255,0.3)",
//                   backdropFilter: "blur(4px)",
//                   transform: hovered ? "rotate(0deg)" : "rotate(-4deg)",
//                   transition: "transform 0.5s ease",
//                 }}
//               />
//               <div
//                 className="absolute w-14 h-24 rounded-sm shadow-lg"
//                 style={{
//                   backgroundColor: "rgba(255,255,255,0.5)",
//                   transform: hovered ? "rotate(0deg)" : "rotate(2deg)",
//                   transition: "transform 0.5s ease",
//                 }}
//               />
//             </div>
//           )}

//           {/* Skin type badges */}
//           {product.skinType && product.skinType.length > 0 && (
//             <div className="absolute top-4 left-4 flex flex-wrap gap-1">
//               {product.skinType.slice(0, 2).map((st) => (
//                 <span
//                   key={st}
//                   className="text-xs px-2 py-0.5"
//                   style={{
//                     backgroundColor: "rgba(255,255,255,0.7)",
//                     color: "#6B4F3A",
//                     fontSize: "10px",
//                     letterSpacing: "0.05em",
//                   }}
//                 >
//                   {st}
//                 </span>
//               ))}
//             </div>
//           )}

//           {/* Quick add */}
//           <div
//             className="relative z-10 w-full"
//             style={{
//               opacity: hovered ? 1 : 0,
//               transform: hovered ? "translateY(0)" : "translateY(8px)",
//               transition: "all 0.3s ease",
//             }}
//           >
//             <button
//               onClick={handleAddToCart}
//               disabled={adding}
//               className="w-full text-xs py-2.5 flex items-center justify-center gap-2 transition-colors"
//               style={{
//                 backgroundColor: added ? "#8A9E8A" : "#1A1410",
//                 color: "#FAF7F2",
//                 letterSpacing: "0.1em",
//               }}
//             >
//               <ShoppingBag size={13} />
//               {adding ? "ADDING..." : added ? "ADDED ✓" : product.hasVariants ? "SELECT OPTIONS" : "ADD TO CART"}
//             </button>
//           </div>
//         </div>
//       </Link>

//       <div>
//         <Link href={`/products/${product.id}`}>
//           <h3
//             className="text-lg font-light transition-colors"
//             style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}
//           >
//             {product.name}
//           </h3>
//         </Link>
//         <p className="text-xs mt-0.5 mb-1" style={{ color: "#6B4F3A", opacity: 0.6, letterSpacing: "0.05em" }}>
//           {product.brand}
//         </p>
//         {/* Rating */}
//         {Number(product.averageRating) > 0 && (
//           <p className="text-xs mb-1" style={{ color: "#C4786A" }}>
//             {"★".repeat(Math.round(Number(product.averageRating)))}
//             {"☆".repeat(5 - Math.round(Number(product.averageRating)))}
//             <span style={{ color: "#6B4F3A", opacity: 0.5, marginLeft: "4px" }}>
//               ({product.reviewCount})
//             </span>
//           </p>
//         )}
//         <p className="text-base font-light" style={{ fontFamily: "Georgia, serif", color: "#1A1410" }}>
//           {displayPrice}
//         </p>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { productsApi, categoriesApi, cartApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { useSignal } from "@/hooks/useSignal";
import RecommendedProducts from "@/components/site/RecommendedProducts";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: string | null;
  images: string[];
  categoryId: string;
  isActive: boolean;
  hasVariants: boolean;
  skinType: string[];
  averageRating: string;
  reviewCount: number;
  variants?: any[];
}

const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low", "Best Rated"] as const;

export default function ProductsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useAuthStore();
  const { track }    = useSignal();

  const [products, setProducts]           = useState<Product[]>([]);
  const [categories, setCategories]       = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]               = useState("");
  const [sort, setSort]                   = useState<typeof SORT_OPTIONS[number]>("Newest");

  useEffect(() => {
    Promise.all([productsApi.getAll(), categoriesApi.getAll()])
      .then(([pRes, cRes]) => {
        const prods = pRes.data?.data ?? pRes.data ?? [];
        const cats  = cRes.data?.data ?? cRes.data ?? [];
        setProducts(Array.isArray(prods) ? prods : []);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      const matched = categories.find(
        (c) => c.slug?.toLowerCase() === cat.toLowerCase() ||
               c.name?.toLowerCase() === cat.toLowerCase()
      );
      if (matched) setActiveCategory(matched.name);
    }
  }, [searchParams, categories]);

  const filtered = products
    .filter((p) => p.isActive)
    .filter((p) => activeCategory === "All" ||
      categories.find((c) => c.name === activeCategory)?.id === p.categoryId)
    .filter((p) => !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "Price: Low to High") return Number(a.price ?? 0) - Number(b.price ?? 0);
      if (sort === "Price: High to Low") return Number(b.price ?? 0) - Number(a.price ?? 0);
      if (sort === "Best Rated")         return Number(b.averageRating) - Number(a.averageRating);
      return 0;
    });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07050A' }}>
        <Loader2 size={32} style={{ color: '#FF5F1F', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07050A', paddingTop: '70px' }}>

      {/* Page hero header */}
      <div style={{
        height: '40vh',
        background: "url('/images/hero-amber-side.jpg') center/cover no-repeat",
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(7,5,10,0.9) 0%, rgba(7,5,10,0.5) 60%, rgba(7,5,10,0.85) 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: '0.6rem',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: '#F89880',
            marginBottom: '1rem',
          }}>
            The Collection
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(3rem, 7vw, 6rem)',
            fontWeight: 300,
            color: '#fff',
            lineHeight: 1,
          }}>
            All Products
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Controls row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}>
          {/* Category pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {["All", ...categories.map((c) => c.name)].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    fontFamily: "'Syncopate', sans-serif",
                    fontSize: '0.55rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    padding: '0.5rem 1.2rem',
                    border: `1px solid ${isActive ? '#FF5F1F' : 'rgba(255,255,255,0.12)'}`,
                    background: isActive ? 'rgba(255,95,31,0.15)' : 'transparent',
                    color: isActive ? '#FF5F1F' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    borderRadius: '999px',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search + Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '0.85rem',
                padding: '0.7rem 1rem',
                width: '180px',
                outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof SORT_OPTIONS[number])}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem',
                padding: '0.7rem 1rem',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: "'Syncopate', sans-serif",
                letterSpacing: '0.05em',
              }}
            >
              {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Count */}
        <p style={{
          fontFamily: "'Syncopate', sans-serif",
          fontSize: '0.55rem',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.3)',
          marginBottom: '2rem',
        }}>
          {filtered.length} PRODUCT{filtered.length !== 1 ? 'S' : ''}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2.5rem',
              fontWeight: 300,
              color: '#fff',
              marginBottom: '1rem',
            }}>
              No products found
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} user={user} router={router} track={track} />
            ))}
          </div>
        )}

        {/* Recommendations section */}
        <div style={{ marginTop: '6rem' }}>
          <RecommendedProducts />
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, user, router, track }: {
  product: Product;
  user: any;
  router: any;
  track: any;
}) {
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding]   = useState(false);
  const [added, setAdded]     = useState(false);
  const selectedVariant = product.variants?.[0];

  const displayPrice = product.price ? `${Number(product.price).toFixed(2)} TND` : "See options";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push("/auth/login?from=/products"); return; }
    if (product.hasVariants) { router.push(`/products/${product.id}`); return; }
    setAdding(true);
    try {
      await cartApi.add(selectedVariant?.id ?? product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      router.push(`/products/${product.id}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: hovered ? '1px solid rgba(248,152,128,0.35)' : '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
          transition: 'all 0.4s ease',
          transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
          boxShadow: hovered ? '0 0 30px rgba(255,95,31,0.1), 0 20px 40px rgba(0,0,0,0.4)' : 'none',
          position: 'relative',
        }}>
          {/* Amber shimmer line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, #F89880, transparent)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s',
          }} />

          {/* Image */}
          <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#0D0A05', position: 'relative' }}>
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.6s ease',
              }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, rgba(255,95,31,0.08), transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>🧴</span>
              </div>
            )}

            {/* Skin type badges */}
            {product.skinType && product.skinType.length > 0 && (
              <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {product.skinType.slice(0, 2).map((st) => (
                  <span key={st} style={{
                    fontFamily: "'Syncopate', sans-serif",
                    fontSize: '0.5rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: 'rgba(7,5,10,0.8)',
                    color: 'rgba(255,255,255,0.6)',
                    padding: '0.25rem 0.5rem',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {st}
                  </span>
                ))}
              </div>
            )}

            {/* Quick add overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '0.75rem',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.3s ease',
            }}>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                style={{
                  width: '100%',
                  fontFamily: "'Syncopate', sans-serif",
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '0.7rem',
                  background: added ? 'rgba(35,213,213,0.9)' : 'rgba(255,95,31,0.9)',
                  color: '#000',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s',
                }}
              >
                <ShoppingBag size={12} />
                {adding ? "Adding..." : added ? "Added ✓" : product.hasVariants ? "Select Options" : "Add to Cart"}
              </button>
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: '1rem 1.2rem 1.4rem' }}>
            <p style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: '0.55rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#F89880',
              marginBottom: '0.4rem',
            }}>
              {product.brand}
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.15rem', fontWeight: 400, color: '#fff',
              marginBottom: '0.5rem', lineHeight: 1.3,
            }}>
              {product.name}
            </p>
            {Number(product.averageRating) > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#FF5F1F', marginBottom: '0.5rem' }}>
                {"★".repeat(Math.round(Number(product.averageRating)))}
                {"☆".repeat(5 - Math.round(Number(product.averageRating)))}
                <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '4px', fontSize: '0.7rem' }}>
                  ({product.reviewCount})
                </span>
              </p>
            )}
            <p style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: '0.75rem', color: '#fff', letterSpacing: '0.05em',
            }}>
              {displayPrice}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}