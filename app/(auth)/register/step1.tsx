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
  FOREIGN_LANGUAGES,
  FONTS,
  getElectiveName,
  getElectivesForTrack,
  getSectionsForGrade,
  getTrackName,
  getTracksForGrade,
} from "../../../src/core/constants";
import type {
  ElectiveId,
  ForeignLanguageId,
  SectionId,
  TrackId,
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
  const [trackId, setTrackId] = useState<TrackId | null>(data.trackId);
  const [electiveId, setElectiveId] = useState<ElectiveId | null>(data.electiveId);
  const savedForeignLanguage = FOREIGN_LANGUAGES.find(
    (language) => language.id === data.electiveId,
  );
  const [electiveOptionId, setElectiveOptionId] = useState<string | null>(
    savedForeignLanguage ? "language" : data.electiveId,
  );
  const [foreignLanguageId, setForeignLanguageId] =
    useState<ForeignLanguageId | null>(savedForeignLanguage?.id ?? null);
  const [sectionId, setSectionId] = useState<SectionId | null>(data.sectionId);
  const [sectionName, setSectionName] = useState(data.sectionName);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableTracks = getTracksForGrade(gradeId);
  const availableElectives = getElectivesForTrack(trackId);
  const availableSections = getSectionsForGrade(gradeId);
  const selectedElective = availableElectives.find(
    (elective) => elective.id === electiveOptionId,
  );
  const showSections = availableSections.length > 0;
  const requiresForeignLanguage = selectedElective?.id === "language";

  const handleGradeChange = (id: number, name: string) => {
    setGradeId(id);
    setGradeName(name);
    setTrackId(null);
    setElectiveId(null);
    setElectiveOptionId(null);
    setForeignLanguageId(null);
    setSectionId(null);
    setSectionName("");
    setErrors((previous) => {
      const next = { ...previous };
      delete next.section;
      delete next.track;
      delete next.elective;
      delete next.foreignLanguage;
      return next;
    });
  };

  const handleTrackChange = (id: TrackId) => {
    setTrackId(id);
    setElectiveId(null);
    setElectiveOptionId(null);
    setForeignLanguageId(null);
    setSectionId(null);
    setSectionName("");
    setErrors((previous) => {
      const next = { ...previous };
      delete next.track;
      delete next.elective;
      delete next.foreignLanguage;
      return next;
    });
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

    if (gradeId === 5 && !trackId) {
      newErrors.track = "من فضلك اختر المسار";
    }

    if (gradeId === 5 && !electiveId) {
      newErrors.elective = "من فضلك اختر المادة الاختيارية";
    }

    if (gradeId === 5 && requiresForeignLanguage && !foreignLanguageId) {
      newErrors.foreignLanguage = "من فضلك اختر اللغة";
    }

    if (showSections && !sectionId) {
      newErrors.section = "من فضلك اختر القسم";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;

    const trackName = getTrackName(trackId);
    const electiveName = getElectiveName(electiveId);
    setStep1({
      fullName: fullName.trim(),
      phone: phone.trim(),
      gradeId: gradeId!,
      gradeName,
      trackId: gradeId === 5 ? trackId : null,
      trackName: gradeId === 5 ? trackName : "",
      electiveId: gradeId === 5 ? electiveId : null,
      electiveName: gradeId === 5 ? electiveName : "",
      sectionId: gradeId === 6 ? sectionId : null,
      sectionName: gradeId === 6 ? sectionName : "",
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

            {gradeId === 5 ? (
              <View style={styles.sectionWrapper}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDivider} />
                  <Text style={styles.label}>المسار</Text>
                </View>
                {errors.track ? (
                  <Text style={styles.errorText}>{errors.track}</Text>
                ) : null}
                <View style={styles.choiceList}>
                  {availableTracks.map((track) => (
                    <TouchableOpacity
                      key={track.id}
                      onPress={() => handleTrackChange(track.id)}
                      activeOpacity={0.8}
                      style={[
                        styles.choiceItem,
                        trackId === track.id && styles.choiceItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          trackId === track.id && styles.choiceTextSelected,
                        ]}
                      >
                        {track.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {trackId ? (
                  <View style={styles.nestedChoice}>
                    <Text style={styles.label}>المادة الاختيارية</Text>
                    {errors.elective ? (
                      <Text style={styles.errorText}>{errors.elective}</Text>
                    ) : null}
                    <View style={styles.choiceList}>
                      {availableElectives.map((elective) => (
                        <TouchableOpacity
                          key={elective.id}
                          onPress={() => {
                            setElectiveOptionId(elective.id);
                            if (elective.id === "language") {
                              setElectiveId(null);
                            } else {
                              setElectiveId(elective.id);
                            }
                            setForeignLanguageId(null);
                            setErrors((previous) => {
                              const next = { ...previous };
                              delete next.elective;
                              delete next.foreignLanguage;
                              return next;
                            });
                          }}
                          activeOpacity={0.8}
                          style={[
                            styles.choiceItem,
                            electiveOptionId === elective.id && styles.choiceItemSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceText,
                              electiveOptionId === elective.id && styles.choiceTextSelected,
                            ]}
                          >
                            {elective.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {requiresForeignLanguage ? (
                      <View style={styles.nestedChoice}>
                        <Text style={styles.label}>اختر اللغة الأجنبية الثانية</Text>
                        {errors.foreignLanguage ? (
                          <Text style={styles.errorText}>{errors.foreignLanguage}</Text>
                        ) : null}
                        <View style={styles.choiceList}>
                          {FOREIGN_LANGUAGES.map((language) => (
                            <TouchableOpacity
                              key={language.id}
                              onPress={() => {
                                setForeignLanguageId(language.id);
                                setElectiveId(language.id);
                                if (errors.foreignLanguage) {
                                  setErrors((previous) => {
                                    const next = { ...previous };
                                    delete next.foreignLanguage;
                                    return next;
                                  });
                                }
                              }}
                              activeOpacity={0.8}
                              style={[
                                styles.choiceItem,
                                foreignLanguageId === language.id && styles.choiceItemSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.choiceText,
                                  foreignLanguageId === language.id && styles.choiceTextSelected,
                                ]}
                              >
                                {language.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

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
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
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
  nestedChoice: { marginTop: 20 },
  choiceList: { gap: 8 },
  choiceItem: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  choiceItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF6FF",
  },
  choiceText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textDark,
    textAlign: "right",
  },
  choiceTextSelected: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
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