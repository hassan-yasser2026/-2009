import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized) return null;

  return (
    <Redirect href={user ? "/(tabs)/home" : "/(auth)/login"} />
  );
}
