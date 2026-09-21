export const APP = {
  name: "منصة البشمهندس حسن التعليمية",
  shortName: "منصة البشمهندس حسن",
  slogan: "التعليم خطوة بخطوة نحو التفوق",
  vodafoneCash: "01067254988",
  monthlyPrice: 15,
  referralTarget: 7,
  trialDays: 30,
} as const;

export const COLORS = {
  primary: "#1E3A8A",
  primaryLight: "#2563EB",
  primaryDark: "#1E40AF",
  secondary: "#F59E0B",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  textDark: "#0F172A",
  textLight: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
} as const;

export const GRADES = [
  { id: 1, name: "أولى إعدادي", stage: "إعدادي" },
  { id: 2, name: "ثانية إعدادي", stage: "إعدادي" },
  { id: 3, name: "ثالثة إعدادي", stage: "إعدادي" },
  { id: 4, name: "أولى ثانوي", stage: "ثانوي" },
  { id: 5, name: "ثانية ثانوي", stage: "ثانوي" },
  { id: 6, name: "ثالثة ثانوي", stage: "ثانوي" },
] as const;

export const FONTS = {
  regular: "Cairo-Regular",
  bold: "Cairo-Bold",
  extraBold: "Cairo-ExtraBold",
} as const;
export const SECTIONS = [
  { id: "scientific_science", name: "علمي علوم", grades: [5, 6] },
  { id: "scientific_math", name: "علمي رياضة", grades: [5, 6] },
  { id: "literary", name: "أدبي", grades: [5, 6] },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"] | null;

export function getSectionsForGrade(gradeId: number | null) {
  if (!gradeId) return [];
  return SECTIONS.filter((s) => s.grades.includes(gradeId as 5 | 6));
}

export function getSectionName(sectionId: string | null): string {
  if (!sectionId) return "";
  return SECTIONS.find((s) => s.id === sectionId)?.name ?? "";
}