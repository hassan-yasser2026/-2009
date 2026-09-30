import { useEffect } from "react";
import { router, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nManager, Platform, View, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "../src/store/authStore";
import { COLORS } from "../src/core/constants";
import {
  registerForPushNotifications,
  setupNotificationListeners,
} from "../src/services/notification.service";

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

export default function RootLayout() {
  const pathname = usePathname();
  const [fontsLoaded, fontError] = useFonts(
    Platform.OS === "web"
      ? {}
      : {
          "Cairo-Regular": require("../assets/fonts/Cairo-Regular.ttf"),
          "Cairo-Bold": require("../assets/fonts/Cairo-Bold.ttf"),
          "Cairo-ExtraBold": require("../assets/fonts/Cairo-ExtraBold.ttf"),
        }
  );
  const { initialize, initialized, user } = useAuthStore();
  const fontsReady = Platform.OS === "web" || fontsLoaded || fontError !== null;

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized || user?.status !== "active") return;

    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void setupNotificationListeners()
      .then((cleanup) => {
        if (disposed) {
          cleanup();
        } else {
          unsubscribe = cleanup;
        }
      })
      .catch((error) => {
        console.error("Push notification listeners failed to initialize", error);
      });
    void registerForPushNotifications().catch((error) => {
      console.error("Push notification registration failed", error);
    });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [initialized, user?.id, user?.status]);

  useEffect(() => {
    if (!initialized) return;

    const isTabsRoute = pathname.startsWith("/(tabs)") || pathname.startsWith("/home");
    const isRegistrationRoute = pathname.startsWith("/register");
    const isLoginRoute = pathname === "/login";

    if (user?.status === "pending") {
      if (
        pathname !== "/register/pending" &&
        pathname !== "/payment" &&
        pathname !== "/payment-status"
      ) {
        router.replace("/register/pending" as any);
      }
      return;
    }

    if (user?.status === "active") {
      if (pathname === "/" || isLoginRoute || isRegistrationRoute) {
        router.replace("/(tabs)/home" as any);
      }
      return;
    }

    if (pathname === "/" || isTabsRoute) {
      router.replace("/register/step1" as any);
    }
  }, [initialized, pathname, user]);

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady || !initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#FFF" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
