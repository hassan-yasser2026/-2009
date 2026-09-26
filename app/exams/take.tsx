import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { examService } from "../../src/services/exam.service";
import { getErrorMessage } from "../../src/services/api";

export default function TakeExamScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const examQuery = useQuery({
    queryKey: ["exam-start", examId],
    queryFn: () => examService.start(examId),
    enabled: Boolean(examId),
    retry: false,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    if (examQuery.data) setRemaining(examQuery.data.remainingSeconds);
  }, [examQuery.data]);

  const submitExam = useCallback(async () => {
    if (!examId || submitting || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      await examService.submit(examId, answers);
      router.replace({ pathname: "/exams/result", params: { examId } });
    } catch (error: any) {
      if (error?.response?.status === 410 || error?.response?.status === 409) {
        router.replace({ pathname: "/exams/result", params: { examId } });
        return;
      }
      submittedRef.current = false;
      setSubmitError(getErrorMessage(error));
      Alert.alert("تعذر التسليم", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [answers, examId, submitting]);

  useEffect(() => {
    if (!examQuery.data || submittedRef.current) return;
    if (remaining <= 0) {
      void submitExam();
      return;
    }
    const interval = setInterval(() => setRemaining((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(interval);
  }, [examQuery.data, remaining, submitExam]);

  if (examQuery.isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }
  if (examQuery.isError || !examQuery.data) {
    const status = (examQuery.error as any)?.response?.status;
    const message = status === 402
      ? "يجب سداد رسوم الامتحان وموافقة الإدارة أولًا."
      : status === 409
        ? "تم تسليم هذا الامتحان بالفعل."
        : status === 410
          ? "انتهى وقت الامتحان."
          : getErrorMessage(examQuery.error);
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{message}</Text>
        {status === 409 || status === 410 ? (
          <TouchableOpacity onPress={() => router.replace({ pathname: "/exams/result", params: { examId } })}>
            <Text style={styles.link}>عرض النتيجة</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>رجوع</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const { exam, questions } = examQuery.data;
  const question = questions[currentIndex];
  const timeLabel = `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Text style={styles.examTitle} numberOfLines={1}>{exam.title}</Text>
        <View style={[styles.timer, remaining < 60 && styles.timerUrgent]}>
          <Ionicons name="time-outline" size={18} color={remaining < 60 ? COLORS.error : COLORS.primary} />
          <Text style={[styles.timerText, remaining < 60 && styles.timerTextUrgent]}>{timeLabel}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>السؤال {currentIndex + 1} من {questions.length}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.text}</Text>
          <Text style={styles.points}>{question.points} درجة</Text>
        </View>
        <View style={styles.options}>
          {question.options.map((option, index) => {
            const selected = answers[question.id] === index;
            return (
              <TouchableOpacity
                key={`${question.id}-${index}`}
                onPress={() => setAnswers((current) => ({ ...current, [question.id]: index }))}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navDisabled]}
            disabled={currentIndex === 0 || submitting}
            onPress={() => setCurrentIndex((index) => index - 1)}
          >
            <Text style={styles.navText}>السابق</Text>
          </TouchableOpacity>
          {currentIndex < questions.length - 1 ? (
            <TouchableOpacity style={[styles.navButton, styles.primaryButton]} onPress={() => setCurrentIndex((index) => index + 1)}>
              <Text style={[styles.navText, styles.primaryText]}>التالي</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.navButton, styles.primaryButton]} disabled={submitting} onPress={() => void submitExam()}>
              <Text style={[styles.navText, styles.primaryText]}>{submitting ? "جارٍ التسليم..." : "تسليم الامتحان"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24, backgroundColor: COLORS.background },
  errorText: { fontFamily: FONTS.bold, color: COLORS.textDark, textAlign: "center" },
  link: { fontFamily: FONTS.bold, color: COLORS.primary },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  examTitle: { flex: 1, fontFamily: FONTS.bold, color: COLORS.textDark, textAlign: "right", fontSize: 17 },
  timer: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  timerUrgent: { backgroundColor: "#FEF2F2" },
  timerText: { fontFamily: FONTS.extraBold, color: COLORS.primary },
  timerTextUrgent: { color: COLORS.error },
  progressRow: { paddingHorizontal: 20, gap: 8 },
  progressText: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: "right" },
  progressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 4 },
  content: { padding: 20, gap: 16 },
  questionCard: { backgroundColor: "#FFF", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: COLORS.border, gap: 14 },
  questionText: { fontFamily: FONTS.bold, color: COLORS.textDark, fontSize: 19, textAlign: "right", lineHeight: 30 },
  points: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: "right" },
  options: { gap: 12 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  optionText: { flex: 1, fontFamily: FONTS.regular, color: COLORS.textDark, textAlign: "right", fontSize: 16 },
  optionTextSelected: { fontFamily: FONTS.bold, color: COLORS.primary },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: "#FFF", gap: 10 },
  navigation: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  navButton: { flex: 1, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" },
  navDisabled: { opacity: 0.4 },
  primaryButton: { backgroundColor: COLORS.primary },
  navText: { fontFamily: FONTS.bold, color: COLORS.textDark },
  primaryText: { color: "#FFF" },
  submitError: { color: COLORS.error, textAlign: "center", fontFamily: FONTS.regular },
});
