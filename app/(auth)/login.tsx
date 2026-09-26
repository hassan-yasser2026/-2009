import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../src/core/constants";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { useAuthStore } from "../../src/store/authStore";
import { getErrorMessage } from "../../src/services/api";

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "من فضلك اكتب الإيميل";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "الإيميل غير صحيح";
    }

    if (!password) {
      newErrors.password = "من فضلك اكتب الباسورد";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoginError("");
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)/home" as any);
    } catch (error: any) {
      const status = error?.response?.status;
      const errorCode = error?.response?.data?.error;

      if (status === 401) {
        const message =
          errorCode === "email_not_found"
            ? "الإيميل غير مسجل، راجع الإيميل وحاول مرة تانية."
            : errorCode === "invalid_password"
              ? "الباسورد غلط، راجعه وحاول مرة تانية."
              : "الإيميل أو الباسورد غلط، راجع البيانات وحاول مرة تانية.";
        setLoginError(message);
        Alert.alert("بيانات الدخول غير صحيحة", message);
        return;
      }

      // لو الحساب لسه pending، وديه لشاشة انتظار الموافقة
      if (status === 403) {
        if (errorCode === "subscription_inactive") {
          const message =
            "حسابك في انتظار موافقة الأدمن. ارفع إيصال الدفع وانتظر التفعيل.";
          setLoginError(message);
          Alert.alert(
            "حسابك تحت المراجعة",
            message,
            [
              { text: "حسنًا", style: "cancel" },
              {
                text: "ارفع سكرين شوت",
                onPress: () => router.push("/payment" as any),
              },
            ]
          );
          return;
        }
        if (errorCode === "subscription_expired") {
          const message = "انتهى اشتراكك، لازم تجدده عشان تدخل المنصة.";
          setLoginError(message);
          Alert.alert(
            "انتهى اشتراكك",
            message,
            [
              { text: "لاحقًا", style: "cancel" },
              {
                text: "جدد الآن",
                onPress: () => router.push("/payment" as any),
              },
            ]
          );
          return;
        }
      }

      const message = getErrorMessage(error);
      setLoginError(message);
      Alert.alert("خطأ", message);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "استعادة كلمة المرور",
      "تواصل مع الأدمن على رقم فودافون كاش 01067254988 لإعادة تعيين كلمة المرور.",
      [{ text: "حسنًا" }]
    );
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
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>أهلاً بيك تاني 👋</Text>
            <Text style={styles.subtitle}>
              سجل دخول عشان تكمل من حيث ما وقفت
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="الإيميل"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLoginError("");
                if (errors.email) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.email;
                    return copy;
                  });
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              editable={!loading}
            />

            <View style={styles.passwordWrapper}>
              <Input
                label="الباسورد"
                placeholder="اكتب الباسورد"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setLoginError("");
                  if (errors.password) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.password;
                      return copy;
                    });
                  }
                }}
                secureTextEntry={!showPassword}
                error={errors.password}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotText}>نسيت الباسورد؟</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Button
            title="تسجيل الدخول"
            onPress={handleLogin}
            loading={loading}
          />

          {loginError ? (
            <View style={styles.loginErrorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={COLORS.error}
              />
              <Text style={styles.loginErrorText}>{loginError}</Text>
            </View>
          ) : null}

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>معندكش حساب؟ </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register/step1" as any)}
              disabled={loading}
            >
              <Text style={styles.registerLink}>سجل دلوقتي</Text>
            </TouchableOpacity>
          </View>

          {/* Help Card */}
          <View style={styles.helpCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.helpText}>
              لو واجهتك أي مشكلة، تواصل مع الدعم على{" "}
              <Text style={styles.helpPhone}>01067254988</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    color: COLORS.textDark,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  form: { marginBottom: 16 },
  loginErrorBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  loginErrorText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.error,
    textAlign: "right",
    lineHeight: 21,
  },
  passwordWrapper: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    left: 16,
    top: 44,
    padding: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 4,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
  },
  registerRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  registerText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
  },
  registerLink: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
  },
  helpCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    marginTop: 32,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  helpText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
    textAlign: "right",
    lineHeight: 20,
  },
  helpPhone: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
});