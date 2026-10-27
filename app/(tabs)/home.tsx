import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQueries, useQuery } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { subjectService } from "../../src/services/subject.service";
import { scheduleService } from "../../src/services/schedule.service";
import { examService, type ExamSummary } from "../../src/services/exam.service";
import { useAuthStore } from "../../src/store/authStore";
import { LoadingState } from "../../src/components/LoadingState";
import { ErrorState } from "../../src/components/ErrorState";
import { EmptyState } from "../../src/components/EmptyState";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [subjectSearch, setSubjectSearch] = useState("");

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
  const progressQueries = useQueries({
    queries: subjects.map((subject) => ({
      queryKey: ["subject-progress", subject.id],
      queryFn: () => subjectService.getProgress(subject.id),
      enabled: Boolean(user) && user?.status === "active",
      staleTime: 5 * 60 * 1000,
    })),
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
  const examsQuery = useQuery({
    queryKey: [
      "exams",
      user?.gradeId,
      user?.trackId,
      user?.electiveId,
      user?.sectionId,
    ],
    queryFn: examService.list,
    enabled: Boolean(user) && user?.status === "active",
    staleTime: 2 * 60 * 1000,
  });
  const resultsQuery = useQuery({
    queryKey: ["exam-results"],
    queryFn: examService.results,
    enabled: Boolean(user) && user?.status === "active",
    staleTime: 2 * 60 * 1000,
  });

  const onRefresh = useCallback(() => {
    void Promise.all([
      refetch(),
      refetchToday(),
      refetchLastLecture(),
      examsQuery.refetch(),
      resultsQuery.refetch(),
      ...progressQueries.map((query) => query.refetch()),
    ]);
  }, [refetch, refetchToday, refetchLastLecture, examsQuery, resultsQuery, progressQueries]);

  const gradeName = user?.gradeName || "";
  const studentContext = [
    gradeName,
    user?.trackName,
    user?.electiveName,
    user?.sectionName,
  ].filter(Boolean).join(" · ");
  const normalizedSearch = subjectSearch.trim().toLocaleLowerCase();
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLocaleLowerCase().includes(normalizedSearch)
  );
  const progressLoading = progressQueries.some((query) => query.isLoading);
  const progressError = progressQueries.some((query) => query.isError);
  const progressData = progressQueries.flatMap((query) =>
    query.data ? [query.data] : []
  );
  const totalLectures = progressData.reduce((total, item) => total + item.totalLectures, 0);
  const viewedLectures = progressData.reduce((total, item) => total + item.viewedLectures, 0);
  const overallProgress = totalLectures === 0
    ? 0
    : Math.round((viewedLectures / totalLectures) * 100);
  const subscriptionDaysLeft = calculateDaysLeft(user?.subscriptionEnd);
  const availableExams = (examsQuery.data ?? []).filter((exam) =>
    !exam.submission?.submittedAt && (exam.price <= 0 || exam.submission?.paid)
  );
  const nextExam = availableExams[0];
  const latestResult = resultsQuery.data?.[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              isRefetching ||
              todayRefetching ||
              examsQuery.isRefetching ||
              resultsQuery.isRefetching ||
              progressQueries.some((query) => query.isRefetching)
            }
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.content}>
          <LinearGradient
            colors={[COLORS.primary, "#3157A5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <View style={styles.header}>
              <View style={styles.welcomeText}>
                <Text style={styles.greeting}>أهلاً بيك من جديد</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.fullName?.split(" ")[0] || "طالب"}
                </Text>
                {studentContext ? (
                  <Text style={styles.gradeName} numberOfLines={2}>{studentContext}</Text>
                ) : null}
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-clear-outline" size={14} color="rgba(255,255,255,0.78)" />
                  <Text style={styles.dateText}>
                    {new Intl.DateTimeFormat("ar-EG", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).format(new Date())}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.notificationBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="فتح الإشعارات"
                onPress={() => router.push("/(tabs)/notifications" as any)}
              >
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.welcomeDecoration}>
              <Ionicons name="school-outline" size={76} color="rgba(255,255,255,0.08)" />
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#173579", "#254CA2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusCard}
          >
            <View style={styles.statusLeft}>
              <View style={styles.subscriptionIcon}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.statusLabel}>الاشتراك الشهري</Text>
                <View style={styles.statusActive}>
                  <View style={styles.dot} />
                  <Text style={styles.statusActiveText}>نشط</Text>
                </View>
              </View>
            </View>
            <View style={styles.statusRight}>
            <Text style={styles.daysNumber}>{user?.subscriptionEnd ? subscriptionDaysLeft : "—"}</Text>
            <Text style={styles.daysLabel}>
              {formatRemainingDays(subscriptionDaysLeft, user?.subscriptionEnd)}
            </Text>
            </View>
          </LinearGradient>

          {(user?.streak ?? 0) > 0 ? (
          <View style={styles.streakCard}>
              <View style={styles.streakIcon}>
                <Ionicons name="flame" size={19} color="#C2410C" />
              </View>
              <View style={styles.streakCopy}>
                <Text style={styles.streakText}>
                  {formatStreakDays(user?.streak ?? 0)} من الالتزام
                </Text>
                <Text style={styles.streakHint}>استمر في المذاكرة يوميًا لتحافظ على تقدمك</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.quickActions}>
            <QuickAction
              icon="calendar-outline"
              label="الجدول"
              tint="#3158B7"
              background="#E8F0FF"
              onPress={() => router.push("/schedule" as any)}
            />
            <QuickAction
              icon="document-text-outline"
              label="الامتحانات"
              tint="#168364"
              background="#E6F7F1"
              onPress={() => router.push("/exams" as any)}
            />
            <QuickAction
              icon="trophy-outline"
              label="نتائجي"
              tint="#7251B5"
              background="#F1ECFF"
              onPress={() => router.push("/exams/results" as any)}
            />
          </View>

          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <View style={styles.todayHeading}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="calendar-outline" size={19} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.todayTitle}>جدول النهاردة</Text>
                  <Text style={styles.cardSubtitle}>خطّط ليومك الدراسي</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.smallAction}
                onPress={() => router.push("/schedule" as any)}
                accessibilityRole="button"
                accessibilityLabel="عرض الجدول الأسبوعي"
              >
                <Ionicons name="arrow-back" size={17} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          {todayLoading ? (
            <View style={styles.todayLoading}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : todayError ? (
            <Text style={styles.todayEmpty}>تعذر تحميل جدول اليوم. اسحب للتحديث.</Text>
          ) : todaySchedule.length > 0 ? (
            todaySchedule.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.todayItem}
                activeOpacity={0.75}
                onPress={() =>
                  router.push(
                    `/subject/${item.subject.id}?name=${encodeURIComponent(item.subject.name)}` as any
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`فتح مادة ${item.subject.name}`}
              >
                <View style={styles.timelineDot} />
                <View style={styles.todayDetails}>
                  <Text style={styles.todaySubject}>{item.subject.name}</Text>
                  {item.note ? <Text style={styles.todayNote}>{item.note}</Text> : null}
                </View>
                <Text style={styles.todayTime}>{item.time || "موعد الحصة غير محدد"}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.todayEmpty}>مفيش حصص النهاردة</Text>
          )}
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>كمّل تعلّمك</Text>
              <Text style={styles.sectionSubtitle}>ارجع لآخر محاضرة شاهدتها</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons name="play-circle-outline" size={20} color={COLORS.primary} />
            </View>
          </View>
          {lastLectureLoading ? (
            <LoadingState message="جارٍ تحميل آخر نشاط..." />
          ) : lastLectureError ? (
            <ErrorState message="تعذر تحميل آخر محاضرة" onRetry={() => refetchLastLecture()} />
          ) : lastLecture ? (
            <TouchableOpacity
              style={styles.lastLectureCard}
              activeOpacity={0.84}
              onPress={() =>
                router.push(
                  `/lecture/${lastLecture.id}?url=${encodeURIComponent(
                    lastLecture.youtubeUrl
                  )}&title=${encodeURIComponent(lastLecture.title)}` as any
                )
              }
            >
              <View style={styles.lastLectureIcon}>
                <Ionicons name="play" size={20} color="#FFF" />
              </View>
              <View style={styles.lastLectureText}>
                <Text style={styles.lastLectureSubject}>{lastLecture.subjectName}</Text>
                <Text style={styles.lastLectureTitle} numberOfLines={2}>
                  {lastLecture.title}
                </Text>
                <Text style={styles.continueText}>أكمل المحاضرة</Text>
              </View>
              <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <EmptyState icon="play-circle-outline" message="ابدأ أول محاضرة ليظهر تقدمك هنا" />
          )}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>الامتحانات والنتائج</Text>
              <Text style={styles.sectionSubtitle}>اختبر مستواك وتابع إنجازك</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons name="school-outline" size={20} color={COLORS.primary} />
            </View>
          </View>
          {examsQuery.isLoading ? (
            <View style={styles.examLoading}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.progressLoadingText}>جارٍ تحميل الامتحانات...</Text>
            </View>
          ) : examsQuery.isError ? (
            <View style={styles.progressError}>
              <Text style={styles.progressErrorText}>تعذر تحميل الامتحانات المتاحة.</Text>
              <TouchableOpacity onPress={() => void examsQuery.refetch()} accessibilityRole="button">
                <Text style={styles.progressRetry}>إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          ) : nextExam ? (
            <TouchableOpacity
              style={styles.examFeatureCard}
              activeOpacity={0.82}
              onPress={() => router.push(`/exams/${nextExam.id}` as any)}
              accessibilityRole="button"
              accessibilityLabel={`فتح امتحان ${nextExam.title}`}
            >
              <View style={styles.examFeatureIcon}>
                <Ionicons name="document-text-outline" size={23} color="#168364" />
              </View>
              <View style={styles.examFeatureBody}>
                <View style={styles.examFeatureTag}>
                  <Text style={styles.examFeatureTagText}>
                    {nextExam.price > 0 ? "جاهز للبدء" : "امتحان متاح"}
                  </Text>
                </View>
                <Text style={styles.examFeatureTitle} numberOfLines={1}>{nextExam.title}</Text>
                <Text style={styles.examFeatureMeta} numberOfLines={1}>
                  {nextExam.subject.name} · {nextExam._count.questions} سؤال · {nextExam.duration} دقيقة
                </Text>
              </View>
              <Ionicons name="arrow-back" size={19} color="#168364" />
            </TouchableOpacity>
          ) : examsQuery.data?.length ? (
            <View style={styles.examDoneCard}>
              <Ionicons name="checkmark-circle" size={22} color="#168364" />
              <Text style={styles.examDoneText}>أحسنت! أكملت كل الامتحانات المتاحة لك.</Text>
            </View>
          ) : (
            <View style={styles.examDoneCard}>
              <Ionicons name="information-circle-outline" size={22} color={COLORS.textLight} />
              <Text style={styles.examDoneText}>لا توجد امتحانات متاحة حاليًا.</Text>
            </View>
          )}
          {resultsQuery.isError ? (
            <View style={styles.latestResultError}>
              <Text style={styles.progressErrorText}>تعذر تحميل آخر نتيجة.</Text>
              <TouchableOpacity onPress={() => void resultsQuery.refetch()} accessibilityRole="button">
                <Text style={styles.progressRetry}>إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          ) : latestResult ? (
            <TouchableOpacity
              style={styles.latestResultCard}
              activeOpacity={0.82}
              onPress={() => router.push("/exams/results" as any)}
              accessibilityRole="button"
              accessibilityLabel="عرض آخر نتيجة"
            >
              <View style={styles.resultScore}>
                <Text style={styles.resultPercent}>{latestResult.percentage}%</Text>
              </View>
              <View style={styles.latestResultBody}>
                <Text style={styles.latestResultLabel}>آخر نتيجة</Text>
                <Text style={styles.latestResultTitle} numberOfLines={1}>{latestResult.exam.title}</Text>
                <Text style={styles.latestResultMeta}>
                  {latestResult.score} من {latestResult.totalScore} · {latestResult.exam.subjectName}
                </Text>
              </View>
              <Ionicons name="arrow-back" size={17} color={COLORS.primary} />
            </TouchableOpacity>
          ) : resultsQuery.isLoading ? (
            <View style={styles.examLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.progressLoadingText}>جارٍ تحميل أحدث نتيجة...</Text>
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>تقدمك الدراسي</Text>
              <Text style={styles.sectionSubtitle}>تابع إنجازك في كل مادة</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons name="stats-chart-outline" size={20} color={COLORS.primary} />
            </View>
          </View>
          {progressLoading ? (
            <View style={styles.progressLoading}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.progressLoadingText}>جارٍ حساب تقدمك...</Text>
            </View>
          ) : progressError ? (
            <View style={styles.progressError}>
              <Text style={styles.progressErrorText}>تعذر تحميل تقدم المواد.</Text>
              <TouchableOpacity
                onPress={() => void Promise.all(progressQueries.map((query) => query.refetch()))}
                accessibilityRole="button"
              >
                <Text style={styles.progressRetry}>إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          ) : subjects.length === 0 ? (
            <View style={styles.progressEmpty}>
              <Text style={styles.progressEmptyText}>سيظهر تقدمك هنا بعد إضافة المواد.</Text>
            </View>
          ) : (
            <View style={styles.progressCard}>
              <View style={styles.progressSummary}>
                <View style={styles.progressRing}>
                  <Text style={styles.progressPercent}>{overallProgress}%</Text>
                </View>
                <View style={styles.progressSummaryText}>
                  <Text style={styles.progressSummaryTitle}>إنجازك الكلي</Text>
                  <Text style={styles.progressSummaryCaption}>
                    شاهدت {viewedLectures} من {totalLectures} محاضرة
                  </Text>
                </View>
                <Ionicons name="trending-up-outline" size={22} color="#168364" />
              </View>
              {subjects.map((subject, index) => {
                const progress = progressQueries[index]?.data;
                const accent = SUBJECT_ACCENTS[index % SUBJECT_ACCENTS.length];
                return (
                  <View key={subject.id} style={styles.subjectProgress}>
                    <View style={styles.subjectProgressLabels}>
                      <Text style={[styles.subjectProgressPercent, { color: accent.foreground }]}>
                        {progress?.percentage ?? 0}%
                      </Text>
                      <Text style={styles.subjectProgressName} numberOfLines={1}>
                        {subject.name}
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: accent.foreground,
                            width: `${progress?.percentage ?? 0}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.subjectProgressMeta}>
                      {progress?.viewedLectures ?? 0} من {progress?.totalLectures ?? 0} محاضرة
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>موادك الدراسية</Text>
              <Text style={styles.sectionSubtitle}>كل اللي تحتاجه في مكان واحد</Text>
            </View>
            <View style={styles.subjectCount}>
              <Text style={styles.sectionCount}>{subjects.length}</Text>
              <Text style={styles.sectionCountLabel}>مواد</Text>
            </View>
          </View>

          {!isLoading && !subjectsError && subjects.length > 0 ? (
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={COLORS.textLight} />
              <TextInput
                value={subjectSearch}
                onChangeText={setSubjectSearch}
                placeholder="ابحث عن مادة..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                returnKeyType="search"
                accessibilityLabel="البحث عن مادة دراسية"
              />
              {subjectSearch.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSubjectSearch("")}
                  accessibilityRole="button"
                  accessibilityLabel="مسح البحث"
                  style={styles.clearSearch}
                >
                  <Ionicons name="close-circle" size={19} color={COLORS.textLight} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {isLoading ? (
            <LoadingState />
          ) : subjectsError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : subjects.length === 0 ? (
            <EmptyState icon="book-outline" message="مفيش مواد لحد دلوقتي" />
          ) : filteredSubjects.length === 0 ? (
            <View style={styles.noSearchResults}>
              <Ionicons name="search-outline" size={25} color={COLORS.textLight} />
              <Text style={styles.noSearchResultsText}>مفيش مادة بالاسم ده</Text>
            </View>
          ) : (
            <View style={styles.subjectsGrid}>
              {filteredSubjects.map((subject) => {
                const index = subjects.findIndex((item) => item.id === subject.id);
                const accent = SUBJECT_ACCENTS[index % SUBJECT_ACCENTS.length];
                return (
                  <TouchableOpacity
                    key={subject.id}
                    style={styles.subjectCard}
                    activeOpacity={0.82}
                    onPress={() =>
                      router.push(
                        `/subject/${subject.id}?name=${encodeURIComponent(subject.name)}` as any
                      )
                    }
                  >
                    <View style={[styles.subjectIconWrapper, { backgroundColor: accent.background }]}>
                      <Ionicons
                        name={(subject.icon as any) || "book-outline"}
                        size={23}
                        color={accent.foreground}
                      />
                    </View>
                    <View style={styles.subjectContent}>
                      <Text style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>
                      <Text style={styles.subjectLectures}>
                        {subject._count?.lectures ?? 0} محاضرة
                      </Text>
                    </View>
                    <View style={styles.subjectArrow}>
                      <Ionicons name="arrow-back" size={15} color={COLORS.textLight} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  tint,
  background,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  tint: string;
  background: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={21} color={tint} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={1}>{label}</Text>
      <Ionicons name="arrow-back" size={14} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

function calculateDaysLeft(endDate?: string): number {
  if (!endDate) return 0;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

function formatRemainingDays(days: number, endDate?: string | null): string {
  if (!endDate) return "مدة غير محددة";
  if (days === 0) return "انتهى الاشتراك";
  if (days === 1) return "يوم متبقٍ";
  if (days === 2) return "يومان متبقيان";
  if (days >= 3 && days <= 10) return "أيام متبقية";
  return "يومًا متبقيًا";
}

function formatStreakDays(days: number): string {
  if (days === 1) return "يوم واحد";
  if (days === 2) return "يومان";
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يومًا`;
}

const SUBJECT_ACCENTS = [
  { background: "#E8F0FF", foreground: "#3158B7" },
  { background: "#E6F7F1", foreground: "#168364" },
  { background: "#FFF1E8", foreground: "#C45B24" },
  { background: "#F1ECFF", foreground: "#7251B5" },
] as const;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7FC" },
  scroll: { paddingHorizontal: 16, paddingBottom: 34 },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingTop: 16,
    paddingBottom: 10,
  },
  welcomeCard: {
    borderRadius: 26,
    marginBottom: 16,
    minHeight: 168,
    overflow: "hidden",
    padding: 22,
    position: "relative",
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcomeText: { alignItems: "flex-end", flex: 1, paddingLeft: 12 },
  greeting: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    textAlign: "right",
  },
  userName: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    color: "#FFFFFF",
    marginTop: 2,
    textAlign: "right",
  },
  gradeName: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    textAlign: "right",
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 6,
    marginTop: 12,
  },
  dateText: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: FONTS.regular,
    fontSize: 12,
    textAlign: "right",
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  welcomeDecoration: {
    bottom: -19,
    left: 18,
    position: "absolute",
  },
  statusCard: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 17,
    marginBottom: 16,
    minHeight: 104,
  },
  statusLeft: { alignItems: "center", flexDirection: "row-reverse", gap: 11 },
  subscriptionIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  statusLabel: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginBottom: 7,
    textAlign: "right",
  },
  statusActive: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    flexDirection: "row-reverse",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-end",
  },
  dot: { backgroundColor: "#43D6A4", borderRadius: 4, height: 8, width: 8 },
  statusActiveText: { color: "#FFFFFF", fontFamily: FONTS.bold, fontSize: 12 },
  statusRight: { alignItems: "center", minWidth: 72 },
  daysNumber: {
    color: "#FFFFFF",
    fontFamily: FONTS.extraBold,
    fontSize: 34,
    lineHeight: 40,
  },
  daysLabel: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: FONTS.regular,
    fontSize: 11,
  },
  streakCard: {
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 11,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  streakIcon: {
    alignItems: "center",
    backgroundColor: "#FFEDD5",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  streakCopy: { alignItems: "flex-end", flex: 1 },
  streakText: { color: "#9A3412", fontFamily: FONTS.bold, fontSize: 13, textAlign: "right" },
  streakHint: { color: "#9A3412", fontFamily: FONTS.regular, fontSize: 11, marginTop: 2, textAlign: "right" },
  quickActions: {
    flexDirection: "row-reverse",
    gap: 9,
    marginBottom: 19,
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    justifyContent: "center",
    minHeight: 103,
    paddingHorizontal: 7,
    paddingVertical: 12,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
  },
  quickActionIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 39,
    justifyContent: "center",
    width: 39,
  },
  quickActionLabel: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 11, textAlign: "center" },
  todayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    marginBottom: 25,
    paddingHorizontal: 17,
    paddingVertical: 16,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 13,
    elevation: 2,
  },
  todayHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  todayHeading: { alignItems: "center", flexDirection: "row-reverse", gap: 10 },
  sectionIcon: {
    alignItems: "center",
    backgroundColor: "#EDF3FF",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  todayTitle: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 15, textAlign: "right" },
  cardSubtitle: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 11, marginTop: 2, textAlign: "right" },
  smallAction: {
    alignItems: "center",
    backgroundColor: "#F2F6FF",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  todayLoading: { paddingVertical: 15 },
  todayItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F6",
  },
  timelineDot: { backgroundColor: COLORS.primaryLight, borderRadius: 4, height: 8, width: 8 },
  todayDetails: { alignItems: "flex-end", flex: 1 },
  todaySubject: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 14, textAlign: "right" },
  todayNote: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 11, marginTop: 3, textAlign: "right" },
  todayTime: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 12, textAlign: "left" },
  todayEmpty: {
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: "right",
    paddingBottom: 5,
    paddingTop: 8,
  },
  progressLoading: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 10,
    marginBottom: 24,
    padding: 18,
  },
  progressLoadingText: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 12 },
  progressError: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#FECACA",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    marginBottom: 24,
    padding: 18,
  },
  progressErrorText: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 12 },
  progressRetry: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 12, padding: 4 },
  progressEmpty: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    padding: 18,
  },
  progressEmptyText: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 12, textAlign: "right" },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 25,
    padding: 16,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 1,
  },
  progressSummary: {
    alignItems: "center",
    borderBottomColor: "#EEF1F6",
    borderBottomWidth: 1,
    flexDirection: "row-reverse",
    gap: 12,
    paddingBottom: 15,
  },
  progressRing: {
    alignItems: "center",
    backgroundColor: "#EAF7F2",
    borderColor: "#B7E7D4",
    borderRadius: 27,
    borderWidth: 3,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  progressPercent: { color: "#168364", fontFamily: FONTS.extraBold, fontSize: 13 },
  progressSummaryText: { alignItems: "flex-end", flex: 1 },
  progressSummaryTitle: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 14 },
  progressSummaryCaption: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 11, marginTop: 3 },
  subjectProgress: { paddingTop: 14 },
  subjectProgressLabels: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  subjectProgressName: { color: COLORS.textDark, flex: 1, fontFamily: FONTS.bold, fontSize: 12, textAlign: "right" },
  subjectProgressPercent: { fontFamily: FONTS.bold, fontSize: 11 },
  progressTrack: {
    backgroundColor: "#EDF1F7",
    borderRadius: 5,
    height: 7,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: { borderRadius: 5, height: "100%" },
  subjectProgressMeta: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 10, marginTop: 5, textAlign: "right" },
  examLoading: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 9,
    marginBottom: 10,
    padding: 16,
  },
  examFeatureCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D8EEE5",
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 11,
    marginBottom: 10,
    padding: 14,
    shadowColor: "#168364",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
  },
  examFeatureIcon: {
    alignItems: "center",
    backgroundColor: "#E6F7F1",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  examFeatureBody: { alignItems: "flex-end", flex: 1 },
  examFeatureTag: {
    backgroundColor: "#E6F7F1",
    borderRadius: 9,
    marginBottom: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  examFeatureTagText: { color: "#168364", fontFamily: FONTS.bold, fontSize: 10 },
  examFeatureTitle: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 13, maxWidth: "100%", textAlign: "right" },
  examFeatureMeta: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 10, marginTop: 3, textAlign: "right" },
  examDoneCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 9,
    marginBottom: 10,
    padding: 15,
  },
  examDoneText: { color: COLORS.textLight, flex: 1, fontFamily: FONTS.regular, fontSize: 12, textAlign: "right" },
  latestResultError: {
    alignItems: "center",
    backgroundColor: "#FFF7F7",
    borderColor: "#FECACA",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 23,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  latestResultCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 11,
    marginBottom: 24,
    padding: 13,
  },
  resultScore: {
    alignItems: "center",
    backgroundColor: "#EAF7F2",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 54,
  },
  resultPercent: { color: "#168364", fontFamily: FONTS.extraBold, fontSize: 14 },
  latestResultBody: { alignItems: "flex-end", flex: 1 },
  latestResultLabel: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 10 },
  latestResultTitle: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 12, marginTop: 2, textAlign: "right" },
  latestResultMeta: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 10, marginTop: 2, textAlign: "right" },
  lastLectureCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 26,
    padding: 16,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  lastLectureIcon: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  lastLectureText: { alignItems: "flex-end", flex: 1 },
  lastLectureSubject: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 11 },
  lastLectureTitle: {
    color: COLORS.textDark,
    fontFamily: FONTS.bold,
    fontSize: 14,
    marginTop: 4,
    textAlign: "right",
  },
  continueText: { color: COLORS.primaryLight, fontFamily: FONTS.bold, fontSize: 11, marginTop: 7 },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 17,
    color: COLORS.textDark,
    textAlign: "right",
  },
  sectionSubtitle: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 11, marginTop: 3, textAlign: "right" },
  subjectCount: {
    alignItems: "center",
    backgroundColor: "#EDF3FF",
    borderRadius: 13,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  sectionCount: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 12 },
  sectionCountLabel: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 11 },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 9,
    marginBottom: 12,
    minHeight: 49,
    paddingHorizontal: 13,
  },
  searchInput: {
    color: COLORS.textDark,
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    outlineStyle: "none",
    paddingVertical: 9,
    textAlign: "right",
  },
  clearSearch: { padding: 3 },
  noSearchResults: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EDF5",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 24,
  },
  noSearchResultsText: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 13 },
  subjectsGrid: { gap: 10 },
  subjectCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  subjectIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectContent: { flex: 1, alignItems: "flex-end" },
  subjectName: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textDark,
  },
  subjectLectures: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 3,
  },
  subjectArrow: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: "#F4F7FC",
    alignItems: "center",
    justifyContent: "center",
  },
});