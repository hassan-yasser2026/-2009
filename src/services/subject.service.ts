import { api } from "./api";

export interface Subject {
  id: string;
  name: string;
  icon: string | null;
  gradeId: number;
  sectionId: string | null;
  order: number;
  _count?: { lectures: number };
}

export interface Lecture {
  id: string;
  subjectId: string;
  title: string;
  youtubeUrl: string;
  pdfUrl: string | null;
  description: string | null;
  order: number;
}

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    const { data } = await api.get<Subject[]>("/subjects");
    return data;
  },

  async getLectures(subjectId: string): Promise<Lecture[]> {
    const { data } = await api.get<Lecture[]>(`/subjects/${subjectId}/lectures`);
    return data;
  },
};