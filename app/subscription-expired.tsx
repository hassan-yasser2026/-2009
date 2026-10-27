import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../src/core/constants";
import { Button } from "../src/components/Button";
import { useAuthStore } from "../src/store/authStore";

export default function SubscriptionExpiredScreen() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login" as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="time-outline" size={72} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>انتهى اشتراكك</Text>
        <Text style={styles.subtitle}>
          جدد اشتراكك لمتابعة المحاضرات والمواد الدراسية.
        </Text>
        <Button
          title="جدد الاشتراك الآن"
          onPress={() => router.push("/payment" as any)}
          style={styles.renewButton}
        />
        <Button
          title="متابعة حالة الدفع"
          onPress={() => router.push("/payment-status" as any)}
          variant="outline"
          style={styles.statusButton}
        />
        <Button
          title="تسجيل الخروج"
          onPress={() => void handleLogout()}
          variant="ghost"
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  iconWrapper: {
    alignSelf: "center",
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 60,
    marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 26,
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 32,
  },
  renewButton: { width: "100%", marginBottom: 12 },
  statusButton: { width: "100%", marginBottom: 8 },
  logoutButton: { alignSelf: "center" },
});
