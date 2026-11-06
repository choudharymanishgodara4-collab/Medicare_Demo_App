import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

import { getUserProfile, signIn } from "../../services/auth.service";

import { LoginForm, loginSchema } from "../../types/auth";

export default function LoginScreen() {
  const [serverError, setServerError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setServerError("");

      const result = await signIn(data.email.trim(), data.password);

      if (!result.user) {
        throw new Error("Login failed. User information not found.");
      }

      const profile = await getUserProfile(result.user.id);

      if (profile.role === "patient") {
        router.replace("/patient");
        return;
      }

      if (profile.role === "doctor") {
        router.replace("/doctor");
        return;
      }

      if (profile.role === "admin") {
        router.replace("/admin");
        return;
      }

      throw new Error("User role is not configured correctly.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";

      console.log("❌ LOGIN ERROR:", message);

      setServerError(message);

      Alert.alert("Login Failed", message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MediCare</Text>

        <Text style={styles.subtitle}>Login to continue</Text>
      </View>

      {/* Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
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
              <Text style={styles.error}>{errors.email.message}</Text>
            )}
          </View>
        )}
      />

      {/* Password */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
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
              <Text style={styles.error}>{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      {/* Server Error */}
      {serverError !== "" && (
        <View style={styles.serverErrorBox}>
          <Text style={styles.serverErrorText}>{serverError}</Text>
        </View>
      )}

      {/* Login */}
      <View style={styles.buttonContainer}>
        <AppButton
          title={isSubmitting ? "Logging in..." : "Login"}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />
      </View>

      {/* Register */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerLabel}>Don`t have an account?</Text>

        <Text
          style={styles.registerLink}
          onPress={() => router.push("/auth/register")}
        >
          {" "}
          Register
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.background,
  },

  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
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

  serverErrorBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },

  serverErrorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },

  buttonContainer: {
    marginTop: Spacing.lg,
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },

  registerLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },

  registerLink: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600",
  },
});
