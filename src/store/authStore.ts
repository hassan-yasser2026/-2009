import { create } from "zustand";
import { storage } from "../core/storage";
import { authService } from "../services/auth.service";

interface User {
  id: string;
  fullName: string;
  email: string;
  gradeId: number;
  gradeName: string;
  sectionId: string | null;
  sectionName: string;
  status: string;
  subscriptionEnd?: string;
  referralCode: string;
  referralCount?: number;
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
      const user = await storage.getUser();
      if (token && user) {
        set({ token, user });
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