import { useEffect, useState } from "react";
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

import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import Loading from "../../components/common/Loading";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

import {
  getProfile,
  updateProfile,
} from "../../services/profile.service";

import { useAuthStore } from "../../store/authStore";

type EditProfileForm = {
  full_name: string;
  mobile: string;
  date_of_birth: string;
  gender: string;
  city: string;
};

type Gender = "Male" | "Female" | "Other";

export default function EditProfileScreen() {
  const session = useAuthStore(
    (state) => state.session
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileForm>({
    defaultValues: {
      full_name: "",
      mobile: "",
      date_of_birth: "",
      gender: "",
      city: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setLoadError("");

        const profile =
          await getProfile(
            session.user.id
          );

        reset({
          full_name:
            profile.full_name ?? "",
          mobile:
            profile.mobile ?? "",
          date_of_birth:
            profile.date_of_birth ?? "",
          gender:
            profile.gender ?? "",
          city:
            profile.city ?? "",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load profile.";

        setLoadError(message);

        console.error(
          "Edit profile load error:",
          message
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [session?.user?.id, reset]);

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
    data: EditProfileForm
  ) => {
    if (!session?.user?.id) {
      return;
    }

    try {
      setIsSaving(true);

      await updateProfile(
        session.user.id,
        {
          full_name: data.full_name.trim(),
          mobile: data.mobile.trim(),
          date_of_birth:
            data.date_of_birth.trim(),
          gender: data.gender.trim(),
          city: data.city.trim(),
        }
      );

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () =>
              router.back(),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update profile.";

      Alert.alert(
        "Update Failed",
        message
      );

      console.error(
        "Profile update error:",
        message
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Loading
          size="large"
          fullScreen={false}
        />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Unable to load profile
        </Text>

        <Text style={styles.errorMessage}>
          {loadError}
        </Text>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Go Back"
            onPress={() =>
              router.back()
            }
          />
        </View>
      </View>
    );
  }

  const genders: Gender[] = [
    "Male",
    "Female",
    "Other",
  ];

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Edit Profile
      </Text>

      <Text style={styles.subtitle}>
        Update your personal information
      </Text>

      {/* Full Name */}
      <Controller
        control={control}
        name="full_name"
        rules={{
          required:
            "Full name is required",
          minLength: {
            value: 2,
            message:
              "Full name must be at least 2 characters",
          },
        }}
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
              error={!!errors.full_name}
            />

            {errors.full_name && (
              <Text style={styles.error}>
                {errors.full_name.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Mobile */}
      <Controller
        control={control}
        name="mobile"
        rules={{
          required:
            "Mobile number is required",
          pattern: {
            value: /^[6-9]\d{9}$/,
            message:
              "Enter a valid 10-digit mobile number",
          },
        }}
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

      {/* Date of Birth */}
      <Controller
        control={control}
        name="date_of_birth"
        rules={{
          required:
            "Date of birth is required",
        }}
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
                errors.date_of_birth &&
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
                    : new Date(
                        2000,
                        0,
                        1
                      )
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

            {errors.date_of_birth && (
              <Text style={styles.error}>
                {
                  errors.date_of_birth
                    .message
                }
              </Text>
            )}
          </View>
        )}
      />

      {/* Gender */}
      <Controller
        control={control}
        name="gender"
        rules={{
          required:
            "Gender is required",
        }}
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
        rules={{
          required: "City is required",
          minLength: {
            value: 2,
            message:
              "City must be at least 2 characters",
          },
        }}
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

      <View style={styles.buttonContainer}>
        <AppButton
          title={
            isSaving
              ? "Saving..."
              : "Save Changes"
          }
          onPress={handleSubmit(onSubmit)}
          disabled={isSaving}
        />
      </View>

      <View
        style={styles.cancelContainer}
      >
        <Text
          style={styles.cancelText}
          onPress={() => router.back()}
        >
          Cancel
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xxl,
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor:
      Colors.background,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    backgroundColor:
      Colors.background,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
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

  buttonContainer: {
    marginTop: Spacing.lg,
  },

  cancelContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },

  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  errorMessage: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});