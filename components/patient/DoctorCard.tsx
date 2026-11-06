import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

import Avatar from "../common/Avatar";

import { Doctor } from "../../data/doctors";

type DoctorCardProps = {
  doctor: Doctor;
  onPress?: () => void;
};

export default function DoctorCard({ doctor, onPress }: DoctorCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Avatar name={doctor.name} size={64} />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {doctor.name}
        </Text>

        <Text style={styles.specialization}>{doctor.specialization}</Text>

        <Text style={styles.location}>📍 {doctor.city}</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.rating}>⭐ {doctor.rating}</Text>

          <Text style={styles.experience}>
            {doctor.experience} years experience
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  pressed: {
    opacity: 0.8,
  },

  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  specialization: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },

  location: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },

  rating: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  experience: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
  },
});
