import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../../src/core/constants";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import { ProgressBar } from "../../../src/components/ProgressBar";
import { useRegistrationStore } from "../../../src/store/registrationStore";

export default function Step2Screen() {
  const { data, setStep2 } = useRegistrationStore();
  const [email, setEmail] = useState(data.email);
  const [password, setPassword] = useState(data.password);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "من فضلك اكتب الإيميل";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "الإيميل غير صحيح";
    }

    if (!password) {
      newErrors.password = "من فضلك اكتب الباسورد";
    } else if (password.length < 8) {
      newErrors.password = "الباسورد لازم يكون 8 أحرف على الأقل";
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      newErrors.password = "الباسورد لازم يحتوي على حروف وأرقام";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "الباسورد مش متطابق";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep2({ email: email.trim().toLowerCase(), password });
    router.push("/auth/register/step3");
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
          <ProgressBar currentStep={2} totalSteps={3} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-forward" size={24} color={COLORS.textDark} />
          </TouchableOpacity>

          <Text style={styles.title}>بيانات الدخول 🔐</Text>
          <Text style={styles.subtitle}>
            هتستخدم البيانات دي عشان تدخل المنصة
          </Text>

          <View style={styles.form}>
            <Input
              label="الإيميل"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <View style={styles.passwordWrapper}>
              <Input
                label="الباسورد"
                placeholder="8 أحرف على الأقل"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                error={errors.password}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordWrapper}>
              <Input
                label="تأكيد الباسورد"
                placeholder="اكتب الباسورد تاني"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                error={errors.confirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button title="التالي" onPress={handleNext} />
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
    marginBottom: 32,
    textAlign: "right",
  },
  form: { marginBottom: 24 },
  passwordWrapper: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    left: 16,
    top: 44,
    padding: 4,
  },
});