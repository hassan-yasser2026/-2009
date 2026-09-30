import { create } from "zustand";
import { SubjectProgress } from "../services/subject.service";

interface ProgressState {
  bySubject: Record<string, SubjectProgress>;
  setProgress: (subjectId: string, progress: SubjectProgress) => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  bySubject: {},
  setProgress: (subjectId, progress) =>
    set((state) => ({ bySubject: { ...state.bySubject, [subjectId]: progress } })),
}));
