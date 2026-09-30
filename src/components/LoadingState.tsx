import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../core/constants";

export function LoadingState({ message = "جاري التحميل..." }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  text: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 14 },
});
