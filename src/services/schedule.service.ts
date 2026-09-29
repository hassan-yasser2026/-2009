import { api } from "./api";

export interface TodayScheduleItem {
  id: string;
  time: string | null;
  note: string | null;
  subject: { id: string; name: string; icon: string | null };
}

export const scheduleService = {
  async getToday(): Promise<TodayScheduleItem[]> {
    const { data } = await api.get<TodayScheduleItem[]>("/schedule/today");
    return data;
  },
};
