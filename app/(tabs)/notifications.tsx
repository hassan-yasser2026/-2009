import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../src/core/constants";

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <Ionicons name="notifications-off-outline" size={80} color={COLORS.textLight} />
        <Text style={styles.title}>مفيش إشعارات لحد دلوقتي</Text>
        <Text style={styles.subtitle}>
          لما يتم إضافة محاضرة جديدة، هيوصلك إشعار هنا
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textDark,
    marginTop: 20,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
  },
});