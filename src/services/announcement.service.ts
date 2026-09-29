import { api } from "./api";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  expiresAt: string;
  createdAt: string;
}

export const announcementService = {
  async list(): Promise<Announcement[]> {
    const { data } = await api.get<Announcement[]>("/announcements");
    return data;
  },
};
