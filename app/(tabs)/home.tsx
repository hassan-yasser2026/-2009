import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { subjectService } from "../../src/services/subject.service";
import { useAuthStore } from "../../src/store/authStore";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  const {
    data: subjects = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["subjects", user?.gradeId, user?.sectionId],
    queryFn: () => subjectService.getSubjects(),
    enabled: !!user,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const gradeName = user?.gradeName || "";
  const sectionName = user?.sectionName || "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>أهلاً بيك 👋</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName?.split(" ")[0] || "طالب"}
            </Text>
            <Text style={styles.gradeName}>
              {gradeName} {sectionName ? `• ${sectionName}` : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => router.push("/(tabs)/notifications" as any)}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={COLORS.textDark}
            />
          </TouchableOpacity>
        </View>

        {/* بطاقة الحالة */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusLabel}>الاشتراك الشهري</Text>
            <View style={styles.statusActive}>
              <View style={styles.dot} />
              <Text style={styles.statusActiveText}>نشط</Text>
            </View>
          </View>
          <View style={styles.statusRight}>
            <Text style={styles.daysNumber}>{calculateDaysLeft(user?.subscriptionEnd)}</Text>
            <Text style={styles.daysLabel}>يوم متبقي</Text>
          </View>
        </View>

        {/* المواد */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>المواد الدراسية</Text>
          <Text style={styles.sectionCount}>{subjects.length} مواد</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>جارٍ التحميل...</Text>
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="book-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>مفيش مواد لحد دلوقتي</Text>
            <Text style={styles.emptyText}>
              هيتم إضافة المواد قريبًا من قِبل الأدمن
            </Text>
          </View>
        ) : (
          <View style={styles.subjectsGrid}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={styles.subjectCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(
                    `/subject/${subject.id}?name=${encodeURIComponent(subject.name)}` as any
                  )
                }
              >
                <View style={styles.subjectIconWrapper}>
                  <Ionicons
                    name={(subject.icon as any) || "book-outline"}
                    size={28}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.subjectContent}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectLectures}>
                    {subject._count?.lectures ?? 0} محاضرة
                  </Text>
                </View>
                <View style={styles.subjectArrow}>
                  <Ionicons
                    name="arrow-back"
                    size={16}
                    color={COLORS.textLight}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function calculateDaysLeft(endDate?: string): number {
  if (!endDate) return 0;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "right",
  },
  userName: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    color: COLORS.textDark,
    marginTop: 4,
    textAlign: "right",
  },
  gradeName: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
    textAlign: "right",
  },
  notificationBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusCard: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },
  statusLeft: { alignItems: "flex-end" },
  statusLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 8,
  },
  statusActive: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusActiveText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  statusRight: { alignItems: "center" },
  daysNumber: {
    fontFamily: FONTS.extraBold,
    fontSize: 36,
    color: "#FFFFFF",
    lineHeight: 40,
  },
  daysLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 18,
    color: COLORS.textDark,
  },
  sectionCount: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
  },
  subjectsGrid: { gap: 12 },
  subjectCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subjectIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  subjectContent: { flex: 1, alignItems: "flex-end" },
  subjectName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textDark,
  },
  subjectLectures: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  subjectArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textDark,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: "center",
  },
});