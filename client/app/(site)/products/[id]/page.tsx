"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { productsApi, cartApi, wishlistApi } from "@/lib/api";
import { useSignal } from "@/hooks/useSignal";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { track } = useSignal();
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      productsApi.getById(id),
      productsApi.getVariants(id).catch(() => ({ data: { data: [] } })),
    ])
      .then(([pRes, vRes]) => {
        const p = pRes.data?.data ?? pRes.data;
        const v = vRes.data?.data ?? vRes.data ?? [];
        setProduct(p);
        setVariants(Array.isArray(v) ? v : []);
        setSelectedVariant(Array.isArray(v) ? v.find((x: any) => x.isDefault) ?? v[0] ?? null : null);
        track("view", id);
      })
      .catch((err) => setError(err?.response?.data?.error ?? "Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      const variantId = selectedVariant?.id;
      await cartApi.add(product.id, 1, variantId);
      track("cart", id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      if (err?.response?.status === 401) router.push("/auth/login");
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    setWishlisting(true);
    try {
      if (wishlisted) {
        await wishlistApi.remove(product.id);
        setWishlisted(false);
      } else {
        await wishlistApi.add(product.id);
        track("wishlist", id);
        setWishlisted(true);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) router.push("/auth/login");
    } finally {
      setWishlisting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
    </div>
  );
  if (error || !product) return <p className="text-center py-20 text-red-500">{error ?? "Not found"}</p>;

  const price = selectedVariant?.price ?? product.price ?? "-";
  const image = product.images?.[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back
      </button>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          {image ? (
            <img src={image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold mb-4">${price}</p>
          <p className="text-gray-600 mb-6">{product.description}</p>

          {variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Size / Variant</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                      selectedVariant?.id === v.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {v.name} {v.price ? `($${v.price})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {adding ? "Adding..." : added ? "Added to cart!" : "Add to cart"}
            </button>
            <button
              onClick={handleWishlist}
              disabled={wishlisting}
              className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {wishlisted ? "❤️" : "🤍"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
