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
  Linking,
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
  const queries = [
    `[out:json][timeout:15];node["sport"="pickleball"](around:${radiusM},${lat},${lng});out 10;`,
    `[out:json][timeout:15];way["sport"="pickleball"](around:${radiusM},${lat},${lng});out center 10;`,
    `[out:json][timeout:15];node["sport"="tennis"](around:${radiusM},${lat},${lng});out 10;`,
    `[out:json][timeout:15];way["sport"="tennis"](around:${radiusM},${lat},${lng});out center 10;`,
  ];
  for (const q of queries) {
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
            (el.tags?.sport === "tennis" ? "Tennis / Pickleball Court" : "Pickleball Court"),
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
    sub: "1 vs 1 · Head to head",
    icon: "person",
    colors: [colors.primaryStart, colors.primaryEnd],
    accentBg: "#EFF6FF",
    accentColor: colors.primaryEnd,
  },
  doubles: {
    label: "Doubles",
    sub: "2 vs 2 · Team play",
    icon: "people",
    colors: ["#7C3AED", "#9333EA"],
    accentBg: "#F5F3FF",
    accentColor: "#7C3AED",
  },
  friendly: {
    label: "Friendly Battle",
    sub: "Casual · No rating impact",
    icon: "heart",
    colors: ["#059669", "#10B981"],
    accentBg: "#ECFDF5",
    accentColor: "#059669",
  },
};

// ── Loading Step Component ────────────────────────────────────────────────────

function LoadingStep({ icon, label, status }) {
  return (
    <View style={lstyles.row}>
      <View style={[lstyles.iconWrap, status === "done" && lstyles.iconDone, status === "active" && lstyles.iconActive]}>
        {status === "done" ? (
          <Ionicons name="checkmark" size={16} color="#fff" />
        ) : status === "active" ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name={icon} size={16} color="#9CA3AF" />
        )}
      </View>
      <Text style={[lstyles.label, status === "done" && lstyles.labelDone, status === "active" && lstyles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

const lstyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconDone: { backgroundColor: "#22C55E" },
  iconActive: { backgroundColor: colors.primaryEnd },
  label: { fontSize: 15, fontWeight: "600", color: "#9CA3AF" },
  labelDone: { color: "#374151" },
  labelActive: { color: colors.textDark, fontWeight: "700" },
});

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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 950, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    return () => {
      const uid = auth.currentUser?.uid;
      if (uid) deleteDoc(doc(db, "vsv_lobby", uid)).catch(() => {});
    };
  }, []);

  const startSearch = async () => {
    setPhase(PHASES.LOCATING);
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!canAskAgain) {
          Alert.alert(
            "Location Blocked",
            "Location access was denied. Open your device Settings to enable it for Smashr.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert("Location Required", "Please enable location access to find nearby players.");
        }
        setPhase(PHASES.START);
        return;
      }

      let loc = null;
      try {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });
      } catch {
        loc = await Location.getLastKnownPositionAsync();
      }
      if (!loc) {
        Alert.alert("Location unavailable", "Could not get your location. Make sure GPS is enabled and try again.");
        setPhase(PHASES.START);
        return;
      }
      const { latitude: lat, longitude: lng } = loc.coords;
      setMyLocation({ lat, lng });

      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Not signed in", "Please log in and try again.");
        setPhase(PHASES.START);
        return;
      }
      await setDoc(doc(db, "vsv_lobby", user.uid), {
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Player",
        lat, lng,
        gameType: type,
        status: "searching",
        updatedAt: serverTimestamp(),
      });

      setPhase(PHASES.SEARCHING);

      const snap = await getDocs(
        query(collection(db, "vsv_lobby"), where("gameType", "==", type), where("status", "==", "searching"))
      );

      const nearby = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.uid === user.uid) return;
        const dist = distanceKm(lat, lng, data.lat, data.lng);
        if (dist <= 25) nearby.push({ ...data, distanceKm: dist });
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
      const mid = midpoint(myLocation.lat, myLocation.lng, player.lat, player.lng);
      let found = await fetchNearbyCourts(mid.lat, mid.lng, 15000);
      if (found.length === 0) found = await fetchNearbyCourts(mid.lat, mid.lng, 30000);

      if (found.length === 0) {
        Alert.alert("No Courts Found", "We couldn't find any courts near your midpoint. Try a different area.");
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

  const myName = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "You";
  const myInitial = myName[0].toUpperCase();

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
        <View style={styles.headerCenter}>
          <Ionicons name={meta.icon} size={18} color="rgba(255,255,255,0.85)" />
          <Text style={styles.headerTitle}>{meta.label}</Text>
        </View>
        <View style={{ width: 28 }} />
      </LinearGradient>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.body} bounces={false} showsVerticalScrollIndicator={false}>

          {/* ── START ── */}
          {phase === PHASES.START && (
            <View style={styles.centerBlock}>
              {/* Pulsing icon */}
              <View style={styles.pulseWrapper}>
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}>
                  <LinearGradient colors={meta.colors} style={styles.pulseInner}>
                    <Ionicons name={meta.icon} size={48} color={colors.white} />
                  </LinearGradient>
                </Animated.View>
                <View style={styles.pulseGlow} />
              </View>

              <Text style={styles.bigLabel}>Find a {meta.label} Match</Text>
              <Text style={styles.bigSub}>{meta.sub}</Text>

              {/* Action button */}
              <TouchableOpacity style={styles.actionButton} onPress={startSearch} activeOpacity={0.85}>
                <LinearGradient colors={meta.colors} style={styles.actionGradient}>
                  <Ionicons name="location-outline" size={22} color={colors.white} />
                  <Text style={styles.actionText}>Find Players Near Me</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* What happens next */}
              <View style={styles.stepsPreview}>
                <Text style={styles.stepsPreviewTitle}>What happens next</Text>
                <View style={styles.stepsPreviewRow}>
                  <View style={[styles.stepChip, { backgroundColor: meta.accentBg }]}>
                    <Ionicons name="location-outline" size={14} color={meta.accentColor} />
                    <Text style={[styles.stepChipText, { color: meta.accentColor }]}>Locate you</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                  <View style={[styles.stepChip, { backgroundColor: meta.accentBg }]}>
                    <Ionicons name="people-outline" size={14} color={meta.accentColor} />
                    <Text style={[styles.stepChipText, { color: meta.accentColor }]}>Find players</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                  <View style={[styles.stepChip, { backgroundColor: meta.accentBg }]}>
                    <Ionicons name="tennisball-outline" size={14} color={meta.accentColor} />
                    <Text style={[styles.stepChipText, { color: meta.accentColor }]}>Best court</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── LOCATING / SEARCHING ── */}
          {(phase === PHASES.LOCATING || phase === PHASES.SEARCHING) && (
            <View style={styles.centerBlock}>
              <View style={[styles.loadingIconWrap, { backgroundColor: meta.accentBg }]}>
                <Ionicons name="location" size={44} color={meta.accentColor} />
              </View>
              <Text style={styles.bigLabel}>
                {phase === PHASES.LOCATING ? "Getting your location" : "Finding players"}
              </Text>
              <Text style={styles.bigSub}>
                {phase === PHASES.LOCATING
                  ? "Allow location access when prompted"
                  : "Scanning for players within 25 km"}
              </Text>

              <View style={styles.loadingSteps}>
                <LoadingStep
                  icon="location-outline"
                  label="Getting GPS coordinates"
                  status={phase === PHASES.LOCATING ? "active" : "done"}
                />
                <LoadingStep
                  icon="wifi-outline"
                  label="Connecting to lobby"
                  status={phase === PHASES.LOCATING ? "pending" : "done"}
                />
                <LoadingStep
                  icon="people-outline"
                  label="Scanning for nearby players"
                  status={phase === PHASES.SEARCHING ? "active" : "pending"}
                />
                <LoadingStep
                  icon="filter-outline"
                  label="Filtering by game type"
                  status="pending"
                />
              </View>
            </View>
          )}

          {/* ── PLAYERS LIST ── */}
          {phase === PHASES.PLAYERS && (
            <View style={styles.listBlock}>
              {/* Status bar */}
              <View style={[styles.statusBar, { backgroundColor: meta.accentBg }]}>
                <View style={styles.statusBarLeft}>
                  <View style={[styles.statusDot, { backgroundColor: meta.accentColor }]} />
                  <Text style={[styles.statusBarText, { color: meta.accentColor }]}>
                    {players.length > 0
                      ? `${players.length} player${players.length !== 1 ? "s" : ""} found nearby`
                      : "No players found right now"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPhase(PHASES.START)} hitSlop={8}>
                  <Text style={[styles.statusBarAction, { color: meta.accentColor }]}>Refresh</Text>
                </TouchableOpacity>
              </View>

              {players.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: meta.accentBg }]}>
                    <Ionicons name="people-outline" size={42} color={meta.accentColor} />
                  </View>
                  <Text style={styles.emptyTitle}>No one nearby yet</Text>
                  <Text style={styles.emptyText}>
                    No one is searching for a {meta.label} match within 25 km right now.
                    Share the app with friends to grow the network!
                  </Text>
                  <TouchableOpacity
                    style={[styles.retryButton, { borderColor: meta.accentColor }]}
                    onPress={() => setPhase(PHASES.START)}
                  >
                    <Ionicons name="refresh-outline" size={16} color={meta.accentColor} />
                    <Text style={[styles.retryText, { color: meta.accentColor }]}>Search Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.listSubLabel}>Tap a player to challenge them</Text>
                  {players.map((player, index) => (
                    <TouchableOpacity
                      key={player.uid}
                      style={styles.playerCard}
                      onPress={() => challengePlayer(player)}
                      activeOpacity={0.85}
                    >
                      {/* Rank badge */}
                      {index === 0 && (
                        <View style={styles.closestBadge}>
                          <Text style={styles.closestBadgeText}>Closest</Text>
                        </View>
                      )}
                      <View style={[styles.playerAvatar, { backgroundColor: meta.accentColor }]}>
                        <Text style={styles.playerInitial}>
                          {(player.displayName || "P")[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.displayName}</Text>
                        <View style={styles.playerMetaRow}>
                          <Ionicons name="location-outline" size={12} color={colors.textGray} />
                          <Text style={styles.playerDist}>{fmtDist(player.distanceKm)} away</Text>
                          <View style={styles.playerDot} />
                          <Text style={styles.playerType}>{meta.label}</Text>
                        </View>
                      </View>
                      <LinearGradient colors={meta.colors} style={styles.challengeBtn}>
                        <Ionicons name="flash" size={14} color={colors.white} />
                        <Text style={styles.challengeText}>Challenge</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}

          {/* ── FINDING COURTS ── */}
          {phase === PHASES.COURTS && (
            <View style={styles.centerBlock}>
              <View style={[styles.loadingIconWrap, { backgroundColor: meta.accentBg }]}>
                <Ionicons name="map" size={44} color={meta.accentColor} />
              </View>
              <Text style={styles.bigLabel}>Finding your court</Text>
              <Text style={styles.bigSub}>
                Calculating the fairest meeting point for you and{" "}
                <Text style={{ fontWeight: "700", color: colors.textDark }}>
                  {selectedPlayer?.displayName}
                </Text>
              </Text>

              <View style={styles.loadingSteps}>
                <LoadingStep icon="people-outline" label="Calculating midpoint" status="done" />
                <LoadingStep icon="map-outline" label="Querying OpenStreetMap courts" status="active" />
                <LoadingStep icon="calculator-outline" label="Ranking by total travel distance" status="pending" />
              </View>
            </View>
          )}

          {/* ── MATCHED ── */}
          {phase === PHASES.MATCHED && bestCourt && (
            <View style={styles.listBlock}>
              {/* VS Header */}
              <LinearGradient colors={meta.colors} style={styles.vsCard}>
                <View style={styles.vsPlayer}>
                  <View style={[styles.vsAvatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                    <Text style={styles.vsInitial}>{myInitial}</Text>
                  </View>
                  <Text style={styles.vsName} numberOfLines={1}>{myName}</Text>
                  <Text style={styles.vsRole}>You</Text>
                </View>

                <View style={styles.vsCenter}>
                  <Text style={styles.vsText}>VS</Text>
                  <Ionicons name="tennisball" size={22} color="rgba(255,255,255,0.5)" />
                </View>

                <View style={styles.vsPlayer}>
                  <View style={[styles.vsAvatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                    <Text style={styles.vsInitial}>
                      {(selectedPlayer?.displayName || "P")[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.vsName} numberOfLines={1}>{selectedPlayer?.displayName}</Text>
                  <Text style={styles.vsRole}>Opponent</Text>
                </View>
              </LinearGradient>

              {/* Court card */}
              <View style={styles.courtCard}>
                <View style={styles.courtCardHeader}>
                  <View style={[styles.courtIconWrap, { backgroundColor: meta.accentBg }]}>
                    <Ionicons name="location" size={26} color={meta.accentColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.courtBestBadge}>
                      <Ionicons name="star" size={11} color="#D97706" />
                      <Text style={styles.courtBestText}>Best Match</Text>
                    </View>
                    <Text style={styles.courtName}>{bestCourt.name}</Text>
                    <Text style={styles.courtType}>
                      {bestCourt.sport.charAt(0).toUpperCase() + bestCourt.sport.slice(1)} Court
                    </Text>
                  </View>
                </View>

                <View style={styles.distRow}>
                  <View style={styles.distItem}>
                    <View style={styles.distIconWrap}>
                      <Ionicons name="person-outline" size={14} color={meta.accentColor} />
                    </View>
                    <Text style={styles.distLabel}>Your drive</Text>
                    <Text style={[styles.distValue, { color: meta.accentColor }]}>
                      {fmtDist(bestCourt.myDist)}
                    </Text>
                  </View>
                  <View style={styles.distDivider} />
                  <View style={styles.distItem}>
                    <View style={styles.distIconWrap}>
                      <Ionicons name="people-outline" size={14} color={meta.accentColor} />
                    </View>
                    <Text style={styles.distLabel}>Their drive</Text>
                    <Text style={[styles.distValue, { color: meta.accentColor }]}>
                      {fmtDist(bestCourt.theirDist)}
                    </Text>
                  </View>
                  <View style={styles.distDivider} />
                  <View style={styles.distItem}>
                    <View style={styles.distIconWrap}>
                      <Ionicons name="git-merge-outline" size={14} color={meta.accentColor} />
                    </View>
                    <Text style={styles.distLabel}>Combined</Text>
                    <Text style={[styles.distValue, { color: meta.accentColor }]}>
                      {fmtDist(bestCourt.totalDist)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Other courts */}
              {courts.length > 1 && (
                <>
                  <Text style={styles.altTitle}>Other nearby courts</Text>
                  {courts.slice(1).map((court) => (
                    <TouchableOpacity
                      key={court.id}
                      style={[styles.altCard, bestCourt.id === court.id && { borderColor: meta.accentColor }]}
                      onPress={() => setBestCourt(court)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.altIconWrap, { backgroundColor: meta.accentBg }]}>
                        <Ionicons name="location-outline" size={16} color={meta.accentColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.altName}>{court.name}</Text>
                        <Text style={styles.altDist}>
                          You: {fmtDist(court.myDist)} · Them: {fmtDist(court.theirDist)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textGray} />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Let's Play */}
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/scoresummary",
                    params: {
                      opponent: JSON.stringify(selectedPlayer),
                      gameType: type,
                      courtName: bestCourt.name,
                    },
                  })
                }
              >
                <LinearGradient colors={meta.colors} style={styles.actionGradient}>
                  <Ionicons name="tennisball-outline" size={22} color={colors.white} />
                  <Text style={styles.actionText}>Let's Play!</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backLink} onPress={() => setPhase(PHASES.PLAYERS)}>
                <Ionicons name="arrow-back" size={14} color={colors.textGray} />
                <Text style={styles.backLinkText}>Back to players</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </Animated.View>
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
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: "900", letterSpacing: 0.3 },

  body: { flexGrow: 1, paddingBottom: 48 },

  // ── Center states ──
  centerBlock: {
    minHeight: 560,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  // Pulse
  pulseWrapper: { marginBottom: 32, alignItems: "center", justifyContent: "center" },
  pulseRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseInner: { flex: 1, borderRadius: 65, alignItems: "center", justifyContent: "center" },
  pulseGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(50, 116, 239, 0.12)",
  },

  // Loading icon (non-pulse states)
  loadingIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  bigLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  bigSub: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 32,
    maxWidth: 280,
  },

  // Loading steps
  loadingSteps: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Action button
  actionButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  actionText: { color: colors.white, fontSize: 17, fontWeight: "800" },

  // Steps preview
  stepsPreview: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  stepsPreviewTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  stepsPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  stepChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepChipText: { fontSize: 11, fontWeight: "700" },

  // ── List states ──
  listBlock: { padding: 16, paddingTop: 12 },

  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  statusBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBarText: { fontSize: 13, fontWeight: "700" },
  statusBarAction: { fontSize: 13, fontWeight: "700" },

  listSubLabel: {
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  // Empty state
  emptyBlock: { alignItems: "center", paddingTop: 40, paddingHorizontal: 16, gap: 12 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.textDark },
  emptyText: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 290,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  retryText: { fontSize: 14, fontWeight: "700" },

  // Player card
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
  closestBadge: {
    position: "absolute",
    top: -8,
    left: 14,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  closestBadgeText: { fontSize: 10, fontWeight: "800", color: "#D97706" },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitial: { fontSize: 20, fontWeight: "900", color: colors.white },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 4 },
  playerMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  playerDist: { fontSize: 12, color: colors.textGray },
  playerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#D1D5DB" },
  playerType: { fontSize: 12, color: colors.textGray },
  challengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  challengeText: { color: colors.white, fontWeight: "700", fontSize: 13 },

  // VS card
  vsCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  vsPlayer: { flex: 1, alignItems: "center", gap: 6 },
  vsAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  vsInitial: { fontSize: 22, fontWeight: "900", color: colors.white },
  vsName: { fontSize: 13, fontWeight: "700", color: colors.white, maxWidth: 90, textAlign: "center" },
  vsRole: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "600" },
  vsCenter: { alignItems: "center", gap: 4, paddingHorizontal: 10 },
  vsText: { fontSize: 22, fontWeight: "900", color: colors.white, letterSpacing: 2 },

  // Court card
  courtCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  courtCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
  },
  courtIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  courtBestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  courtBestText: { fontSize: 11, fontWeight: "700", color: "#D97706" },
  courtName: { fontSize: 16, fontWeight: "800", color: colors.textDark, marginBottom: 2 },
  courtType: { fontSize: 12, color: colors.textGray },
  distRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
  },
  distItem: { flex: 1, alignItems: "center", gap: 5 },
  distIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  distLabel: { fontSize: 11, color: colors.textGray, fontWeight: "500" },
  distValue: { fontSize: 16, fontWeight: "800" },
  distDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 4 },

  // Alt courts
  altTitle: { fontSize: 14, fontWeight: "700", color: colors.textDark, marginBottom: 10 },
  altCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  altIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  altName: { fontSize: 13, fontWeight: "600", color: colors.textDark },
  altDist: { fontSize: 12, color: colors.textGray, marginTop: 2 },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 14,
  },
  backLinkText: { fontSize: 14, color: colors.textGray, fontWeight: "600" },
});
