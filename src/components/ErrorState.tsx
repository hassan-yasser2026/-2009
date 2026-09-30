import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS } from "../core/constants";

export function ErrorState({
  message = "تعذر الاتصال بالسيرفر، حاول تاني",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={48} color={COLORS.error} />
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.buttonText}>حاول تاني</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  text: { color: COLORS.textDark, fontFamily: FONTS.regular, fontSize: 14, textAlign: "center" },
  button: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 10, flexDirection: "row-reverse", gap: 8, paddingHorizontal: 18, paddingVertical: 10 },
  buttonText: { color: "#FFF", fontFamily: FONTS.bold },
});
