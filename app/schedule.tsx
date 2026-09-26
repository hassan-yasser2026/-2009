import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, FONTS } from "../src/core/constants";
import { api } from "../src/services/api";
import { useAuthStore } from "../src/store/authStore";

interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  time: string | null;
  note: string | null;
  subject: { id: string; name: string; icon: string | null };
}

const DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export default function ScheduleScreen() {
  const user = useAuthStore((state) => state.user);
  const query = useQuery({
    queryKey: ["schedule", user?.gradeId, user?.sectionId],
    queryFn: async () => (await api.get<ScheduleEntry[]>("/schedule")).data,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (user?.status !== "active") {
      router.replace(user?.status === "pending" ? "/register/pending" : "/register/step1");
    }
  }, [user]);

  const entriesByDay = DAYS.map((name, dayOfWeek) => ({
    name,
    entries: query.data?.filter((entry) => entry.dayOfWeek === dayOfWeek) ?? [],
  }));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>الجدول الأسبوعي</Text>
        <Text style={styles.subtitle}>
          {user?.gradeName}{user?.sectionName ? ` · ${user.sectionName}` : ""}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {query.isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : query.isError ? (
          <Text style={styles.message}>تعذر تحميل الجدول. اسحب للتحديث أو حاول مرة أخرى.</Text>
        ) : (
          entriesByDay.map(({ name, entries }) => (
            <View key={name} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayIcon}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.dayTitle}>{name}</Text>
                <Text style={styles.count}>{entries.length} حصص</Text>
              </View>
              {entries.length ? entries.map((entry) => (
                <View key={entry.id} style={styles.lesson}>
                  <View style={styles.lessonIcon}>
                    <Ionicons name="book-outline" size={21} color={COLORS.primary} />
                  </View>
                  <View style={styles.lessonDetails}>
                    <Text style={styles.subject}>{entry.subject.name}</Text>
                    {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
                  </View>
                  {entry.time ? (
                    <View style={styles.time}>
                      <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.timeText}>{entry.time}</Text>
                    </View>
                  ) : null}
                </View>
              )) : (
                <Text style={styles.dayEmpty}>لا توجد حصص مسجلة لهذا اليوم</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, alignItems: "flex-end" },
  title: { fontFamily: FONTS.extraBold, fontSize: 24, color: COLORS.textDark },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  content: { padding: 20, paddingTop: 12, gap: 14, paddingBottom: 36 },
  dayCard: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 12 },
  dayHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 9, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dayIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  dayTitle: { flex: 1, textAlign: "right", fontFamily: FONTS.bold, fontSize: 17, color: COLORS.textDark },
  count: { fontFamily: FONTS.regular, color: COLORS.textLight, fontSize: 12 },
  lesson: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingVertical: 3 },
  lessonIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  lessonDetails: { flex: 1, alignItems: "flex-end" },
  subject: { fontFamily: FONTS.bold, color: COLORS.textDark, textAlign: "right" },
  note: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: "right", fontSize: 12, marginTop: 3 },
  time: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  timeText: { fontFamily: FONTS.bold, color: COLORS.primary, fontSize: 12 },
  dayEmpty: { textAlign: "right", fontFamily: FONTS.regular, color: COLORS.textLight, fontSize: 13, paddingVertical: 3 },
  message: { textAlign: "center", fontFamily: FONTS.regular, color: COLORS.textLight, paddingVertical: 24 },
});
