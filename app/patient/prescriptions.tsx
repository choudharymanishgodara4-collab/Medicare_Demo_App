import { router } from "expo-router";
import { useEffect, useState } from "react";
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

type PrescriptionItem = {
  id: string;
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
};

type Prescription = {
  id: string;
  consultation_id: string;
  doctor_id: string;
  notes: string | null;
  issued_at: string;
  doctor: {
    id: string;
    full_name: string;
  } | null;
  items: PrescriptionItem[];
};

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [openId, setOpenId] = useState<string | null>(null);

  const loadPrescriptions = async () => {
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

      const { data, error: prescriptionError } = await supabase
        .from("prescriptions")
        .select(
          `
          id,
          consultation_id,
          doctor_id,
          notes,
          issued_at,

          doctor:profiles!prescriptions_doctor_id_fkey (
            id,
            full_name
          ),

          items:prescription_items (
            id,
            medicine_id,
            medicine_name,
            dosage,
            frequency,
            duration,
            instructions
          )
        `,
        )
        .eq("patient_id", user.id)
        .order("issued_at", {
          ascending: false,
        });

      if (prescriptionError) {
        throw new Error(prescriptionError.message);
      }

      const normalized = (data ?? []).map((item) => ({
        ...item,

        doctor: Array.isArray(item.doctor)
          ? (item.doctor[0] ?? null)
          : item.doctor,

        items: Array.isArray(item.items) ? item.items : [],
      })) as Prescription[];

      setPrescriptions(normalized);
    } catch (err) {
      console.error("Prescriptions load error:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load prescriptions.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPrescriptions();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />

        <Text style={styles.loadingText}>Loading prescriptions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => {
            void loadPrescriptions();
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>My Prescriptions</Text>

      <Text style={styles.subtitle}>
        View prescriptions issued by your doctors
      </Text>

      {prescriptions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Prescriptions</Text>

          <Text style={styles.emptyText}>
            Your doctor prescriptions will appear here after they are issued.
          </Text>
        </View>
      ) : (
        prescriptions.map((prescription) => {
          const isOpen = openId === prescription.id;

          return (
            <View key={prescription.id} style={styles.card}>
              <Pressable
                onPress={() => {
                  setOpenId(isOpen ? null : prescription.id);
                }}
              >
                <View style={styles.headerRow}>
                  <View style={styles.headerContent}>
                    <Text style={styles.doctorName}>
                      {prescription.doctor?.full_name || "Doctor"}
                    </Text>

                    <Text style={styles.date}>
                      Issued:{" "}
                      {new Date(prescription.issued_at).toLocaleString()}
                    </Text>
                  </View>

                  <Text style={styles.arrow}>{isOpen ? "▲" : "▼"}</Text>
                </View>
              </Pressable>

              {isOpen && (
                <View style={styles.details}>
                  <View style={styles.separator} />

                  <Text style={styles.sectionTitle}>Medicines</Text>

                  {prescription.items.length === 0 ? (
                    <View style={styles.noMedicineBox}>
                      <Text style={styles.noMedicineText}>
                        No medicines added to this prescription.
                      </Text>
                    </View>
                  ) : (
                    prescription.items.map((medicine, index) => (
                      <View key={medicine.id} style={styles.medicineCard}>
                        <Text style={styles.medicineName}>
                          {index + 1}. {medicine.medicine_name}
                        </Text>

                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Dosage:</Text>

                          <Text style={styles.infoValue}>
                            {medicine.dosage}
                          </Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Frequency:</Text>

                          <Text style={styles.infoValue}>
                            {medicine.frequency}
                          </Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Duration:</Text>

                          <Text style={styles.infoValue}>
                            {medicine.duration}
                          </Text>
                        </View>

                        {medicine.instructions && (
                          <View style={styles.instructionsBox}>
                            <Text style={styles.instructionsLabel}>
                              Instructions
                            </Text>

                            <Text style={styles.instructionsText}>
                              {medicine.instructions}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))
                  )}

                  {prescription.notes && (
                    <>
                      <Text style={styles.sectionTitle}>Doctor`s Advice</Text>

                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>
                          {prescription.notes}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
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

  retryButtonText: {
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerContent: {
    flex: 1,
  },

  doctorName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  date: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  arrow: {
    marginLeft: Spacing.md,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },

  details: {
    marginTop: Spacing.md,
  },

  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },

  medicineCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },

  medicineName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },

  infoRow: {
    flexDirection: "row",
    marginTop: 5,
  },

  infoLabel: {
    width: 82,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  infoValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },

  instructionsBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: "#FFF8E8",
  },

  instructionsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },

  instructionsText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },

  notesBox: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },

  notesText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
  },

  noMedicineBox: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
  },

  noMedicineText: {
    color: Colors.textSecondary,
    fontSize: 13,
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
