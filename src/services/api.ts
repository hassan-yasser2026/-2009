import axios from "axios";
import { Platform } from "react-native";
import { storage } from "../core/storage";

const DEFAULT_API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://localhost:3000/api";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

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
