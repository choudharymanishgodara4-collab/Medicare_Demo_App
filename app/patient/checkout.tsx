import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

import { createOrder } from "../../services/order.service";
import { supabase } from "../../services/supabase";
import { useCartStore } from "../../store/cartStore";

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

export default function CheckoutScreen() {
  const { addressId } =
    useLocalSearchParams<{
      addressId?: string;
    }>();
  const {
    items,
    isLoading: isCartLoading,
    loadCart,
    clearCart,
  } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const loadAddresses = useCallback(async () => {
    try {
      setIsLoadingAddresses(true);

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

      const loadedAddresses = (data ?? []) as Address[];

      setAddresses(loadedAddresses);

      // Prefer an address passed back from the address manager.
      if (addressId) {
        const selectedAddress = loadedAddresses.find(
          (address) => address.id === addressId,
        );

        if (selectedAddress) {
          setSelectedAddressId(selectedAddress.id);
          return;
        }
      }

      // Otherwise prefer the patient's default address.
      const defaultAddress = loadedAddresses.find(
        (address) => address.is_default,
      );

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (loadedAddresses.length > 0) {
        setSelectedAddressId(loadedAddresses[0].id);
      } else {
        setSelectedAddressId(null);
      }
    } catch (error) {
      console.error("Load checkout addresses error:", error);

      Alert.alert(
        "Address Error",
        error instanceof Error
          ? error.message
          : "Unable to load delivery addresses.",
      );
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [addressId]);

  useEffect(() => {
    void loadCart();
    void loadAddresses();
  }, [loadCart, loadAddresses]);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert("Cart Empty", "Please add medicines before checkout.");
      return;
    }

    if (!selectedAddressId) {
      Alert.alert("Select Address", "Please select a delivery address.");
      return;
    }

    try {
      setIsPlacingOrder(true);

      await createOrder(
  items.map((item) => ({
    medicineId: item.id,
    medicineName: item.name,
    price: item.price,
    quantity: item.quantity,
  })),
  selectedAddressId,
);

      await clearCart();

      Alert.alert(
        "Order Placed",
        "Your medicine order has been placed successfully.",
        [
          {
            text: "View Orders",
            onPress: () => {
              router.replace("/patient/orders");
            },
          },
        ],
      );
    } catch (error) {
      console.error("Checkout order error:", error);

      Alert.alert(
        "Order Failed",
        error instanceof Error ? error.message : "Unable to place your order.",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isCartLoading || isLoadingAddresses) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />

        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>

        <Text style={styles.emptyText}>
          Add medicines to your cart before checkout.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/medicine")}
        >
          <Text style={styles.primaryButtonText}>Browse Medicines</Text>
        </Pressable>
      </View>
    );
  }

  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? null;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Checkout</Text>

      <Text style={styles.subtitle}>
        Review your order and choose a delivery address
      </Text>

      {/* Delivery Address */}

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Delivery Address</Text>

            <Text style={styles.sectionSubtitle}>
              Where should we deliver your medicines?
            </Text>
          </View>

          <Pressable
            onPress={() => {
              router.push({
                pathname: "/patient/addresses",
                params: {
                  from: "checkout",
                },
              });
            }}
          >
            <Text style={styles.manageText}>Manage</Text>
          </Pressable>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.noAddressBox}>
            <Text style={styles.noAddressTitle}>No delivery address</Text>

            <Text style={styles.noAddressText}>
              Add an address to continue with your order.
            </Text>

            <Pressable
              style={styles.addAddressButton}
              onPress={() => {
                router.push({
                  pathname: "/patient/addresses",
                  params: {
                    from: "checkout",
                  },
                });
              }}
            >
              <Text style={styles.addAddressText}>+ Add Address</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            {addresses.map((address) => {
              const selected = address.id === selectedAddressId;

              return (
                <Pressable
                  key={address.id}
                  style={[
                    styles.addressOption,
                    selected && styles.selectedAddress,
                  ]}
                  onPress={() => {
                    setSelectedAddressId(address.id);
                  }}
                >
                  <View
                    style={[styles.radio, selected && styles.radioSelected]}
                  >
                    {selected && <View style={styles.radioDot} />}
                  </View>

                  <View style={styles.addressContent}>
                    <View style={styles.addressNameRow}>
                      <Text style={styles.addressName}>
                        {address.full_name}
                      </Text>

                      {address.is_default && (
                        <Text style={styles.defaultBadge}>DEFAULT</Text>
                      )}
                    </View>

                    <Text style={styles.addressMobile}>
                      📱 {address.mobile}
                    </Text>

                    <Text style={styles.addressText}>
                      {address.address_line1}
                    </Text>

                    {address.address_line2 && (
                      <Text style={styles.addressText}>
                        {address.address_line2}
                      </Text>
                    )}

                    <Text style={styles.addressText}>
                      {address.city}, {address.state}
                    </Text>

                    <Text style={styles.addressText}>
                      PIN: {address.postal_code}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Order Items */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Items</Text>

        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>

              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>

            <Text style={styles.itemPrice}>
              ₹{(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Selected Address */}

      {selectedAddress && (
        <View style={styles.selectedSummaryCard}>
          <Text style={styles.selectedSummaryTitle}>✓ Delivering To</Text>

          <Text style={styles.selectedSummaryName}>
            {selectedAddress.full_name}
          </Text>

          <Text style={styles.selectedSummaryText}>
            {selectedAddress.address_line1}
          </Text>

          {selectedAddress.address_line2 && (
            <Text style={styles.selectedSummaryText}>
              {selectedAddress.address_line2}
            </Text>
          )}

          <Text style={styles.selectedSummaryText}>
            {selectedAddress.city}, {selectedAddress.state} -{" "}
            {selectedAddress.postal_code}
          </Text>

          <Text style={styles.selectedSummaryText}>
            📱 {selectedAddress.mobile}
          </Text>
        </View>
      )}

      {/* Price Summary */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Items</Text>

          <Text style={styles.summaryValue}>{totalItems}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>

          <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>

          <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Place Order */}

      <Pressable
        disabled={isPlacingOrder || !selectedAddressId}
        style={[
          styles.placeOrderButton,
          (!selectedAddressId || isPlacingOrder) && styles.disabledButton,
        ]}
        onPress={() => {
          void handlePlaceOrder();
        }}
      >
        <Text style={styles.placeOrderText}>
          {isPlacingOrder
            ? "Placing Order..."
            : `Place Order • ₹${total.toFixed(2)}`}
        </Text>
      </Pressable>

      {!selectedAddressId && (
        <Text style={styles.addressRequiredText}>
          Select a delivery address to continue.
        </Text>
      )}

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back to Cart</Text>
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
    lineHeight: 20,
  },

  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    maxWidth: 260,
  },

  manageText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  addressOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
  },

  selectedAddress: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: Radius.round,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },

  radioSelected: {
    borderColor: Colors.primary,
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.round,
    backgroundColor: Colors.primary,
  },

  addressContent: {
    flex: 1,
  },

  addressNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  addressName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  defaultBadge: {
    marginLeft: Spacing.sm,
    fontSize: 9,
    fontWeight: "800",
    color: Colors.primary,
  },

  addressMobile: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  addressText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },

  noAddressBox: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    alignItems: "center",
  },

  noAddressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  noAddressText: {
    marginTop: Spacing.xs,
    textAlign: "center",
    color: Colors.textSecondary,
  },

  addAddressButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
  },

  addAddressText: {
    color: Colors.white,
    fontWeight: "700",
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },

  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  itemQuantity: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  selectedSummaryCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  selectedSummaryTitle: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },

  selectedSummaryName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  selectedSummaryText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },

  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  totalAmount: {
    fontSize: 21,
    fontWeight: "800",
    color: Colors.primary,
  },

  primaryButton: {
    marginTop: Spacing.lg,
    height: 50,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  placeOrderButton: {
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },

  disabledButton: {
    opacity: 0.55,
  },

  placeOrderText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
  },

  addressRequiredText: {
    marginTop: Spacing.sm,
    textAlign: "center",
    fontSize: 12,
    color: Colors.danger,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyText: {
    marginTop: Spacing.sm,
    textAlign: "center",
    color: Colors.textSecondary,
    lineHeight: 20,
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
