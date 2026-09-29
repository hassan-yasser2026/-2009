import { api } from "./api";

export interface ExamSummary {
  id: string;
  subjectId: string;
  subject: { id: string; name: string };
  title: string;
  description: string | null;
  price: number;
  duration: number;
  gradeId: number;
  sectionId: string | null;
  isPublished: boolean;
  _count: { questions: number };
  submission: { paid: boolean; submittedAt: string | null } | null;
  paymentStatus: "pending" | "approved" | "rejected" | null;
}

export interface ExamDetails {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description: string | null;
  price: number;
  duration: number;
  questionCount: number;
  submission: { paid: boolean; submittedAt: string | null } | null;
  paymentStatus: "pending" | "approved" | "rejected" | null;
}

export interface PublicExamQuestion {
  id: string;
  text: string;
  type: "mcq" | "truefalse";
  options: string[];
  points: number;
  order: number;
}

export interface StartedExam {
  exam: { id: string; title: string; duration: number; startedAt: string };
  remainingSeconds: number;
  questions: PublicExamQuestion[];
}

export interface ExamResult {
  exam: { id: string; title: string; subjectName: string };
  score: number;
  totalScore: number;
  paid: boolean;
  startedAt: string;
  submittedAt: string;
  percentage: number;
}

export interface ExamSubmissionResult extends ExamResult {}

export const examService = {
  async list(): Promise<ExamSummary[]> {
    const { data } = await api.get<ExamSummary[]>("/exams");
    return data;
  },

  async get(examId: string): Promise<ExamDetails> {
    const { data } = await api.get<ExamDetails>(`/exams/${examId}`);
    return data;
  },

  async start(examId: string): Promise<StartedExam> {
    const { data } = await api.get<StartedExam>(`/exams/${examId}/start`);
    return data;
  },

  async submit(examId: string, answers: Record<string, number>) {
    const { data } = await api.post(`/exams/${examId}/submit`, { answers });
    return data;
  },

  async result(examId: string): Promise<ExamResult> {
    const { data } = await api.get<ExamResult>(`/exams/${examId}/result`);
    return data;
  },

  async results(): Promise<ExamSubmissionResult[]> {
    const { data } = await api.get<ExamSubmissionResult[]>("/exams/results");
    return data;
  },

  async submitPayment(
    examId: string,
    screenshotUri: string,
    transactionRef: string,
    webFile?: File
  ) {
    const formData = new FormData();
    const filename =
      webFile?.name || screenshotUri.split("/").pop() || "exam-payment.jpg";
    const extension = filename.split(".").pop()?.toLowerCase();
    const contentType =
      webFile?.type ||
      (extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg");

    if (webFile) {
      formData.append("screenshot", webFile);
    } else {
      formData.append("screenshot", {
        uri: screenshotUri,
        name: filename,
        type: contentType,
      } as unknown as Blob);
    }
    formData.append("transactionRef", transactionRef);

    const { data } = await api.post(`/exams/${examId}/pay`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return data;
  },
};
