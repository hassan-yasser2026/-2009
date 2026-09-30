import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../core/constants";

export function EmptyState({
  message = "مفيش بيانات",
  icon = "file-tray-outline",
}: {
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={52} color={COLORS.textLight} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  text: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 14, textAlign: "center" },
});
