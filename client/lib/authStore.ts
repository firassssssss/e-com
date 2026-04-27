import { create } from "zustand";
import { authApi } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "super_admin" | "suspended";
  emailVerified?: boolean;
  image?: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      await authApi.login(email, password);
      // Better Auth sets an httpOnly cookie; fetch the session to get the user
      const res = await authApi.me();
      const user = res.data?.user ?? res.data ?? null;
      set({ user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      await authApi.register(data);
      // After registration + OTP verification, session cookie is set
      const res = await authApi.me();
      const user = res.data?.user ?? res.data ?? null;
      set({ user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },

  fetchMe: async () => {
    try {
      const res = await authApi.me();
      // better-auth get-session returns { session, user }
      const user = res.data?.user ?? res.data ?? null;
      set({ user });
    } catch {
      set({ user: null });
    }
  },
}));

