import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { supabase } from "../../services/supabase";

type Patient = {
  id: string;
  full_name: string;
  mobile: string | null;
  city: string | null;
};

type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED";
  reason: string | null;
  created_at: string;
  patient: Patient | null;
};

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  // ---------------------------------
  // Load appointments
  // ---------------------------------
  const loadAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

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

      const {
        data,
        error: queryError,
      } = await supabase
        .from("appointments")
        .select(`
          id,
          patient_id,
          doctor_id,
          appointment_date,
          status,
          reason,
          created_at,
          patient:profiles!appointments_patient_id_fkey (
            id,
            full_name,
            mobile,
            city
          )
        `)
        .eq("doctor_id", user.id)
        .order("appointment_date", {
          ascending: false,
        });

      if (queryError) {
        throw new Error(queryError.message);
      }

      const normalized = (data ?? []).map((item) => ({
        ...item,
        patient: Array.isArray(item.patient)
          ? item.patient[0] ?? null
          : item.patient,
      })) as Appointment[];

      setAppointments(normalized);
    } catch (err) {
      console.error(
        "Doctor appointments load error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load appointments.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------
  // Refresh whenever screen gets focus
  // ---------------------------------
  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
    }, [loadAppointments]),
  );

  // ---------------------------------
  // Update appointment status
  // ---------------------------------
  const updateAppointmentStatus = async (
    appointment: Appointment,
    status: "CONFIRMED" | "CANCELLED",
  ) => {
    try {
      setActionId(appointment.id);

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

      const { error } = await supabase
        .from("appointments")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointment.id)
        .eq("doctor_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );

      Alert.alert(
        status === "CONFIRMED"
          ? "Appointment Confirmed"
          : "Appointment Cancelled",
        status === "CONFIRMED"
          ? "Appointment has been confirmed."
          : "Appointment has been cancelled.",
      );
    } catch (err) {
      console.error(
        "Appointment status update error:",
        err,
      );

      Alert.alert(
        "Update Failed",
        err instanceof Error
          ? err.message
          : "Unable to update appointment.",
      );
    } finally {
      setActionId(null);
    }
  };

  // ---------------------------------
  // Start consultation
  // ---------------------------------
  const startConsultation = async (
    appointment: Appointment,
  ) => {
    try {
      if (appointment.status !== "CONFIRMED") {
        Alert.alert(
          "Appointment Not Confirmed",
          "Please confirm the appointment before starting the consultation.",
        );
        return;
      }

      if (!appointment.patient?.id) {
        Alert.alert(
          "Patient Missing",
          "Patient details were not found.",
        );
        return;
      }

      setActionId(appointment.id);

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

      // Check whether this appointment already has
      // a consultation.
      const {
        data: existing,
        error: existingError,
      } = await supabase
        .from("consultations")
        .select("id, status")
        .eq("appointment_id", appointment.id)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      // ---------------------------------
      // Existing ACTIVE consultation
      // ---------------------------------
      if (existing) {
        if (existing.status === "ACTIVE") {
          Alert.alert(
            "Consultation Already Active",
            "This appointment already has an active consultation.",
            [
              {
                text: "Open Consultations",
                onPress: () => {
                  router.push("/doctor/consultations");
                },
              },
              {
                text: "Cancel",
                style: "cancel",
              },
            ],
          );

          return;
        }

        // ---------------------------------
        // Existing COMPLETED consultation
        // ---------------------------------
        if (existing.status === "COMPLETED") {
          Alert.alert(
            "Consultation Completed",
            "This appointment's consultation is already completed. Create a new appointment for another consultation.",
            [
              {
                text: "View History",
                onPress: () => {
                  router.push("/doctor/consultations");
                },
              },
              {
                text: "OK",
              },
            ],
          );

          return;
        }

        // ---------------------------------
        // Existing CANCELLED consultation
        // ---------------------------------
        if (existing.status === "CANCELLED") {
          Alert.alert(
            "Consultation Cancelled",
            "This consultation was cancelled. A new appointment is required.",
          );

          return;
        }
      }

      // ---------------------------------
      // Create new consultation
      // ---------------------------------
      const {
        data,
        error: insertError,
      } = await supabase
        .from("consultations")
        .insert({
          appointment_id: appointment.id,
          patient_id: appointment.patient.id,
          doctor_id: user.id,
          status: "ACTIVE",
          notes: null,
        })
        .select("id, status")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (!data) {
        throw new Error(
          "Consultation was not created.",
        );
      }

      Alert.alert(
        "Consultation Started",
        `Consultation with ${
          appointment.patient.full_name || "Patient"
        } has started.`,
        [
          {
            text: "Open Consultations",
            onPress: () => {
              router.push("/doctor/consultations");
            },
          },
        ],
      );
    } catch (err) {
      console.error(
        "Start consultation error:",
        err,
      );

      Alert.alert(
        "Unable to Start Consultation",
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setActionId(null);
    }
  };

  // ---------------------------------
  // Loading
  // ---------------------------------
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading appointments...
        </Text>
      </View>
    );
  }

  // ---------------------------------
  // Error
  // ---------------------------------
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => {
            void loadAppointments();
          }}
        >
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  // ---------------------------------
  // UI
  // ---------------------------------
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Appointments
      </Text>

      <Text style={styles.subtitle}>
        Manage patient appointment requests
      </Text>

      {appointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No Appointments
          </Text>

          <Text style={styles.emptyText}>
            Patient appointment requests will
            appear here.
          </Text>
        </View>
      ) : (
        appointments.map((appointment) => {
          const patient = appointment.patient;

          const isBusy =
            actionId === appointment.id;

          return (
            <View
              key={appointment.id}
              style={styles.card}
            >
              {/* ---------------------------------
                  Top row
              --------------------------------- */}
              <View style={styles.topRow}>
                <View style={styles.patientBlock}>
                  <Text style={styles.patientName}>
                    {patient?.full_name ||
                      "Patient"}
                  </Text>

                  <Text style={styles.date}>
                    {new Date(
                      appointment.appointment_date,
                    ).toLocaleString("en-IN")}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    appointment.status ===
                      "PENDING" &&
                      styles.pendingBadge,
                    appointment.status ===
                      "CONFIRMED" &&
                      styles.confirmedBadge,
                    appointment.status ===
                      "COMPLETED" &&
                      styles.completedBadge,
                    appointment.status ===
                      "CANCELLED" &&
                      styles.cancelledBadge,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {appointment.status}
                  </Text>
                </View>
              </View>

              {/* ---------------------------------
                  Patient contact
              --------------------------------- */}
              <Text style={styles.info}>
                📱{" "}
                {patient?.mobile ||
                  "Mobile not added"}
              </Text>

              <Text style={styles.info}>
                📍{" "}
                {patient?.city ||
                  "City not added"}
              </Text>

              {/* ---------------------------------
                  Patient Problem
              --------------------------------- */}
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>
                  🩺 Patient Problem
                </Text>

                <Text style={styles.reasonText}>
                  {appointment.reason?.trim() ||
                    "No reason provided."}
                </Text>
              </View>

              {/* ---------------------------------
                  Patient Profile
              --------------------------------- */}
              <Pressable
                onPress={() => {
                  if (patient?.id) {
                    router.push({
                      pathname:
                        "/doctor/patients/[id]",
                      params: {
                        id: patient.id,
                      },
                    });
                  }
                }}
              >
                <Text style={styles.patientLink}>
                  View Patient Profile →
                </Text>
              </Pressable>

              {/* ---------------------------------
                  Pending actions
              --------------------------------- */}
              {appointment.status ===
                "PENDING" && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.confirmButton}
                    disabled={isBusy}
                    onPress={() => {
                      void updateAppointmentStatus(
                        appointment,
                        "CONFIRMED",
                      );
                    }}
                  >
                    <Text
                      style={
                        styles.actionButtonText
                      }
                    >
                      {isBusy
                        ? "Updating..."
                        : "Confirm"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.cancelButton}
                    disabled={isBusy}
                    onPress={() => {
                      Alert.alert(
                        "Cancel Appointment",
                        "Are you sure you want to cancel this appointment?",
                        [
                          {
                            text: "No",
                            style: "cancel",
                          },
                          {
                            text: "Yes, Cancel",
                            style: "destructive",
                            onPress: () => {
                              void updateAppointmentStatus(
                                appointment,
                                "CANCELLED",
                              );
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Text
                      style={
                        styles.cancelButtonText
                      }
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* ---------------------------------
                  Confirmed action
              --------------------------------- */}
              {appointment.status ===
                "CONFIRMED" && (
                <Pressable
                  style={styles.startButton}
                  disabled={isBusy}
                  onPress={() => {
                    void startConsultation(
                      appointment,
                    );
                  }}
                >
                  <Text
                    style={
                      styles.startButtonText
                    }
                  >
                    {isBusy
                      ? "Starting..."
                      : "Start Consultation"}
                  </Text>
                </Pressable>
              )}

              {/* ---------------------------------
                  Completed
              --------------------------------- */}
              {appointment.status ===
                "COMPLETED" && (
                <View
                  style={styles.completedInfo}
                >
                  <Text
                    style={
                      styles.completedInfoText
                    }
                  >
                    ✓ Consultation completed
                  </Text>
                </View>
              )}

              {/* ---------------------------------
                  Cancelled
              --------------------------------- */}
              {appointment.status ===
                "CANCELLED" && (
                <View
                  style={styles.cancelledInfo}
                >
                  <Text
                    style={
                      styles.cancelledInfoText
                    }
                  >
                    Appointment cancelled
                  </Text>
                </View>
              )}
            </View>
          );
        })
      )}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ← Back to Dashboard
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    color: Colors.textSecondary,
  },

  errorText: {
    color: Colors.danger,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },

  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },

  retryText: {
    color: Colors.white,
    fontWeight: "700",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
  },

  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  patientBlock: {
    flex: 1,
    marginRight: Spacing.md,
  },

  patientName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  date: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  statusBadge: {
    borderRadius: Radius.round,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },

  pendingBadge: {
    backgroundColor: "#FFF3CD",
  },

  confirmedBadge: {
    backgroundColor: Colors.primaryLight,
  },

  completedBadge: {
    backgroundColor: "#E8F5E9",
  },

  cancelledBadge: {
    backgroundColor: "#FEECEC",
  },

  statusText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  info: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  reasonBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#F2D28B",
    backgroundColor: "#FFF8E8",
  },

  reasonLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 5,
  },

  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },

  patientLink: {
    marginTop: Spacing.md,
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },

  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  cancelButtonText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: "700",
  },

  startButton: {
    height: 52,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  startButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  completedInfo: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: "#E8F5E9",
  },

  completedInfoText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600",
  },

  cancelledInfo: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: "#FEECEC",
  },

  cancelledInfoText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyText: {
    marginTop: Spacing.sm,
    textAlign: "center",
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  backButton: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },

  backText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});