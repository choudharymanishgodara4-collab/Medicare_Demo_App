import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import Avatar from "../../../components/common/Avatar";
import AppButton from "../../../components/common/AppButton";
import Loading from "../../../components/common/Loading";
import EmptyState from "../../../components/common/EmptyState";

import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";

import {
  getUserProfile,
} from "../../../services/auth.service";

import {
  deleteAvatar,
  getAvatarUrl,
  uploadAvatar,
} from "../../../services/profile.service";

import { useAuthStore } from "../../../store/authStore";

type PatientProfileData = {
  role: "patient" | "doctor" | "admin";
  full_name: string;
  mobile: string | null;
  date_of_birth: string | null;
  gender: string | null;
  city: string | null;
  avatar_url: string | null;
};

type ImageAction = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

export default function PatientProfile() {
  const session = useAuthStore(
    (state) => state.session,
  );

  const logout = useAuthStore(
    (state) => state.logout,
  );

  const [profile, setProfile] =
    useState<PatientProfileData | null>(
      null,
    );

  const [avatarUrl, setAvatarUrl] =
    useState<string | undefined>(
      undefined,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUploading, setIsUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadProfile = useCallback(
    async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");

        const data =
          await getUserProfile(
            session.user.id,
          );

        const profileData =
          data as PatientProfileData;

        setProfile(profileData);

        if (profileData.avatar_url) {
          const signedUrl =
            await getAvatarUrl(
              profileData.avatar_url,
            );

          setAvatarUrl(signedUrl);
        } else {
          setAvatarUrl(undefined);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load profile.";

        console.error(
          "Profile load error:",
          message,
        );

        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const formatError = (
    error: unknown,
  ) => {
    return error instanceof Error
      ? error.message
      : "Something went wrong.";
  };

  const openImageOptions = () => {
    const actions: ImageAction[] = [
      {
        text: "Camera",
        onPress: () => {
          void handleCamera();
        },
      },
      {
        text: "Gallery",
        onPress: () => {
          void handleGallery();
        },
      },
    ];

    if (profile?.avatar_url) {
      actions.push({
        text: "Remove Photo",
        style: "destructive",
        onPress: confirmDeletePhoto,
      });
    }

    actions.push({
      text: "Cancel",
      style: "cancel",
    });

    Alert.alert(
      "Profile Photo",
      "Choose an option",
      actions,
    );
  };

  const handleCamera = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera Permission",
          "Camera permission is required to take a profile photo.",
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      await uploadSelectedImage(
        result.assets[0],
      );
    } catch (error) {
      console.error(
        "Camera error:",
        error,
      );

      Alert.alert(
        "Camera Error",
        formatError(error),
      );
    }
  };

  const handleGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Gallery Permission",
          "Photo library permission is required.",
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          },
        );

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      await uploadSelectedImage(
        result.assets[0],
      );
    } catch (error) {
      console.error(
        "Gallery error:",
        error,
      );

      Alert.alert(
        "Gallery Error",
        formatError(error),
      );
    }
  };

  const uploadSelectedImage = async (
    asset: ImagePicker.ImagePickerAsset,
  ) => {
    if (!session?.user?.id) {
      return;
    }

    try {
      setIsUploading(true);

      const path =
        await uploadAvatar(
          session.user.id,
          asset.uri,
          asset.mimeType ||
            "image/jpeg",
        );

      const signedUrl =
        await getAvatarUrl(path);

      setAvatarUrl(signedUrl);

      setProfile((current) =>
        current
          ? {
              ...current,
              avatar_url: path,
            }
          : current,
      );

      Alert.alert(
        "Profile Photo Updated",
        "Your profile photo has been updated successfully.",
      );
    } catch (error) {
      console.error(
        "Avatar upload error:",
        error,
      );

      Alert.alert(
        "Upload Failed",
        formatError(error),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeletePhoto = () => {
    Alert.alert(
      "Remove Profile Photo",
      "Are you sure you want to remove your profile photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void handleDeletePhoto();
          },
        },
      ],
    );
  };

  const handleDeletePhoto = async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      setIsUploading(true);

      await deleteAvatar(
        session.user.id,
      );

      setAvatarUrl(undefined);

      setProfile((current) =>
        current
          ? {
              ...current,
              avatar_url: null,
            }
          : current,
      );

      Alert.alert(
        "Photo Removed",
        "Your profile photo has been removed.",
      );
    } catch (error) {
      console.error(
        "Avatar delete error:",
        error,
      );

      Alert.alert(
        "Delete Failed",
        formatError(error),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();

      router.replace("/auth/login");
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );

      Alert.alert(
        "Logout Failed",
        "Unable to logout. Please try again.",
      );
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

  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Profile unavailable"
          message={
            error ||
            "We couldn't load your profile."
          }
          actionText="Go Home"
          onAction={() =>
            router.replace("/patient")
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Pressable
          onPress={openImageOptions}
          disabled={isUploading}
        >
          <View style={styles.avatarWrapper}>
            <Avatar
              name={profile.full_name}
              uri={avatarUrl}
              size={100}
            />

            <View style={styles.avatarButton}>
              <Text
                style={
                  styles.avatarButtonText
                }
              >
                📷
              </Text>
            </View>

            {isUploading && (
              <View
                style={
                  styles.uploadOverlay
                }
              >
                <Loading
                  size="small"
                  fullScreen={false}
                />
              </View>
            )}
          </View>
        </Pressable>

        <Text
          style={
            styles.changePhotoText
          }
        >
          Tap photo to change
        </Text>

        <Text
          style={styles.photoAction}
          onPress={openImageOptions}
        >
          Change Photo
        </Text>

        <Text style={styles.name}>
          {profile.full_name}
        </Text>

        <Text style={styles.email}>
          {session?.user?.email}
        </Text>
      </View>

      {/* Personal Information */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Personal Information
        </Text>

        <ProfileRow
          label="Full Name"
          value={profile.full_name}
        />

        <ProfileRow
          label="Mobile"
          value={
            profile.mobile ||
            "Not added"
          }
        />

        <ProfileRow
          label="Date of Birth"
          value={
            profile.date_of_birth ||
            "Not added"
          }
        />

        <ProfileRow
          label="Gender"
          value={
            profile.gender ||
            "Not added"
          }
        />

        <ProfileRow
          label="City"
          value={
            profile.city ||
            "Not added"
          }
        />
      </View>

      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Account
        </Text>

        <ProfileRow
          label="Role"
          value={
            profile.role === "patient"
              ? "Patient"
              : profile.role
          }
        />
      </View>

      {/* Edit Profile */}
      <AppButton
        title="Edit Profile"
        onPress={() =>
          router.push(
            "/patient/edit-profile",
          )
        }
      />

      {/* Orders */}
      <View style={styles.actionsCard}>
        <ActionRow
          title="My Orders"
          subtitle="View medicine orders"
          onPress={() =>
  router.push("../orders")
}
        />

        <ActionRow
  title="My Prescriptions"
  subtitle="View your prescriptions"
  onPress={() =>
    router.push("/patient/prescriptions")
  }
/>

        <ActionRow
  title="My Consultations"
  subtitle="View doctor consultations"
  onPress={() =>
    router.push("/patient/consultations")
  }
/>
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <AppButton
          title="Logout"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

type ProfileRowProps = {
  label: string;
  value: string;
};

function ProfileRow({
  label,
  value,
}: ProfileRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>
        {label}
      </Text>

      <Text style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

type ActionRowProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
};

function ActionRow({
  title,
  subtitle,
  onPress,
}: ActionRowProps) {
  return (
    <Pressable
      style={styles.actionRow}
      onPress={onPress}
    >
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text
          style={styles.actionSubtitle}
        >
          {subtitle}
        </Text>
      </View>

      <Text style={styles.arrow}>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    backgroundColor:
      Colors.background,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor:
      Colors.background,
  },

  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatarButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: Radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },

  avatarButtonText: {
    fontSize: 15,
  },

  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.75)",
  },

  changePhotoText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  photoAction: {
    marginTop: Spacing.xs,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },

  name: {
    marginTop: Spacing.md,
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
  },

  email: {
    marginTop: Spacing.xs,
    fontSize: 14,
    color: Colors.textSecondary,
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

  row: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor:
      Colors.border,
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

  actionsCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor:
      Colors.border,
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
    color: Colors.textSecondary,
  },

  arrow: {
    fontSize: 28,
    color: Colors.textSecondary,
  },

  logoutContainer: {
    marginTop: Spacing.md,
  },
});