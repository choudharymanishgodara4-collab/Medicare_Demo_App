import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

type SpecialistCardProps = {
  name: string;
  icon: string;
  onPress?: () => void;
};

export default function SpecialistCard({
  name,
  icon,
  onPress,
}: SpecialistCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {icon}
        </Text>
      </View>

      <Text style={styles.name}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 85,
    alignItems: "center",
    marginRight: 14,
    flexShrink: 0,
  },

  iconContainer: {
    width: 62,
    height: 62,
    borderRadius: Radius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 28,
  },

  name: {
    marginTop: Spacing.sm,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.7,
  },
});