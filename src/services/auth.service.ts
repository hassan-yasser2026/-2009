import { api } from "./api";
import type {
  ElectiveId,
  SectionId,
  TrackId,
} from "../core/constants";

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  gradeId: number;
  gradeName: string;
  trackId: TrackId | null;
  trackName: string | null;
  electiveId: ElectiveId | null;
  electiveName: string | null;
  sectionId: SectionId | null;
  sectionName: string | null;
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
    trackId: string | null;
    trackName: string | null;
    electiveId: string | null;
    electiveName: string | null;
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