import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, APP } from "../src/core/constants";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { paymentService } from "../src/services/payment.service";
import { getErrorMessage } from "../src/services/api";

export default function PaymentScreen() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    await Clipboard.setStringAsync(APP.vodafoneCash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("صلاحيات", "محتاجين صلاحية الوصول للصور عشان ترفع السكرين شوت");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      Alert.alert("تنبيه", "من فضلك ارفع سكرين شوت التحويل");
      return;
    }

    setLoading(true);
    try {
      await paymentService.upload(screenshot, transactionRef.trim() || undefined);
      router.replace("/payment-status" as any);
    } catch (error: any) {
      Alert.alert("خطأ", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-forward" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>دفع الاشتراك</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* السعر */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>الاشتراك الشهري</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>{APP.monthlyPrice}</Text>
              <Text style={styles.priceCurrency}>ج.م</Text>
            </View>
          </View>

          {/* الرقم */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>حوّل على رقم فودافون كاش</Text>
            </View>

            <TouchableOpacity
              style={styles.numberBox}
              onPress={copyNumber}
              activeOpacity={0.85}
            >
              <Text style={styles.numberText}>{APP.vodafoneCash}</Text>
              <View style={styles.copyBtn}>
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.copyText}>{copied ? "تم النسخ" : "نسخ"}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* خطوات التحويل */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>خطوات التحويل</Text>
            </View>

            <StepItem number="1" text="افتح تطبيق فودافون كاش أو اتصل بـ *9#" />
            <StepItem number="2" text="اختار تحويل أموال واكتب الرقم اللي فوق" />
            <StepItem
              number="3"
              text={`حوّل مبلغ ${APP.monthlyPrice} جنيه`}
            />
            <StepItem number="4" text="خد سكرين شوت لإيصال التحويل وارفعه هنا" />
          </View>

          {/* رفع السكرين شوت */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="image" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>سكرين شوت التحويل</Text>
            </View>

            {screenshot ? (
              <View style={styles.screenshotWrapper}>
                <Image source={{ uri: screenshot }} style={styles.screenshot} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setScreenshot(null)}
                >
                  <Ionicons name="close-circle" size={32} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={48}
                  color={COLORS.primary}
                />
                <Text style={styles.uploadTitle}>اضغط لرفع السكرين شوت</Text>
                <Text style={styles.uploadHint}>PNG أو JPG</Text>
              </TouchableOpacity>
            )}

            <View style={styles.refWrapper}>
              <Input
                label="رقم العملية (اختياري)"
                placeholder="مثال: 1234567890"
                value={transactionRef}
                onChangeText={setTransactionRef}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* تحذير */}
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color="#B45309" />
            <Text style={styles.warningText}>
              هيتم مراجعة الدفع خلال 24 ساعة. لو فيه أي مشكلة هنكلمك على رقم
              الموبايل اللي سجلت بيه.
            </Text>
          </View>

          <Button
            title="إرسال للمراجعة"
            onPress={handleSubmit}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepItem({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textDark,
  },
  priceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  priceLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  priceRow: { flexDirection: "row-reverse", alignItems: "flex-end", gap: 6 },
  priceValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 48,
    color: "#FFFFFF",
    lineHeight: 52,
  },
  priceCurrency: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textDark,
  },
  numberBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
  },
  numberText: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  copyText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.primary,
  },
  stepItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  stepText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textDark,
    flex: 1,
    textAlign: "right",
    lineHeight: 22,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  uploadTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textDark,
    marginTop: 12,
  },
  uploadHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  screenshotWrapper: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  screenshot: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
  },
  refWrapper: { marginTop: 16, marginBottom: -18 },
  warningBox: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  warningText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: "#78350F",
    flex: 1,
    textAlign: "right",
    lineHeight: 20,
  },
});