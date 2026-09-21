import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { COLORS, FONTS } from "../core/constants";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={COLORS.textLight}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.surface,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
  },
});