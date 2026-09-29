import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { announcementService } from "../../src/services/announcement.service";
import { COLORS, FONTS } from "../../src/core/constants";

export default function AnnouncementsScreen() {
  const query = useQuery({
    queryKey: ["announcements"],
    queryFn: announcementService.list,
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            colors={[COLORS.primary]}
          />
        }
      >
        <Text style={styles.heading}>الإعلانات</Text>
        {query.isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : query.isError ? (
          <Text style={styles.empty}>تعذر تحميل الإعلانات. اسحب الشاشة للتحديث.</Text>
        ) : query.data?.length ? (
          query.data.map((announcement) => (
            <View key={announcement.id} style={styles.card}>
              <View style={styles.titleRow}>
                <Ionicons name="megaphone-outline" size={22} color={COLORS.primary} />
                <Text style={styles.title}>{announcement.title}</Text>
              </View>
              <Text style={styles.body}>{announcement.body}</Text>
              <Text style={styles.date}>
                {new Date(announcement.createdAt).toLocaleDateString("ar-EG")}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="megaphone-outline" size={54} color={COLORS.textLight} />
            <Text style={styles.empty}>لا توجد إعلانات حالية</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 14 },
  heading: { fontFamily: FONTS.extraBold, fontSize: 23, color: COLORS.textDark, textAlign: "right", marginBottom: 6 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  titleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: FONTS.bold, fontSize: 17, color: COLORS.textDark, textAlign: "right" },
  body: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textDark, textAlign: "right", lineHeight: 23, marginTop: 12 },
  date: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, textAlign: "left", marginTop: 12 },
  emptyBox: { alignItems: "center", gap: 12, marginTop: 90 },
  empty: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: "center", marginTop: 20 },
});
