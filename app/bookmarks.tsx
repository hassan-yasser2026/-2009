import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../src/services/api";
import { COLORS, FONTS } from "../src/core/constants";
import { LoadingState } from "../src/components/LoadingState";
import { ErrorState } from "../src/components/ErrorState";
import { EmptyState } from "../src/components/EmptyState";

interface Bookmark {
  id: string;
  lectureId: string;
  lecture: { id: string; title: string; youtubeUrl: string; subject: { name: string } };
}

export default function BookmarksScreen() {
  const query = useQuery({
    queryKey: ["lecture-bookmarks"],
    queryFn: async () => (await api.get<Bookmark[]>("/lectures/bookmarks")).data,
  });
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-forward" size={24} color={COLORS.textDark} /></TouchableOpacity>
        <Text style={styles.title}>المفضلة ⭐</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState icon="star-outline" message="مفيش محاضرات محفوظة" /> : query.data.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card} onPress={() => router.push(`/lecture/${item.lecture.id}?url=${encodeURIComponent(item.lecture.youtubeUrl)}&title=${encodeURIComponent(item.lecture.title)}` as any)}>
            <View style={styles.icon}><Ionicons name="star" size={22} color={COLORS.secondary} /></View>
            <View style={styles.text}><Text style={styles.subject}>{item.lecture.subject.name}</Text><Text style={styles.lecture}>{item.lecture.title}</Text></View>
            <Ionicons name="chevron-back" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: COLORS.background, flex: 1 },
  header: { alignItems: "center", backgroundColor: COLORS.surface, flexDirection: "row-reverse", justifyContent: "space-between", padding: 18 },
  title: { color: COLORS.textDark, fontFamily: FONTS.extraBold, fontSize: 18 },
  content: { gap: 12, padding: 20 },
  card: { alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: 14, borderWidth: 1, flexDirection: "row-reverse", gap: 12, padding: 15 },
  icon: { alignItems: "center", backgroundColor: "#FEF3C7", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  text: { alignItems: "flex-end", flex: 1 },
  subject: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 12 },
  lecture: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 14, marginTop: 4, textAlign: "right" },
});
