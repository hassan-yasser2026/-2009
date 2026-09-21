import { api } from "./api";

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  gradeId: number;
  gradeName: string;
  sectionId: string | null;
  sectionName: string;
  referralCode?: string;
}

export interface AuthResponse {
  token: string;
  user: {
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
  };
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },

  async getMe() {
    const { data } = await api.get("/users/me");
    return data;
  },
};