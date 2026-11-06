import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { Spacing } from "../../constants/spacing";

type SectionHeaderProps = {
  title: string;
  onSeeAll?: () => void;
};

export default function SectionHeader({
  title,
  onSeeAll,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={styles.seeAll}>
            See All
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: Colors.text,
  },

  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
});