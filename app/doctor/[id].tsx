import {
  router,
  Stack,
  useLocalSearchParams,
} from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import AppButton from "../../components/common/AppButton";
import Avatar from "../../components/common/Avatar";
import EmptyState from "../../components/common/EmptyState";
import DoctorProfileSection from "../../components/patient/DoctorProfileSection";

import { getDoctorById, type Doctor } from "../../services/doctor.service";
import { supabase } from "../../services/supabase";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

export default function DoctorDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingMessageType, setBookingMessageType] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    const loadDoctor = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getDoctorById(id);
        setDoctor(data);
      } catch (error) {
        console.error("Doctor load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDoctor();
  }, [id]);

  const formatDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatTime = (value: Date) => {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const formatDisplayDate = (value: Date) => {
    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDisplayTime = (value: Date) => {
    return value.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleOpenBooking = () => {
    const now = new Date();

    setSelectedDate(now);
    setSelectedTime(now);

    setDate(formatDate(now));
    setTime(formatTime(now));

    setBookingMessage("");
    setBookingMessageType("");
    setShowBooking(true);
  };

  const handleDateChange = (
    event: any,
    selected?: Date,
  ) => {
    setShowDatePicker(false);

    if (!selected) {
      return;
    }

    setSelectedDate(selected);
    setDate(formatDate(selected));
  };

  const handleTimeChange = (
    event: any,
    selected?: Date,
  ) => {
    setShowTimePicker(false);

    if (!selected) {
      return;
    }

    setSelectedTime(selected);
    setTime(formatTime(selected));
  };

  const handleBookAppointment = async () => {
    if (!doctor) {
      return;
    }

    setBookingMessage("");
    setBookingMessageType("");

    const cleanDate = date.trim();
    const cleanTime = time.trim();
    const cleanReason = reason.trim();

    if (!cleanDate || !cleanTime) {
      const message = "Please select appointment date and time.";

      setBookingMessage(message);
      setBookingMessageType("error");

      Alert.alert("Missing Information", message);
      return;
    }

    try {
      setIsBooking(true);

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

      const appointmentDate = new Date(
        `${cleanDate}T${cleanTime}:00`,
      );

      if (Number.isNaN(appointmentDate.getTime())) {
        throw new Error("Please select a valid date and time.");
      }

      if (appointmentDate.getTime() <= Date.now()) {
        throw new Error(
          "Please select a future date and time.",
        );
      }

      console.log("Creating appointment:", {
        patient_id: user.id,
        doctor_id: doctor.id,
        appointment_date: appointmentDate.toISOString(),
        reason: cleanReason || null,
      });

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          doctor_id: doctor.id,
          appointment_date: appointmentDate.toISOString(),
          reason: cleanReason || null,
          status: "PENDING",
        })
        .select(
          "id, patient_id, doctor_id, appointment_date, status, reason",
        )
        .single();

      if (error) {
        console.error(
          "Supabase appointment error:",
          error,
        );
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("Appointment was not created.");
      }

      console.log(
        "Appointment created successfully:",
        data,
      );

      setShowBooking(false);
      setDate("");
      setTime("");
      setReason("");

      const successMessage =
        "✅ Appointment booked successfully. Your request is now pending doctor confirmation.";

      setBookingMessage(successMessage);
      setBookingMessageType("success");

      Alert.alert(
        "Appointment Booked",
        successMessage,
      );
    } catch (error) {
      console.error(
        "Appointment booking error:",
        error,
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to book appointment.";

      setBookingMessage(`❌ ${errorMessage}`);
      setBookingMessageType("error");

      Alert.alert(
        "Booking Failed",
        errorMessage,
      );
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <>
       <Stack.Screen
  options={{
    title: "Doctor Details",
  }}
/>
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>
          Loading doctor...
        </Text>
      </View>
      </>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.notFoundContainer}>
        <EmptyState
          title="Doctor not found"
          message="The doctor you are looking for is not available."
          actionText="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <>
    <Stack.Screen
  options={{
    title: "Doctor Details",
  }}
/>
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Avatar
        name={doctor.name}
        size={110}
      />

      <Text style={styles.name}>
        {doctor.name}
      </Text>

      <Text style={styles.specialization}>
        {doctor.specialization}
      </Text>

      <Text style={styles.location}>
        📍 {doctor.city}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ⭐ {doctor.rating}
          </Text>

          <Text style={styles.statLabel}>
            Rating
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {doctor.experience}
          </Text>

          <Text style={styles.statLabel}>
            Years Experience
          </Text>
        </View>
      </View>

      <DoctorProfileSection title="About Doctor">
        <Text style={styles.sectionText}>
          {doctor.name} is a{" "}
          {doctor.specialization.toLowerCase()} with{" "}
          {doctor.experience} years of professional
          experience. You can consult this specialist for
          expert medical guidance.
        </Text>
      </DoctorProfileSection>

      <DoctorProfileSection title="Qualification">
        <Text style={styles.sectionText}>
          MBBS • MD
        </Text>
      </DoctorProfileSection>

      <DoctorProfileSection title="Availability">
        <Text style={styles.sectionText}>
          Monday - Saturday
        </Text>

        <Text style={styles.sectionText}>
          10:00 AM - 6:00 PM
        </Text>
      </DoctorProfileSection>

      {bookingMessage ? (
        <View
          style={[
            styles.messageBox,
            bookingMessageType === "success"
              ? styles.successBox
              : styles.errorBox,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              bookingMessageType === "success"
                ? styles.successText
                : styles.errorText,
            ]}
          >
            {bookingMessage}
          </Text>
        </View>
      ) : null}

      {!showBooking ? (
        <View style={styles.actionContainer}>
          <AppButton
            title="Consult Doctor"
            onPress={handleOpenBooking}
          />
        </View>
      ) : (
        <View style={styles.bookingCard}>
          <Text style={styles.bookingTitle}>
            Book Appointment
          </Text>

          {/* DATE */}
          <Text style={styles.inputLabel}>
            Appointment Date
          </Text>

          <Pressable
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerIcon}>
              📅
            </Text>

            <View style={styles.pickerTextContainer}>
              <Text style={styles.pickerMainText}>
                {date
                  ? formatDisplayDate(selectedDate)
                  : "Select Date"}
              </Text>

              <Text style={styles.pickerHint}>
                Tap to open calendar
              </Text>
            </View>

            <Text style={styles.pickerArrow}>
              ›
            </Text>
          </Pressable>

          {showDatePicker ? (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={
                Platform.OS === "android"
                  ? "calendar"
                  : "spinner"
              }
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          ) : null}

          {/* TIME */}
          <Text style={styles.inputLabel}>
            Appointment Time
          </Text>

          <Pressable
            style={styles.pickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.pickerIcon}>
              🕐
            </Text>

            <View style={styles.pickerTextContainer}>
              <Text style={styles.pickerMainText}>
                {time
                  ? formatDisplayTime(selectedTime)
                  : "Select Time"}
              </Text>

              <Text style={styles.pickerHint}>
                Tap to open clock
              </Text>
            </View>

            <Text style={styles.pickerArrow}>
              ›
            </Text>
          </Pressable>

          {showTimePicker ? (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={
                Platform.OS === "android"
                  ? "clock"
                  : "spinner"
              }
              onChange={handleTimeChange}
            />
          ) : null}

          {/* REASON */}
          <Text style={styles.inputLabel}>
            Reason
          </Text>

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for consultation"
            placeholderTextColor={
              Colors.textSecondary
            }
            style={[
              styles.input,
              styles.reasonInput,
            ]}
            multiline
          />

          <AppButton
            title={
              isBooking
                ? "Booking..."
                : "Book Appointment"
            }
            onPress={() => {
              void handleBookAppointment();
            }}
          />

          <Pressable
            style={styles.cancelButton}
            disabled={isBooking}
            onPress={() => {
              setShowBooking(false);
            }}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={styles.backButton}
        onPress={() =>
          router.replace("/patient/doctors")
        }
      >
        <Text style={styles.backText}>
          ← Back to Doctors
        </Text>
      </Pressable>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.background,
    alignItems: "center",
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },

  notFoundContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
  },

  name: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginTop: Spacing.lg,
  },

  specialization: {
    fontSize: 17,
    color: Colors.primary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },

  location: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 14,
  },

  statsContainer: {
    width: "100%",
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  statLabel: {
    marginTop: Spacing.xs,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  sectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },

  actionContainer: {
    width: "100%",
    marginTop: Spacing.xl,
  },

  bookingCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
  },

  bookingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },

  pickerButton: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },

  pickerIcon: {
    fontSize: 25,
    marginRight: Spacing.md,
  },

  pickerTextContainer: {
    flex: 1,
  },

  pickerMainText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },

  pickerHint: {
    marginTop: 3,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  pickerArrow: {
    fontSize: 28,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
  },

  reasonInput: {
    height: 100,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },

  messageBox: {
    width: "100%",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
  },

  successBox: {
    backgroundColor: "#EAF8EF",
    borderColor: "#9AD5AC",
  },

  errorBox: {
    backgroundColor: "#FDECEC",
    borderColor: "#F0A0A0",
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },

  successText: {
    color: "#1F7A3D",
  },

  errorText: {
    color: "#B42318",
  },

  cancelButton: {
    alignItems: "center",
    marginTop: Spacing.md,
  },

  cancelText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: "600",
  },

  backButton: {
    marginTop: Spacing.lg,
  },

  backText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});