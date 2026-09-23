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
import {
  COLORS,
  FONTS,
  getSectionsForGrade,
  SectionId,
} from "../../../src/core/constants";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import { ProgressBar } from "../../../src/components/ProgressBar";
import { GradeSelector } from "../../../src/components/GradeSelector";
import { SectionSelector } from "../../../src/components/SectionSelector";
import { useRegistrationStore } from "../../../src/store/registrationStore";

export default function Step1Screen() {
  const { data, setStep1 } = useRegistrationStore();
  const [fullName, setFullName] = useState(data.fullName);
  const [phone, setPhone] = useState(data.phone);
  const [gradeId, setGradeId] = useState<number | null>(data.gradeId);
  const [gradeName, setGradeName] = useState(data.gradeName);
  const [sectionId, setSectionId] = useState<SectionId>(data.sectionId);
  const [sectionName, setSectionName] = useState(data.sectionName);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableSections = getSectionsForGrade(gradeId);
  const showSections = availableSections.length > 0;

  const handleGradeChange = (id: number, name: string) => {
    setGradeId(id);
    setGradeName(name);
    // لو الصف مش ثانوي، نصفّر القسم
    const sectionsForThisGrade = getSectionsForGrade(id);
    if (sectionsForThisGrade.length === 0) {
      setSectionId(null);
      setSectionName("");
    } else {
      // لو الصف الجديد فيه أقسام، نصفّر القسم القديم عشان المستخدم يختار من جديد
      setSectionId(null);
      setSectionName("");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const nameParts = fullName.trim().split(/\s+/);
    if (!fullName.trim()) {
      newErrors.fullName = "من فضلك اكتب اسمك";
    } else if (nameParts.length < 4) {
      newErrors.fullName = "الاسم لازم يكون رباعي (4 أسماء على الأقل)";
    }

    if (!phone.trim()) {
      newErrors.phone = "من فضلك اكتب رقم الموبايل";
    } else if (!/^01[0125][0-9]{8}$/.test(phone.trim())) {
      newErrors.phone = "رقم الموبايل غير صحيح";
    }

    if (!gradeId) {
      newErrors.grade = "من فضلك اختر الصف الدراسي";
    }

    if (showSections && !sectionId) {
      newErrors.section = "من فضلك اختر القسم";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;

    setStep1({
      fullName: fullName.trim(),
      phone: phone.trim(),
      gradeId: gradeId!,
      gradeName,
      sectionId,
      sectionName,
    });

    router.push("/register/step2");
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
          <ProgressBar currentStep={1} totalSteps={3} />

          <Text style={styles.title}>أهلاً بيك 👋</Text>
          <Text style={styles.subtitle}>خلينا نتعرف عليك الأول</Text>

          <View style={styles.form}>
            <Input
              label="الاسم رباعي"
              placeholder="مثال: حسن محمد أحمد علي"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              autoCapitalize="words"
            />

            <Input
              label="رقم الموبايل"
              placeholder="01xxxxxxxxx"
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
              keyboardType="phone-pad"
              maxLength={11}
              error={errors.phone}
            />

            <Text style={styles.label}>الصف الدراسي</Text>
            {errors.grade ? (
              <Text style={styles.errorText}>{errors.grade}</Text>
            ) : null}
            <GradeSelector
              selectedId={gradeId}
              onSelect={handleGradeChange}
            />

            {showSections ? (
              <View style={styles.sectionWrapper}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDivider} />
                  <Text style={styles.label}>القسم</Text>
                </View>
                {errors.section ? (
                  <Text style={styles.errorText}>{errors.section}</Text>
                ) : null}
                <SectionSelector
                  sections={availableSections}
                  selectedId={sectionId}
                  onSelect={(id, name) => {
                    setSectionId(id as Exclude<SectionId, null>);
                    setSectionName(name);
                    if (errors.section) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.section;
                        return copy;
                      });
                    }
                  }}
                />
              </View>
            ) : null}
          </View>

          <Button title="التالي" onPress={handleNext} />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>عندك حساب بالفعل؟ </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.loginLink}>سجل دخول</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
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
  label: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: "right",
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.error,
    marginBottom: 8,
    textAlign: "right",
  },
  sectionWrapper: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  loginRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
  },
  loginLink: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
  },
});