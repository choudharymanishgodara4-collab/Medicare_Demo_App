import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import EmptyState from "../../components/common/EmptyState";
import DoctorCard from "../../components/patient/DoctorCard";

import { getDoctors, type Doctor } from "../../services/doctor.service";

import { Colors } from "../../constants/colors";
import { Spacing } from "../../constants/spacing";

export default function DoctorList() {
  const { category } = useLocalSearchParams<{
    category?: string;
  }>();

  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getDoctors();

        setDoctors(data);
      } catch (err) {
        console.error("Failed to load doctors:", err);

        setError(
          err instanceof Error ? err.message : "Unable to load doctors.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadDoctors();
  }, []);

  const filteredDoctors = category
    ? doctors.filter(
        (doctor) => doctor.category.toLowerCase() === category.toLowerCase(),
      )
    : doctors;

  if (isLoading) {
  return (
    <>
      <Stack.Screen
        options={{
          title: category
            ? `${category} Specialists`
            : "Doctors",
        }}
      />

      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading doctors...
        </Text>
      </View>
    </>
  );
}

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Unable to load doctors"
          message={error}
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
          title: category
            ? `${category} Specialists`
            : "Doctors",
        }}
        />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {category ? `${category} Specialists` : "Doctors"}
        </Text>

        <Text style={styles.subtitle}>
          {category
            ? `Specialists in ${category}`
            : "Specialists in Ganganagar"}
        </Text>

        {filteredDoctors.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              title="No doctors found"
              message={`No ${
                category ?? ""
              } specialist is available right now.`}
            />
          </View>
        ) : (
          filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onPress={() =>
                router.push({
                  pathname: "/doctor/[id]",
                  params: {
                    id: doctor.id,
                  },
                })
              }
            />
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.huge,
    backgroundColor: Colors.background,
  },

  centerContainer: {
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

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },

  emptyWrapper: {
    marginTop: Spacing.xl,
  },
});
