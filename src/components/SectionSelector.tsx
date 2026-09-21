import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../core/constants";
import type { SectionId } from "../core/constants";

export interface Section {
  id: Exclude<SectionId, null>;
  name: string;
}

interface SectionSelectorProps {
  sections: readonly Section[];
  selectedId: string | null;
  onSelect: (id: Exclude<SectionId, null>, name: string) => void;
}

const SECTION_ICONS: Record<string, any> = {
  scientific_science: "flask-outline",
  scientific_math: "calculator-outline",
  literary: "book-outline",
};

export function SectionSelector({
  sections,
  selectedId,
  onSelect,
}: SectionSelectorProps) {
  return (
    <View style={styles.wrapper}>
      {sections.map((section) => {
        const isSelected = selectedId === section.id;
        return (
          <TouchableOpacity
            key={section.id}
            onPress={() => onSelect(section.id, section.name)}
            activeOpacity={0.8}
            style={[
              styles.item,
              isSelected ? styles.itemActive : styles.itemInactive,
            ]}
          >
            <View
              style={[
                styles.iconWrapper,
                isSelected ? styles.iconWrapperActive : styles.iconWrapperInactive,
              ]}
            >
              <Ionicons
                name={SECTION_ICONS[section.id] ?? "school-outline"}
                size={24}
                color={isSelected ? "#FFF" : COLORS.primary}
              />
            </View>
            <Text
              style={[
                styles.text,
                isSelected ? styles.textActive : styles.textInactive,
              ]}
            >
              {section.name}
            </Text>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  item: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  itemActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF6FF",
  },
  itemInactive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    backgroundColor: COLORS.primary,
  },
  iconWrapperInactive: {
    backgroundColor: "#EFF6FF",
  },
  text: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    flex: 1,
    textAlign: "right",
  },
  textActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  textInactive: {
    color: COLORS.textDark,
  },
});