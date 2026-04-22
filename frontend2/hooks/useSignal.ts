import { useCallback, useRef } from "react";
import api from "@/lib/api";

type SignalType = "view" | "search" | "cart" | "wishlist";

export function useSignal() {
  const sentRef = useRef<Set<string>>(new Set());

  const track = useCallback((type: SignalType, productId?: string, searchQuery?: string) => {
    const key = `${type}:${productId ?? ""}:${searchQuery ?? ""}`;
    if (sentRef.current.has(key)) return;
    sentRef.current.add(key);
    api.post("/api/v1/signals", { type, productId, searchQuery }).catch(() => {});
  }, []);

  return { track };
}
