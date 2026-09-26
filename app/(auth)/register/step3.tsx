import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../../src/core/constants";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import { ProgressBar } from "../../../src/components/ProgressBar";
import { useRegistrationStore } from "../../../src/store/registrationStore";
import { authService } from "../../../src/services/auth.service";
import { getErrorMessage } from "../../../src/services/api";
import { useAuthStore } from "../../../src/store/authStore";
import { storage } from "../../../src/core/storage";

export default function Step3Screen() {
  const { data, reset } = useRegistrationStore();
  const [referralCode, setReferralCode] = useState(data.referralCode);
  const [loading, setLoading] = useState(false);

  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  const handleSubmit = async () => {
    if (
      !data.fullName ||
      !data.email ||
      !data.phone ||
      !data.password ||
      !data.gradeId ||
      !data.gradeName
    ) {
      Alert.alert("بيانات ناقصة", "ارجع للخطوات السابقة وتأكد من إدخال كل البيانات المطلوبة");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        gradeId: data.gradeId!,
        gradeName: data.gradeName,
        sectionId: data.sectionId,
        sectionName: data.sectionName,
        referralCode: referralCode || undefined,
      });
      // حفظ التوكن وبيانات المستخدم
      await storage.setToken(response.token);
      await storage.setUser(response.user);
      setToken(response.token);
      setUser(response.user as any);

      reset();
      router.replace("/register/pending" as any);
    } catch (error: unknown) {
      Alert.alert("خطأ", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProgressBar currentStep={3} totalSteps={3} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-forward" size={24} color={COLORS.textDark} />
          </TouchableOpacity>

          <Text style={styles.title}>راجع بياناتك 📝</Text>
          <Text style={styles.subtitle}>
            اتأكد إن كل البيانات صحيحة قبل ما تكمل
          </Text>

          <View style={styles.card}>
            <InfoRow icon="person-outline" label="الاسم" value={data.fullName} />
            <InfoRow icon="call-outline" label="الموبايل" value={data.phone} />
            <InfoRow icon="school-outline" label="الصف" value={data.gradeName} />
            {data.sectionName ? (
              <InfoRow
                icon="git-branch-outline"
                label="القسم"
                value={data.sectionName}
              />
            ) : null}
            <InfoRow icon="mail-outline" label="الإيميل" value={data.email} />
          </View>

          <View style={styles.referralSection}>
            <View style={styles.referralHeader}>
              <Ionicons name="gift-outline" size={22} color={COLORS.secondary} />
              <Text style={styles.referralTitle}>عندك كود إحالة؟ (اختياري)</Text>
            </View>
            <Text style={styles.referralHint}>
              لو حد دعاك للمنصة، اكتب كود الإحالة بتاعه هنا
            </Text>
            <Input
              label=""
              placeholder="مثال: AHMED123"
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.termsBox}>
            <Text style={styles.termsText}>
              بالضغط على "إنشاء الحساب" إنت موافق على شروط الاستخدام وسياسة
              الخصوصية
            </Text>
          </View>

          <Button
            title="إنشاء الحساب"
            onPress={handleSubmit}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  backBtn: { marginBottom: 16, alignItems: "flex-end" },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    color: COLORS.textDark,
    textAlign: "right",
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "right",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1, alignItems: "flex-end" },
  infoLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
  },
  infoValue: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textDark,
    marginTop: 2,
  },
  referralSection: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  referralHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  referralTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textDark,
  },
  referralHint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 14,
    textAlign: "right",
  },
  termsBox: { marginBottom: 24, paddingHorizontal: 4 },
  termsText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
});