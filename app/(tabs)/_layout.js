import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import ChatBot from "../../components/ChatBot";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          height: 68,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.07,
          shadowRadius: 6,
          elevation: 10,
        },

        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginBottom: 4,
        },

        tabBarActiveTintColor: colors.primaryEnd,
        tabBarInactiveTintColor: colors.textGray,
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      {/* 1 — VsV */}
      <Tabs.Screen
        name="home/homepage"
        options={{
          tabBarLabel: "VsV",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "flash" : "flash-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* 2 — Tournament */}
      <Tabs.Screen
        name="tournament/index"
        options={{
          tabBarLabel: "Tournaments",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "trophy" : "trophy-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* 3 — Programs */}
      <Tabs.Screen
        name="programs/index"
        options={{
          tabBarLabel: "Programs",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "albums" : "albums-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* 4 — Bookings */}
      <Tabs.Screen
        name="booking/index"
        options={{
          tabBarLabel: "Bookings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* 5 — Account */}
      <Tabs.Screen
        name="account/index"
        options={{
          tabBarLabel: "Account",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* Friends — accessible via header icon, hidden from tab bar */}
      <Tabs.Screen
        name="friends/index"
        options={{ href: null }}
      />

      {/* Suppress auto-generated index */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
    <ChatBot tabBarHeight={68} />
    </View>
  );
}
