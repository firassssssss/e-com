import { create } from "zustand";
import { authApi } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
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
      const res = await authApi.login(email, password);
      // better-auth sign-in/email returns { token, user }
      const { token, user } = res.data;
      if (token) localStorage.setItem("token", token);
      set({ user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.register(data);
      // better-auth sign-up/email returns { token, user }
      const { token, user } = res.data;
      if (token) localStorage.setItem("token", token);
      set({ user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    await authApi.logout();
    localStorage.removeItem("token");
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
