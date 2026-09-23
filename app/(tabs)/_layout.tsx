import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nManager, View, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS } from "../../src/core/constants";

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Cairo-Regular": require("../../assets/fonts/Cairo-Regular.ttf"),
    "Cairo-Bold": require("../../assets/fonts/Cairo-Bold.ttf"),
    "Cairo-ExtraBold": require("../../assets/fonts/Cairo-ExtraBold.ttf"),
  });

  const { initialize, initialized, user } = useAuthStore();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      initialize();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !initialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#FFF" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="payment-status" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="subject/[id]" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}