import { api } from "./api";

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationInboxService = {
  async getAll(): Promise<InboxNotification[]> {
    const { data } = await api.get<InboxNotification[]>("/users/notifications");
    return data;
  },
};
