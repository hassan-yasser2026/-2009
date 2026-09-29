export const APP = {
  name: "ذاكر صح",
  shortName: "ذاكر صح",
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
  { id: 1, name: "أولى إعدادي", stage: "preparatory" },
  { id: 2, name: "ثانية إعدادي", stage: "preparatory" },
  { id: 3, name: "ثالثة إعدادي", stage: "preparatory" },
  { id: 4, name: "أولى ثانوي", stage: "secondary" },
  { id: 5, name: "تانية ثانوي بكالوريا", stage: "baccalaureate" },
  { id: 6, name: "تالتة ثانوي بكالوريا", stage: "baccalaureate" },
] as const;

export const FONTS = {
  regular: "Cairo-Regular",
  bold: "Cairo-Bold",
  extraBold: "Cairo-ExtraBold",
} as const;

export const FOREIGN_LANGUAGES = [
  { id: "german", name: "ألماني" },
  { id: "french", name: "فرنساوي" },
  { id: "italian", name: "إيطالي" },
] as const;

type ElectiveOption = {
  id: string;
  name: string;
  subOptions?: readonly { id: string; name: string }[];
};

type Track = {
  id: string;
  name: string;
  icon: string;
  electives: readonly ElectiveOption[];
};

export const TRACKS = [
  {
    id: "engineering_cs",
    name: "مسار الهندسة وعلوم الحاسب",
    icon: "laptop-outline",
    electives: [
      { id: "programming", name: "البرمجة" },
      { id: "chemistry", name: "الكيمياء" },
    ],
  },
  {
    id: "medical_life",
    name: "مسار الطب وعلوم الحياة",
    icon: "medical-outline",
    electives: [
      { id: "physics", name: "فيزياء" },
      { id: "math", name: "رياضيات" },
    ],
  },
  {
    id: "business",
    name: "مسار الأعمال",
    icon: "briefcase-outline",
    electives: [
      { id: "economics", name: "اقتصاد" },
      { id: "math", name: "رياضيات" },
    ],
  },
  {
    id: "arts_literature",
    name: "مسار الأدب والفنون الجميلة",
    icon: "color-palette-outline",
    electives: [
      { id: "psychology", name: "علم نفس" },
      { id: "language", name: "لغة أجنبية", subOptions: FOREIGN_LANGUAGES },
    ],
  },
] as const satisfies readonly Track[];

export const SECTIONS = [
  { id: "scientific_science", name: "علمي علوم" },
  { id: "scientific_math", name: "علمي رياضة" },
  { id: "literary", name: "أدبي" },
] as const;

export type TrackId = (typeof TRACKS)[number]["id"];
export type ElectiveId =
  | "programming"
  | "chemistry"
  | "physics"
  | "math"
  | "economics"
  | "psychology"
  | (typeof FOREIGN_LANGUAGES)[number]["id"];
export type ForeignLanguageId = (typeof FOREIGN_LANGUAGES)[number]["id"];
export type SectionId = (typeof SECTIONS)[number]["id"];

export function getTracksForGrade(gradeId: number | null) {
  return gradeId === 5 ? TRACKS : [];
}

export function getSectionsForGrade(gradeId: number | null) {
  return gradeId === 6 ? SECTIONS : [];
}

export function getElectivesForTrack(trackId: TrackId | null) {
  if (!trackId) return [];
  return TRACKS.find((track) => track.id === trackId)?.electives ?? [];
}

export function getTrackName(trackId: string | null): string {
  if (!trackId) return "";
  return TRACKS.find((track) => track.id === trackId)?.name ?? "";
}

export function getElectiveName(electiveId: string | null): string {
  if (!electiveId) return "";
  for (const track of TRACKS) {
    const electives: readonly ElectiveOption[] = track.electives;
    for (const elective of electives) {
      if (elective.id === electiveId) return elective.name;
      const subOption = elective.subOptions?.find((option) => option.id === electiveId);
      if (subOption) return subOption.name;
    }
  }
  return "";
}

export function getSectionName(sectionId: string | null): string {
  if (!sectionId) return "";
  return SECTIONS.find((section) => section.id === sectionId)?.name ?? "";
}