import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getMyOrders } from "../../../services/order.service";

import { Colors } from "../../../constants/colors";
import { Radius } from "../../../constants/radius";
import { Spacing } from "../../../constants/spacing";

type Order = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getMyOrders();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load orders.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>

          <Text style={styles.emptyText}>
            Your medicine orders will appear here.
          </Text>
        </View>
      ) : (
        orders.map((order) => (
          <Pressable
            key={order.id}
            style={styles.orderCard}
            onPress={() =>
  router.push({
    pathname: "/patient/orders/[id]",
    params: {
      id: order.id,
    },
  })
}
          >
            <View style={styles.row}>
              <Text style={styles.orderTitle}>
                Order #{order.id.slice(0, 8)}
              </Text>

              <Text style={styles.status}>{order.status}</Text>
            </View>

            <Text style={styles.date}>
              {new Date(order.created_at).toLocaleString()}
            </Text>

            <View style={styles.row}>
              <Text style={styles.totalLabel}>Total</Text>

              <Text style={styles.total}>
                ₹{Number(order.total_amount).toFixed(2)}
              </Text>
            </View>
          </Pressable>
        ))
      )}
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

  errorText: {
    color: Colors.danger,
    textAlign: "center",
  },

  orderCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  status: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  date: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 12,
  },

  totalLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },

  total: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyText: {
    marginTop: Spacing.sm,
    textAlign: "center",
    color: Colors.textSecondary,
  },
});
