import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../../src/core/constants";
import { Button } from "../../../src/components/Button";

export default function PendingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle" size={100} color={COLORS.success} />
        </View>

        <Text style={styles.title}>تم إنشاء حسابك بنجاح! 🎉</Text>
        <Text style={styles.subtitle}>
          دلوقتي محتاج تدفع الاشتراك الشهري عشان تقدر تدخل المنصة
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>الخطوة الجاية</Text>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletText}>
              حوّل 15ج على فودافون كاش على الرقم:
            </Text>
          </View>
          <Text style={styles.phone}>01067254988</Text>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletText}>
              ارفع سكرين شوت التحويل من داخل التطبيق
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletText}>
              استنى موافقة الأدمن (مش هتاخد وقت طويل)
            </Text>
          </View>
        </View>

        <Button
          title="ارفع سكرين شوت الدفع"
          onPress={() => router.replace("/payment" as any)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: { marginBottom: 24 },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 24,
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textDark,
    textAlign: "right",
    marginBottom: 16,
  },
  bulletRow: { marginBottom: 10 },
  bulletText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textDark,
    textAlign: "right",
    lineHeight: 22,
  },
  phone: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    color: COLORS.primary,
    textAlign: "center",
    letterSpacing: 2,
    marginVertical: 12,
  },
});