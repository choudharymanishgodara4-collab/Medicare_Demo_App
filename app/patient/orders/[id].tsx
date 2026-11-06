import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";


import { router, Stack, useLocalSearchParams } from "expo-router";

import { supabase } from "../../../services/supabase";

import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";

type OrderItem = {
  id: string;
  medicine_id: string | null;
  medicine_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type Order = {
  id: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;

  address_name: string | null;
  address_mobile: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;

  items: OrderItem[];
};

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [order, setOrder] = useState<Order | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        setError("Order ID is missing.");
        setIsLoading(false);
        return;
      }

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

        const {
          data,
          error: orderError,
        } = await supabase
          .from("orders")
          .select(
            `
              id,
              status,
              subtotal,
              delivery_fee,
              total_amount,
              payment_method,
              payment_status,
              created_at,

              address_name,
              address_mobile,
              address_line1,
              address_line2,
              address_city,
              address_state,
              address_postal_code,

              order_items (
                id,
                medicine_id,
                medicine_name,
                price,
                quantity,
                subtotal
              )
            `,
          )
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (orderError) {
          throw new Error(orderError.message);
        }

        setOrder({
          id: data.id,
          status: data.status,

          subtotal: Number(data.subtotal),
          delivery_fee: Number(data.delivery_fee),
          total_amount: Number(data.total_amount),

          payment_method: data.payment_method,
          payment_status: data.payment_status,

          created_at: data.created_at,

          address_name: data.address_name,
          address_mobile: data.address_mobile,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          address_city: data.address_city,
          address_state: data.address_state,
          address_postal_code:
            data.address_postal_code,

          items: (data.order_items ?? []).map(
            (item) => ({
              id: item.id,
              medicine_id: item.medicine_id,
              medicine_name: item.medicine_name,
              price: Number(item.price),
              quantity: item.quantity,
              subtotal: Number(item.subtotal),
            }),
          ),
        });
      } catch (err) {
        console.error(
          "Order detail error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load order.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [id]);

  if (isLoading) {
    return (
      <>
      <Stack.Screen
  options={{
    title: "Order Details",
  }}
/>
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading order...
        </Text>
      </View>
      </>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || "Order not found."}
        </Text>

        <Text
          style={styles.backLink}
          onPress={() => router.back()}
        >
          ← Back to Orders
        </Text>
      </View>
    );
  }

  const totalItems = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const hasAddress =
    !!order.address_name ||
    !!order.address_line1 ||
    !!order.address_city;

  return (
    <>
    <Stack.Screen
  options={{
    title: "Order Details",
  }}
/>
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Order Details
      </Text>

      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderLabel}>
            Order
          </Text>

          <Text style={styles.orderId}>
            #{order.id.slice(0, 8)}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {order.status}
          </Text>
        </View>
      </View>

      <Text style={styles.date}>
        {new Date(
          order.created_at,
        ).toLocaleString()}
      </Text>

      {/* Delivery Address */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Delivery Address
        </Text>

        {!hasAddress ? (
          <View style={styles.noAddressBox}>
            <Text style={styles.noAddressText}>
              Delivery address was not saved for
              this order.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.addressName}>
              {order.address_name ||
                "Recipient"}
            </Text>

            {order.address_mobile && (
              <Text style={styles.addressText}>
                📱 {order.address_mobile}
              </Text>
            )}

            {order.address_line1 && (
              <Text style={styles.addressText}>
                {order.address_line1}
              </Text>
            )}

            {order.address_line2 && (
              <Text style={styles.addressText}>
                {order.address_line2}
              </Text>
            )}

            {(order.address_city ||
              order.address_state ||
              order.address_postal_code) && (
              <Text style={styles.addressText}>
                {[
                  order.address_city,
                  order.address_state,
                  order.address_postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Items */}
      <View style={styles.itemsCard}>
        <Text style={styles.sectionTitle}>
          Items
        </Text>

        {order.items.map((item) => (
          <View
            key={item.id}
            style={styles.itemRow}
          >
            <View style={styles.itemInfo}>
              <Text
                style={styles.itemName}
                numberOfLines={2}
              >
                {item.medicine_name}
              </Text>

              <Text style={styles.itemMeta}>
                ₹
                {item.price.toFixed(2)} ×{" "}
                {item.quantity}
              </Text>
            </View>

            <Text style={styles.itemTotal}>
              ₹
              {item.subtotal.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>
          Order Summary
        </Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Total Items
          </Text>

          <Text style={styles.summaryValue}>
            {totalItems}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Subtotal
          </Text>

          <Text style={styles.summaryValue}>
            ₹{order.subtotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Delivery Fee
          </Text>

          <Text style={styles.summaryValue}>
            {order.delivery_fee === 0
              ? "FREE"
              : `₹${order.delivery_fee.toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>
            Total Amount
          </Text>

          <Text style={styles.totalAmount}>
            ₹{order.total_amount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Payment */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Payment
        </Text>

        <View style={styles.paymentRow}>
          <Text style={styles.summaryLabel}>
            Method
          </Text>

          <Text style={styles.summaryValue}>
            {order.payment_method}
          </Text>
        </View>

        <View style={styles.paymentRow}>
          <Text style={styles.summaryLabel}>
            Status
          </Text>

          <View style={styles.paymentBadge}>
            <Text style={styles.paymentBadgeText}>
              {order.payment_status}
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={styles.backLink}
        onPress={() => router.back()}
      >
        ← Back to Orders
      </Text>
    </ScrollView>
    </>
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

  errorText: {
    color: Colors.danger,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },

  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },

  orderLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  orderId: {
    marginTop: Spacing.xs,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  statusBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  statusText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  date: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    fontSize: 13,
  },

  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  itemsCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  addressName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },

  addressText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginTop: 2,
  },

  noAddressBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },

  noAddressText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },

  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  itemMeta: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  itemTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  summaryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
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
    marginVertical: Spacing.sm,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  totalAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  paymentBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  paymentBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  backLink: {
    marginTop: Spacing.md,
    textAlign: "center",
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});