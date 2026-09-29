import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { examService } from "../../src/services/exam.service";
import { useAuthStore } from "../../src/store/authStore";

export default function ExamResultsScreen() {
  const user = useAuthStore((state) => state.user);
  const query = useQuery({ queryKey: ["exam-results"], queryFn: examService.results });

  useEffect(() => {
    if (user?.status !== "active") {
      router.replace(user?.status === "pending" ? "/register/pending" : "/register/step1");
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.heading}>نتائجي</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {query.isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : query.isError ? (
          <Text style={styles.empty}>تعذر تحميل النتائج. حاول مرة أخرى.</Text>
        ) : query.data?.length ? (
          query.data.map((result) => (
            <View key={result.exam.id} style={styles.card}>
              <Text style={styles.examTitle}>{result.exam.title}</Text>
              <Text style={styles.subject}>{result.exam.subjectName}</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.score}>{result.score} / {result.totalScore}</Text>
                <Text style={styles.percent}>{result.percentage}%</Text>
              </View>
              <Text style={styles.date}>
                {new Date(result.submittedAt).toLocaleDateString("ar-EG")}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="trophy-outline" size={58} color={COLORS.textLight} />
            <Text style={styles.empty}>لسه مفيش امتحانات مكتملة</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", padding: 20 },
  back: { width: 40, alignItems: "center" },
  heading: { fontFamily: FONTS.extraBold, color: COLORS.textDark, fontSize: 23 },
  content: { padding: 20, gap: 14 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  examTitle: { fontFamily: FONTS.bold, color: COLORS.textDark, fontSize: 17, textAlign: "right" },
  subject: { fontFamily: FONTS.regular, color: COLORS.primary, textAlign: "right", marginTop: 4 },
  scoreRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  score: { fontFamily: FONTS.bold, color: COLORS.textDark, fontSize: 18 },
  percent: { fontFamily: FONTS.extraBold, color: COLORS.success, fontSize: 20 },
  date: { fontFamily: FONTS.regular, color: COLORS.textLight, fontSize: 12, textAlign: "left", marginTop: 10 },
  emptyBox: { alignItems: "center", gap: 10, marginTop: 90 },
  empty: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: "center", marginTop: 20 },
});
