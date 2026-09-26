import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  TOKEN: "auth_token",
  REFRESH: "refresh_token",
  USER: "user_data",
} as const;

const secureStorage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
  async getItem(key: string) {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};

export const storage = {
  async setToken(token: string) {
    await secureStorage.setItem(KEYS.TOKEN, token);
  },
  async getToken() {
    return secureStorage.getItem(KEYS.TOKEN);
  },
  async setRefreshToken(token: string) {
    await secureStorage.setItem(KEYS.REFRESH, token);
  },
  async getRefreshToken() {
    return secureStorage.getItem(KEYS.REFRESH);
  },
  async setUser(user: object) {
    await secureStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  async getUser() {
    const raw = await secureStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async clear() {
    await secureStorage.removeItem(KEYS.TOKEN);
    await secureStorage.removeItem(KEYS.REFRESH);
    await secureStorage.removeItem(KEYS.USER);
  },
};