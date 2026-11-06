import { Stack } from "expo-router";

export default function DoctorLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="appointments"
        options={{
          title: "Appointments",
        }}
      />

      <Stack.Screen
        name="consultations"
        options={{
          title: "Consultations",
        }}
      />

      <Stack.Screen
        name="profile"
        options={{
          title: "My Profile",
        }}
      />
    </Stack>
  );
}
