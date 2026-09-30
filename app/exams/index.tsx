import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { examService, type ExamSummary } from "../../src/services/exam.service";
import { useAuthStore } from "../../src/store/authStore";

export default function ExamsScreen() {
  const user = useAuthStore((state) => state.user);
  const examsQuery = useQuery({
    queryKey: [
      "exams",
      user?.gradeId,
      user?.trackId,
      user?.electiveId,
      user?.sectionId,
    ],
    queryFn: examService.list,
    enabled: user?.status === "active",
  });
  const freeExams = examsQuery.data?.filter((exam) => exam.price <= 0) ?? [];
  const paidExams = examsQuery.data?.filter((exam) => exam.price > 0) ?? [];
  const studentContext = [
    user?.gradeName,
    user?.trackName,
    user?.electiveName,
    user?.sectionName,
  ].filter(Boolean).join(" · ");

  useEffect(() => {
    if (user?.status !== "active") {
      router.replace(user?.status === "pending" ? "/register/pending" : "/register/step1");
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>الامتحانات</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {studentContext ? <Text style={styles.context}>{studentContext}</Text> : null}
        {examsQuery.isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : examsQuery.isError ? (
          <Text style={styles.message}>تعذر تحميل الامتحانات. حاول مرة أخرى.</Text>
        ) : examsQuery.data?.length ? (
          <>
            {freeExams.length ? (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>امتحانات مجانية ({freeExams.length})</Text>
                {freeExams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
              </View>
            ) : null}
            {paidExams.length ? (
              <View style={styles.group}>
                <Text style={styles.groupTitle}>امتحانات مدفوعة ({paidExams.length})</Text>
                {paidExams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.message}>لا توجد امتحانات متاحة لصفك حاليًا.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExamCard({ exam }: { exam: ExamSummary }) {
  const isPaid = exam.price > 0;
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/exams/${exam.id}` as never)}
    >
      <View style={styles.icon}>
        <Ionicons name="document-text-outline" size={28} color={COLORS.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.examTitle}>{exam.title}</Text>
        <Text style={styles.subject}>{exam.subject.name}</Text>
        <Text style={styles.meta}>
          {exam._count.questions} سؤال · {exam.duration} دقيقة ·{" "}
          {isPaid ? `${exam.price} ج.م` : "مجاني"}
        </Text>
        {exam.submission?.submittedAt ? (
          <Text style={styles.done}>تم تسليم الامتحان</Text>
        ) : exam.submission?.paid ? (
          <Text style={styles.done}>جاهز للبدء</Text>
        ) : exam.submission ? (
          <Text style={exam.paymentStatus === "rejected" ? styles.rejected : styles.pending}>
            {exam.paymentStatus === "rejected" ? "تم رفض الدفع — أعد الإرسال" : "الدفع قيد المراجعة"}
          </Text>
        ) : null}
      </View>
      <View style={[styles.priceBadge, isPaid ? styles.paidBadge : styles.freeBadge]}>
        <Text style={[styles.priceBadgeText, isPaid ? styles.paidText : styles.freeText]}>
          {isPaid ? "مدفوع" : "مجاني"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  backButton: { width: 40, alignItems: "center" },
  title: { fontFamily: FONTS.extraBold, fontSize: 23, color: COLORS.textDark },
  content: { padding: 20, gap: 14 },
  context: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, textAlign: "right", marginBottom: 2 },
  group: { gap: 12 },
  groupTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.textDark, textAlign: "right", marginTop: 4 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  icon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  examTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.textDark, textAlign: "right" },
  subject: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.primary, textAlign: "right", marginTop: 2 },
  meta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, textAlign: "right", marginTop: 4 },
  done: { fontFamily: FONTS.bold, color: COLORS.success, textAlign: "right", marginTop: 5 },
  pending: { fontFamily: FONTS.bold, color: COLORS.warning, textAlign: "right", marginTop: 5 },
  rejected: { fontFamily: FONTS.bold, color: COLORS.error, textAlign: "right", marginTop: 5 },
  priceBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, alignSelf: "flex-start" },
  paidBadge: { backgroundColor: "#FEF3C7" },
  freeBadge: { backgroundColor: "#D1FAE5" },
  priceBadgeText: { fontFamily: FONTS.bold, fontSize: 11 },
  paidText: { color: "#92400E" },
  freeText: { color: "#047857" },
  message: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: "center", marginTop: 50 },
});
