// app/(tabs)/home/homepage.jsx

import React from "react";
import { StyleSheet, Text, View, Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";

import { colors } from "../../../constants/colors";
import { auth } from "../../../services/firebaseConfig";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const onLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (e) {
      console.log("Logout error:", e);
    }
  };

  const startMatch = (type) => {
    router.push({ pathname: "/findmatch", params: { type } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      {/* HEADER */}
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable hitSlop={10} onPress={() => router.push("/(tabs)/friends")}>
          <Ionicons name="people-outline" size={28} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>VsV</Text>
        <Pressable onPress={onLogout} hitSlop={10}>
          <Ionicons name="log-out-outline" size={28} color={colors.white} />
        </Pressable>
      </LinearGradient>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.tagline}>Challenge nearby players</Text>
        <Text style={styles.subtitle}>
          Find a match, meet at the nearest court
        </Text>

        {/* Singles & Doubles */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.matchButton}
            onPress={() => startMatch("singles")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primaryStart, colors.primaryEnd]}
              style={styles.matchButtonGradient}
            >
              <Ionicons name="person" size={36} color={colors.white} />
              <Text style={styles.matchButtonLabel}>Singles</Text>
              <Text style={styles.matchButtonSub}>1 vs 1</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.matchButton}
            onPress={() => startMatch("doubles")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7C3AED", "#9333EA"]}
              style={styles.matchButtonGradient}
            >
              <Ionicons name="people" size={36} color={colors.white} />
              <Text style={styles.matchButtonLabel}>Doubles</Text>
              <Text style={styles.matchButtonSub}>2 vs 2</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Friendly Battle */}
        <TouchableOpacity
          style={styles.friendlyButton}
          onPress={() => startMatch("friendly")}
          activeOpacity={0.85}
        >
          <Ionicons name="heart-outline" size={20} color={colors.primaryEnd} />
          <Text style={styles.friendlyText}>Friendly Battle</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textGray} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    width: "100%",
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  tagline: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 36,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    width: "100%",
  },
  matchButton: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  matchButtonGradient: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
  },
  matchButtonLabel: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  matchButtonSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
  },

  friendlyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  friendlyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
  },
});
