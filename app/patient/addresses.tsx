import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";
import { supabase } from "../../services/supabase";

type Address = {
  id: string;
  full_name: string;
  mobile: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
};

export default function PatientAddresses() {
  const { from } = useLocalSearchParams<{
    from?: string;
  }>();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const loadAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
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
      const { data, error } = await supabase
        .from("delivery_addresses")
        .select(
          `
            id,
            full_name,
            mobile,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            is_default
          `,
        )
        .eq("patient_id", user.id)
        .order("is_default", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      setAddresses((data ?? []) as Address[]);
    } catch (error) {
      console.error("Load addresses error:", error);

      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Unable to load addresses.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);
  const resetForm = () => {
    setFullName("");
    setMobile("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPostalCode("");
  };

  const saveAddress = async () => {
    if (!fullName.trim()) {
      Alert.alert("Missing Name", "Please enter recipient name.");
      return;
    }

    if (!mobile.trim() || mobile.trim().length < 10) {
      Alert.alert("Invalid Mobile", "Please enter a valid mobile number.");
      return;
    }

    if (!addressLine1.trim()) {
      Alert.alert("Missing Address", "Please enter address.");
      return;
    }

    if (!city.trim()) {
      Alert.alert("Missing City", "Please enter city.");
      return;
    }

    if (!state.trim()) {
      Alert.alert("Missing State", "Please enter state.");
      return;
    }

    if (!postalCode.trim() || postalCode.trim().length !== 6) {
      Alert.alert("Invalid PIN Code", "Please enter a valid 6 digit PIN code.");
      return;
    }

    try {
      setIsSaving(true);

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

      const shouldBeDefault = addresses.length === 0;

      if (shouldBeDefault) {
        await supabase
          .from("delivery_addresses")
          .update({
            is_default: false,
            updated_at: new Date().toISOString(),
          })
          .eq("patient_id", user.id);
      }

      const { data: newAddress, error } = await supabase
        .from("delivery_addresses")
        .insert({
          patient_id: user.id,
          full_name: fullName.trim(),
          mobile: mobile.trim(),
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
          is_default: shouldBeDefault,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!newAddress) {
        throw new Error(
          "Address was saved but its ID was not returned.",
        );
      }

      resetForm();
      setShowForm(false);

      if (from === "checkout") {
        router.replace({
          pathname: "/patient/checkout",
          params: {
            addressId: newAddress.id,
          },
        });
        return;
      }

      await loadAddresses();

      Alert.alert(
        "Address Saved",
        "Delivery address saved successfully.",
      );
    } catch (error) {
      console.error("Save address error:", error);

      Alert.alert(
        "Save Failed",
        error instanceof Error ? error.message : "Unable to save address.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const makeDefault = async (addressId: string) => {
    try {
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

      const { error: resetError } = await supabase
        .from("delivery_addresses")
        .update({
          is_default: false,
          updated_at: new Date().toISOString(),
        })
        .eq("patient_id", user.id);

      if (resetError) {
        throw new Error(resetError.message);
      }

      const { error } = await supabase
        .from("delivery_addresses")
        .update({
          is_default: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", addressId)
        .eq("patient_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      await loadAddresses();
    } catch (error) {
      console.error("Default address error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to change default address.",
      );
    }
  };

  const deleteAddress = async (address: Address) => {
    Alert.alert("Delete Address", `Delete address for ${address.full_name}?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void performDeleteAddress(address.id);
        },
      },
    ]);
  };

  const performDeleteAddress = async (addressId: string) => {
    try {
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

      console.log("Deleting address:", addressId, "User:", user.id);

      const { data, error } = await supabase
        .from("delivery_addresses")
        .delete()
        .eq("id", addressId)
        .eq("patient_id", user.id)
        .select("id");

      if (error) {
        console.error("Supabase delete error:", error);

        throw new Error(error.message);
      }

      console.log("Deleted address:", data);

      if (!data || data.length === 0) {
        throw new Error(
          "Address was not deleted. Check your Supabase RLS policy.",
        );
      }

      await loadAddresses();

      Alert.alert("Deleted", "Delivery address deleted successfully.");
    } catch (error) {
      console.error("Delete address error:", error);

      Alert.alert(
        "Delete Failed",
        error instanceof Error ? error.message : "Unable to delete address.",
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />

        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Delivery Addresses</Text>

      <Text style={styles.subtitle}>
        Manage your medicine delivery addresses
      </Text>

      {addresses.map((address) => (
        <View key={address.id} style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Text style={styles.name}>{address.full_name}</Text>

            {address.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>DEFAULT</Text>
              </View>
            )}
          </View>

          <Text style={styles.mobile}>📱 {address.mobile}</Text>

          <Text style={styles.addressText}>{address.address_line1}</Text>

          {address.address_line2 && (
            <Text style={styles.addressText}>{address.address_line2}</Text>
          )}

          <Text style={styles.addressText}>
            {address.city}, {address.state}
          </Text>

          <Text style={styles.addressText}>PIN: {address.postal_code}</Text>

          <View style={styles.actionRow}>
            {!address.is_default && (
              <Pressable
                style={styles.defaultButton}
                onPress={() => {
                  void makeDefault(address.id);
                }}
              >
                <Text style={styles.defaultButtonText}>Make Default</Text>
              </Pressable>
            )}

            {from === "checkout" && (
              <Pressable
                style={styles.useAddressButton}
                onPress={() => {
                  router.replace({
                    pathname: "/patient/checkout",
                    params: {
                      addressId: address.id,
                    },
                  });
                }}
              >
                <Text style={styles.useAddressButtonText}>
                  Use This Address
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.deleteButton}
              onPress={() => {
                void deleteAddress(address);
              }}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {addresses.length === 0 && !showForm && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Address Added</Text>

          <Text style={styles.emptyText}>
            Add a delivery address before placing your next order.
          </Text>
        </View>
      )}

      <Pressable
        style={styles.addButton}
        onPress={() => {
          setShowForm((current) => !current);
        }}
      >
        <Text style={styles.addButtonText}>
          {showForm ? "Close" : "+ Add New Address"}
        </Text>
      </Pressable>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Delivery Address</Text>

          <Text style={styles.label}>Full Name</Text>

          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Recipient name"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Mobile</Text>

          <TextInput
            value={mobile}
            onChangeText={setMobile}
            placeholder="10 digit mobile number"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />

          <Text style={styles.label}>Address Line 1</Text>

          <TextInput
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="House no, street, area"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Address Line 2</Text>

          <TextInput
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Landmark, apartment etc. (optional)"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>City</Text>

          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>State</Text>

          <TextInput
            value={state}
            onChangeText={setState}
            placeholder="State"
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>PIN Code</Text>

          <TextInput
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="6 digit PIN code"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />

          <Pressable
            style={styles.saveButton}
            disabled={isSaving}
            onPress={() => {
              void saveAddress();
            }}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save Address"}
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
    </ScrollView>
  );
}

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

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
  },

  addressCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  defaultBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.round,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },

  defaultText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  mobile: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  addressText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },

  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },

  defaultButton: {
    flex: 1,
    height: 42,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  defaultButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  useAddressButton: {
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },

  useAddressButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  deleteButton: {
    flex: 1,
    height: 42,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyText: {
    marginTop: Spacing.sm,
    textAlign: "center",
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  addButton: {
    height: 50,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },

  addButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  formCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },

  formTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  label: {
    marginTop: Spacing.sm,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },

  saveButton: {
    height: 50,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },

  saveButtonText: {
    color: Colors.white,
    fontSize: 15,
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
