import { Platform } from "react-native";
import Constants, { AppOwnership } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function isRunningInExpoGo() {
  return (
    Constants.executionEnvironment === "storeClient" &&
    Constants.appOwnership === AppOwnership.Expo
  );
}

async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return null;
  if (!Device.isDevice) {
    throw new Error("Push notifications require a physical device");
  }
  if (isRunningInExpoGo()) {
    throw new Error(
      "FCM is unavailable in Expo Go; install a development or production build"
    );
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "الإشعارات",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }

  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) return null;

  const {
    getMessaging,
    getToken,
    registerDeviceForRemoteMessages,
  } = await import("@react-native-firebase/messaging");
  const messaging = getMessaging();
  if (Platform.OS === "ios") {
    await registerDeviceForRemoteMessages(messaging);
  }

  const token = await getToken(messaging);
  await api.post("/users/push-token", { token });
  return token;
}

export async function setupNotificationListeners(): Promise<() => void> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return () => undefined;
  }
  if (isRunningInExpoGo()) {
    console.warn("FCM listeners are unavailable in Expo Go");
    return () => undefined;
  }

  const {
    getInitialNotification,
    getMessaging,
    onMessage,
    onNotificationOpenedApp,
    onTokenRefresh,
  } = await import("@react-native-firebase/messaging");
  const messaging = getMessaging();
  const unsubscribeOnMessage = onMessage(messaging, async (message) => {
    const title = message.notification?.title;
    const body = message.notification?.body;
    if (!title && !body) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title ?? "",
        body: body ?? "",
        data: message.data ?? {},
        sound: "default",
      },
      trigger: null,
    });
  });
  const openNotification = (data?: Record<string, unknown>) => {
    const lectureId = data?.lectureId;
    const youtubeUrl = data?.youtubeUrl;
    if (typeof lectureId === "string" && typeof youtubeUrl === "string") {
      const title =
        typeof data?.lectureTitle === "string" ? data.lectureTitle : "";
      router.push(
        `/lecture/${encodeURIComponent(lectureId)}?url=${encodeURIComponent(youtubeUrl)}&title=${encodeURIComponent(title)}` as never
      );
      return;
    }

    const subjectId = data?.subjectId;
    router.push(
      typeof subjectId === "string"
        ? `/subject/${encodeURIComponent(subjectId)}`
        : "/(tabs)/home" as never
    );
  };
  const unsubscribeOnOpen = onNotificationOpenedApp(messaging, (message) => {
    openNotification(message.data);
  });
  const unsubscribeOnExpoResponse =
    Notifications.addNotificationResponseReceivedListener((response) => {
      openNotification(response.notification.request.content.data);
    });
  const unsubscribeOnTokenRefresh = onTokenRefresh(messaging, async (token) => {
    try {
      await api.post("/users/push-token", { token });
    } catch (error) {
      console.error("Failed to update the refreshed FCM token", error);
    }
  });

  void getInitialNotification(messaging)
    .then((message) => {
      if (message) openNotification(message.data);
    })
    .catch((error) => {
      console.error("Failed to read the initial FCM notification", error);
    });
  void Notifications.getLastNotificationResponseAsync()
    .then(async (response) => {
      if (response) {
        openNotification(response.notification.request.content.data);
        await Notifications.clearLastNotificationResponseAsync();
      }
    })
    .catch((error) => {
      console.error("Failed to read the initial local notification response", error);
    });

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnOpen();
    unsubscribeOnExpoResponse.remove();
    unsubscribeOnTokenRefresh();
  };
}
