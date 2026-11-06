import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius } from "../../constants/radius";
import { Spacing } from "../../constants/spacing";

import { CartItem as CartItemType } from "../../store/cartStore";

type CartItemProps = {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

export default function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.price}>₹{item.price}</Text>

        <View style={styles.quantityRow}>
          <Pressable style={styles.quantityButton} onPress={onDecrease}>
            <Text style={styles.quantityButtonText}>−</Text>
          </Pressable>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <Pressable style={styles.quantityButton} onPress={onIncrease}>
            <Text style={styles.quantityButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.total}>₹{item.price * item.quantity}</Text>

        <Pressable onPress={onRemove}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  price: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
  },

  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  quantity: {
    minWidth: 35,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  total: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  remove: {
    fontSize: 13,
    color: Colors.danger,
  },
});
