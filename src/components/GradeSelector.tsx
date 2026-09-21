import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, GRADES } from "../core/constants";

interface GradeSelectorProps {
  selectedId: number | null;
  onSelect: (gradeId: number, gradeName: string) => void;
}

export function GradeSelector({ selectedId, onSelect }: GradeSelectorProps) {
  return (
    <View style={styles.wrapper}>
      {GRADES.map((grade) => {
        const isSelected = selectedId === grade.id;
        return (
          <TouchableOpacity
            key={grade.id}
            onPress={() => onSelect(grade.id, grade.name)}
            activeOpacity={0.8}
            style={[
              styles.item,
              isSelected ? styles.itemActive : styles.itemInactive,
            ]}
          >
            <View
              style={[
                styles.circle,
                isSelected ? styles.circleActive : styles.circleInactive,
              ]}
            >
              {isSelected ? <View style={styles.circleInner} /> : null}
            </View>
            <Text
              style={[
                styles.text,
                isSelected ? styles.textActive : styles.textInactive,
              ]}
            >
              {grade.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  item: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
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
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  circleActive: {
    borderColor: COLORS.primary,
  },
  circleInactive: {
    borderColor: "#CBD5E1",
  },
  circleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  text: {
    fontFamily: FONTS.regular,
    fontSize: 15,
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