import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

import { Medicine } from "../../data/medicines";

type MedicineCardProps = {
  medicine: Medicine;
  onPress?: () => void;
};

export default function MedicineCard({
  medicine,
  onPress,
}: MedicineCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>💊</Text>
      </View>

      <View style={styles.content}>
        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {medicine.name}
        </Text>

        <Text style={styles.category}>
          {medicine.category}
        </Text>

        <Text style={styles.price}>
          ₹{medicine.price}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  pressed: {
    opacity: 0.8,
  },

  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  icon: {
    fontSize: 30,
  },

  content: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  category: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  price: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: Spacing.sm,
  },
});