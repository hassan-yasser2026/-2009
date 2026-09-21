import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, FONTS, APP } from "../src/core/constants";
import { paymentService } from "../src/services/payment.service";
import { useAuthStore } from "../src/store/authStore";

export default function PaymentStatusScreen() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["payment-status"],
    queryFn: () => paymentService.getMyStatus(),
    refetchInterval: 30000, // كل 30 ثانية
  });

  // لو الحساب اتفعل، وديه على الرئيسية
  useEffect(() => {
    if (data?.user?.status === "active" && user) {
      setUser({ ...user, status: "active" });
      router.replace("/(tabs)/home" as any);
    }
  }, [data?.user?.status]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const latestPayment = data?.payments?.[0];
  const isPending = latestPayment?.status === "pending";
  const isRejected = latestPayment?.status === "rejected";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
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
        ) : (
          <>
            {/* الأيقونة */}
            <Animated.View
              style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}
            >
              {isRejected ? (
                <Ionicons name="close-circle" size={80} color={COLORS.error} />
              ) : isPending ? (
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <Ionicons
                    name="time-outline"
                    size={80}
                    color={COLORS.secondary}
                  />
                </Animated.View>
              ) : (
                <Ionicons name="hourglass-outline" size={80} color={COLORS.secondary} />
              )}
            </Animated.View>

            {/* العنوان */}
            <Text style={styles.title}>
              {isRejected
                ? "تم رفض الطلب ❌"
                : isPending
                ? "طلبك تحت المراجعة ⏳"
                : "في انتظار رفع الدفع"}
            </Text>

            <Text style={styles.subtitle}>
              {isRejected
                ? "للأسف، السكرين شوت اللي رفعته مرفوض. تأكد من صحة التحويل وارفع صورة واضحة."
                : isPending
                ? "استلمنا سكرين شوت التحويل، وهيتم مراجعته من الأدمن خلال 24 ساعة"
                : "ارفع سكرين شوت التحويل عشان نقدر نراجع حسابك"}
            </Text>

            {/* بطاقة الحالة */}
            {latestPayment ? (
              <View style={styles.card}>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isRejected
                          ? COLORS.error
                          : COLORS.secondary,
                      },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {isRejected ? "مرفوض" : "في انتظار موافقة الأدمن"}
                  </Text>
                </View>

                {latestPayment.reviewNote ? (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.noteLabel}>ملاحظة الأدمن:</Text>
                    <Text style={styles.noteText}>{latestPayment.reviewNote}</Text>
                  </>
                ) : null}

                <View style={styles.divider} />

                <Text style={styles.helpText}>
                  لما يتم قبول طلبك، هتقدر تدخل المنصة على طول. لو محصلش، هنتواصل معاك على{" "}
                  <Text style={styles.bold}>رقم الموبايل</Text> اللي سجلت بيه.
                </Text>
              </View>
            ) : null}

            {/* بطاقة الدعم */}
            <View style={styles.supportBox}>
              <Ionicons name="headset-outline" size={20} color={COLORS.primary} />
              <Text style={styles.supportText}>
                لو حصلت مشكلة، تواصل مع الدعم على {APP.vodafoneCash}
              </Text>
            </View>

            {/* أزرار */}
            {isRejected ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace("/payment" as any)}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.primaryBtnText}>ارفع سكرين شوت جديد</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => refetch()}
                disabled={isRefetching}
              >
                <Ionicons name="refresh" size={20} color={COLORS.primary} />
                <Text style={styles.refreshText}>
                  {isRefetching ? "جارٍ التحديث..." : "تحديث الحالة"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  loadingBox: { alignItems: "center", gap: 12 },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
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
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  noteLabel: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
    textAlign: "right",
    marginBottom: 6,
  },
  noteText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.error,
    textAlign: "right",
    lineHeight: 22,
  },
  helpText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "right",
    lineHeight: 22,
  },
  bold: {
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  supportBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    width: "100%",
  },
  supportText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
    textAlign: "right",
  },
  refreshBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  refreshText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.primary,
  },
  primaryBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: "#FFF",
  },
});