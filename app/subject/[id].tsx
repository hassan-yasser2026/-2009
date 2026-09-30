import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { subjectService, Lecture } from "../../src/services/subject.service";
import { getErrorMessage } from "../../src/services/api";
import { LoadingState } from "../../src/components/LoadingState";
import { ErrorState } from "../../src/components/ErrorState";
import { EmptyState } from "../../src/components/EmptyState";
import { useProgressStore } from "../../src/store/progressStore";

export default function SubjectScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const queryClient = useQueryClient();

  const {
    data: lectures = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["lectures", id],
    queryFn: () => subjectService.getLectures(id),
    enabled: !!id,
  });
  const progressQuery = useQuery({
    queryKey: ["subject-progress", id],
    queryFn: () => subjectService.getProgress(id),
    enabled: !!id,
  });
  const setProgress = useProgressStore((state) => state.setProgress);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unviewed" | "viewed">("all");
  useEffect(() => {
    if (progressQuery.data && id) setProgress(id, progressQuery.data);
  }, [id, progressQuery.data, setProgress]);
  const visibleLectures = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return lectures.filter((lecture) => {
      const matchesSearch =
        !normalized || lecture.title.toLowerCase().includes(normalized);
      const matchesFilter =
        filter === "all" || (filter === "viewed" ? lecture.viewed : !lecture.viewed);
      return matchesSearch && matchesFilter;
    });
  }, [filter, lectures, search]);

  const [expanded, setExpanded] = useState<string | null>(null);
  const openLecture = async (lecture: Lecture) => {
    try {
      await subjectService.markViewed(lecture.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lectures", id] }),
        queryClient.invalidateQueries({ queryKey: ["subject-progress", id] }),
      ]);
    } catch (error) {
      console.error("Failed to save lecture view", error);
      Alert.alert("تعذر حفظ التقدم", getErrorMessage(error));
    }
    router.push(
      `/lecture/${lecture.id}?url=${encodeURIComponent(
        lecture.youtubeUrl
      )}&title=${encodeURIComponent(lecture.title)}` as any
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name ? decodeURIComponent(name) : "المادة"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {lectures.length} محاضرة
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>تقدمك في المادة</Text>
            <Text style={styles.progressCount}>
              {progressQuery.data?.viewedLectures ?? 0}/
              {progressQuery.data?.totalLectures ?? lectures.length} محاضرة
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressQuery.data?.percentage ?? 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {progressQuery.data?.percentage ?? 0}% مكتمل
          </Text>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : lectures.length === 0 ? (
          <EmptyState icon="videocam-off-outline" message="مفيش محاضرات لحد دلوقتي" />
        ) : (
          <>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color={COLORS.textLight} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="ابحث في المحاضرات..."
                placeholderTextColor={COLORS.textLight}
                style={styles.searchInput}
              />
            </View>
            <View style={styles.filters}>
              {([
                ["all", "الكل"],
                ["unviewed", "لم تُشاهد"],
                ["viewed", "تمت مشاهدتها"],
              ] as const).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setFilter(value)}
                  style={[styles.filter, filter === value && styles.filterActive]}
                >
                  <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.list}>
              {visibleLectures.map((lecture, index) => (
                <LectureItem
                  key={lecture.id}
                  lecture={lecture}
                  index={index + 1}
                  isExpanded={expanded === lecture.id}
                  onViewLecture={() => openLecture(lecture)}
                  onToggle={() =>
                    setExpanded(expanded === lecture.id ? null : lecture.id)
                  }
                />
              ))}
            </View>
            {visibleLectures.length === 0 ? (
              <EmptyState icon="search-outline" message="مفيش محاضرات مطابقة للبحث" />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LectureItem({
  lecture,
  index,
  isExpanded,
  onViewLecture,
  onToggle,
}: {
  lecture: Lecture;
  index: number;
  isExpanded: boolean;
  onViewLecture: () => void;
  onToggle: () => void;
}) {
  return (
    <View style={styles.lectureCard}>
      <TouchableOpacity
        style={styles.lectureHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.lectureNumber}>
          {lecture.viewed ? (
            <Ionicons name="checkmark" size={17} color="#FFF" />
          ) : (
            <Text style={styles.lectureNumberText}>{index}</Text>
          )}
        </View>
        <View style={styles.lectureContent}>
          <Text style={styles.lectureTitle} numberOfLines={2}>
            {lecture.title}
          </Text>
          {lecture.description ? (
            <Text style={styles.lectureDesc} numberOfLines={1}>
              {lecture.description}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={COLORS.textLight}
        />
      </TouchableOpacity>

      {isExpanded ? (
        <View style={styles.lectureExpanded}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onViewLecture}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="play" size={20} color="#FFF" />
            </View>
            <Text style={styles.actionText}>شاهد الفيديو</Text>
            <Ionicons name="chevron-back" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          {lecture.pdfUrl ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() =>
                router.push(
                  `/pdf?url=${encodeURIComponent(
                    lecture.pdfUrl!
                  )}&title=${encodeURIComponent(lecture.title)}` as any
                )
              }
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, styles.actionIconSecondary]}>
                <Ionicons name="document-text" size={20} color="#FFF" />
              </View>
              <Text style={styles.actionText}>ملف PDF</Text>
              <Ionicons name="chevron-back" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4, width: 40 },
  headerText: { flex: 1, alignItems: "flex-end" },
  headerTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 18,
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  scroll: { padding: 20, paddingBottom: 40 },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 18,
  },
  progressHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: { fontFamily: FONTS.bold, color: COLORS.textDark, fontSize: 15 },
  progressCount: { fontFamily: FONTS.regular, color: COLORS.textLight, fontSize: 13 },
  progressTrack: {
    height: 9,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: COLORS.success, borderRadius: 5 },
  progressPercentage: {
    fontFamily: FONTS.bold,
    color: COLORS.success,
    textAlign: "left",
    fontSize: 12,
    marginTop: 8,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: COLORS.textDark,
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    paddingVertical: 12,
    textAlign: "right",
  },
  filters: { flexDirection: "row-reverse", gap: 8, marginBottom: 16 },
  filter: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 12 },
  filterTextActive: { color: "#FFF", fontFamily: FONTS.bold },
  loadingBox: { paddingVertical: 60, alignItems: "center", gap: 12 },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
  },
  emptyBox: { paddingVertical: 60, alignItems: "center", gap: 12 },
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
  list: { gap: 12 },
  lectureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  lectureHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  lectureNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  lectureNumberText: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.primary,
  },
  lectureContent: { flex: 1, alignItems: "flex-end" },
  lectureTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textDark,
    textAlign: "right",
  },
  lectureDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: "right",
  },
  lectureExpanded: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
    gap: 8,
    backgroundColor: "#F8FAFC",
  },
  actionBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconSecondary: {
    backgroundColor: COLORS.primary,
  },
  actionText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: "#FFF",
    flex: 1,
    textAlign: "right",
  },
});