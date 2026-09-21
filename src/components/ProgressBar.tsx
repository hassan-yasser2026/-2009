import { View, StyleSheet } from "react-native";
import { COLORS } from "../core/constants";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <View style={styles.wrapper}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            index < currentStep ? styles.barActive : styles.barInactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  bar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  barActive: {
    backgroundColor: COLORS.primary,
  },
  barInactive: {
    backgroundColor: COLORS.border,
  },
});