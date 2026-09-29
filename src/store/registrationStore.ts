import { create } from "zustand";
import type {
  ElectiveId,
  SectionId,
  TrackId,
} from "../core/constants";

interface RegistrationData {
  fullName: string;
  phone: string;
  gradeId: number | null;
  gradeName: string;
  trackId: TrackId | null;
  trackName: string;
  electiveId: ElectiveId | null;
  electiveName: string;
  sectionId: SectionId | null;
  sectionName: string;
  email: string;
  password: string;
  referralCode: string;
}

interface RegistrationStore {
  data: RegistrationData;
  setStep1: (
    data: Pick<
      RegistrationData,
      | "fullName"
      | "phone"
      | "gradeId"
      | "gradeName"
      | "trackId"
      | "trackName"
      | "electiveId"
      | "electiveName"
      | "sectionId"
      | "sectionName"
    >,
  ) => void;
  setStep2: (data: Pick<RegistrationData, "email" | "password">) => void;
  setReferral: (code: string) => void;
  reset: () => void;
}

const initialData: RegistrationData = {
  fullName: "",
  phone: "",
  gradeId: null,
  gradeName: "",
  trackId: null,
  trackName: "",
  electiveId: null,
  electiveName: "",
  sectionId: null,
  sectionName: "",
  email: "",
  password: "",
  referralCode: "",
};

export const useRegistrationStore = create<RegistrationStore>((set) => ({
  data: initialData,
  setStep1: (data) => set((state) => ({ data: { ...state.data, ...data } })),
  setStep2: (data) => set((state) => ({ data: { ...state.data, ...data } })),
  setReferral: (code) => set((state) => ({ data: { ...state.data, referralCode: code } })),
  reset: () => set({ data: initialData }),
}));