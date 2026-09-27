import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { examService } from "../../src/services/exam.service";
import { useAuthStore } from "../../src/store/authStore";

export default function ExamResultScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const user = useAuthStore((state) => state.user);
  const resultQuery = useQuery({
    queryKey: ["exam-result", examId],
    queryFn: () => examService.result(examId),
    enabled: Boolean(examId) && user?.status === "active",
    retry: false,
  });
  const result = resultQuery.data;

  useEffect(() => {
    if (user?.status !== "active") {
      router.replace(user?.status === "pending" ? "/register/pending" : "/register/step1");
    }
  }, [user]);

  if (resultQuery.isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!result) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>لم يتم تسليم الامتحان بعد أو تعذر تحميل النتيجة.</Text>
        <TouchableOpacity onPress={() => router.replace(`/exams/${examId}` as never)}>
          <Text style={styles.link}>العودة لتفاصيل الامتحان</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const passed = result.percentage >= 50;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={[styles.icon, passed ? styles.successIcon : styles.failIcon]}>
          <Ionicons name={passed ? "checkmark" : "school-outline"} size={44} color="#FFF" />
        </View>
        <Text style={styles.heading}>نتيجة الامتحان</Text>
        <Text style={styles.examTitle}>{result.exam.title}</Text>
        <Text style={styles.subject}>{result.exam.subjectName}</Text>
        <View style={styles.scoreCard}>
          <Text style={styles.score}>{result.score} / {result.totalScore}</Text>
          <Text style={styles.percent}>{result.percentage}%</Text>
          <Text style={styles.caption}>{passed ? "أحسنت، استمر في التقدم!" : "راجع إجاباتك واستعد للامتحان القادم."}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.replace("/exams" as never)}>
          <Text style={styles.buttonText}>العودة للامتحانات</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  icon: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successIcon: { backgroundColor: COLORS.success },
  failIcon: { backgroundColor: COLORS.primary },
  heading: { fontFamily: FONTS.extraBold, color: COLORS.textDark, fontSize: 26 },
  examTitle: { fontFamily: FONTS.bold, color: COLORS.textDark, fontSize: 20, textAlign: "center" },
  subject: { fontFamily: FONTS.regular, color: COLORS.primary },
  scoreCard: { width: "100%", alignItems: "center", gap: 8, backgroundColor: "#FFF", borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 26, marginVertical: 12 },
  score: { fontFamily: FONTS.extraBold, color: COLORS.textDark, fontSize: 34 },
  percent: { fontFamily: FONTS.bold, color: COLORS.primary, fontSize: 22 },
  caption: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: "center" },
  button: { width: "100%", height: 50, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  buttonText: { fontFamily: FONTS.bold, color: "#FFF" },
  message: { fontFamily: FONTS.regular, color: COLORS.textDark, textAlign: "center" },
  link: { fontFamily: FONTS.bold, color: COLORS.primary },
});
