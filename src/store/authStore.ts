import { create } from "zustand";
import { storage } from "../core/storage";
import { authService } from "../services/auth.service";
import { api } from "../services/api";

interface User {
  id: string;
  fullName: string;
  email: string;
  gradeId: number;
  gradeName: string;
  trackId: string | null;
  trackName: string | null;
  electiveId: string | null;
  electiveName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  status: string;
  subscriptionEnd?: string;
  referralCode: string;
  referralCount?: number;
  points?: number;
  level?: number;
  streak?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  initialize: async () => {
    try {
      const token = await storage.getToken();
      if (!token) {
        set({ token: null, user: null });
        return;
      }

      set({ token });
      try {
        const { data: user } = await api.get<User>("/users/me");
        await storage.setUser(user);
        set({ token, user });
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          await storage.clear();
          set({ token: null, user: null });
          return;
        }

        const cachedUser = await storage.getUser();
        if (cachedUser?.status === "active") {
          set({ token, user: cachedUser });
        } else {
          await storage.clear();
          set({ token: null, user: null });
        }
      }
    } finally {
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await authService.login(email, password);
      await storage.setToken(response.token);
      await storage.setUser(response.user);
      set({ token: response.token, user: response.user as any });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await storage.clear();
    set({ user: null, token: null });
  },
}));