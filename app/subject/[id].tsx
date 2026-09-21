import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { subjectService, Lecture } from "../../src/services/subject.service";

export default function SubjectScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  const {
    data: lectures = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["lectures", id],
    queryFn: () => subjectService.getLectures(id),
    enabled: !!id,
  });

  const [expanded, setExpanded] = useState<string | null>(null);

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
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>جارٍ التحميل...</Text>
          </View>
        ) : lectures.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="videocam-off-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>مفيش محاضرات لحد دلوقتي</Text>
            <Text style={styles.emptyText}>
              هيتم إضافة المحاضرات قريبًا من قِبل الأدمن
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {lectures.map((lecture, index) => (
              <LectureItem
                key={lecture.id}
                lecture={lecture}
                index={index + 1}
                isExpanded={expanded === lecture.id}
                onToggle={() =>
                  setExpanded(expanded === lecture.id ? null : lecture.id)
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LectureItem({
  lecture,
  index,
  isExpanded,
  onToggle,
}: {
  lecture: Lecture;
  index: number;
  isExpanded: boolean;
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
          <Text style={styles.lectureNumberText}>{index}</Text>
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
            onPress={() =>
              router.push(
                `/lecture/${lecture.id}?url=${encodeURIComponent(
                  lecture.youtubeUrl
                )}&title=${encodeURIComponent(lecture.title)}` as any
              )
            }
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