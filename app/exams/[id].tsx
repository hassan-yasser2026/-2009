import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { COLORS, FONTS } from "../../src/core/constants";
import { examService } from "../../src/services/exam.service";
import { useAuthStore } from "../../src/store/authStore";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { getErrorMessage } from "../../src/services/api";

export default function ExamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [screenshot, setScreenshot] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [busy, setBusy] = useState(false);
  const examQuery = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examService.get(id),
    enabled: Boolean(id),
  });
  const exam = examQuery.data;
  const submission = exam?.submission;

  useEffect(() => {
    if (user?.status !== "active") {
      router.replace(user?.status === "pending" ? "/register/pending" : "/register/step1");
    }
  }, [user]);

  const startExam = async () => {
    if (!exam) return;
    router.push({ pathname: "/exams/take", params: { examId: exam.id } });
  };

  const submitPayment = async () => {
    if (!exam) return;
    if (!transactionRef.trim()) {
      Alert.alert("تنبيه", "رقم العملية مطلوب");
      return;
    }
    if (!screenshot) {
      Alert.alert("تنبيه", "ارفع صورة إيصال التحويل");
      return;
    }
    setBusy(true);
    try {
      await examService.submitPayment(
        exam.id,
        screenshot.uri,
        transactionRef.trim(),
        screenshot.file
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exam", id] }),
        queryClient.invalidateQueries({ queryKey: ["exams"] }),
      ]);
      Alert.alert("تم الإرسال", "تم إرسال إيصال الدفع للمراجعة.");
    } catch (error) {
      Alert.alert("تعذر إرسال الدفع", getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (examQuery.isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }
  if (examQuery.isError || !exam) {
    return <View style={styles.center}><Text style={styles.body}>تعذر تحميل تفاصيل الامتحان.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.textDark} />
          <Text style={styles.backText}>الامتحانات</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.subject}>{exam.subjectName}</Text>
          <Text style={styles.title}>{exam.title}</Text>
          {!!exam.description && <Text style={styles.body}>{exam.description}</Text>}
          <View style={styles.infoRow}>
            <Info label="المدة" value={`${exam.duration} دقيقة`} />
            <Info label="الأسئلة" value={String(exam.questionCount)} />
            <Info label="السعر" value={exam.price > 0 ? `${exam.price} ج.م` : "مجاني"} />
          </View>
        </View>

        {submission?.submittedAt ? (
          <Button title="عرض النتيجة" onPress={() => router.push({ pathname: "/exams/result", params: { examId: exam.id } })} />
        ) : submission?.paid || exam.price === 0 ? (
          <Button title="ابدأ الامتحان" onPress={() => void startExam()} />
        ) : submission && exam.paymentStatus === "pending" ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>تم استلام إيصال الدفع، وسيتم تفعيل الامتحان بعد المراجعة.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>دفع رسوم الامتحان</Text>
            {exam.paymentStatus === "rejected" && (
              <Text style={styles.rejectedNotice}>تم رفض إيصال الدفع السابق. يمكنك إرسال إيصال جديد.</Text>
            )}
            <Text style={styles.body}>حوّل {exam.price} جنيه على رقم فودافون كاش 01067254988، ثم ارفع إيصال التحويل.</Text>
            {screenshot ? (
              <View style={styles.imageWrap}>
                <Image source={{ uri: screenshot.uri }} style={styles.image} />
                <TouchableOpacity onPress={() => setScreenshot(null)} style={styles.removeImage}>
                  <Ionicons name="close-circle" size={30} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.upload}
                onPress={async () => {
                  if (ImagePicker.requestMediaLibraryPermissionsAsync) {
                    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!permission.granted) {
                      Alert.alert("الصلاحيات مطلوبة", "اسمح للتطبيق بالوصول للصور لاختيار الإيصال.");
                      return;
                    }
                  }
                  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
                  if (!picked.canceled) setScreenshot(picked.assets[0]);
                }}
              >
                <Ionicons name="cloud-upload-outline" size={28} color={COLORS.primary} />
                <Text style={styles.uploadText}>اختيار صورة الإيصال</Text>
              </TouchableOpacity>
            )}
            <Input label="رقم العملية (مطلوب)" value={transactionRef} onChangeText={setTransactionRef} />
            <Button title="إرسال إيصال الدفع" onPress={() => void submitPayment()} loading={busy} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoItem}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  content: { padding: 20, gap: 16 },
  back: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { color: COLORS.textDark, fontFamily: FONTS.bold },
  card: { backgroundColor: "#FFF", padding: 20, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  subject: { color: COLORS.primary, textAlign: "right", fontFamily: FONTS.bold },
  title: { color: COLORS.textDark, textAlign: "right", fontFamily: FONTS.extraBold, fontSize: 24 },
  body: { color: COLORS.textLight, textAlign: "right", fontFamily: FONTS.regular, lineHeight: 23 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  infoItem: { alignItems: "center", gap: 5 },
  infoLabel: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 12 },
  infoValue: { color: COLORS.textDark, fontFamily: FONTS.bold },
  notice: { backgroundColor: "#FFFBEB", borderRadius: 14, padding: 18 },
  noticeText: { color: "#92400E", textAlign: "right", fontFamily: FONTS.bold, lineHeight: 23 },
  rejectedNotice: { color: COLORS.error, textAlign: "right", fontFamily: FONTS.bold },
  sectionTitle: { fontFamily: FONTS.bold, color: COLORS.textDark, fontSize: 18, textAlign: "right" },
  upload: { alignItems: "center", gap: 8, padding: 20, borderWidth: 1, borderColor: COLORS.border, borderStyle: "dashed", borderRadius: 14 },
  uploadText: { color: COLORS.primary, fontFamily: FONTS.bold },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 200, borderRadius: 12 },
  removeImage: { position: "absolute", top: 4, right: 4 },
});
