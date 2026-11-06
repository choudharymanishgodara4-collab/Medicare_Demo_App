import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

type HomeHeaderProps = {
  name?: string;
  onCartPress?: () => void;
};

export default function HomeHeader({
  name = "Patient",
  onCartPress,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>Hello, {name} 👋</Text>

        <Text style={styles.subtitle}>Find the right care for you</Text>
      </View>

      {onCartPress && (
        <Pressable
          style={({ pressed }) => [
            styles.cartButton,
            pressed && styles.pressed,
          ]}
          onPress={onCartPress}
        >
          <Text style={styles.cartIcon}>🛒</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },

  textContainer: {
    flex: 1,
  },

  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  cartButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.round,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: Spacing.md,
  },

  cartIcon: {
    fontSize: 23,
  },

  pressed: {
    opacity: 0.7,
  },
});
