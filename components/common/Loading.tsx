import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Colors } from "../../constants/colors";

type LoadingProps = {
  size?: "small" | "large";
  fullScreen?: boolean;
};

export default function Loading({
  size = "large",
  fullScreen = false,
}: LoadingProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
