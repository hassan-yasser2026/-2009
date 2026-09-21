import { api, API_URL } from "./api";

export interface UploadResponse {
  success: boolean;
  payment: {
    id: string;
    status: string;
    createdAt: string;
  };
}

export const paymentService = {
  async upload(screenshotUri: string, transactionRef?: string): Promise<UploadResponse> {
    const formData = new FormData();

    // نجيب اسم الملف والامتداد
    const filename = screenshotUri.split("/").pop() || "screenshot.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : "jpg";
    const type = ext === "png" ? "image/png" : "image/jpeg";

    // نضيف الصورة
    formData.append("screenshot", {
      uri: screenshotUri,
      name: filename,
      type,
    } as any);

    if (transactionRef) {
      formData.append("transactionRef", transactionRef);
    }

    const { data } = await api.post<UploadResponse>("/payments/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000, // دقيقة عشان الرفع
    });

    return data;
  },

  async getMyStatus() {
    const { data } = await api.get("/payments/my-status");
    return data;
  },

  // دالة مساعدة للحصول على رابط الصورة الكامل
  getScreenshotUrl(relativePath: string): string {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    // نشيل /api من النهاية
    const base = API_URL.replace(/\/api$/, "");
    return `${base}${relativePath}`;
  },
};