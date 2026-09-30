import { useState, useCallback, useEffect } from "react";
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
import { scheduleService } from "../../src/services/schedule.service";
import { useAuthStore } from "../../src/store/authStore";
import { LoadingState } from "../../src/components/LoadingState";
import { ErrorState } from "../../src/components/ErrorState";
import { EmptyState } from "../../src/components/EmptyState";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.status !== "active") {
      router.replace(
        user?.status === "pending" ? "/register/pending" : "/register/step1"
      );
    }
  }, [user]);

  const {
    data: subjects = [],
    isLoading,
    isError: subjectsError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      "subjects",
      user?.gradeId,
      user?.trackId,
      user?.electiveId,
      user?.sectionId,
    ],
    queryFn: () => subjectService.getSubjects(),
    enabled: !!user,
  });
  const {
    data: lastLecture,
    isLoading: lastLectureLoading,
    isError: lastLectureError,
    refetch: refetchLastLecture,
  } = useQuery({
    queryKey: ["last-lecture"],
    queryFn: subjectService.getLastLecture,
    enabled: Boolean(user) && user?.status === "active",
  });
  const {
    data: todaySchedule = [],
    isLoading: todayLoading,
    isRefetching: todayRefetching,
    refetch: refetchToday,
    isError: todayError,
  } = useQuery({
    queryKey: [
      "schedule",
      "today",
      user?.gradeId,
      user?.trackId,
      user?.electiveId,
      user?.sectionId,
    ],
    queryFn: scheduleService.getToday,
    enabled: Boolean(user) && user?.status === "active",
  });

  const onRefresh = useCallback(() => {
    void Promise.all([refetch(), refetchToday(), refetchLastLecture()]);
  }, [refetch, refetchToday, refetchLastLecture]);

  const gradeName = user?.gradeName || "";
  const studentContext = [
    gradeName,
    user?.trackName,
    user?.electiveName,
    user?.sectionName,
  ].filter(Boolean).join(" · ");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || todayRefetching}
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
            <Text style={styles.gradeName}>{studentContext}</Text>
            <Text style={styles.dateText}>
              {new Intl.DateTimeFormat("ar-EG", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(new Date())}
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
            {(user?.streak ?? 0) > 0 ? (
              <View style={styles.streakCard}>
                <Text style={styles.streakText}>🔥 {user?.streak} أيام متتالية</Text>
                <Text style={styles.streakHint}>ادخل النهاردة عشان تحافظ على الـ streak</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.statusRight}>
            <Text style={styles.daysNumber}>{calculateDaysLeft(user?.subscriptionEnd)}</Text>
            <Text style={styles.daysLabel}>يوم متبقي</Text>
          </View>
        </View>

        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>📅 جدول النهاردة</Text>
            <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
          </View>
          {todayLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : todayError ? (
            <Text style={styles.todayEmpty}>تعذر تحميل جدول اليوم. اسحب للتحديث.</Text>
          ) : todaySchedule.length > 0 ? (
            todaySchedule.map((item) => (
              <View key={item.id} style={styles.todayItem}>
                <View style={styles.todayDetails}>
                  <Text style={styles.todaySubject}>{item.subject.name}</Text>
                  {item.note ? <Text style={styles.todayNote}>{item.note}</Text> : null}
                </View>
                <Text style={styles.todayTime}>{item.time || "موعد الحصة غير محدد"}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.todayEmpty}>مفيش حصص النهاردة</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>آخر محاضرة</Text>
        </View>
        {lastLectureLoading ? (
          <LoadingState message="جارٍ تحميل آخر نشاط..." />
        ) : lastLectureError ? (
          <ErrorState message="تعذر تحميل آخر محاضرة" onRetry={() => refetchLastLecture()} />
        ) : lastLecture ? (
          <TouchableOpacity
            style={styles.lastLectureCard}
            onPress={() =>
              router.push(
                `/lecture/${lastLecture.id}?url=${encodeURIComponent(
                  lastLecture.youtubeUrl
                )}&title=${encodeURIComponent(lastLecture.title)}` as any
              )
            }
          >
            <View style={styles.lastLectureIcon}>
              <Ionicons name="play" size={22} color="#FFF" />
            </View>
            <View style={styles.lastLectureText}>
              <Text style={styles.lastLectureSubject}>{lastLecture.subjectName}</Text>
              <Text style={styles.lastLectureTitle} numberOfLines={2}>
                {lastLecture.title}
              </Text>
              <Text style={styles.continueText}>أكمل من هنا ←</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <EmptyState icon="play-circle-outline" message="ابدأ أول محاضرة ليظهر تقدمك هنا" />
        )}

        {/* المواد */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>المواد الدراسية</Text>
          <Text style={styles.sectionCount}>{subjects.length} مواد</Text>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : subjectsError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : subjects.length === 0 ? (
          <EmptyState icon="book-outline" message="مفيش مواد لحد دلوقتي" />
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
  dateText: {
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 4,
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
  todayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  todayHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  todayTitle: { fontFamily: FONTS.bold, color: COLORS.textDark, fontSize: 16 },
  todayItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  todayDetails: { flex: 1, alignItems: "flex-end" },
  todaySubject: { fontFamily: FONTS.bold, color: COLORS.textDark, fontSize: 14 },
  todayNote: { fontFamily: FONTS.regular, color: COLORS.textLight, fontSize: 12, textAlign: "right", marginTop: 2 },
  todayTime: { fontFamily: FONTS.regular, color: COLORS.textLight, fontSize: 13 },
  todayEmpty: {
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: "right",
    paddingTop: 8,
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
  lastLectureCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 24,
    padding: 16,
  },
  streakCard: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA", borderRadius: 12, borderWidth: 1, marginBottom: 20, padding: 13 },
  streakText: { color: "#C2410C", fontFamily: FONTS.bold, fontSize: 15, textAlign: "right" },
  streakHint: { color: "#9A3412", fontFamily: FONTS.regular, fontSize: 12, marginTop: 3, textAlign: "right" },
  lastLectureIcon: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  lastLectureText: { alignItems: "flex-end", flex: 1 },
  lastLectureSubject: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 12 },
  lastLectureTitle: {
    color: COLORS.textDark,
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginTop: 4,
    textAlign: "right",
  },
  continueText: { color: COLORS.secondary, fontFamily: FONTS.bold, fontSize: 12, marginTop: 6 },
  examsBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 28,
  },
  scheduleBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0F766E",
    borderRadius: 16,
    padding: 14,
    marginTop: -16,
    marginBottom: 28,
  },
  resultsBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    padding: 14,
    marginTop: -16,
    marginBottom: 28,
  },
  examsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  examsBannerText: { flex: 1, alignItems: "flex-end" },
  examsTitle: { fontFamily: FONTS.bold, color: "#FFF", fontSize: 15 },
  examsSubtitle: { fontFamily: FONTS.regular, color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
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