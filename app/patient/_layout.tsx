import { Stack } from "expo-router";

export default function PatientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="orders"
        options={{
          headerShown: true,
          title: "My Orders",
        }}
      />

      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: true,
          title: "Edit Profile",
        }}
      />
    </Stack>
  );
}