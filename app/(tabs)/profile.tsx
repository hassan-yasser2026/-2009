import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../src/core/constants";

export default function ProfileScreen() {
  const menuItems = [
    { icon: "person-outline", label: "البيانات الشخصية" },
    { icon: "gift-outline", label: "نظام الإحالة" },
    { icon: "card-outline", label: "سجل المدفوعات" },
    { icon: "help-circle-outline", label: "المساعدة والدعم" },
    { icon: "settings-outline", label: "الإعدادات" },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.name}>حسن محمد أحمد علي</Text>
          <Text style={styles.grade}>أولى إعدادي</Text>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-back" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  name: {
    fontFamily: FONTS.extraBold,
    fontSize: 18,
    color: COLORS.textDark,
  },
  grade: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  menu: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textDark,
    flex: 1,
    textAlign: "right",
  },
});