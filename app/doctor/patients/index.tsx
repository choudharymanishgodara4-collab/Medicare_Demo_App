import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Avatar from "../../../components/common/Avatar";
import EmptyState from "../../../components/common/EmptyState";

import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";

import { supabase } from "../../../services/supabase";

type Patient = {
  id: string;
  full_name: string | null;
  mobile: string | null;
  city: string | null;
};

export default function DoctorPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      setError("");

      // ---------------------------------------------
      // Current logged-in doctor
      // ---------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error("Please login first.");
      }

      // ---------------------------------------------
      // Get patients who have appointments
      // with this doctor
      // ---------------------------------------------

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("doctor_id", user.id);

      if (appointmentError) {
        throw new Error(appointmentError.message);
      }

      // ---------------------------------------------
      // Unique patient IDs
      // ---------------------------------------------

      const patientIds = [
        ...new Set((appointmentData ?? []).map((item) => item.patient_id)),
      ];

      // No patients
      if (patientIds.length === 0) {
        setPatients([]);
        return;
      }

      // ---------------------------------------------
      // Get patient profiles
      // ---------------------------------------------

      const { data: patientData, error: patientError } = await supabase
        .from("profiles")
        .select("id, full_name, mobile, city")
        .in("id", patientIds)
        .eq("role", "patient")
        .order("full_name", {
          ascending: true,
        });

      if (patientError) {
        throw new Error(patientError.message);
      }

      setPatients((patientData ?? []) as Patient[]);
    } catch (err) {
      console.error("Failed to load doctor patients:", err);

      setError(err instanceof Error ? err.message : "Unable to load patients.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reload whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadPatients();
    }, []),
  );

  // ---------------------------------------------
  // Loading
  // ---------------------------------------------

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />

        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  // ---------------------------------------------
  // Error
  // ---------------------------------------------

  if (error) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Unable to load patients"
          message={error}
          actionText="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  // ---------------------------------------------
  // Patient List
  // ---------------------------------------------

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}

      <Text style={styles.title}>My Patients</Text>

      <Text style={styles.subtitle}>
        Patients who have appointments with you
      </Text>

      {/* Patient count */}

      <View style={styles.countCard}>
        <Text style={styles.countNumber}>{patients.length}</Text>

        <Text style={styles.countLabel}>
          {patients.length === 1 ? "Patient" : "Patients"}
        </Text>
      </View>

      {/* Empty */}

      {patients.length === 0 ? (
        <EmptyState
          title="No patients found"
          message="Patients who book an appointment with you will appear here."
        />
      ) : (
        <View style={styles.list}>
          {patients.map((patient) => (
            <Pressable
              key={patient.id}
              style={({ pressed }) => [
                styles.patientCard,
                pressed && styles.patientCardPressed,
              ]}
              android_ripple={{
                color: "#E9EEF9",
              }}
              onPress={() =>
                router.push({
                  pathname: "/doctor/patients/[id]",
                  params: {
                    id: patient.id,
                  },
                })
              }
            >
              {/* Avatar */}

              <Avatar name={patient.full_name ?? "Patient"} size={64} />

              {/* Patient information */}

              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {patient.full_name || "Patient"}
                </Text>

                <Text style={styles.city}>
                  📍 {patient.city || "City not added"}
                </Text>

                <Text style={styles.mobile}>
                  📱 {patient.mobile || "Mobile not added"}
                </Text>

                <Text style={styles.viewText}>View Patient →</Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
    backgroundColor: Colors.background,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },

  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  countCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  countNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
  },

  countLabel: {
    marginLeft: Spacing.sm,
    fontSize: 15,
    color: Colors.textSecondary,
  },

  list: {
    marginTop: Spacing.xs,
  },

  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },

  patientCardPressed: {
    opacity: 0.85,
  },

  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  city: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  mobile: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  viewText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  arrow: {
    marginLeft: Spacing.sm,
    fontSize: 28,
    color: Colors.textSecondary,
  },
});
