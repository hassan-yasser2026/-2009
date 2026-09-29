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
  viewed: boolean;
}

export interface SubjectProgress {
  totalLectures: number;
  viewedLectures: number;
  percentage: number;
  viewedLectureIds: string[];
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

  async getProgress(subjectId: string): Promise<SubjectProgress> {
    const { data } = await api.get<SubjectProgress>(`/subjects/${subjectId}/progress`);
    return data;
  },

  async markViewed(lectureId: string): Promise<void> {
    await api.post(`/lectures/${lectureId}/view`);
  },
};