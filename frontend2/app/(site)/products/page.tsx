
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