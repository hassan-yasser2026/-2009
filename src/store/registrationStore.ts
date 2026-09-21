import { create } from "zustand";
import { SectionId } from "../core/constants";

interface RegistrationData {
  fullName: string;
  phone: string;
  gradeId: number | null;
  gradeName: string;
  sectionId: SectionId;
  sectionName: string;
  email: string;
  password: string;
  referralCode: string;
}

interface RegistrationStore {
  data: RegistrationData;
  setStep1: (data: Pick<RegistrationData, "fullName" | "phone" | "gradeId" | "gradeName" | "sectionId" | "sectionName">) => void;
  setStep2: (data: Pick<RegistrationData, "email" | "password">) => void;
  setReferral: (code: string) => void;
  reset: () => void;
}

const initialData: RegistrationData = {
  fullName: "",
  phone: "",
  gradeId: null,
  gradeName: "",
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