import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router, Stack, useLocalSearchParams } from "expo-router";

import { useCartStore } from "../../store/cartStore";

import AppButton from "../../components/common/AppButton";
import EmptyState from "../../components/common/EmptyState";
import MedicineInfoSection from "../../components/patient/MedicineInfoSection";

import {
  getMedicineById,
  Medicine,
} from "../../services/medicine.service";

import { Colors } from "../../constants/colors";
import { Spacing } from "../../constants/spacing";
import { Radius } from "../../constants/radius";

export default function MedicineDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [medicine, setMedicine] =
    useState<Medicine | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const addToCart = useCartStore(
    (state) => state.addToCart,
  );

  useEffect(() => {
    const loadMedicine = async () => {
      if (!id) {
        setError("Medicine ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const data = await getMedicineById(id);

        if (!data) {
          setMedicine(null);
          return;
        }

        setMedicine(data);
      } catch (err) {
        console.error(
          "Failed to load medicine:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load medicine.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadMedicine();
  }, [id]);

  const handleAddToCart = async () => {
    if (!medicine) {
      return;
    }

    try {
      await addToCart({
        id: medicine.id,
        name: medicine.name,
        price: medicine.price,
      });

      Alert.alert(
        "Added to Cart",
        `${medicine.name} has been added to your cart.`,
      );
    } catch (err) {
      Alert.alert(
        "Unable to Add",
        err instanceof Error
          ? err.message
          : "Could not add this medicine to your cart.",
      );
    }
  };

  if (isLoading) {
    return (
      <>
      <Stack.Screen
  options={{
    title: "Medicine Details",
  }}
/>
  <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading medicine...
        </Text>
      </View>
      </>
      
    );
  }

  if (error || !medicine) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Medicine not found"
          message={
            error ||
            "The medicine you are looking for is not available."
          }
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
    title: "Medicine Details",
  }}
/>
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.medicineIconBox}>
        <Text style={styles.medicineIcon}>💊</Text>
      </View>

      <Text style={styles.name}>
        {medicine.name}
      </Text>

      <Text style={styles.category}>
        {medicine.category}
      </Text>

      <Text style={styles.price}>
        ₹{medicine.price}
      </Text>

      <MedicineInfoSection title="Description">
        <Text style={styles.sectionText}>
          {medicine.description}
        </Text>
      </MedicineInfoSection>

      <MedicineInfoSection title="Manufacturer">
        <Text style={styles.sectionText}>
          {medicine.manufacturer}
        </Text>
      </MedicineInfoSection>

      <View style={styles.actionContainer}>
        <AppButton
          title="Add to Cart"
          onPress={() => {
            void handleAddToCart();
          }}
        />
      </View>

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
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

  medicineIconBox: {
    width: 120,
    height: 120,
    borderRadius: Radius.round,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },

  medicineIcon: {
    fontSize: 55,
  },

  name: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  category: {
    color: Colors.primary,
    fontSize: 16,
    marginTop: Spacing.sm,
  },

  price: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: Spacing.sm,
  },

  sectionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },

  actionContainer: {
    width: "100%",
    marginTop: Spacing.xl,
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