import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

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

import Avatar from "../../components/common/Avatar";

import { supabase } from "../../services/supabase";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

type DoctorProfile = {
  full_name: string;
  email: string;
  specialization: string;
  city: string;
  experience: number;
  rating: number;
};

export default function DoctorProfileScreen() {
  const [profile, setProfile] =
    useState<DoctorProfile | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [isEditing, setIsEditing] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [specialization, setSpecialization] =
    useState("");

  const [city, setCity] =
    useState("");

  const [experience, setExperience] =
    useState("");

  // ---------------------------------
  // Load doctor profile
  // ---------------------------------
  const loadProfile = useCallback(async () => {
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
      // Get basic profile
      // ---------------------------------
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .eq("role", "doctor")
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profileData) {
        throw new Error("Doctor profile not found.");
      }

      // ---------------------------------
      // Get doctor-specific profile
      // ---------------------------------
      const {
        data: doctorData,
        error: doctorError,
      } = await supabase
        .from("doctor_profiles")
        .select(
          "specialization, city, experience, rating",
        )
        .eq("user_id", user.id)
        .single();

      if (doctorError) {
        throw new Error(doctorError.message);
      }

      if (!doctorData) {
        throw new Error(
          "Doctor professional profile not found.",
        );
      }

      const nextProfile: DoctorProfile = {
        full_name:
          profileData.full_name ?? "Doctor",

        email: user.email ?? "",

        specialization:
          doctorData.specialization ?? "",

        city:
          doctorData.city ?? "",

        experience:
          Number(doctorData.experience ?? 0),

        rating:
          Number(doctorData.rating ?? 0),
      };

      setProfile(nextProfile);

      // Fill edit fields
      setFullName(nextProfile.full_name);
      setSpecialization(
        nextProfile.specialization,
      );
      setCity(nextProfile.city);
      setExperience(
        String(nextProfile.experience),
      );
    } catch (err) {
      console.error(
        "Doctor profile error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load profile.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh whenever screen gets focus
  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  // ---------------------------------
  // Open edit mode
  // ---------------------------------
  const handleStartEditing = () => {
    if (!profile) {
      return;
    }

    setFullName(profile.full_name);
    setSpecialization(profile.specialization);
    setCity(profile.city);
    setExperience(
      String(profile.experience),
    );

    setIsEditing(true);
  };

  // ---------------------------------
  // Cancel edit
  // ---------------------------------
  const handleCancelEditing = () => {
    if (!profile) {
      setIsEditing(false);
      return;
    }

    setFullName(profile.full_name);
    setSpecialization(
      profile.specialization,
    );
    setCity(profile.city);
    setExperience(
      String(profile.experience),
    );

    setIsEditing(false);
  };

  // ---------------------------------
  // Save profile
  // ---------------------------------
  const handleSaveProfile = async () => {
    try {
      const cleanName = fullName.trim();
      const cleanSpecialization =
        specialization.trim();
      const cleanCity = city.trim();
      const cleanExperience =
        experience.trim();

      if (!cleanName) {
        Alert.alert(
          "Validation",
          "Please enter your full name.",
        );
        return;
      }

      if (!cleanSpecialization) {
        Alert.alert(
          "Validation",
          "Please enter your specialization.",
        );
        return;
      }

      if (!cleanCity) {
        Alert.alert(
          "Validation",
          "Please enter your city.",
        );
        return;
      }

      if (!cleanExperience) {
        Alert.alert(
          "Validation",
          "Please enter your experience.",
        );
        return;
      }

      const experienceNumber =
        Number(cleanExperience);

      if (
        !Number.isInteger(experienceNumber) ||
        experienceNumber < 0
      ) {
        Alert.alert(
          "Validation",
          "Experience must be a valid whole number.",
        );
        return;
      }

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

      setIsSaving(true);

      // ---------------------------------
      // Update basic profile
      // ---------------------------------
      const {
        error: profileUpdateError,
      } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
        })
        .eq("id", user.id)
        .eq("role", "doctor");

      if (profileUpdateError) {
        throw new Error(
          profileUpdateError.message,
        );
      }

      // ---------------------------------
      // Update doctor profile
      // ---------------------------------
      const {
        error: doctorUpdateError,
      } = await supabase
        .from("doctor_profiles")
        .update({
          specialization:
            cleanSpecialization,

          city: cleanCity,

          experience:
            experienceNumber,
        })
        .eq("user_id", user.id);

      if (doctorUpdateError) {
        throw new Error(
          doctorUpdateError.message,
        );
      }

      // ---------------------------------
      // Update local state immediately
      // ---------------------------------
      setProfile((current) =>
        current
          ? {
              ...current,

              full_name: cleanName,

              specialization:
                cleanSpecialization,

              city: cleanCity,

              experience:
                experienceNumber,
            }
          : current,
      );

      setIsEditing(false);

      Alert.alert(
        "Profile Updated",
        "Your doctor profile has been updated successfully.",
      );

      // Refresh from Supabase
      await loadProfile();
    } catch (err) {
      console.error(
        "Doctor profile update error:",
        err,
      );

      Alert.alert(
        "Update Failed",
        err instanceof Error
          ? err.message
          : "Unable to update profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------
  // Logout
  // ---------------------------------
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              const {
                error: logoutError,
              } =
                await supabase.auth.signOut();

              if (logoutError) {
                throw new Error(
                  logoutError.message,
                );
              }

              router.replace(
                "/auth/login",
              );
            } catch (err) {
              console.error(
                "Logout error:",
                err,
              );

              Alert.alert(
                "Logout Failed",
                "Unable to logout.",
              );
            }
          },
        },
      ],
    );
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
          Loading profile...
        </Text>
      </View>
    );
  }

  // ---------------------------------
  // Error
  // ---------------------------------
  if (error || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || "Profile not found."}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => {
            void loadProfile();
          }}
        >
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ---------------------------------
          Header
      --------------------------------- */}
      <View style={styles.header}>
        <Avatar
          name={profile.full_name}
          size={110}
        />

        <Text style={styles.name}>
          {profile.full_name}
        </Text>

        <Text style={styles.specialization}>
          {profile.specialization ||
            "Specialization not added"}
        </Text>

        <Text style={styles.email}>
          {profile.email}
        </Text>
      </View>

      {/* ---------------------------------
          Professional Information
      --------------------------------- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Professional Information
        </Text>

        <InfoRow
          label="Specialization"
          value={
            profile.specialization ||
            "Not added"
          }
        />

        <InfoRow
          label="City"
          value={
            profile.city || "Not added"
          }
        />

        <InfoRow
          label="Experience"
          value={`${profile.experience} years`}
        />

        <InfoRow
          label="Rating"
          value={`⭐ ${profile.rating}`}
          last
        />
      </View>

      {/* ---------------------------------
          Account
      --------------------------------- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Account
        </Text>

        <InfoRow
          label="Email"
          value={profile.email}
        />

        <InfoRow
          label="Role"
          value="Doctor"
          last
        />
      </View>

      {/* ---------------------------------
          Edit Profile
      --------------------------------- */}
      {!isEditing ? (
        <View style={styles.actionCard}>
          <Pressable
            style={styles.editButton}
            onPress={handleStartEditing}
          >
            <Text
              style={styles.editButtonText}
            >
              Edit Profile
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Edit Profile
          </Text>

          {/* Full Name */}
          <Text style={styles.inputLabel}>
            Full Name
          </Text>

          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor={
              Colors.textSecondary
            }
            style={styles.input}
            autoCapitalize="words"
          />

          {/* Specialization */}
          <Text style={styles.inputLabel}>
            Specialization
          </Text>

          <TextInput
            value={specialization}
            onChangeText={
              setSpecialization
            }
            placeholder="Enter specialization"
            placeholderTextColor={
              Colors.textSecondary
            }
            style={styles.input}
            autoCapitalize="words"
          />

          {/* City */}
          <Text style={styles.inputLabel}>
            City
          </Text>

          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            placeholderTextColor={
              Colors.textSecondary
            }
            style={styles.input}
            autoCapitalize="words"
          />

          {/* Experience */}
          <Text style={styles.inputLabel}>
            Experience (Years)
          </Text>

          <TextInput
            value={experience}
            onChangeText={setExperience}
            placeholder="e.g. 12"
            placeholderTextColor={
              Colors.textSecondary
            }
            style={styles.input}
            keyboardType="number-pad"
          />

          {/* Rating Read Only */}
          <View style={styles.readOnlyBox}>
            <Text
              style={styles.readOnlyLabel}
            >
              Rating
            </Text>

            <Text
              style={styles.readOnlyValue}
            >
              ⭐ {profile.rating}
            </Text>

            <Text
              style={styles.readOnlyHint}
            >
              Rating cannot be edited from
              this screen.
            </Text>
          </View>

          {/* Save / Cancel */}
          <View style={styles.editActions}>
            <Pressable
              style={[
                styles.saveButton,
                isSaving &&
                  styles.disabledButton,
              ]}
              disabled={isSaving}
              onPress={() => {
                void handleSaveProfile();
              }}
            >
              <Text
                style={styles.saveButtonText}
              >
                {isSaving
                  ? "Saving..."
                  : "Save Changes"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelEditButton}
              disabled={isSaving}
              onPress={
                handleCancelEditing
              }
            >
              <Text
                style={
                  styles.cancelEditText
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ---------------------------------
          Logout
      --------------------------------- */}
      <Pressable
        style={[
          styles.logoutButton,
          isEditing &&
            styles.disabledButton,
        ]}
        disabled={isEditing}
        onPress={() => {
          void handleLogout();
        }}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>

      {/* ---------------------------------
          Back
      --------------------------------- */}
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

// ============================================
// Info Row
// ============================================

type InfoRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

function InfoRow({
  label,
  value,
  last = false,
}: InfoRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        last && styles.infoRowLast,
      ]}
    >
      <Text style={styles.label}>
        {label}
      </Text>

      <Text style={styles.value}>
        {value}
      </Text>
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

  errorText: {
    color: Colors.danger,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },

  retryButton: {
    minWidth: 120,
    height: 46,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  retryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },

  name: {
    marginTop: Spacing.lg,
    fontSize: 27,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  specialization: {
    marginTop: Spacing.xs,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
    textAlign: "center",
  },

  email: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
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

  infoRowLast: {
    borderBottomWidth: 0,
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

  actionCard: {
    marginBottom: Spacing.lg,
  },

  editButton: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  editButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  inputLabel: {
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontSize: 15,
  },

  readOnlyBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  readOnlyLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  readOnlyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  readOnlyHint: {
    marginTop: Spacing.xs,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  editActions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },

  saveButton: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  cancelEditButton: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelEditText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.6,
  },

  logoutButton: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },

  logoutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: "700",
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