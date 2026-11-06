import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import Loading from "../components/common/Loading";
import { Colors } from "../constants/colors";

import { getUserProfile } from "../services/auth.service";

import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const { session, isLoading, loadSession, setSession } = useAuthStore();

  /*
   * Load saved session when app starts
   */
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  /*
   * Listen for auth changes
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  /*
   * Redirect according to authentication state
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute = pathname.startsWith("/auth");

    /*
     * No logged-in user
     */
    if (!session) {
      if (!isAuthRoute) {
        router.replace("/auth/login");
      }

      return;
    }

    /*
     * User is logged in.
     * Don't redirect again if already
     * inside patient/doctor/admin area.
     */
    const isAppRoute =
      pathname.startsWith("/patient") ||
      pathname.startsWith("/doctor") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/medicine") ||
      pathname.startsWith("/cart") ||
      pathname.startsWith("/search");

    if (isAppRoute) {
      return;
    }

    /*
     * Get user's role from profile
     */
    const redirectUser = async () => {
      try {
        const profile = await getUserProfile(session.user.id);

        if (profile.role === "patient") {
          router.replace("/patient");
          return;
        }

        if (profile.role === "doctor") {
          router.replace("/doctor");
          return;
        }

        if (profile.role === "admin") {
          await supabase.auth.signOut();
          setSession(null);
          router.replace("/auth/login");
          return;
        }

        await supabase.auth.signOut();
        setSession(null);

        router.replace("/auth/login");
      } catch (error) {
        console.error("Failed to load user profile:", error);

        await supabase.auth.signOut();
        setSession(null);

        router.replace("/auth/login");
      }
    };

    redirectUser();
  }, [isLoading, session, pathname, router, setSession]);

  /*
   * Show loading while restoring
   * the saved Supabase session.
   */
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading size="large" fullScreen={false} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
