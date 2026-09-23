import axios from "axios";
import { storage } from "../core/storage";

export const API_URL = "https://1612-production.up.railway.app/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clear();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: any): string {
  if (!error.response) {
    return "تحقق من اتصالك بالإنترنت";
  }

  const { status, data } = error.response;

  if (data?.message) return data.message;

  switch (status) {
    case 400:
      return "البيانات غير صحيحة";
    case 401:
      return "بيانات الدخول غير صحيحة";
    case 403:
      return data?.message || "غير مصرح لك بالدخول";
    case 404:
      return "الصفحة المطلوبة غير موجودة";
    case 500:
      return "حدث خطأ في السيرفر، حاول لاحقًا";
    default:
      return "حدث خطأ غير متوقع";
  }
}
