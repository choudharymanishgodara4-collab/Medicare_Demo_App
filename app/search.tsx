import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import EmptyState from "../components/common/EmptyState";
import SearchInput from "../components/common/SearchInput";
import DoctorCard from "../components/patient/DoctorCard";
import MedicineCard from "../components/patient/MedicineCard";

import { medicines } from "../data/medicines";
import { getDoctors, type Doctor } from "../services/doctor.service";

import { Colors } from "../constants/colors";
import { Spacing } from "../constants/spacing";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState("");

  // --------------------------------------------------
  // Load real doctors from Supabase
  // --------------------------------------------------

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoadingDoctors(true);
        setDoctorError("");

        const data = await getDoctors();

        setDoctors(data);
      } catch (error) {
        console.error("Search doctors load error:", error);

        setDoctorError(
          error instanceof Error ? error.message : "Unable to load doctors.",
        );
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    void loadDoctors();
  }, []);

  // --------------------------------------------------
  // Search doctors + medicines
  // --------------------------------------------------

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return {
        doctors: [],
        medicines: [],
      };
    }

    const doctorResults = doctors.filter((doctor) =>
      [doctor.name, doctor.specialization, doctor.category, doctor.city].some(
        (field) => field.toLowerCase().includes(value),
      ),
    );

    const medicineResults = medicines.filter((medicine) =>
      [medicine.name, medicine.category].some((field) =>
        field.toLowerCase().includes(value),
      ),
    );

    return {
      doctors: doctorResults,
      medicines: medicineResults,
    };
  }, [query, doctors]);

  const hasResults = results.doctors.length > 0 || results.medicines.length > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Search MediCare</Text>

      <SearchInput value={query} onChangeText={setQuery} />

      {!query.trim() && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What can you search?</Text>

          <Text style={styles.infoText}>
            Doctor name, specialization, category, city or medicine name
          </Text>
        </View>
      )}

      {/* --------------------------------------------------
          Doctor Loading
      -------------------------------------------------- */}

      {query.trim() && isLoadingDoctors && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />

          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      )}

      {query.trim() && !isLoadingDoctors && doctorError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Unable to load doctors</Text>

          <Text style={styles.errorText}>{doctorError}</Text>
        </View>
      )}

      {/* --------------------------------------------------
          Doctors
      -------------------------------------------------- */}

      {query.trim() &&
        !isLoadingDoctors &&
        !doctorError &&
        results.doctors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctors</Text>

            {results.doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onPress={() => {
                  router.push({
                    pathname: "/doctor/[id]",
                    params: {
                      id: doctor.id,
                    },
                  });
                }}
              />
            ))}
          </View>
        )}

      {/* --------------------------------------------------
          Medicines
      -------------------------------------------------- */}

      {query.trim() && results.medicines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicines</Text>

          {results.medicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onPress={() =>
                router.push({
                  pathname: "/medicine/[id]",
                  params: {
                    id: medicine.id,
                  },
                })
              }
            />
          ))}
        </View>
      )}

      {/* --------------------------------------------------
          No Results
      -------------------------------------------------- */}

      {query.trim() && !isLoadingDoctors && !doctorError && !hasResults && (
        <View style={styles.emptyState}>
          <EmptyState
            title="No results found"
            message="Try another doctor, specialist or medicine."
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.huge,
    backgroundColor: Colors.background,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },

  infoBox: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  infoTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  infoText: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },

  loadingBox: {
    marginTop: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },

  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 14,
  },

  errorBox: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  errorText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  section: {
    marginTop: Spacing.xxl,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  emptyState: {
    marginTop: Spacing.xl,
  },
});
