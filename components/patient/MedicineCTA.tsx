import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

type MedicineCTAProps = {
  onPress?: () => void;
};

export default function MedicineCTA({ onPress }: MedicineCTAProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.icon}>💊</Text>

      <View style={styles.content}>
        <Text style={styles.title}>Find Your Medicine</Text>

        <Text style={styles.subtitle}>Search and order medicines</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },

  pressed: {
    opacity: 0.8,
  },

  icon: {
    fontSize: 34,
    marginRight: Spacing.md,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
