// app/(tabs)/home/homepage.jsx

import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";

import { colors } from "../../../constants/colors";
import { auth } from "../../../services/firebaseConfig";

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: "location-outline",
    title: "Share Location",
    desc: "We get your GPS to find players within 25 km",
    color: colors.primaryEnd,
    bg: "#EFF6FF",
  },
  {
    step: "2",
    icon: "people-outline",
    title: "Find Opponents",
    desc: "See who's searching for the same game type",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    step: "3",
    icon: "tennisball-outline",
    title: "Best Court",
    desc: "We pick the fairest court for both players",
    color: "#059669",
    bg: "#ECFDF5",
  },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Player";
  const firstName = displayName.split(" ")[0];

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
      {/* ── Header ── */}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Banner ── */}
        <LinearGradient
          colors={[colors.primaryStart, colors.primaryEnd]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative circles */}
          <View style={[styles.heroBubble, styles.heroBubble1]} />
          <View style={[styles.heroBubble, styles.heroBubble2]} />

          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroGreeting}>Hey, {firstName} 👋</Text>
              <Text style={styles.heroTitle}>Ready to{"\n"}challenge someone?</Text>
              <Text style={styles.heroSub}>
                Find a real opponent near you and settle it on the court.
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="tennisball" size={52} color="rgba(255,255,255,0.25)" />
            </View>
          </View>

          {/* Live indicator */}
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>VsV Lobby is Live</Text>
            <Text style={styles.liveSubtext}>• Players searching now</Text>
          </View>
        </LinearGradient>

        {/* ── Match Type Label ── */}
        <Text style={styles.sectionLabel}>Choose Match Type</Text>

        {/* ── Singles + Doubles ── */}
        <View style={styles.buttonRow}>
          {/* Singles */}
          <TouchableOpacity
            style={styles.matchCard}
            onPress={() => startMatch("singles")}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[colors.primaryStart, colors.primaryEnd]}
              style={styles.matchGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.matchIconCircle}>
                <Ionicons name="person" size={30} color={colors.primaryEnd} />
              </View>
              <Text style={styles.matchLabel}>Singles</Text>
              <Text style={styles.matchSub}>1 vs 1 · Head to head</Text>
              <View style={styles.matchArrow}>
                <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Doubles */}
          <TouchableOpacity
            style={styles.matchCard}
            onPress={() => startMatch("doubles")}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#7C3AED", "#9333EA"]}
              style={styles.matchGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.matchIconCircle, { backgroundColor: "#F5F3FF" }]}>
                <Ionicons name="people" size={30} color="#7C3AED" />
              </View>
              <Text style={styles.matchLabel}>Doubles</Text>
              <Text style={styles.matchSub}>2 vs 2 · Team play</Text>
              <View style={styles.matchArrow}>
                <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Friendly Battle ── */}
        <TouchableOpacity
          style={styles.friendlyCard}
          onPress={() => startMatch("friendly")}
          activeOpacity={0.85}
        >
          <View style={styles.friendlyLeft}>
            <View style={styles.friendlyIconWrap}>
              <Ionicons name="heart" size={22} color="#059669" />
            </View>
            <View>
              <Text style={styles.friendlyTitle}>Friendly Battle</Text>
              <Text style={styles.friendlySub}>Casual · No rating impact</Text>
            </View>
          </View>
          <View style={styles.friendlyBadge}>
            <Text style={styles.friendlyBadgeText}>Casual</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textGray} />
        </TouchableOpacity>

        {/* ── How It Works ── */}
        <Text style={styles.sectionLabel}>How VsV Works</Text>

        <View style={styles.stepsCard}>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={step.step}>
              <View style={styles.stepRow}>
                <View style={[styles.stepIconWrap, { backgroundColor: step.bg }]}>
                  <Ionicons name={step.icon} size={20} color={step.color} />
                </View>
                <View style={styles.stepBody}>
                  <View style={styles.stepTitleRow}>
                    <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
                      <Text style={styles.stepNumberText}>{step.step}</Text>
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
              {i < HOW_IT_WORKS.length - 1 && (
                <View style={styles.stepConnector}>
                  <View style={styles.stepConnectorLine} />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ── Quick Facts ── */}
        <Text style={styles.sectionLabel}>About VsV</Text>
        <View style={styles.factsRow}>
          <View style={styles.factCard}>
            <Ionicons name="flash-outline" size={24} color={colors.primaryEnd} />
            <Text style={styles.factValue}>Real-time</Text>
            <Text style={styles.factLabel}>Player matching</Text>
          </View>
          <View style={styles.factCard}>
            <Ionicons name="location-outline" size={24} color="#059669" />
            <Text style={styles.factValue}>25 km</Text>
            <Text style={styles.factLabel}>Search radius</Text>
          </View>
          <View style={styles.factCard}>
            <Ionicons name="trophy-outline" size={24} color="#D97706" />
            <Text style={styles.factValue}>DUPR</Text>
            <Text style={styles.factLabel}>Rating tracked</Text>
          </View>
        </View>
      </ScrollView>
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

  scroll: { paddingBottom: 48 },

  // ── Hero ──
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
  },
  heroBubble: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroBubble1: { width: 160, height: 160, top: -40, right: -30 },
  heroBubble2: { width: 100, height: 100, bottom: -20, left: 60 },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  heroGreeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.white,
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 19,
    maxWidth: 200,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  liveText: { fontSize: 13, color: colors.white, fontWeight: "700" },
  liveSubtext: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "500" },

  // ── Section label ──
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 16,
  },

  // ── Match type cards ──
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  matchCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 7,
  },
  matchGradient: {
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 16,
    minHeight: 160,
    gap: 8,
  },
  matchIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  matchLabel: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  matchSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  matchArrow: {
    position: "absolute",
    bottom: 14,
    right: 14,
  },

  // ── Friendly ──
  friendlyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  friendlyLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  friendlyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  friendlyTitle: { fontSize: 16, fontWeight: "700", color: colors.textDark },
  friendlySub: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  friendlyBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  friendlyBadgeText: { fontSize: 11, fontWeight: "700", color: "#059669" },

  // ── How it works ──
  stepsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  stepIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBody: { flex: 1 },
  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontSize: 11, fontWeight: "900", color: colors.white },
  stepTitle: { fontSize: 14, fontWeight: "800", color: colors.textDark },
  stepDesc: { fontSize: 13, color: colors.textGray, lineHeight: 18 },
  stepConnector: { paddingLeft: 22, marginVertical: 4 },
  stepConnectorLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 1,
  },

  // ── Facts ──
  factsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  factCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  factValue: { fontSize: 15, fontWeight: "900", color: colors.textDark },
  factLabel: { fontSize: 11, color: colors.textGray, fontWeight: "500", textAlign: "center" },
});
