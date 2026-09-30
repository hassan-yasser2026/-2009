import { useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { APP, COLORS, FONTS } from "../../src/core/constants";
import { useAuthStore } from "../../src/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../src/services/api";
import { LoadingState } from "../../src/components/LoadingState";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showDetails, setShowDetails] = useState(false);
  const [feedback, setFeedback] = useState("");
  const pointsQuery = useQuery({
    queryKey: ["points-and-badges"],
    queryFn: async () => (await api.get<PointsData>("/users/points-and-badges")).data,
  });

  const menuItems = [
    { icon: "person-outline", label: "البيانات الشخصية" },
    { icon: "gift-outline", label: "نظام الإحالة" },
    { icon: "star-outline", label: "المفضلة" },
    { icon: "card-outline", label: "حالة الدفع" },
    { icon: "help-circle-outline", label: "المساعدة والدعم" },
    { icon: "log-out-outline", label: "تسجيل الخروج" },
  ];

  const handleMenuPress = async (label: string) => {
    switch (label) {
      case "البيانات الشخصية":
        setShowDetails(true);
        return;
      case "نظام الإحالة":
        if (!user?.referralCode) {
          setFeedback("كود الإحالة غير متاح لحسابك حاليًا.");
          return;
        }
        try {
          await Clipboard.setStringAsync(user.referralCode);
          setFeedback(`تم نسخ كود الإحالة: ${user.referralCode}`);
        } catch (error) {
          console.error("Failed to copy referral code", error);
          setFeedback("تعذر نسخ كود الإحالة. حاول مرة أخرى.");
        }
        return;
      case "حالة الدفع":
        router.push("/payment-status" as any);
        return;
      case "المفضلة":
        router.push("/bookmarks" as any);
        return;
      case "المساعدة والدعم":
        try {
          await Linking.openURL(
            `https://wa.me/${APP.whatsapp}`
          );
        } catch (error) {
          console.error("Failed to open support chat", error);
          setFeedback("تعذر فتح واتساب. حاول مرة أخرى.");
        }
        return;
      case "تسجيل الخروج":
        try {
          await logout();
          router.replace("/(auth)/login");
        } catch (error) {
          console.error("Failed to log out", error);
          setFeedback("تعذر تسجيل الخروج. حاول مرة أخرى.");
        }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={COLORS.primary} />
          </View>
          {pointsQuery.isLoading ? <LoadingState message="جارٍ تحميل إنجازاتك..." /> : pointsQuery.data ? (
            <>
              <View style={styles.pointsCard}>
                <View style={styles.pointsTop}><Text style={styles.level}>المستوى {pointsQuery.data.level}</Text><Text style={styles.points}>{pointsQuery.data.points} نقطة</Text></View>
                <View style={styles.levelTrack}><View style={[styles.levelFill, { width: `${Math.min(100, (pointsQuery.data.points % 100))}%` }]} /></View>
                <Text style={styles.streak}>🔥 {pointsQuery.data.streak} أيام متتالية</Text>
              </View>
              <Text style={styles.badgesTitle}>🏅 شاراتي</Text>
              <View style={styles.badges}>
                {pointsQuery.data.achievements.length ? pointsQuery.data.achievements.map((badge) => <View key={badge.id} style={styles.badge}><Text style={styles.badgeIcon}>{badge.icon}</Text><Text style={styles.badgeName}>{badge.name}</Text></View>) : <Text style={styles.noBadges}>اجمع نقاطًا لتحصل على شاراتك الأولى</Text>}
              </View>
            </>
          ) : null}
          <Text style={styles.name}>{user?.fullName || "طالب"}</Text>
          <Text style={styles.grade}>{user?.gradeName || ""}</Text>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => void handleMenuPress(item.label)}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-back" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>
        {feedback ? (
          <Text accessibilityRole="alert" style={styles.feedback}>
            {feedback}
          </Text>
        ) : null}
      </ScrollView>
      <Modal
        visible={showDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>البيانات الشخصية</Text>
            <DetailRow label="الاسم" value={user?.fullName} />
            <DetailRow label="البريد الإلكتروني" value={user?.email} />
            <DetailRow label="الصف الدراسي" value={user?.gradeName} />
            <DetailRow label="القسم" value={user?.sectionName} />
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowDetails(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface PointsData { points: number; level: number; streak: number; achievements: { id: string; name: string; icon: string }[] }

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailValue}>{value || "غير متاح"}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  name: {
    fontFamily: FONTS.extraBold,
    fontSize: 18,
    color: COLORS.textDark,
  },
  grade: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  pointsCard: { backgroundColor: COLORS.primary, borderRadius: 18, marginBottom: 24, padding: 20 },
  pointsTop: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between" },
  level: { color: "#FFF", fontFamily: FONTS.extraBold, fontSize: 20 },
  points: { color: "#FFF", fontFamily: FONTS.bold, fontSize: 16 },
  levelTrack: { backgroundColor: "rgba(255,255,255,.25)", borderRadius: 5, height: 8, marginTop: 18, overflow: "hidden" },
  levelFill: { backgroundColor: COLORS.secondary, borderRadius: 5, height: "100%" },
  streak: { color: "#FFF", fontFamily: FONTS.bold, marginTop: 14, textAlign: "right" },
  badgesTitle: { color: COLORS.textDark, fontFamily: FONTS.extraBold, fontSize: 18, marginBottom: 12, textAlign: "right" },
  badges: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, flexDirection: "row-reverse", flexWrap: "wrap", gap: 12, marginBottom: 24, padding: 14 },
  badge: { alignItems: "center", backgroundColor: "#FFFBEB", borderRadius: 12, minWidth: 90, padding: 10 },
  badgeIcon: { fontSize: 26 },
  badgeName: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 11, marginTop: 5, textAlign: "center" },
  noBadges: { color: COLORS.textLight, fontFamily: FONTS.regular, padding: 8, textAlign: "right" },
  menu: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textDark,
    flex: 1,
    textAlign: "right",
  },
  feedback: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 16,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 20,
    color: COLORS.textDark,
    textAlign: "right",
  },
  detailRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    gap: 12,
  },
  detailLabel: {
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  detailValue: {
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    flexShrink: 1,
    textAlign: "left",
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
});