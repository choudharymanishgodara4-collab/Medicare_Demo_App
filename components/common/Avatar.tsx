import { Image, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";

type AvatarProps = {
  uri?: string;
  name?: string;
  size?: number;
};

export default function Avatar({ uri, name = "User", size = 50 }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.initial,
          {
            fontSize: size * 0.4,
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "cover",
  },

  placeholder: {
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  initial: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
