import { router } from "expo-router";
import { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCartStore } from "../store/cartStore";

import EmptyState from "../components/common/EmptyState";
import CartItem from "../components/patient/CartItem";

import { Colors } from "../constants/colors";
import { Radius } from "../constants/radius";
import { Spacing } from "../constants/spacing";

export default function CartScreen() {
  const {
    items,
    isLoading,
    error,
    loadCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCartStore();

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const total = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0,
  );

  const totalItems = items.reduce(
    (sum, item) =>
      sum + item.quantity,
    0,
  );

  if (isLoading) {
    return (
      <View
        style={styles.emptyContainer}
      >
        <Text
          style={styles.loadingText}
        >
          Loading cart...
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View
        style={styles.emptyContainer}
      >
        {error ? (
          <Text
            style={styles.errorText}
          >
            {error}
          </Text>
        ) : null}

        <EmptyState
          title="Your Cart is Empty"
          message="Add medicines to your cart to continue."
          actionText="Browse Medicines"
          onAction={() =>
            router.push(
              "/medicine",
            )
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <Text
        style={styles.title}
      >
        My Cart
      </Text>

      {error ? (
        <Text
          style={styles.errorText}
        >
          {error}
        </Text>
      ) : null}

      {items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onIncrease={() => {
            void increaseQuantity(
              item.id,
            );
          }}
          onDecrease={() => {
            void decreaseQuantity(
              item.id,
            );
          }}
          onRemove={() => {
            void removeFromCart(
              item.id,
            );
          }}
        />
      ))}

      <View
        style={styles.summary}
      >
        <Text
          style={styles.summaryTitle}
        >
          Order Summary
        </Text>

        <View
          style={styles.summaryRow}
        >
          <Text
            style={styles.summaryLabel}
          >
            Total Items
          </Text>

          <Text
            style={styles.summaryValue}
          >
            {totalItems}
          </Text>
        </View>

        <View
          style={styles.summaryRow}
        >
          <Text
            style={styles.summaryLabel}
          >
            Total Amount
          </Text>

          <Text
            style={styles.totalAmount}
          >
            ₹{total.toFixed(2)}
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.checkoutButton,
          pressed &&
            styles.pressed,
        ]}
        onPress={() =>
          router.push(
            "/patient/checkout",
          )
        }
      >
        <Text
          style={styles.checkoutText}
        >
          Proceed to Checkout
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      padding: Spacing.xl,
      paddingBottom:
        Spacing.huge,
      backgroundColor:
        Colors.background,
    },

    title: {
      fontSize: 30,
      fontWeight: "700",
      color: Colors.text,
      marginBottom:
        Spacing.xl,
    },

    summary: {
      backgroundColor:
        Colors.white,
      borderRadius:
        Radius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.sm,
      borderWidth: 1,
      borderColor:
        Colors.border,
    },

    summaryTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
      marginBottom:
        Spacing.md,
    },

    summaryRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginBottom:
        Spacing.sm,
    },

    summaryLabel: {
      fontSize: 15,
      color:
        Colors.textSecondary,
    },

    summaryValue: {
      fontSize: 15,
      fontWeight: "600",
      color: Colors.text,
    },

    totalAmount: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
    },

    checkoutButton: {
      height: 54,
      borderRadius:
        Radius.lg,
      backgroundColor:
        Colors.primary,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop:
        Spacing.lg,
    },

    checkoutText: {
      color: Colors.white,
      fontSize: 17,
      fontWeight: "700",
    },

    pressed: {
      opacity: 0.8,
    },

    emptyContainer: {
      flex: 1,
      backgroundColor:
        Colors.background,
      justifyContent:
        "center",
      alignItems:
        "center",
      padding: Spacing.xl,
    },

    loadingText: {
      fontSize: 16,
      color:
        Colors.textSecondary,
    },

    errorText: {
      color: Colors.danger,
      fontSize: 14,
      textAlign:
        "center",
      marginBottom:
        Spacing.md,
    },
  });