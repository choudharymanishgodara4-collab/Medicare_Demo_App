import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { supabase } from "../../services/supabase";

type Medicine = {
  id: string;
  name: string;
  category: string;
};

type PrescriptionItemDraft = {
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type Consultation = {
  id: string;
  appointment_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;

  appointment: {
    id: string;
    appointment_date: string;
    reason: string | null;
  } | null;

  patient: {
    id: string;
    full_name: string;
    mobile: string | null;
    city: string | null;
  } | null;
};

export default function DoctorConsultations() {
  const [consultations, setConsultations] =
    useState<Consultation[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [openId, setOpenId] =
    useState<string | null>(null);

  const [medicines, setMedicines] =
    useState<Medicine[]>([]);

  const [prescriptionOpenId, setPrescriptionOpenId] =
    useState<string | null>(null);

  const [prescriptionId, setPrescriptionId] =
    useState<string | null>(null);

  const [prescriptionNotes, setPrescriptionNotes] =
    useState("");

  const [prescriptionItems, setPrescriptionItems] =
    useState<PrescriptionItemDraft[]>([]);

  const [selectedMedicineId, setSelectedMedicineId] =
    useState("");

  const [medicinePickerOpen, setMedicinePickerOpen] =
    useState(false);

  const [dosage, setDosage] =
    useState("");

  const [frequency, setFrequency] =
    useState("");

  const [duration, setDuration] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  const [savingPrescriptionId, setSavingPrescriptionId] =
    useState<string | null>(null);

  const resetPrescriptionForm = () => {
    setPrescriptionId(null);
    setPrescriptionNotes("");
    setPrescriptionItems([]);
    setSelectedMedicineId("");
    setMedicinePickerOpen(false);
    setDosage("");
    setFrequency("");
    setDuration("");
    setInstructions("");
  };

  const closePrescription = () => {
    setPrescriptionOpenId(null);
    setMedicinePickerOpen(false);
    resetPrescriptionForm();
  };

  const loadMedicines = async () => {
    const { data, error } = await supabase
      .from("medicines")
      .select("id, name, category")
      .order("name", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    setMedicines(
      (data ?? []) as Medicine[],
    );
  };

  const loadPrescriptionForConsultation =
    async (
      consultation: Consultation,
    ) => {
      try {
        resetPrescriptionForm();

        setPrescriptionOpenId(
          consultation.id,
        );

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

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

        const {
          data: prescription,
          error: prescriptionError,
        } = await supabase
          .from("prescriptions")
          .select("id, notes")
          .eq(
            "consultation_id",
            consultation.id,
          )
          .eq(
            "doctor_id",
            user.id,
          )
          .maybeSingle();

        if (prescriptionError) {
          throw new Error(
            prescriptionError.message,
          );
        }

        if (!prescription) {
          if (
            consultation.status ===
            "COMPLETED"
          ) {
            Alert.alert(
              "No Prescription",
              "No prescription was saved for this consultation.",
            );

            closePrescription();
          }

          return;
        }

        setPrescriptionId(
          prescription.id,
        );

        setPrescriptionNotes(
          prescription.notes ?? "",
        );

        const {
          data: items,
          error: itemsError,
        } = await supabase
          .from("prescription_items")
          .select(
            "id, medicine_id, medicine_name, dosage, frequency, duration, instructions",
          )
          .eq(
            "prescription_id",
            prescription.id,
          )
          .order("created_at", {
            ascending: true,
          });

        if (itemsError) {
          throw new Error(
            itemsError.message,
          );
        }

        setPrescriptionItems(
          (items ?? []).map(
            (item) => ({
              medicine_id:
                item.medicine_id,
              medicine_name:
                item.medicine_name,
              dosage:
                item.dosage,
              frequency:
                item.frequency,
              duration:
                item.duration,
              instructions:
                item.instructions ??
                "",
            }),
          ),
        );
      } catch (err) {
        console.error(
          "Load prescription error:",
          err,
        );

        Alert.alert(
          "Prescription Error",
          err instanceof Error
            ? err.message
            : "Unable to load prescription.",
        );

        closePrescription();
      }
    };

  const addPrescriptionItem = () => {
    const medicine =
      medicines.find(
        (item) =>
          item.id ===
          selectedMedicineId,
      );

    if (!medicine) {
      Alert.alert(
        "Medicine Required",
        "Please select a medicine.",
      );
      return;
    }

    if (
      !dosage.trim() ||
      !frequency.trim() ||
      !duration.trim()
    ) {
      Alert.alert(
        "Missing Details",
        "Please enter dosage, frequency and duration.",
      );
      return;
    }

    const newItem: PrescriptionItemDraft = {
      medicine_id:
        medicine.id,
      medicine_name:
        medicine.name,
      dosage:
        dosage.trim(),
      frequency:
        frequency.trim(),
      duration:
        duration.trim(),
      instructions:
        instructions.trim(),
    };

    setPrescriptionItems(
      (current) => [
        ...current,
        newItem,
      ],
    );

    setSelectedMedicineId("");
    setMedicinePickerOpen(false);
    setDosage("");
    setFrequency("");
    setDuration("");
    setInstructions("");
  };

  const removePrescriptionItem = (
    index: number,
  ) => {
    setPrescriptionItems(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index,
        ),
    );
  };

  const savePrescription = async (
    consultation: Consultation,
  ) => {
    try {
      if (
        consultation.status !==
        "ACTIVE"
      ) {
        Alert.alert(
          "Prescription Locked",
          "Completed consultations are read-only.",
        );
        return;
      }

      if (
        !consultation.patient?.id
      ) {
        Alert.alert(
          "Patient Missing",
          "Patient details were not found.",
        );
        return;
      }

      if (
        prescriptionItems.length ===
        0
      ) {
        Alert.alert(
          "Add Medicine",
          "Please add at least one medicine.",
        );
        return;
      }

      setSavingPrescriptionId(
        consultation.id,
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

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

      const cleanNotes =
        prescriptionNotes.trim() ||
        null;

      let currentPrescriptionId =
        prescriptionId;

      if (currentPrescriptionId) {
        const {
          error:
            prescriptionUpdateError,
        } = await supabase
          .from("prescriptions")
          .update({
            notes: cleanNotes,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            currentPrescriptionId,
          )
          .eq(
            "doctor_id",
            user.id,
          );

        if (
          prescriptionUpdateError
        ) {
          throw new Error(
            prescriptionUpdateError.message,
          );
        }

        const {
          error: deleteItemsError,
        } = await supabase
          .from(
            "prescription_items",
          )
          .delete()
          .eq(
            "prescription_id",
            currentPrescriptionId,
          );

        if (deleteItemsError) {
          throw new Error(
            deleteItemsError.message,
          );
        }
      } else {
        const {
          data: newPrescription,
          error: insertError,
        } = await supabase
          .from("prescriptions")
          .insert({
            consultation_id:
              consultation.id,
            patient_id:
              consultation.patient.id,
            doctor_id:
              user.id,
            notes: cleanNotes,
          })
          .select("id")
          .single();

        if (insertError) {
          throw new Error(
            insertError.message,
          );
        }

        currentPrescriptionId =
          newPrescription.id;

        setPrescriptionId(
          newPrescription.id,
        );
      }

      if (
        !currentPrescriptionId
      ) {
        throw new Error(
          "Prescription ID was not created.",
        );
      }

      const {
        error: itemsInsertError,
      } = await supabase
        .from("prescription_items")
        .insert(
          prescriptionItems.map(
            (item) => ({
              prescription_id:
                currentPrescriptionId,
              medicine_id:
                item.medicine_id,
              medicine_name:
                item.medicine_name,
              dosage:
                item.dosage,
              frequency:
                item.frequency,
              duration:
                item.duration,
              instructions:
                item.instructions
                  .trim() || null,
            }),
          ),
        );

      if (itemsInsertError) {
        throw new Error(
          itemsInsertError.message,
        );
      }

      Alert.alert(
        "Prescription Saved",
        "Prescription has been saved successfully.",
      );
    } catch (err) {
      console.error(
        "Save prescription error:",
        err,
      );

      Alert.alert(
        "Save Failed",
        err instanceof Error
          ? err.message
          : "Unable to save prescription.",
      );
    } finally {
      setSavingPrescriptionId(
        null,
      );
    }
  };

  const loadConsultations =
    async () => {
      try {
        setIsLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

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

        const {
          data,
          error: queryError,
        } = await supabase
          .from("consultations")
          .select(`
            id,
            appointment_id,
            status,
            started_at,
            ended_at,
            notes,

            appointment:appointments!consultations_appointment_id_fkey (
              id,
              appointment_date,
              reason
            ),

            patient:profiles!consultations_patient_id_fkey (
              id,
              full_name,
              mobile,
              city
            )
          `)
          .eq(
            "doctor_id",
            user.id,
          )
          .order("started_at", {
            ascending: false,
          });

        if (queryError) {
          throw new Error(
            queryError.message,
          );
        }

        const normalized =
          (data ?? []).map(
            (item) => ({
              ...item,

              appointment:
                Array.isArray(
                  item.appointment,
                )
                  ? item.appointment[0] ??
                    null
                  : item.appointment,

              patient:
                Array.isArray(
                  item.patient,
                )
                  ? item.patient[0] ??
                    null
                  : item.patient,
            }),
          ) as Consultation[];

        setConsultations(
          normalized,
        );

        await loadMedicines();
      } catch (err) {
        console.error(
          "Consultations load error:",
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
    };

  useEffect(() => {
    void loadConsultations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveNotes = async (
    consultationId: string,
    notes: string,
  ) => {
    try {
      setSavingId(
        consultationId,
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

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

      const cleanedNotes =
        notes.trim();

      const { error } =
        await supabase
          .from("consultations")
          .update({
            notes:
              cleanedNotes ||
              null,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            consultationId,
          )
          .eq(
            "doctor_id",
            user.id,
          );

      if (error) {
        throw new Error(
          error.message,
        );
      }

      setConsultations(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              consultationId
                ? {
                    ...item,
                    notes:
                      cleanedNotes ||
                      null,
                  }
                : item,
          ),
      );

      Alert.alert(
        "Saved",
        "Consultation conclusion saved.",
      );
    } catch (err) {
      console.error(
        "Save consultation error:",
        err,
      );

      Alert.alert(
        "Save Failed",
        err instanceof Error
          ? err.message
          : "Unable to save consultation.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const completeConsultation =
    async (
      consultation: Consultation,
    ) => {
      try {
        if (
          consultation.status !==
          "ACTIVE"
        ) {
          return;
        }

        setSavingId(
          consultation.id,
        );

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

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

        const now =
          new Date().toISOString();

        const {
          error:
            consultationError,
        } = await supabase
          .from("consultations")
          .update({
            status:
              "COMPLETED",
            ended_at: now,
            updated_at: now,
          })
          .eq(
            "id",
            consultation.id,
          )
          .eq(
            "doctor_id",
            user.id,
          );

        if (consultationError) {
          throw new Error(
            consultationError.message,
          );
        }

        const {
          error:
            appointmentError,
        } = await supabase
          .from("appointments")
          .update({
            status:
              "COMPLETED",
            updated_at: now,
          })
          .eq(
            "id",
            consultation.appointment_id,
          )
          .eq(
            "doctor_id",
            user.id,
          );

        if (appointmentError) {
          console.error(
            "Appointment completion update failed:",
            appointmentError,
          );
        }

        setConsultations(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                consultation.id
                  ? {
                      ...item,
                      status:
                        "COMPLETED",
                      ended_at:
                        now,
                    }
                  : item,
            ),
        );

        setOpenId(null);
        closePrescription();

        Alert.alert(
          "Completed",
          "Consultation has been completed successfully.",
        );
      } catch (err) {
        console.error(
          "Complete consultation error:",
          err,
        );

        Alert.alert(
          "Complete Failed",
          err instanceof Error
            ? err.message
            : "Unable to complete consultation.",
        );
      } finally {
        setSavingId(null);
      }
    };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
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

  if (error) {
    return (
      <View style={styles.center}>
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
      </View>
    );
  }

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
        Consultations
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Manage your patient consultations
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
            Your active and completed
            consultations will appear here.
          </Text>
        </View>
      ) : (
        consultations.map(
          (consultation) => {
            const isOpen =
              openId ===
              consultation.id;

            const isPrescriptionOpen =
              prescriptionOpenId ===
              consultation.id;

            const isCompleted =
              consultation.status ===
              "COMPLETED";

            const patientProblem =
              consultation
                .appointment?.reason
                ?.trim();

            return (
              <View
                key={
                  consultation.id
                }
                style={
                  styles.card
                }
              >
                <Pressable
                  onPress={() => {
                    if (isOpen) {
                      setOpenId(null);
                      closePrescription();
                    } else {
                      setOpenId(
                        consultation.id,
                      );
                    }
                  }}
                >
                  <View
                    style={
                      styles.topRow
                    }
                  >
                    <View
                      style={
                        styles.patientBlock
                      }
                    >
                      <Text
                        style={
                          styles.patientName
                        }
                      >
                        {consultation
                          .patient
                          ?.full_name ||
                          "Patient"}
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

                  <Text
                    style={
                      styles.info
                    }
                  >
                    📱{" "}
                    {consultation
                      .patient
                      ?.mobile ||
                      "Mobile not added"}
                  </Text>

                  <Text
                    style={
                      styles.info
                    }
                  >
                    📍{" "}
                    {consultation
                      .patient
                      ?.city ||
                      "City not added"}
                  </Text>
                </Pressable>

                {isOpen && (
                  <View
                    style={
                      styles.detailSection
                    }
                  >
                    <View
                      style={
                        styles.separator
                      }
                    />

                    <Text
                      style={
                        styles.detailTitle
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
                          patientProblem
                            ? styles.problemText
                            : styles.noProblemText
                        }
                      >
                        {patientProblem ||
                          "No problem/reason provided by patient."}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.detailTitle
                      }
                    >
                      Patient
                    </Text>

                    <Pressable
                      onPress={() => {
                        if (
                          consultation
                            .patient?.id
                        ) {
                          router.push({
                            pathname:
                              "/doctor/patients/[id]",
                            params: {
                              id: consultation
                                .patient
                                .id,
                            },
                          });
                        }
                      }}
                    >
                      <Text
                        style={
                          styles.patientLink
                        }
                      >
                        View Patient Profile →
                      </Text>
                    </Pressable>

                    <Text
                      style={
                        styles.detailTitle
                      }
                    >
                      Consultation Conclusion
                    </Text>

                    <TextInput
                      value={
                        consultation.notes ??
                        ""
                      }
                      editable={
                        !isCompleted
                      }
                      onChangeText={(
                        value,
                      ) => {
                        setConsultations(
                          (current) =>
                            current.map(
                              (item) =>
                                item.id ===
                                consultation.id
                                  ? {
                                      ...item,
                                      notes:
                                        value,
                                    }
                                  : item,
                            ),
                        );
                      }}
                      placeholder="Write diagnosis, observations, advice and consultation conclusion..."
                      placeholderTextColor={
                        Colors.textSecondary
                      }
                      multiline
                      style={[
                        styles.notesInput,
                        isCompleted &&
                          styles.disabledInput,
                      ]}
                    />

                    <Pressable
                      style={
                        styles.prescriptionButton
                      }
                      onPress={() => {
                        if (
                          isPrescriptionOpen
                        ) {
                          closePrescription();
                        } else {
                          void loadPrescriptionForConsultation(
                            consultation,
                          );
                        }
                      }}
                    >
                      <Text
                        style={
                          styles.prescriptionButtonText
                        }
                      >
                        {isPrescriptionOpen
                          ? "Close Prescription"
                          : isCompleted
                            ? "View Prescription"
                            : "Write Prescription"}
                      </Text>
                    </Pressable>

                    {isPrescriptionOpen && (
                      <View
                        style={
                          styles.prescriptionSection
                        }
                      >
                        <View
                          style={
                            styles.prescriptionHeader
                          }
                        >
                          <Text
                            style={
                              styles.detailTitle
                            }
                          >
                            Prescription
                          </Text>

                          {isCompleted && (
                            <Text
                              style={
                                styles.readOnlyBadge
                              }
                            >
                              VIEW ONLY
                            </Text>
                          )}
                        </View>

                        {isCompleted && (
                          <Text
                            style={
                              styles.readOnlyText
                            }
                          >
                            This prescription was
                            already issued for this
                            completed consultation.
                          </Text>
                        )}

                        <Text
                          style={
                            styles.fieldLabel
                          }
                        >
                          Medicine
                        </Text>

                        <Pressable
                          disabled={
                            isCompleted
                          }
                          style={[
                            styles.dropdownButton,
                            isCompleted &&
                              styles.disabledInput,
                          ]}
                          onPress={() =>
                            setMedicinePickerOpen(
                              (current) =>
                                !current,
                            )
                          }
                        >
                          <Text
                            style={
                              selectedMedicineId
                                ? styles.dropdownText
                                : styles.dropdownPlaceholder
                            }
                          >
                            {selectedMedicineId
                              ? medicines.find(
                                  (item) =>
                                    item.id ===
                                    selectedMedicineId,
                                )?.name ||
                                "Select medicine"
                              : "Select medicine"}
                          </Text>
                        </Pressable>

                        {medicinePickerOpen &&
                          !isCompleted && (
                            <View
                              style={
                                styles.dropdownList
                              }
                            >
                              {medicines.length ===
                              0 ? (
                                <Text
                                  style={
                                    styles.noMedicineText
                                  }
                                >
                                  No medicines available.
                                </Text>
                              ) : (
                                medicines.map(
                                  (
                                    medicine,
                                  ) => (
                                    <Pressable
                                      key={
                                        medicine.id
                                      }
                                      style={
                                        styles.dropdownItem
                                      }
                                      onPress={() => {
                                        setSelectedMedicineId(
                                          medicine.id,
                                        );
                                        setMedicinePickerOpen(
                                          false,
                                        );
                                      }}
                                    >
                                      <Text
                                        style={
                                          styles.dropdownItemName
                                        }
                                      >
                                        {
                                          medicine.name
                                        }
                                      </Text>

                                      <Text
                                        style={
                                          styles.dropdownItemCategory
                                        }
                                      >
                                        {
                                          medicine.category
                                        }
                                      </Text>
                                    </Pressable>
                                  ),
                                )
                              )}
                            </View>
                          )}

                        <Text
                          style={
                            styles.fieldLabel
                          }
                        >
                          Dosage
                        </Text>

                        <TextInput
                          value={
                            dosage
                          }
                          editable={
                            !isCompleted
                          }
                          onChangeText={
                            setDosage
                          }
                          placeholder="e.g. 1 tablet"
                          placeholderTextColor={
                            Colors.textSecondary
                          }
                          style={[
                            styles.smallInput,
                            isCompleted &&
                              styles.disabledInput,
                          ]}
                        />

                        <Text
                          style={
                            styles.fieldLabel
                          }
                        >
                          Frequency
                        </Text>

                        <TextInput
                          value={
                            frequency
                          }
                          editable={
                            !isCompleted
                          }
                          onChangeText={
                            setFrequency
                          }
                          placeholder="e.g. Twice daily"
                          placeholderTextColor={
                            Colors.textSecondary
                          }
                          style={[
                            styles.smallInput,
                            isCompleted &&
                              styles.disabledInput,
                          ]}
                        />

                        <Text
                          style={
                            styles.fieldLabel
                          }
                        >
                          Duration
                        </Text>

                        <TextInput
                          value={
                            duration
                          }
                          editable={
                            !isCompleted
                          }
                          onChangeText={
                            setDuration
                          }
                          placeholder="e.g. 5 days"
                          placeholderTextColor={
                            Colors.textSecondary
                          }
                          style={[
                            styles.smallInput,
                            isCompleted &&
                              styles.disabledInput,
                          ]}
                        />

                        <Text
                          style={
                            styles.fieldLabel
                          }
                        >
                          Instructions
                        </Text>

                        <TextInput
                          value={
                            instructions
                          }
                          editable={
                            !isCompleted
                          }
                          onChangeText={
                            setInstructions
                          }
                          placeholder="e.g. After food"
                          placeholderTextColor={
                            Colors.textSecondary
                          }
                          style={[
                            styles.smallInput,
                            isCompleted &&
                              styles.disabledInput,
                          ]}
                        />

                        {!isCompleted && (
                          <Pressable
                            style={
                              styles.addMedicineButton
                            }
                            onPress={
                              addPrescriptionItem
                            }
                          >
                            <Text
                              style={
                                styles.addMedicineButtonText
                              }
                            >
                              + Add Medicine
                            </Text>
                          </Pressable>
                        )}

                        {prescriptionItems.length >
                          0 && (
                          <View
                            style={
                              styles.itemsList
                            }
                          >
                            {prescriptionItems.map(
                              (
                                item,
                                index,
                              ) => (
                                <View
                                  key={`${item.medicine_id}-${index}`}
                                  style={
                                    styles.prescriptionItemCard
                                  }
                                >
                                  <View
                                    style={
                                      styles.prescriptionItemContent
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.prescriptionMedicineName
                                      }
                                    >
                                      {index +
                                        1}
                                      .{" "}
                                      {
                                        item.medicine_name
                                      }
                                    </Text>

                                    <Text
                                      style={
                                        styles.prescriptionItemText
                                      }
                                    >
                                      {
                                        item.dosage
                                      }{" "}
                                      •{" "}
                                      {
                                        item.frequency
                                      }{" "}
                                      •{" "}
                                      {
                                        item.duration
                                      }
                                    </Text>

                                    {item.instructions && (
                                      <Text
                                        style={
                                          styles.prescriptionItemInstructions
                                        }
                                      >
                                        Instructions:{" "}
                                        {
                                          item.instructions
                                        }
                                      </Text>
                                    )}
                                  </View>

                                  {!isCompleted && (
                                    <Pressable
                                      style={
                                        styles.removeButton
                                      }
                                      onPress={() =>
                                        removePrescriptionItem(
                                          index,
                                        )
                                      }
                                    >
                                      <Text
                                        style={
                                          styles.removeButtonText
                                        }
                                      >
                                        Remove
                                      </Text>
                                    </Pressable>
                                  )}
                                </View>
                              ),
                            )}
                          </View>
                        )}

                        <Text
                          style={
                            styles.fieldLabel
                          }
                        >
                          Prescription Notes
                        </Text>

                        <TextInput
                          value={
                            prescriptionNotes
                          }
                          editable={
                            !isCompleted
                          }
                          onChangeText={
                            setPrescriptionNotes
                          }
                          placeholder="Additional prescription advice..."
                          placeholderTextColor={
                            Colors.textSecondary
                          }
                          multiline
                          style={[
                            styles.prescriptionNotesInput,
                            isCompleted &&
                              styles.disabledInput,
                          ]}
                        />

                        {!isCompleted && (
                          <Pressable
                            style={
                              styles.savePrescriptionButton
                            }
                            disabled={
                              savingPrescriptionId ===
                              consultation.id
                            }
                            onPress={() => {
                              void savePrescription(
                                consultation,
                              );
                            }}
                          >
                            <Text
                              style={
                                styles.savePrescriptionButtonText
                              }
                            >
                              {savingPrescriptionId ===
                              consultation.id
                                ? "Saving Prescription..."
                                : prescriptionId
                                  ? "Update Prescription"
                                  : "Save Prescription"}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}

                    {consultation.status ===
                      "ACTIVE" && (
                      <>
                        <Pressable
                          style={
                            styles.saveButton
                          }
                          disabled={
                            savingId ===
                            consultation.id
                          }
                          onPress={() => {
                            void saveNotes(
                              consultation.id,
                              consultation.notes ??
                                "",
                            );
                          }}
                        >
                          <Text
                            style={
                              styles.saveButtonText
                            }
                          >
                            {savingId ===
                            consultation.id
                              ? "Saving..."
                              : "Save Conclusion"}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={
                            styles.completeButton
                          }
                          disabled={
                            savingId ===
                            consultation.id
                          }
                          onPress={() => {
                            Alert.alert(
                              "Complete Consultation",
                              "Are you sure you want to complete this consultation?",
                              [
                                {
                                  text: "Cancel",
                                  style:
                                    "cancel",
                                },
                                {
                                  text: "Complete",
                                  onPress: () => {
                                    void completeConsultation(
                                      consultation,
                                    );
                                  },
                                },
                              ],
                            );
                          }}
                        >
                          <Text
                            style={
                              styles.completeButtonText
                            }
                          >
                            Complete Consultation
                          </Text>
                        </Pressable>
                      </>
                    )}

                    {isCompleted && (
                      <Text
                        style={
                          styles.completedText
                        }
                      >
                        Completed:{" "}
                        {consultation.ended_at
                          ? new Date(
                              consultation.ended_at,
                            ).toLocaleString()
                          : "Completed"}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          },
        )
      )}

      <Pressable
        style={
          styles.backButton
        }
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={styles.backText}
        >
          ← Back to Dashboard
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

    title: {
      fontSize: 30,
      fontWeight: "700",
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

    topRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
    },

    patientBlock: {
      flex: 1,
      marginRight:
        Spacing.md,
    },

    patientName: {
      fontSize: 17,
      fontWeight:
        "700",
      color:
        Colors.text,
    },

    statusBadge: {
      backgroundColor:
        Colors.primaryLight,
      borderRadius:
        Radius.round,
      paddingHorizontal:
        Spacing.sm,
      paddingVertical: 5,
    },

    statusText: {
      color:
        Colors.primary,
      fontSize: 11,
      fontWeight:
        "700",
    },

    date: {
      marginTop:
        Spacing.sm,
      fontSize: 13,
      color:
        Colors.textSecondary,
    },

    info: {
      marginTop:
        Spacing.xs,
      fontSize: 13,
      color:
        Colors.textSecondary,
    },

    detailSection: {
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

    detailTitle: {
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
      backgroundColor:
        "#FFF8E8",
      borderWidth: 1,
      borderColor:
        "#F2D28B",
      borderRadius:
        Radius.lg,
      padding:
        Spacing.md,
      marginBottom:
        Spacing.md,
    },

    problemText: {
      fontSize: 14,
      lineHeight: 21,
      color:
        Colors.text,
    },

    noProblemText: {
      fontSize: 14,
      lineHeight: 21,
      color:
        Colors.textSecondary,
      fontStyle:
        "italic",
    },

    patientLink: {
      color:
        Colors.primary,
      fontSize: 14,
      fontWeight:
        "600",
      marginBottom:
        Spacing.md,
    },

    notesInput: {
      minHeight: 150,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius:
        Radius.lg,
      padding:
        Spacing.md,
      color:
        Colors.text,
      backgroundColor:
        Colors.background,
      textAlignVertical:
        "top",
    },

    disabledInput: {
      backgroundColor:
        "#F1F3F5",
      opacity: 0.8,
    },

    prescriptionButton: {
      height: 48,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.primaryLight,
      borderWidth: 1,
      borderColor:
        Colors.primary,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop:
        Spacing.md,
    },

    prescriptionButtonText: {
      color:
        Colors.primary,
      fontSize: 15,
      fontWeight:
        "700",
    },

    prescriptionSection: {
      marginTop:
        Spacing.md,
      padding:
        Spacing.md,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.background,
    },

    prescriptionHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    readOnlyBadge: {
      fontSize: 10,
      fontWeight:
        "800",
      color:
        Colors.primary,
      backgroundColor:
        Colors.primaryLight,
      paddingHorizontal:
        Spacing.sm,
      paddingVertical: 5,
      borderRadius:
        Radius.round,
    },

    readOnlyText: {
      fontSize: 12,
      lineHeight: 18,
      color:
        Colors.textSecondary,
      marginBottom:
        Spacing.sm,
    },

    fieldLabel: {
      marginTop:
        Spacing.sm,
      marginBottom: 6,
      fontSize: 13,
      fontWeight:
        "700",
      color:
        Colors.text,
    },

    dropdownButton: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.white,
      paddingHorizontal:
        Spacing.md,
      justifyContent:
        "center",
    },

    dropdownText: {
      color:
        Colors.text,
      fontSize: 14,
    },

    dropdownPlaceholder: {
      color:
        Colors.textSecondary,
      fontSize: 14,
    },

    dropdownList: {
      marginTop: 6,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.white,
      overflow:
        "hidden",
    },

    dropdownItem: {
      paddingHorizontal:
        Spacing.md,
      paddingVertical:
        Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor:
        Colors.border,
    },

    dropdownItemName: {
      color:
        Colors.text,
      fontSize: 14,
      fontWeight:
        "600",
    },

    dropdownItemCategory: {
      marginTop: 2,
      color:
        Colors.textSecondary,
      fontSize: 12,
    },

    noMedicineText: {
      padding:
        Spacing.md,
      color:
        Colors.textSecondary,
      fontSize: 13,
    },

    smallInput: {
      minHeight: 46,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius:
        Radius.lg,
      paddingHorizontal:
        Spacing.md,
      color:
        Colors.text,
      backgroundColor:
        Colors.white,
    },

    addMedicineButton: {
      height: 44,
      marginTop:
        Spacing.md,
      borderRadius:
        Radius.lg,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        Colors.white,
      borderWidth: 1,
      borderColor:
        Colors.primary,
    },

    addMedicineButtonText: {
      color:
        Colors.primary,
      fontSize: 14,
      fontWeight:
        "700",
    },

    itemsList: {
      marginTop:
        Spacing.md,
    },

    prescriptionItemCard: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      padding:
        Spacing.md,
      marginBottom:
        Spacing.sm,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.white,
      borderWidth: 1,
      borderColor:
        Colors.border,
    },

    prescriptionItemContent: {
      flex: 1,
    },

    prescriptionMedicineName: {
      fontSize: 14,
      fontWeight:
        "700",
      color:
        Colors.text,
    },

    prescriptionItemText: {
      marginTop: 4,
      fontSize: 13,
      color:
        Colors.text,
    },

    prescriptionItemInstructions: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 18,
      color:
        Colors.textSecondary,
    },

    removeButton: {
      marginLeft:
        Spacing.sm,
      paddingHorizontal:
        Spacing.sm,
      paddingVertical: 6,
      borderRadius:
        Radius.lg,
      backgroundColor:
        "#FEECEC",
    },

    removeButtonText: {
      color:
        Colors.danger,
      fontSize: 12,
      fontWeight:
        "700",
    },

    prescriptionNotesInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor:
        Colors.border,
      borderRadius:
        Radius.lg,
      padding:
        Spacing.md,
      color:
        Colors.text,
      backgroundColor:
        Colors.white,
      textAlignVertical:
        "top",
    },

    savePrescriptionButton: {
      height: 50,
      marginTop:
        Spacing.md,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.primary,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    savePrescriptionButtonText: {
      color:
        Colors.white,
      fontSize: 15,
      fontWeight:
        "700",
    },

    saveButton: {
      height: 48,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.primaryLight,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop:
        Spacing.md,
    },

    saveButtonText: {
      color:
        Colors.primary,
      fontSize: 15,
      fontWeight:
        "700",
    },

    completeButton: {
      height: 52,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.primary,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop:
        Spacing.md,
    },

    completeButtonText: {
      color:
        Colors.white,
      fontSize: 16,
      fontWeight:
        "700",
    },

    completedText: {
      marginTop:
        Spacing.md,
      fontSize: 13,
      color:
        Colors.textSecondary,
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
      color:
        Colors.textSecondary,
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