import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import EmptyState from "../../components/common/EmptyState";
import MedicineCard from "../../components/patient/MedicineCard";

import { getMedicines, Medicine } from "../../services/medicine.service";

import { Colors } from "../../constants/colors";
import { Spacing } from "../../constants/spacing";

export default function MedicineList() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getMedicines();
        setMedicines(data);
      } catch (err) {
        console.error("Failed to load medicines:", err);

        setError(
          err instanceof Error ? err.message : "Unable to load medicines.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadMedicines();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />

        <Text style={styles.loadingText}>Loading medicines...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Unable to load medicines"
          message={error}
          actionText="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Medicines</Text>

      <Text style={styles.subtitle}>Browse available medicines</Text>

      {medicines.length === 0 ? (
        <EmptyState
          title="No medicines found"
          message="No medicines are available right now."
        />
      ) : (
        medicines.map((medicine) => (
          <MedicineCard
            key={medicine.id}
            medicine={medicine}
            onPress={() =>
              router.push({
                pathname: "/patient/medicine/[id]",
                params: {
                  id: medicine.id,
                },
              })
            }
          />
        ))
      )}
    </ScrollView>
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
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },

  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 14,
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
});
