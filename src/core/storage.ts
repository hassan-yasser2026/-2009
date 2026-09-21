import * as SecureStore from "expo-secure-store";

const KEYS = {
  TOKEN: "auth_token",
  REFRESH: "refresh_token",
  USER: "user_data",
} as const;

export const storage = {
  async setToken(token: string) {
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
  },
  async getToken() {
    return SecureStore.getItemAsync(KEYS.TOKEN);
  },
  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(KEYS.REFRESH, token);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH);
  },
  async setUser(user: object) {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },
  async getUser() {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async clear() {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH);
    await SecureStore.deleteItemAsync(KEYS.USER);
  },
};