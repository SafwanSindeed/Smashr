// app/findmatch.jsx

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { colors } from "../constants/colors";

// ── Helpers ──────────────────────────────────────────────────────────────────

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function midpoint(lat1, lon1, lat2, lon2) {
  return { lat: (lat1 + lat2) / 2, lng: (lon1 + lon2) / 2 };
}

function fmtDist(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

async function fetchNearbyCourts(lat, lng, radiusM = 15000) {
  const overpassQueries = [
    `[out:json][timeout:15];node["sport"="pickleball"](around:${radiusM},${lat},${lng});out 10;`,
    `[out:json][timeout:15];way["sport"="pickleball"](around:${radiusM},${lat},${lng});out center 10;`,
    `[out:json][timeout:15];node["sport"="tennis"](around:${radiusM},${lat},${lng});out 10;`,
    `[out:json][timeout:15];way["sport"="tennis"](around:${radiusM},${lat},${lng});out center 10;`,
  ];

  for (const q of overpassQueries) {
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(q)}`,
      });
      const json = await res.json();
      const elements = (json.elements || []).filter(
        (el) => (el.lat || el.center?.lat) && (el.lon || el.center?.lon)
      );
      if (elements.length > 0) {
        return elements.map((el) => ({
          id: String(el.id),
          name:
            el.tags?.name ||
            (el.tags?.sport === "tennis"
              ? "Tennis / Pickleball Court"
              : "Pickleball Court"),
          lat: el.lat ?? el.center.lat,
          lng: el.lon ?? el.center.lon,
          sport: el.tags?.sport || "court",
        }));
      }
    } catch (_) {}
  }
  return [];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASES = {
  START: "start",
  LOCATING: "locating",
  SEARCHING: "searching",
  PLAYERS: "players",
  COURTS: "courts",
  MATCHED: "matched",
};

const TYPE_META = {
  singles: {
    label: "Singles",
    sub: "1 vs 1",
    icon: "person",
    colors: [colors.primaryStart, colors.primaryEnd],
  },
  doubles: {
    label: "Doubles",
    sub: "2 vs 2",
    icon: "people",
    colors: ["#7C3AED", "#9333EA"],
  },
  friendly: {
    label: "Friendly Battle",
    sub: "Casual play",
    icon: "heart",
    colors: ["#059669", "#10B981"],
  },
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FindMatch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type = "singles" } = useLocalSearchParams();

  const meta = TYPE_META[type] || TYPE_META.singles;

  const [phase, setPhase] = useState(PHASES.START);
  const [myLocation, setMyLocation] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [courts, setCourts] = useState([]);
  const [bestCourt, setBestCourt] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => {
      pulse.stop();
      const uid = auth.currentUser?.uid;
      if (uid) deleteDoc(doc(db, "vsv_lobby", uid)).catch(() => {});
    };
  }, []);

  const startSearch = async () => {
    setPhase(PHASES.LOCATING);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "Please enable location access to find nearby players."
        );
        setPhase(PHASES.START);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = loc.coords;
      setMyLocation({ lat, lng });

      const user = auth.currentUser;
      await setDoc(doc(db, "vsv_lobby", user.uid), {
        uid: user.uid,
        displayName:
          user.displayName || user.email?.split("@")[0] || "Player",
        lat,
        lng,
        gameType: type,
        status: "searching",
        updatedAt: serverTimestamp(),
      });

      setPhase(PHASES.SEARCHING);

      const snap = await getDocs(
        query(
          collection(db, "vsv_lobby"),
          where("gameType", "==", type),
          where("status", "==", "searching")
        )
      );

      const nearby = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.uid === user.uid) return;
        const dist = distanceKm(lat, lng, data.lat, data.lng);
        if (dist <= 50) nearby.push({ ...data, distanceKm: dist });
      });
      nearby.sort((a, b) => a.distanceKm - b.distanceKm);

      setPlayers(nearby);
      setPhase(PHASES.PLAYERS);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not get your location. Please try again.");
      setPhase(PHASES.START);
    }
  };

  const challengePlayer = async (player) => {
    setSelectedPlayer(player);
    setPhase(PHASES.COURTS);
    try {
      const mid = midpoint(
        myLocation.lat,
        myLocation.lng,
        player.lat,
        player.lng
      );

      let found = await fetchNearbyCourts(mid.lat, mid.lng, 15000);
      if (found.length === 0) {
        found = await fetchNearbyCourts(mid.lat, mid.lng, 30000);
      }

      if (found.length === 0) {
        Alert.alert(
          "No Courts Found",
          "We couldn't find any courts near your midpoint. Try a different area."
        );
        setPhase(PHASES.PLAYERS);
        return;
      }

      const scored = found
        .map((court) => ({
          ...court,
          myDist: distanceKm(myLocation.lat, myLocation.lng, court.lat, court.lng),
          theirDist: distanceKm(player.lat, player.lng, court.lat, court.lng),
        }))
        .map((c) => ({ ...c, totalDist: c.myDist + c.theirDist }))
        .sort((a, b) => a.totalDist - b.totalDist);

      setCourts(scored.slice(0, 5));
      setBestCourt(scored[0]);
      setPhase(PHASES.MATCHED);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not find courts. Please try again.");
      setPhase(PHASES.PLAYERS);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      {/* Header */}
      <LinearGradient
        colors={meta.colors}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={28} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{meta.label}</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} bounces={false}>

        {/* ── START ── */}
        {phase === PHASES.START && (
          <View style={styles.centerBlock}>
            <Animated.View
              style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
            >
              <LinearGradient colors={meta.colors} style={styles.pulseInner}>
                <Ionicons name={meta.icon} size={52} color={colors.white} />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.bigLabel}>Find a {meta.label} Match</Text>
            <Text style={styles.bigSub}>
              We'll locate players near you and find the best court for both of you
            </Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={startSearch}
              activeOpacity={0.85}
            >
              <LinearGradient colors={meta.colors} style={styles.actionGradient}>
                <Ionicons name="location-outline" size={22} color={colors.white} />
                <Text style={styles.actionText}>Find Players Near Me</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── LOCATING / SEARCHING ── */}
        {(phase === PHASES.LOCATING || phase === PHASES.SEARCHING) && (
          <View style={styles.centerBlock}>
            <ActivityIndicator
              size="large"
              color={meta.colors[1]}
              style={{ marginBottom: 24 }}
            />
            <Text style={styles.bigLabel}>
              {phase === PHASES.LOCATING
                ? "Getting your location..."
                : "Searching for players..."}
            </Text>
            <Text style={styles.bigSub}>
              {phase === PHASES.LOCATING
                ? "Allow location access when prompted"
                : "Looking for players within 50 km of you"}
            </Text>
          </View>
        )}

        {/* ── PLAYERS LIST ── */}
        {phase === PHASES.PLAYERS && (
          <View style={styles.listBlock}>
            <Text style={styles.sectionTitle}>
              {players.length > 0
                ? `${players.length} player${players.length !== 1 ? "s" : ""} found nearby`
                : "No players found nearby"}
            </Text>

            {players.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  No one is searching for a {meta.label} match near you right now.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => setPhase(PHASES.START)}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              players.map((player) => (
                <TouchableOpacity
                  key={player.uid}
                  style={styles.playerCard}
                  onPress={() => challengePlayer(player)}
                  activeOpacity={0.85}
                >
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerInitial}>
                      {(player.displayName || "P")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.displayName}</Text>
                    <Text style={styles.playerDist}>
                      {fmtDist(player.distanceKm)} away
                    </Text>
                  </View>
                  <LinearGradient
                    colors={meta.colors}
                    style={styles.challengeBtn}
                  >
                    <Text style={styles.challengeText}>Challenge</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── FINDING COURTS ── */}
        {phase === PHASES.COURTS && (
          <View style={styles.centerBlock}>
            <ActivityIndicator
              size="large"
              color={meta.colors[1]}
              style={{ marginBottom: 24 }}
            />
            <Text style={styles.bigLabel}>Finding optimal court...</Text>
            <Text style={styles.bigSub}>
              Calculating the fairest meeting point for you and{" "}
              {selectedPlayer?.displayName}
            </Text>
          </View>
        )}

        {/* ── MATCHED ── */}
        {phase === PHASES.MATCHED && bestCourt && (
          <View style={styles.listBlock}>
            <View style={styles.matchedHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
              <Text style={styles.matchedTitle}>Court Found!</Text>
              <Text style={styles.matchedSub}>
                Best spot for you and {selectedPlayer?.displayName}
              </Text>
            </View>

            {/* Best court card */}
            <View style={styles.courtCard}>
              <View style={styles.courtCardTop}>
                <View style={styles.courtIconWrap}>
                  <Ionicons name="location" size={28} color={meta.colors[1]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courtName}>{bestCourt.name}</Text>
                  <Text style={styles.courtSport}>
                    {bestCourt.sport.charAt(0).toUpperCase() +
                      bestCourt.sport.slice(1)}{" "}
                    Court
                  </Text>
                </View>
              </View>

              <View style={styles.distRow}>
                <View style={styles.distItem}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={colors.textGray}
                  />
                  <Text style={styles.distLabel}>Your distance</Text>
                  <Text style={styles.distValue}>
                    {fmtDist(bestCourt.myDist)}
                  </Text>
                </View>
                <View style={styles.distDivider} />
                <View style={styles.distItem}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={colors.textGray}
                  />
                  <Text style={styles.distLabel}>Their distance</Text>
                  <Text style={styles.distValue}>
                    {fmtDist(bestCourt.theirDist)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Alternate courts */}
            {courts.length > 1 && (
              <>
                <Text style={styles.altTitle}>Other nearby courts</Text>
                {courts.slice(1).map((court) => (
                  <TouchableOpacity
                    key={court.id}
                    style={[
                      styles.altCard,
                      bestCourt.id === court.id && styles.altCardActive,
                    ]}
                    onPress={() => setBestCourt(court)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={meta.colors[1]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.altName}>{court.name}</Text>
                      <Text style={styles.altDist}>
                        You: {fmtDist(court.myDist)} · Them:{" "}
                        {fmtDist(court.theirDist)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textGray}
                    />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Let's play */}
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/scoresummary",
                  params: {
                    opponent:  JSON.stringify(selectedPlayer),
                    gameType:  type,
                    courtName: bestCourt.name,
                  },
                })
              }
            >
              <LinearGradient colors={meta.colors} style={styles.actionGradient}>
                <Ionicons
                  name="tennisball-outline"
                  size={22}
                  color={colors.white}
                />
                <Text style={styles.actionText}>Let's Play!</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => setPhase(PHASES.PLAYERS)}
            >
              <Text style={styles.backLinkText}>← Back to players</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  body: { flexGrow: 1, paddingBottom: 40 },

  // ── Center states ──
  centerBlock: {
    flex: 1,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  pulseRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseInner: {
    flex: 1,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  bigLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 10,
  },
  bigSub: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },

  // ── Action button (Start / Let's Play) ──
  actionButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  actionText: { color: colors.white, fontSize: 17, fontWeight: "800" },

  // ── List states ──
  listBlock: { padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 16,
  },

  emptyBlock: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyText: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryText: { fontSize: 15, fontWeight: "700", color: colors.primaryEnd },

  // ── Player card ──
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryEnd,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitial: { fontSize: 20, fontWeight: "900", color: colors.white },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: "700", color: colors.textDark },
  playerDist: { fontSize: 13, color: colors.textGray, marginTop: 2 },
  challengeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  challengeText: { color: colors.white, fontWeight: "700", fontSize: 13 },

  // ── Matched header ──
  matchedHeader: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    gap: 6,
  },
  matchedTitle: { fontSize: 24, fontWeight: "900", color: colors.textDark },
  matchedSub: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: "center",
  },

  // ── Court card ──
  courtCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  courtCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  courtIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  courtName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 4,
  },
  courtSport: { fontSize: 13, color: colors.textGray },

  distRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
  },
  distItem: { flex: 1, alignItems: "center", gap: 4 },
  distLabel: { fontSize: 12, color: colors.textGray, fontWeight: "500" },
  distValue: { fontSize: 17, fontWeight: "800", color: colors.textDark },
  distDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 8 },

  // ── Alt courts ──
  altTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 10,
  },
  altCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  altCardActive: { borderColor: colors.primaryEnd },
  altName: { fontSize: 14, fontWeight: "600", color: colors.textDark },
  altDist: { fontSize: 12, color: colors.textGray, marginTop: 2 },

  backLink: { alignItems: "center", paddingVertical: 14 },
  backLinkText: { fontSize: 14, color: colors.textGray, fontWeight: "600" },
});
