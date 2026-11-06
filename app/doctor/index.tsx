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

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { supabase } from "../../services/supabase";

type DashboardStats = {
  todayAppointments: number;
  pendingAppointments: number;
  completedConsultations: number;
  totalPatients: number;
};

type RecentAppointment = {
  id: string;
  appointment_date: string;
  status: string;
  reason: string | null;
  patient: {
    id: string;
    full_name: string | null;
  } | null;
};

export default function DoctorHome() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingAppointments: 0,
    completedConsultations: 0,
    totalPatients: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
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
      // Today's date range
      // ---------------------------------------------

      const today = new Date();

      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0,
      );

      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999,
      );

      // ---------------------------------------------
      // 1. Today's appointments
      // ---------------------------------------------

      const { data: todayData, error: todayError } =
        await supabase
          .from("appointments")
          .select("id")
          .eq("doctor_id", user.id)
          .gte(
            "appointment_date",
            startOfDay.toISOString(),
          )
          .lte(
            "appointment_date",
            endOfDay.toISOString(),
          );

      if (todayError) {
        throw new Error(todayError.message);
      }

      // ---------------------------------------------
      // 2. Pending appointments
      // ---------------------------------------------

      const { data: pendingData, error: pendingError } =
        await supabase
          .from("appointments")
          .select("id")
          .eq("doctor_id", user.id)
          .eq("status", "PENDING");

      if (pendingError) {
        throw new Error(pendingError.message);
      }

      // ---------------------------------------------
      // 3. Completed consultations
      // ---------------------------------------------

      const {
        data: completedData,
        error: completedError,
      } = await supabase
        .from("consultations")
        .select("id")
        .eq("doctor_id", user.id)
        .eq("status", "COMPLETED");

      if (completedError) {
        throw new Error(completedError.message);
      }

      // ---------------------------------------------
      // 4. Total unique patients
      // ---------------------------------------------

      const {
        data: patientData,
        error: patientError,
      } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("doctor_id", user.id);

      if (patientError) {
        throw new Error(patientError.message);
      }

      const uniquePatientIds = new Set(
        (patientData ?? []).map(
          (item) => item.patient_id,
        ),
      );

      // ---------------------------------------------
      // 5. Recent appointments
      // ---------------------------------------------

      const {
        data: recentData,
        error: recentError,
      } = await supabase
        .from("appointments")
        .select(
          `
            id,
            appointment_date,
            status,
            reason,
            patient:profiles!appointments_patient_id_fkey (
              id,
              full_name
            )
          `,
        )
        .eq("doctor_id", user.id)
        .order("appointment_date", {
          ascending: false,
        })
        .limit(2);

      if (recentError) {
        throw new Error(recentError.message);
      }

      const normalizedRecent = (
        recentData ?? []
      ).map((item) => {
        const patient = Array.isArray(item.patient)
          ? item.patient[0] ?? null
          : item.patient;

        return {
          id: item.id,
          appointment_date:
            item.appointment_date,
          status: item.status,
          reason: item.reason,
          patient,
        };
      }) as RecentAppointment[];

      // ---------------------------------------------
      // Update dashboard
      // ---------------------------------------------

      setStats({
        todayAppointments:
          todayData?.length ?? 0,

        pendingAppointments:
          pendingData?.length ?? 0,

        completedConsultations:
          completedData?.length ?? 0,

        totalPatients:
          uniquePatientIds.size,
      });

      setRecentAppointments(
        normalizedRecent,
      );
    } catch (err) {
      console.error(
        "Doctor dashboard error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load doctor dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reload dashboard whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, []),
  );

  // ---------------------------------------------
  // Loading
  // ---------------------------------------------

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading doctor dashboard...
        </Text>
      </View>
    );
  }

  // ---------------------------------------------
  // Error
  // ---------------------------------------------

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Unable to load dashboard
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => {
            void loadDashboard();
          }}
        >
          <Text style={styles.retryButtonText}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  // ---------------------------------------------
  // Dashboard
  // ---------------------------------------------

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* =========================================
          HEADER
      ========================================== */}

      <View style={styles.header}>
        <Text style={styles.greeting}>
          Doctor Dashboard
        </Text>

        <Text style={styles.subtitle}>
          Manage your practice and patients
        </Text>
      </View>

      {/* =========================================
          OVERVIEW
      ========================================== */}

      <Text style={styles.sectionTitle}>
        Overview
      </Text>

      <View style={styles.statsGrid}>

        {/* Today's Appointments */}

        <Pressable
          style={({ pressed }) => [
            styles.statCard,
            pressed && styles.statCardPressed,
          ]}
          android_ripple={{
            color: "#E9EEF9",
          }}
          onPress={() =>
            router.push(
              "/doctor/appointments",
            )
          }
        >
          <Text style={styles.statIcon}>
            📅
          </Text>

          <Text style={styles.statNumber}>
            {stats.todayAppointments}
          </Text>

          <Text style={styles.statLabel}>
            Today`s Appointments
          </Text>

          <Text style={styles.tapText}>
            View →
          </Text>
        </Pressable>

        {/* Pending Appointments */}

        <Pressable
          style={({ pressed }) => [
            styles.statCard,
            pressed && styles.statCardPressed,
          ]}
          android_ripple={{
            color: "#E9EEF9",
          }}
          onPress={() =>
            router.push(
              "/doctor/appointments",
            )
          }
        >
          <Text style={styles.statIcon}>
            ⏳
          </Text>

          <Text style={styles.statNumber}>
            {stats.pendingAppointments}
          </Text>

          <Text style={styles.statLabel}>
            Pending Appointments
          </Text>

          <Text style={styles.tapText}>
            View →
          </Text>
        </Pressable>

        {/* Completed Consultations */}

        <Pressable
          style={({ pressed }) => [
            styles.statCard,
            pressed && styles.statCardPressed,
          ]}
          android_ripple={{
            color: "#E9EEF9",
          }}
          onPress={() =>
            router.push(
              "/doctor/consultations",
            )
          }
        >
          <Text style={styles.statIcon}>
            ✅
          </Text>

          <Text style={styles.statNumber}>
            {stats.completedConsultations}
          </Text>

          <Text style={styles.statLabel}>
            Completed Consultations
          </Text>

          <Text style={styles.tapText}>
            View →
          </Text>
        </Pressable>

        {/* Total Patients */}

        <Pressable
          style={({ pressed }) => [
            styles.statCard,
            pressed && styles.statCardPressed,
          ]}
          android_ripple={{
            color: "#E9EEF9",
          }}
          onPress={() =>
            router.push(
              "/doctor/patients",
            )
          }
        >
          <Text style={styles.statIcon}>
            👥
          </Text>

          <Text style={styles.statNumber}>
            {stats.totalPatients}
          </Text>

          <Text style={styles.statLabel}>
            Total Patients
          </Text>

          <Text style={styles.tapText}>
            View →
          </Text>
        </Pressable>
      </View>

      {/* =========================================
          QUICK ACTIONS
      ========================================== */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        {/* Appointments */}

        <Pressable
          style={styles.actionCard}
          android_ripple={{
            color: "#E9EEF9",
          }}
          onPress={() =>
            router.push(
              "/doctor/appointments",
            )
          }
        >
          <View style={styles.iconBox}>
            <Text style={styles.icon}>
              📅
            </Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Appointments
            </Text>

            <Text style={styles.actionSubtitle}>
              View and manage appointment requests
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </Pressable>

        {/* Patients */}

        <Pressable
          style={styles.actionCard}
          android_ripple={{
            color: "#E9EEF9",
          }}
          onPress={() =>
            router.push(
              "/doctor/patients",
            )
          }
        >
          <View style={styles.iconBox}>
            <Text style={styles.icon}>
              👨‍⚕️
            </Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Patients
            </Text>

            <Text style={styles.actionSubtitle}>
              Browse your patient records
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </Pressable>

        {/* Consultations */}

        <Pressable
          style={styles.actionCard}
          android_ripple={{
            color: "#E9EEF9",
          }}
          onPress={() =>
            router.push(
              "/doctor/consultations",
            )
          }
        >
          <View style={styles.iconBox}>
            <Text style={styles.icon}>
              🩺
            </Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Consultations
            </Text>

            <Text style={styles.actionSubtitle}>
              Manage active and completed consultations
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </Pressable>

        {/* Profile */}

        <Pressable
          style={styles.actionCard}
          android_ripple={{
            color: "#E9EEF9",
          }}
          onPress={() =>
            router.push(
              "/doctor/profile",
            )
          }
        >
          <View style={styles.iconBox}>
            <Text style={styles.icon}>
              👤
            </Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              My Profile
            </Text>

            <Text style={styles.actionSubtitle}>
              View your doctor profile
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </Pressable>
      </View>

      {/* =========================================
    RECENT APPOINTMENTS
========================================= */}

<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>
      Recent Appointments
    </Text>

    <Pressable
      android_ripple={{
        color: "#E9EEF9",
      }}
      onPress={() =>
        router.push("/doctor/appointments")
      }
    >
      <Text style={styles.viewAll}>
        View All
      </Text>
    </Pressable>
  </View>

  {recentAppointments.length === 0 ? (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>
        No appointments yet
      </Text>

      <Text style={styles.emptyText}>
        Patient appointment requests will
        appear here.
      </Text>
    </View>
  ) : (
    recentAppointments.map((appointment) => (
      <Pressable
        key={appointment.id}
        style={({ pressed }) => [
          styles.appointmentCard,
          pressed &&
            styles.appointmentCardPressed,
        ]}
        android_ripple={{
          color: "#E9EEF9",
        }}
        onPress={() => {
          if (appointment.patient?.id) {
            router.push({
              pathname:
                "/doctor/patients/[id]",
              params: {
                id: appointment.patient.id,
              },
            });
          }
        }}
      >
        {/* Patient + Status */}

        <View style={styles.appointmentTopRow}>
          <Text style={styles.patientName}>
            {appointment.patient?.full_name ||
              "Patient"}
          </Text>

          <View
            style={[
              styles.statusBadge,

              appointment.status === "PENDING" &&
                styles.pendingBadge,

              appointment.status === "CONFIRMED" &&
                styles.confirmedBadge,

              appointment.status === "COMPLETED" &&
                styles.completedBadge,

              appointment.status === "CANCELLED" &&
                styles.cancelledBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {appointment.status}
            </Text>
          </View>
        </View>

        {/* Date */}

        <Text style={styles.appointmentDate}>
          {new Date(
            appointment.appointment_date,
          ).toLocaleString()}
        </Text>

        {/* Problem */}

        {appointment.reason && (
          <Text
            style={styles.reason}
            numberOfLines={1}
          >
            Problem: {appointment.reason}
          </Text>
        )}

        {/* Open Patient */}

        <Text style={styles.patientLink}>
          View Patient →
        </Text>
      </Pressable>
    ))
  )}
</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.huge,
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

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  errorText: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
  },

  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  header: {
    marginBottom: Spacing.xl,
  },

  greeting: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    marginTop: Spacing.xs,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  section: {
    marginTop: Spacing.xl,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },

  statCard: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    overflow: "hidden",
  },

  statCardPressed: {
    opacity: 0.85,
  },

  statIcon: {
    fontSize: 24,
  },

  statNumber: {
    marginTop: Spacing.sm,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
  },

  statLabel: {
    marginTop: Spacing.xs,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },

  tapText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    overflow: "hidden",
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  icon: {
    fontSize: 26,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  actionSubtitle: {
    marginTop: Spacing.xs,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },

  arrow: {
    fontSize: 28,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  viewAll: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },

  appointmentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },

  appointmentCardPressed: {
    opacity: 0.85,
  },

  appointmentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },

  patientName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  appointmentDate: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  reason: {
    marginTop: Spacing.sm,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },

  patientLink: {
    marginTop: Spacing.md,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.border,
  },

  pendingBadge: {
    backgroundColor: "#FFF4D6",
  },

  confirmedBadge: {
    backgroundColor: "#DFF6E5",
  },

  completedBadge: {
    backgroundColor: "#E0ECFF",
  },

  cancelledBadge: {
    backgroundColor: "#FFE3E3",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyText: {
    marginTop: Spacing.xs,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
});