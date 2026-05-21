"use client";
import { createContext, useContext, useMemo } from "react";
import { useTheme } from "@/components/ui/ThemeContext";
import { getD, AdminTokens } from "@/lib/adminTokens";

const Ctx = createContext<AdminTokens>(getD(true));

export function AdminTokensProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const D = useMemo(() => getD(theme === "dark"), [theme]);
  return <Ctx.Provider value={D}>{children}</Ctx.Provider>;
}

export function useD(): AdminTokens {
  return useContext(Ctx);
}
