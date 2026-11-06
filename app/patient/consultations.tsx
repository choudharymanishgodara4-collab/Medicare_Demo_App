import { router } from "expo-router";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
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

type Doctor = {
  id: string;
  full_name: string;
};

type Appointment = {
  appointment_date: string;
  reason: string | null;
};

type PrescriptionItem = {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
};

type Prescription = {
  id: string;
  consultation_id: string;
  notes: string | null;
  issued_at: string;
  items: PrescriptionItem[];
};

type Consultation = {
  id: string;
  appointment_id: string;
  doctor_id: string;
  status:
    | "ACTIVE"
    | "COMPLETED"
    | "CANCELLED";
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  appointment: Appointment | null;
  doctor: Doctor | null;
  prescription: Prescription | null;
};

type RawConsultation = {
  id: string;
  appointment_id: string;
  doctor_id: string;
  status:
    | "ACTIVE"
    | "COMPLETED"
    | "CANCELLED";
  notes: string | null;
  started_at: string;
  ended_at: string | null;

  appointment:
    | Appointment
    | Appointment[]
    | null;

  doctor:
    | Doctor
    | Doctor[]
    | null;
};

type RawPrescription = {
  id: string;
  consultation_id: string;
  notes: string | null;
  issued_at: string;
};

type RawPrescriptionItem = {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
};

function getRelation<T>(
  relation: T | T[] | null,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export default function PatientConsultations() {
  const [consultations, setConsultations] =
    useState<Consultation[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [openId, setOpenId] =
    useState<string | null>(null);

  const loadConsultations = useCallback(
    async () => {
      try {
        setIsLoading(true);
        setError("");

        // -----------------------------------------
        // Logged-in patient
        // -----------------------------------------

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw new Error(
            userError.message,
          );
        }

        if (!user) {
          throw new Error(
            "Please login first.",
          );
        }

        // -----------------------------------------
        // 1. Consultations
        // -----------------------------------------

        const {
          data: consultationData,
          error: consultationError,
        } =
          await supabase
            .from("consultations")
            .select(`
              id,
              appointment_id,
              doctor_id,
              status,
              notes,
              started_at,
              ended_at,

              appointment:appointments!consultations_appointment_id_fkey (
                appointment_date,
                reason
              ),

              doctor:profiles!consultations_doctor_id_fkey (
                id,
                full_name
              )
            `)
            .eq(
              "patient_id",
              user.id,
            )
            .order(
              "started_at",
              {
                ascending: false,
              },
            );

        if (consultationError) {
          throw new Error(
            consultationError.message,
          );
        }

        const rawConsultations =
          (consultationData ??
            []) as RawConsultation[];

        if (
          rawConsultations.length ===
          0
        ) {
          setConsultations([]);
          return;
        }

        // -----------------------------------------
        // Consultation IDs
        // -----------------------------------------

        const consultationIds =
          rawConsultations.map(
            (item) => item.id,
          );

        // -----------------------------------------
        // 2. Prescriptions
        // -----------------------------------------

        const {
          data: prescriptionData,
          error: prescriptionError,
        } =
          await supabase
            .from("prescriptions")
            .select(`
              id,
              consultation_id,
              notes,
              issued_at
            `)
            .eq(
              "patient_id",
              user.id,
            )
            .in(
              "consultation_id",
              consultationIds,
            )
            .order(
              "issued_at",
              {
                ascending: false,
              },
            );

        if (prescriptionError) {
          throw new Error(
            prescriptionError.message,
          );
        }

        const prescriptions =
          (prescriptionData ??
            []) as RawPrescription[];

        // -----------------------------------------
        // 3. Prescription Items
        // -----------------------------------------

        let prescriptionItems: RawPrescriptionItem[] =
          [];

        if (
          prescriptions.length >
          0
        ) {
          const prescriptionIds =
            prescriptions.map(
              (item) => item.id,
            );

          const {
            data: itemsData,
            error: itemsError,
          } =
            await supabase
              .from(
                "prescription_items",
              )
              .select(`
                id,
                prescription_id,
                medicine_name,
                dosage,
                frequency,
                duration,
                instructions
              `)
              .in(
                "prescription_id",
                prescriptionIds,
              )
              .order(
                "created_at",
                {
                  ascending: true,
                },
              );

          if (itemsError) {
            throw new Error(
              itemsError.message,
            );
          }

          prescriptionItems =
            (itemsData ??
              []) as RawPrescriptionItem[];
        }

        // -----------------------------------------
        // 4. Build final consultation data
        // -----------------------------------------

        const finalConsultations =
          rawConsultations.map(
            (item) => {
              const appointment =
                getRelation(
                  item.appointment,
                );

              const doctor =
                getRelation(
                  item.doctor,
                );

              const rawPrescription =
                prescriptions.find(
                  (prescription) =>
                    prescription.consultation_id ===
                    item.id,
                );

              const prescriptionItemsForConsultation =
                rawPrescription
                  ? prescriptionItems.filter(
                      (
                        prescriptionItem,
                      ) =>
                        prescriptionItem.prescription_id ===
                        rawPrescription.id,
                    )
                  : [];

              const prescription =
                rawPrescription
                  ? {
                      id:
                        rawPrescription.id,

                      consultation_id:
                        rawPrescription.consultation_id,

                      notes:
                        rawPrescription.notes,

                      issued_at:
                        rawPrescription.issued_at,

                      items:
                        prescriptionItemsForConsultation.map(
                          (
                            prescriptionItem,
                          ) => ({
                            id:
                              prescriptionItem.id,

                            medicine_name:
                              prescriptionItem.medicine_name,

                            dosage:
                              prescriptionItem.dosage,

                            frequency:
                              prescriptionItem.frequency,

                            duration:
                              prescriptionItem.duration,

                            instructions:
                              prescriptionItem.instructions,
                          }),
                        ),
                    }
                  : null;

              return {
                id: item.id,
                appointment_id:
                  item.appointment_id,
                doctor_id:
                  item.doctor_id,
                status:
                  item.status,
                notes:
                  item.notes,
                started_at:
                  item.started_at,
                ended_at:
                  item.ended_at,
                appointment,
                doctor,
                prescription,
              };
            },
          );

        setConsultations(
          finalConsultations,
        );
      } catch (err) {
        console.error(
          "Patient consultations load error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load consultations.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadConsultations();
  }, [loadConsultations]);

  // -----------------------------------------
  // Loading
  // -----------------------------------------

  if (isLoading) {
    return (
      <View
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color={
            Colors.primary
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading consultations...
        </Text>
      </View>
    );
  }

  // -----------------------------------------
  // Error
  // -----------------------------------------

  if (error) {
    return (
      <View
        style={styles.center}
      >
        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>

        <Pressable
          style={
            styles.retryButton
          }
          onPress={() => {
            void loadConsultations();
          }}
        >
          <Text
            style={
              styles.retryText
            }
          >
            Try Again
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backText
            }
          >
            ← Back
          </Text>
        </Pressable>
      </View>
    );
  }

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <Text
        style={styles.title}
      >
        My Consultations
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        View your doctor consultation history
      </Text>

      {consultations.length ===
      0 ? (
        <View
          style={
            styles.emptyCard
          }
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            No Consultations
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            Your doctor consultations
            will appear here.
          </Text>
        </View>
      ) : (
        consultations.map(
          (consultation) => {
            const isOpen =
              openId ===
              consultation.id;

            const prescription =
              consultation.prescription;

            return (
              <View
                key={
                  consultation.id
                }
                style={
                  styles.card
                }
              >
                {/* -------------------------------- */}
                {/* Consultation Header */}
                {/* -------------------------------- */}

                <Pressable
                  onPress={() => {
                    setOpenId(
                      isOpen
                        ? null
                        : consultation.id,
                    );
                  }}
                >
                  <View
                    style={
                      styles.headerRow
                    }
                  >
                    <View
                      style={
                        styles.headerContent
                      }
                    >
                      <Text
                        style={
                          styles.doctorName
                        }
                      >
                        {consultation
                          .doctor
                          ?.full_name ||
                          "Doctor"}
                      </Text>

                      <Text
                        style={
                          styles.date
                        }
                      >
                        Started:{" "}
                        {new Date(
                          consultation.started_at,
                        ).toLocaleString()}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.statusBadge
                      }
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {
                          consultation.status
                        }
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* -------------------------------- */}
                {/* Details */}
                {/* -------------------------------- */}

                {isOpen && (
                  <View
                    style={
                      styles.details
                    }
                  >
                    <View
                      style={
                        styles.separator
                      }
                    />

                    {/* Patient Problem */}

                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      🩺 Patient Problem
                    </Text>

                    <View
                      style={
                        styles.problemBox
                      }
                    >
                      <Text
                        style={
                          styles.problemText
                        }
                      >
                        {consultation
                          .appointment
                          ?.reason
                          ?.trim() ||
                          "No problem/reason provided."}
                      </Text>
                    </View>

                    {/* Consultation Conclusion */}

                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Consultation Conclusion
                    </Text>

                    <View
                      style={
                        styles.notesBox
                      }
                    >
                      <Text
                        style={
                          consultation.notes
                            ?.trim()
                            ? styles.notesText
                            : styles.noDataText
                        }
                      >
                        {consultation.notes
                          ?.trim() ||
                          "No conclusion added."}
                      </Text>
                    </View>

                    {/* Completed */}

                    {consultation.ended_at && (
                      <Text
                        style={
                          styles.completedDate
                        }
                      >
                        Completed:{" "}
                        {new Date(
                          consultation.ended_at,
                        ).toLocaleString()}
                      </Text>
                    )}

                    {/* -------------------------------- */}
                    {/* Prescription */}
                    {/* -------------------------------- */}

                    <View
                      style={
                        styles.prescriptionHeader
                      }
                    >
                      <Text
                        style={
                          styles.sectionTitle
                        }
                      >
                        Prescription
                      </Text>

                      {prescription && (
                        <Text
                          style={
                            styles.prescriptionBadge
                          }
                        >
                          ISSUED
                        </Text>
                      )}
                    </View>

                    {prescription ? (
                      <>
                        {prescription
                          .items.length ===
                        0 ? (
                          <View
                            style={
                              styles.noPrescriptionBox
                            }
                          >
                            <Text
                              style={
                                styles.noDataText
                              }
                            >
                              No medicines were
                              added to this
                              prescription.
                            </Text>
                          </View>
                        ) : (
                          prescription.items.map(
                            (
                              medicine,
                              index,
                            ) => (
                              <View
                                key={
                                  medicine.id
                                }
                                style={
                                  styles.medicineCard
                                }
                              >
                                <Text
                                  style={
                                    styles.medicineName
                                  }
                                >
                                  {index +
                                    1}
                                  .{" "}
                                  {
                                    medicine.medicine_name
                                  }
                                </Text>

                                <View
                                  style={
                                    styles.detailRow
                                  }
                                >
                                  <Text
                                    style={
                                      styles.detailLabel
                                    }
                                  >
                                    Dosage
                                  </Text>

                                  <Text
                                    style={
                                      styles.detailValue
                                    }
                                  >
                                    {
                                      medicine.dosage
                                    }
                                  </Text>
                                </View>

                                <View
                                  style={
                                    styles.detailRow
                                  }
                                >
                                  <Text
                                    style={
                                      styles.detailLabel
                                    }
                                  >
                                    Frequency
                                  </Text>

                                  <Text
                                    style={
                                      styles.detailValue
                                    }
                                  >
                                    {
                                      medicine.frequency
                                    }
                                  </Text>
                                </View>

                                <View
                                  style={
                                    styles.detailRow
                                  }
                                >
                                  <Text
                                    style={
                                      styles.detailLabel
                                    }
                                  >
                                    Duration
                                  </Text>

                                  <Text
                                    style={
                                      styles.detailValue
                                    }
                                  >
                                    {
                                      medicine.duration
                                    }
                                  </Text>
                                </View>

                                {medicine.instructions &&
                                  medicine.instructions.trim() !==
                                    "" && (
                                    <View
                                      style={
                                        styles.instructionsBox
                                      }
                                    >
                                      <Text
                                        style={
                                          styles.instructionsTitle
                                        }
                                      >
                                        Instructions
                                      </Text>

                                      <Text
                                        style={
                                          styles.instructionsText
                                        }
                                      >
                                        {
                                          medicine.instructions
                                        }
                                      </Text>
                                    </View>
                                  )}
                              </View>
                            ),
                          )
                        )}

                        {/* Doctor's Advice */}

                        {prescription.notes &&
                          prescription.notes.trim() !==
                            "" && (
                            <>
                              <Text
                                style={
                                  styles.sectionTitle
                                }
                              >
                                Doctor&apos;s Advice
                              </Text>

                              <View
                                style={
                                  styles.notesBox
                                }
                              >
                                <Text
                                  style={
                                    styles.notesText
                                  }
                                >
                                  {
                                    prescription.notes
                                  }
                                </Text>
                              </View>
                            </>
                          )}

                        <Text
                          style={
                            styles.issuedDate
                          }
                        >
                          Prescription Issued:{" "}
                          {new Date(
                            prescription.issued_at,
                          ).toLocaleString()}
                        </Text>
                      </>
                    ) : (
                      <View
                        style={
                          styles.noPrescriptionBox
                        }
                      >
                        <Text
                          style={
                            styles.noDataText
                          }
                        >
                          No prescription was
                          issued for this
                          consultation.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          },
        )
      )}

      {/* All Prescriptions */}

      <Pressable
        style={
          styles.prescriptionsButton
        }
        onPress={() =>
          router.push(
            "/patient/prescriptions",
          )
        }
      >
        <Text
          style={
            styles.prescriptionsButtonText
          }
        >
          View All Prescriptions
        </Text>
      </Pressable>

      {/* Back */}

      <Pressable
        style={
          styles.backButton
        }
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={
            styles.backText
          }
        >
          ← Back
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      padding:
        Spacing.xl,
      paddingBottom:
        Spacing.huge,
      backgroundColor:
        Colors.background,
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding:
        Spacing.xl,
      backgroundColor:
        Colors.background,
    },

    loadingText: {
      marginTop:
        Spacing.md,
      color:
        Colors.textSecondary,
    },

    errorText: {
      color:
        Colors.danger,
      textAlign:
        "center",
      marginBottom:
        Spacing.lg,
    },

    title: {
      fontSize: 30,
      fontWeight:
        "700",
      color:
        Colors.text,
    },

    subtitle: {
      marginTop:
        Spacing.xs,
      marginBottom:
        Spacing.xl,
      color:
        Colors.textSecondary,
    },

    card: {
      backgroundColor:
        Colors.white,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius:
        Radius.xl,
      padding:
        Spacing.lg,
      marginBottom:
        Spacing.md,
    },

    headerRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    headerContent: {
      flex: 1,
      marginRight:
        Spacing.md,
    },

    doctorName: {
      fontSize: 17,
      fontWeight:
        "700",
      color:
        Colors.text,
    },

    date: {
      marginTop:
        Spacing.xs,
      fontSize: 13,
      color:
        Colors.textSecondary,
    },

    statusBadge: {
      paddingHorizontal:
        Spacing.sm,
      paddingVertical: 6,
      borderRadius:
        Radius.round,
      backgroundColor:
        Colors.primaryLight,
    },

    statusText: {
      color:
        Colors.primary,
      fontSize: 11,
      fontWeight:
        "700",
    },

    details: {
      marginTop:
        Spacing.md,
    },

    separator: {
      height: 1,
      backgroundColor:
        Colors.border,
      marginBottom:
        Spacing.lg,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight:
        "700",
      color:
        Colors.text,
      marginBottom:
        Spacing.sm,
      marginTop:
        Spacing.sm,
    },

    problemBox: {
      padding:
        Spacing.md,
      borderRadius:
        Radius.lg,
      borderWidth: 1,
      borderColor:
        "#F2D28B",
      backgroundColor:
        "#FFF8E8",
    },

    problemText: {
      fontSize: 14,
      lineHeight: 21,
      color:
        Colors.text,
    },

    notesBox: {
      padding:
        Spacing.md,
      borderRadius:
        Radius.lg,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.background,
    },

    notesText: {
      fontSize: 14,
      lineHeight: 21,
      color:
        Colors.text,
    },

    noDataText: {
      fontSize: 13,
      lineHeight: 19,
      color:
        Colors.textSecondary,
      fontStyle:
        "italic",
    },

    completedDate: {
      marginTop:
        Spacing.sm,
      fontSize: 12,
      color:
        Colors.textSecondary,
    },

    prescriptionHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    prescriptionBadge: {
      fontSize: 10,
      fontWeight:
        "800",
      color:
        "#2E7D32",
      backgroundColor:
        "#E8F5E9",
      paddingHorizontal:
        Spacing.sm,
      paddingVertical: 5,
      borderRadius:
        Radius.round,
    },

    medicineCard: {
      padding:
        Spacing.md,
      marginBottom:
        Spacing.sm,
      borderRadius:
        Radius.lg,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.background,
    },

    medicineName: {
      fontSize: 15,
      fontWeight:
        "700",
      color:
        Colors.text,
      marginBottom:
        Spacing.sm,
    },

    detailRow: {
      flexDirection:
        "row",
      marginTop: 5,
    },

    detailLabel: {
      width: 90,
      fontSize: 13,
      fontWeight:
        "600",
      color:
        Colors.textSecondary,
    },

    detailValue: {
      flex: 1,
      fontSize: 13,
      color:
        Colors.text,
    },

    instructionsBox: {
      marginTop:
        Spacing.sm,
      padding:
        Spacing.sm,
      borderRadius:
        Radius.lg,
      backgroundColor:
        "#FFF8E8",
    },

    instructionsTitle: {
      fontSize: 12,
      fontWeight:
        "700",
      color:
        Colors.text,
      marginBottom: 3,
    },

    instructionsText: {
      fontSize: 13,
      lineHeight: 19,
      color:
        Colors.text,
    },

    noPrescriptionBox: {
      padding:
        Spacing.md,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.background,
    },

    issuedDate: {
      marginTop:
        Spacing.sm,
      fontSize: 12,
      color:
        Colors.textSecondary,
    },

    prescriptionsButton: {
      height: 50,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.primary,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop:
        Spacing.lg,
    },

    prescriptionsButtonText: {
      color:
        Colors.white,
      fontSize: 15,
      fontWeight:
        "700",
    },

    emptyCard: {
      backgroundColor:
        Colors.white,
      borderRadius:
        Radius.xl,
      padding:
        Spacing.xl,
      alignItems:
        "center",
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight:
        "700",
      color:
        Colors.text,
    },

    emptyText: {
      marginTop:
        Spacing.sm,
      textAlign:
        "center",
      lineHeight: 20,
      color:
        Colors.textSecondary,
    },

    retryButton: {
      backgroundColor:
        Colors.primary,
      paddingHorizontal:
        Spacing.lg,
      paddingVertical:
        Spacing.md,
      borderRadius:
        Radius.lg,
    },

    retryText: {
      color:
        Colors.white,
      fontWeight:
        "700",
    },

    backButton: {
      alignItems:
        "center",
      marginTop:
        Spacing.lg,
    },

    backText: {
      color:
        Colors.primary,
      fontSize: 15,
      fontWeight:
        "600",
    },
  });