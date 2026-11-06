import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
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

import Avatar from "../../../components/common/Avatar";
import EmptyState from "../../../components/common/EmptyState";

import { supabase } from "../../../services/supabase";

import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";

type Patient = {
  id: string;
  full_name: string | null;
  mobile: string | null;
  date_of_birth: string | null;
  gender: string | null;
  city: string | null;
  avatar_url: string | null;
};

type Appointment = {
  id: string;
  appointment_date: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  reason: string | null;
};

type Consultation = {
  id: string;
  appointment_id: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  started_at: string;
  ended_at: string | null;
};

export default function PatientDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  const loadPatientDetails = useCallback(async () => {
    if (!id) {
      setError("Patient ID is missing.");
      setIsLoading(false);
      return;
    }

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

      // ---------------------------------
      // Patient profile
      // ---------------------------------
      const {
        data: patientData,
        error: patientError,
      } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          mobile,
          date_of_birth,
          gender,
          city,
          avatar_url
          `,
        )
        .eq("id", id)
        .eq("role", "patient")
        .single();

      if (patientError) {
        throw new Error(patientError.message);
      }

      // ---------------------------------
      // Appointment history
      // ---------------------------------
      const {
        data: appointmentData,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .select("id, appointment_date, status, reason")
        .eq("doctor_id", user.id)
        .eq("patient_id", id)
        .order("appointment_date", { ascending: false });

      if (appointmentError) {
        throw new Error(appointmentError.message);
      }

      // ---------------------------------
      // Consultation history
      // ---------------------------------
      const {
        data: consultationData,
        error: consultationError,
      } = await supabase
        .from("consultations")
        .select(
          `
          id,
          appointment_id,
          status,
          notes,
          started_at,
          ended_at
          `,
        )
        .eq("doctor_id", user.id)
        .eq("patient_id", id)
        .order("started_at", { ascending: false });

      if (consultationError) {
        throw new Error(consultationError.message);
      }

      setPatient(patientData);
      setAppointments((appointmentData ?? []) as Appointment[]);
      setConsultations((consultationData ?? []) as Consultation[]);
    } catch (err) {
      console.error("Patient detail error:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load patient.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadPatientDetails();
    }, [loadPatientDetails]),
  );

  // ---------------------------------
  // Start consultation
  // ---------------------------------
  const handleStartConsultation = async () => {
    if (!patient) {
      return;
    }

    try {
      setIsStarting(true);

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

      // Get newest confirmed appointment
      const {
        data: appointment,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .select("id, appointment_date, status")
        .eq("doctor_id", user.id)
        .eq("patient_id", patient.id)
        .eq("status", "CONFIRMED")
        .order("appointment_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appointmentError) {
        throw new Error(appointmentError.message);
      }

      if (!appointment) {
        Alert.alert(
          "No Confirmed Appointment",
          "This patient does not have a new confirmed appointment. The patient needs to book another appointment before starting a new consultation.",
        );
        return;
      }

      // Check if this appointment already has consultation
      const {
        data: existingConsultation,
        error: consultationError,
      } = await supabase
        .from("consultations")
        .select("id, status")
        .eq("appointment_id", appointment.id)
        .maybeSingle();

      if (consultationError) {
        throw new Error(consultationError.message);
      }

      if (existingConsultation) {
        if (existingConsultation.status === "ACTIVE") {
          Alert.alert(
            "Consultation Already Active",
            `${patient.full_name ?? "This patient"} already has an active consultation.`,
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

        if (existingConsultation.status === "COMPLETED") {
          Alert.alert(
            "Consultation Already Completed",
            "This appointment has already been used. A new appointment is required for another consultation.",
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

        if (existingConsultation.status === "CANCELLED") {
          Alert.alert(
            "Consultation Cancelled",
            "This appointment's consultation was cancelled. A new appointment is required.",
          );
          return;
        }
      }

      // Create consultation
      const {
        data: newConsultation,
        error: insertError,
      } = await supabase
        .from("consultations")
        .insert({
          appointment_id: appointment.id,
          patient_id: patient.id,
          doctor_id: user.id,
          status: "ACTIVE",
          notes: null,
        })
        .select("id, status")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (!newConsultation) {
        throw new Error("Consultation could not be created.");
      }

      Alert.alert(
        "Consultation Started",
        `Consultation with ${patient.full_name ?? "patient"} has started.`,
        [
          {
            text: "Open Consultation",
            onPress: () => {
              router.push("/doctor/consultations");
            },
          },
        ],
      );

      await loadPatientDetails();
    } catch (err) {
      console.error("Start consultation error:", err);

      Alert.alert(
        "Unable to Start Consultation",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  // ---------------------------------
  // Open consultation screen
  // ---------------------------------
  const handleOpenConsultations = () => {
    router.push("/doctor/consultations");
  };

  // ---------------------------------
  // Format date
  // ---------------------------------
  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (
    status: Appointment["status"] | Consultation["status"],
  ) => {
    switch (status) {
      case "CONFIRMED":
        return styles.confirmedStatus;

      case "COMPLETED":
        return styles.completedStatus;

      case "CANCELLED":
        return styles.cancelledStatus;

      case "ACTIVE":
        return styles.activeStatus;

      default:
        return styles.pendingStatus;
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Patient Details" }} />

        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading patient...</Text>
        </View>
      </>
    );
  }

  if (error || !patient) {
    return (
      <>
        <Stack.Screen options={{ title: "Patient Details" }} />

        <View style={styles.center}>
          <EmptyState
            title="Patient not found"
            message={error || "The patient profile is not available."}
            actionText="Go Back"
            onAction={() => router.back()}
          />
        </View>
      </>
    );
  }

  const patientName = patient.full_name ?? "Patient";

  const activeConsultation = consultations.find(
    (consultation) => consultation.status === "ACTIVE",
  );

  const latestAppointment = appointments[0];

  return (
    <>
      <Stack.Screen options={{ title: "Patient Details" }} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------
            Header
        --------------------------------- */}
        <View style={styles.header}>
          <Avatar name={patientName} size={110} />

          <Text style={styles.name}>{patientName}</Text>

          <Text style={styles.role}>Patient</Text>
        </View>

        {/* ---------------------------------
            Personal Information
        --------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>

          <InfoRow
            label="Mobile"
            value={patient.mobile || "Not added"}
          />

          <InfoRow
            label="Date of Birth"
            value={patient.date_of_birth || "Not added"}
          />

          <InfoRow
            label="Gender"
            value={patient.gender || "Not added"}
          />

          <InfoRow
            label="City"
            value={patient.city || "Not added"}
          />
        </View>

        {/* ---------------------------------
            Quick Summary
        --------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Summary</Text>

          <View style={styles.summaryGrid}>
            <SummaryBox
              value={String(appointments.length)}
              label="Appointments"
            />

            <SummaryBox
              value={String(consultations.length)}
              label="Consultations"
            />

            <SummaryBox
              value={activeConsultation ? "1" : "0"}
              label="Active"
            />
          </View>
        </View>

        {/* ---------------------------------
            Latest Appointment
        --------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Latest Appointment</Text>

          {!latestAppointment ? (
            <Text style={styles.emptyText}>
              No appointments found for this patient.
            </Text>
          ) : (
            <>
              <InfoRow
                label="Appointment Date"
                value={formatDate(latestAppointment.appointment_date)}
              />

              <View style={styles.statusRow}>
                <Text style={styles.label}>Status</Text>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(latestAppointment.status),
                  ]}
                >
                  <Text style={styles.statusText}>
                    {latestAppointment.status}
                  </Text>
                </View>
              </View>

              <InfoRow
                label="Patient Problem"
                value={latestAppointment.reason || "No problem added"}
              />
            </>
          )}
        </View>

        {/* ---------------------------------
            Doctor Actions
        --------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Doctor Actions</Text>

          <Pressable
            style={[
              styles.actionButton,
              isStarting && styles.disabledButton,
            ]}
            disabled={isStarting}
            onPress={() => {
              void handleStartConsultation();
            }}
          >
            <Text style={styles.actionButtonText}>
              {isStarting ? "Starting..." : "Start Consultation"}
            </Text>
          </Pressable>

          {activeConsultation && (
            <Pressable
              style={styles.secondaryButton}
              onPress={handleOpenConsultations}
            >
              <Text style={styles.secondaryButtonText}>
                Open Active Consultation
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.secondaryButton, styles.lastButton]}
            onPress={handleOpenConsultations}
          >
            <Text style={styles.secondaryButtonText}>
              Consultation History
            </Text>
          </Pressable>
        </View>

        {/* ---------------------------------
            Consultation History
        --------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consultation History</Text>

          {consultations.length === 0 ? (
            <Text style={styles.emptyText}>
              No consultations found for this patient.
            </Text>
          ) : (
            consultations.map((consultation) => (
              <Pressable
                key={consultation.id}
                style={styles.historyCard}
                onPress={handleOpenConsultations}
              >
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>
                    Consultation
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      getStatusStyle(consultation.status),
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {consultation.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.historyDate}>
                  Started: {formatDate(consultation.started_at)}
                </Text>

                {consultation.ended_at && (
                  <Text style={styles.historyDate}>
                    Ended: {formatDate(consultation.ended_at)}
                  </Text>
                )}

                <Text style={styles.historyNotes}>
                  {consultation.notes || "No consultation notes added."}
                </Text>

                <Text style={styles.viewText}>
                  Open Consultation →
                </Text>
              </Pressable>
            ))
          )}
        </View>

        {/* ---------------------------------
            Appointment History
        --------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment History</Text>

          {appointments.length === 0 ? (
            <Text style={styles.emptyText}>
              No appointment history found.
            </Text>
          ) : (
            appointments.map((appointment) => (
              <View
                key={appointment.id}
                style={styles.historyCard}
              >
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>
                    Appointment
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      getStatusStyle(appointment.status),
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {appointment.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.historyDate}>
                  {formatDate(appointment.appointment_date)}
                </Text>

                <Text style={styles.historyNotes}>
                  Problem:{" "}
                  {appointment.reason || "No problem added"}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* ---------------------------------
            Info
        --------------------------------- */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Need another consultation?
          </Text>

          <Text style={styles.infoText}>
            The same patient can consult the same doctor multiple times.
            Every new consultation must use a new appointment.
          </Text>
        </View>

        {/* ---------------------------------
            Back
        --------------------------------- */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back to Patients
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

// ============================================
// Info Row
// ============================================

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>

      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

// ============================================
// Summary Box
// ============================================

type SummaryBoxProps = {
  value: string;
  label: string;
};

function SummaryBox({ value, label }: SummaryBoxProps) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ============================================
// Styles
// ============================================

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

  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },

  name: {
    marginTop: Spacing.md,
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  role: {
    marginTop: Spacing.xs,
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600",
  },

  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  infoRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  summaryGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  summaryBox: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.primary,
  },

  summaryLabel: {
    marginTop: Spacing.xs,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  statusRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.text,
  },

  pendingStatus: {
    backgroundColor: "#FFF3CD",
  },

  confirmedStatus: {
    backgroundColor: "#DFF6E4",
  },

  completedStatus: {
    backgroundColor: "#DDEBFF",
  },

  cancelledStatus: {
    backgroundColor: "#FFE1E1",
  },

  activeStatus: {
    backgroundColor: "#E4E0FF",
  },

  actionButton: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },

  disabledButton: {
    opacity: 0.6,
  },

  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },

  lastButton: {
    marginBottom: 0,
  },

  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },

  historyCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  historyCardLast: {
    marginBottom: 0,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },

  historyTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  historyDate: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  historyNotes: {
    marginTop: Spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },

  viewText: {
    marginTop: Spacing.sm,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  infoCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  infoText: {
    marginTop: Spacing.sm,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  backButton: {
    marginTop: Spacing.sm,
    alignItems: "center",
  },

  backText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});