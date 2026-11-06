import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../../constants/colors";

export default function PatientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Important: give every tab screen full available height
        sceneStyle: {
          flex: 1,
          backgroundColor: Colors.background,
        },

        tabBarActiveTintColor:
          Colors.primary,

        tabBarInactiveTintColor:
          Colors.textSecondary,

        tabBarStyle: {
          backgroundColor:
            Colors.white,
          borderTopColor:
            Colors.border,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="doctors"
        options={{
          title: "Doctors",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="medkit-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="medicines"
        options={{
          title: "Medicines",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="fitness-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="cart-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden duplicate medicine route */}
      <Tabs.Screen
        name="medicine"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}