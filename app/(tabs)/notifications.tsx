import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";
import { LoadingState } from "../../src/components/LoadingState";
import { COLORS, FONTS } from "../../src/core/constants";
import {
  InboxNotification,
  notificationInboxService,
} from "../../src/services/notificationInbox.service";

function openNotification(notification: InboxNotification) {
  if (notification.type === "subscription_expired") {
    router.push("/payment" as never);
    return;
  }
  if (notification.type === "payment_approved") {
    router.push("/payment-status" as never);
    return;
  }
  router.push("/(tabs)/home" as never);
}

export default function NotificationsScreen() {
  const { data = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationInboxService.getAll,
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>الإشعارات</Text>
      </View>
      {isLoading ? (
        <LoadingState message="جاري تحميل الإشعارات..." />
      ) : isError ? (
        <ErrorState message="تعذر تحميل الإشعارات" onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          message="مفيش إشعارات لحد دلوقتي"
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              colors={[COLORS.primary]}
            />
          }
        >
          {data.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => openNotification(notification)}
            >
              <View style={styles.icon}>
                <Ionicons
                  name={
                    notification.type === "subscription_expired"
                      ? "time-outline"
                      : notification.type === "payment_approved"
                        ? "checkmark-circle-outline"
                        : "notifications-outline"
                  }
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.details}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.body}>{notification.body}</Text>
                <Text style={styles.date}>
                  {new Intl.DateTimeFormat("ar-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(notification.createdAt))}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: "flex-end",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textDark,
  },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#EEF3FF",
  },
  details: { flex: 1, alignItems: "flex-end", gap: 6 },
  notificationTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textDark,
    textAlign: "right",
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textLight,
    textAlign: "right",
  },
  date: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
  },
});
