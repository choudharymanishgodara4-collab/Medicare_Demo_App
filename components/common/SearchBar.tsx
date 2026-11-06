import { Pressable, StyleSheet, Text, TextInput } from "react-native";

type SearchBarProps = {
  onPress: () => void;
};

export default function SearchBar({ onPress }: SearchBarProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Text style={styles.icon}>🔍</Text>

      <TextInput
        style={styles.input}
        placeholder="Search disease, doctor or medicine"
        placeholderTextColor="#6B7280"
        editable={false}
        pointerEvents="none"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  icon: {
    fontSize: 20,
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
  },
});
