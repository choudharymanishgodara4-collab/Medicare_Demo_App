import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

import Avatar from "../common/Avatar";

import { Doctor } from "../../data/doctors";

type DoctorBannerProps = {
  doctor: Doctor;
  onPress?: () => void;
};

export default function DoctorBanner({ doctor, onPress }: DoctorBannerProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.heading}>Best Doctors in Ganganagar</Text>

      <Text style={styles.subtitle}>Find trusted specialists near you</Text>

      <View style={styles.doctorRow}>
        <Avatar name={doctor.name} size={58} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {doctor.name}
          </Text>

          <Text style={styles.specialization}>{doctor.specialization}</Text>

          <Text style={styles.rating}>
            ⭐ {doctor.rating} • {doctor.experience} years
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
  },

  pressed: {
    opacity: 0.9,
  },

  heading: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700",
  },

  subtitle: {
    color: Colors.primaryLight,
    fontSize: 14,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },

  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  name: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
  },

  specialization: {
    color: Colors.primaryLight,
    fontSize: 14,
    marginTop: Spacing.xs,
  },

  rating: {
    color: Colors.white,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
});
