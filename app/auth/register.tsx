import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

import {
  PatientRegisterForm,
  patientRegisterSchema,
} from "../../types/auth";

import { signUpPatient } from "../../services/auth.service";

type Gender = "Male" | "Female" | "Other";

export default function RegisterScreen() {
  const [serverError, setServerError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<PatientRegisterForm>({
    resolver: zodResolver(patientRegisterSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      gender: "",
      city: "",
    },
  });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const onSubmit = async (
    data: PatientRegisterForm
  ) => {
    try {
      setServerError("");

      console.log("✅ FORM VALID:", data);

      const result = await signUpPatient({
        email: data.email.trim(),
        password: data.password,
        fullName: data.fullName.trim(),
        mobile: data.mobile.trim(),
        dateOfBirth: data.dateOfBirth.trim(),
        gender: data.gender.trim(),
        city: data.city.trim(),
      });

      if (!result.session) {
        Alert.alert(
          "Registration Successful",
          "Your account has been created. Please verify your email before logging in.",
          [
            {
              text: "Go to Login",
              onPress: () =>
                router.replace("/auth/login"),
            },
          ]
        );

        return;
      }

      Alert.alert(
        "Registration Successful",
        "Your patient account has been created.",
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace("/patient"),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      console.log(
        "❌ REGISTRATION ERROR:",
        message
      );

      setServerError(message);

      Alert.alert(
        "Registration Failed",
        message
      );
    }
  };

  const genders: Gender[] = [
    "Male",
    "Female",
    "Other",
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Create Account
        </Text>

        <Text style={styles.subtitle}>
          Register as a Patient
        </Text>
      </View>

      {/* Full Name */}
      <Controller
        control={control}
        name="fullName"
        render={({
          field: {
            onChange,
            onBlur,
            value,
          },
        }) => (
          <View style={styles.field}>
            <AppInput
              placeholder="Full Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              error={!!errors.fullName}
            />

            {errors.fullName && (
              <Text style={styles.error}>
                {errors.fullName.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Mobile */}
      <Controller
        control={control}
        name="mobile"
        render={({
          field: {
            onChange,
            onBlur,
            value,
          },
        }) => (
          <View style={styles.field}>
            <AppInput
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              maxLength={10}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.mobile}
            />

            {errors.mobile && (
              <Text style={styles.error}>
                {errors.mobile.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Email */}
      <Controller
        control={control}
        name="email"
        render={({
          field: {
            onChange,
            onBlur,
            value,
          },
        }) => (
          <View style={styles.field}>
            <AppInput
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.email}
            />

            {errors.email && (
              <Text style={styles.error}>
                {errors.email.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Password */}
      <Controller
        control={control}
        name="password"
        render={({
          field: {
            onChange,
            onBlur,
            value,
          },
        }) => (
          <View style={styles.field}>
            <AppInput
              placeholder="Password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.password}
            />

            {errors.password && (
              <Text style={styles.error}>
                {errors.password.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Confirm Password */}
      <Controller
        control={control}
        name="confirmPassword"
        render={({
          field: {
            onChange,
            onBlur,
            value,
          },
        }) => (
          <View style={styles.field}>
            <AppInput
              placeholder="Confirm Password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.confirmPassword}
            />

            {errors.confirmPassword && (
              <Text style={styles.error}>
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Date of Birth */}
      <Controller
        control={control}
        name="dateOfBirth"
        render={({
          field: {
            onChange,
            value,
          },
        }) => (
          <View style={styles.field}>
            <Pressable
              style={[
                styles.dateInput,
                errors.dateOfBirth &&
                  styles.dateInputError,
              ]}
              onPress={() =>
                setShowDatePicker(true)
              }
            >
              <Text
                style={[
                  styles.dateText,
                  !value &&
                    styles.placeholderText,
                ]}
              >
                {value || "Date of Birth"}
              </Text>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={
                  value
                    ? new Date(value)
                    : new Date(2000, 0, 1)
                }
                mode="date"
                display={
                  Platform.OS === "android"
                    ? "calendar"
                    : "spinner"
                }
                maximumDate={new Date()}
                onChange={(
                  _event,
                  selectedDate
                ) => {
                  setShowDatePicker(false);

                  if (selectedDate) {
                    onChange(
                      formatDate(
                        selectedDate
                      )
                    );
                  }
                }}
              />
            )}

            {errors.dateOfBirth && (
              <Text style={styles.error}>
                {errors.dateOfBirth.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Gender */}
      <Controller
        control={control}
        name="gender"
        render={({
          field: {
            onChange,
            value,
          },
        }) => (
          <View style={styles.genderField}>
            <Text style={styles.genderLabel}>
              Gender
            </Text>

            <View style={styles.genderRow}>
              {genders.map((gender) => {
                const selected =
                  value === gender;

                return (
                  <Pressable
                    key={gender}
                    onPress={() =>
                      onChange(gender)
                    }
                    style={[
                      styles.genderOption,
                      selected &&
                        styles.genderSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        selected &&
                          styles.radioSelected,
                      ]}
                    />

                    <Text
                      style={[
                        styles.genderText,
                        selected &&
                          styles.genderTextSelected,
                      ]}
                    >
                      {gender}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {errors.gender && (
              <Text style={styles.error}>
                {errors.gender.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* City */}
      <Controller
        control={control}
        name="city"
        render={({
          field: {
            onChange,
            onBlur,
            value,
          },
        }) => (
          <View style={styles.field}>
            <AppInput
              placeholder="City"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              error={!!errors.city}
            />

            {errors.city && (
              <Text style={styles.error}>
                {errors.city.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Server Error */}
      {serverError !== "" && (
        <View style={styles.serverErrorBox}>
          <Text style={styles.serverErrorText}>
            {serverError}
          </Text>
        </View>
      )}

      {/* Create Account */}
      <View style={styles.buttonContainer}>
        <AppButton
          title={
            isSubmitting
              ? "Creating Account..."
              : "Create Account"
          }
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />
      </View>

      {/* Login */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginLabel}>
          Already have an account?
        </Text>

        <Text
          style={styles.loginLink}
          onPress={() =>
            router.push("/auth/login")
          }
        >
          {" "}
          Login
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: Colors.background,
  },

  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },

  field: {
    marginBottom: Spacing.sm,
  },

  error: {
    color: Colors.danger,
    fontSize: 13,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },

  dateInput: {
    height: 52,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
  },

  dateInputError: {
    borderColor: Colors.danger,
  },

  dateText: {
    fontSize: 16,
    color: Colors.text,
  },

  placeholderText: {
    color: Colors.textSecondary,
  },

  genderField: {
    marginBottom: Spacing.sm,
  },

  genderLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },

  genderRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  genderOption: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
  },

  genderSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },

  radio: {
    width: 16,
    height: 16,
    borderRadius: Radius.round,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },

  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },

  genderText: {
    fontSize: 14,
    color: Colors.text,
  },

  genderTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },

  serverErrorBox: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
  },

  serverErrorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },

  buttonContainer: {
    marginTop: Spacing.lg,
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },

  loginLabel: {
    color: Colors.textSecondary,
    fontSize: 15,
  },

  loginLink: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});