import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

type AppInputProps = TextInputProps & {
  error?: boolean;
};

export default function AppInput({
  error = false,
  style,
  ...props
}: AppInputProps) {
  return (
    <TextInput
      {...props}
      style={[styles.input, error && styles.error, style]}
      placeholderTextColor={Colors.textSecondary}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },

  error: {
    borderColor: Colors.danger,
  },
});
