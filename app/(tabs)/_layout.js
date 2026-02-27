import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
    screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      
        tabBarStyle: {
          height: 78,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
      
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 12,
        },
      
        // ✅ gives each tab equal width + centers everything
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
      
        // ✅ stop cutoff by making text smaller + less wide
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 6,
        },
      
        tabBarActiveTintColor: colors.primaryEnd,
        tabBarInactiveTintColor: colors.textGray,
      }}
    >
      {/* 1️⃣ VsV */}
      <Tabs.Screen
        name="home/homepage"
        options={{
          tabBarLabel: "VsV",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "flash" : "flash-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 2️⃣ Tournament */}
      <Tabs.Screen
        name="tournament/index"
        options={{
          tabBarLabel: "Tournament",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 3️⃣ Programs */}
      <Tabs.Screen
        name="programs/index"
        options={{
          tabBarLabel: "Programs",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "albums" : "albums-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 4️⃣ My Booking */}
      <Tabs.Screen
        name="booking/index"
        options={{
          tabBarLabel: "My Booking",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 5️⃣ Account */}
      <Tabs.Screen
        name="account/index"
        options={{
          tabBarLabel: "Account",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Hide any accidental auto-generated index route */}
      <Tabs.Screen name="index" options={{ href: null }} />

    </Tabs>
  );
}