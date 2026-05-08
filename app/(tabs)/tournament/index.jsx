// app/(tabs)/tournament/index.jsx
// Fetches tournament data from the local GPN scraper (scraper/server.js)
// instead of calling the GPN API directly.

import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/colors";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  View,
  ActivityIndicator,
  FlatList,
  Linking,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ─── Scraper endpoint ─────────────────────────────────────────────────────────
// Point this at wherever your scraper/server.js is running.
// • Local dev (iOS Simulator / Android Emulator on same machine):
//     http://localhost:3001/tournaments
// • Android Emulator (needs host machine IP, not localhost):
//     http://10.0.2.2:3001/tournaments
// • Physical device / Expo Go on LAN:
//     http://<YOUR_MACHINE_LAN_IP>:3001/tournaments   e.g. http://192.168.1.42:3001/tournaments
// • Production: replace with your deployed scraper URL
const SCRAPER_URL = "http://192.168.1.159:3001/tournaments";

const FILTERS = [
  { label: "All Events", value: "All" },
  { label: "Singles", value: "S" },
  { label: "Doubles", value: "D" },
];

function FilterButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TournamentCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {item.singlesDoubles === "S" ? "Singles" : "Doubles"}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMeta}>📅 {item.startDate} → {item.endDate}</Text>
        <Text style={styles.cardMeta}>
          📍 {[item.city, item.country].filter(Boolean).join(", ")}
        </Text>
        <Text style={styles.cardMeta}>👥 {item.totalPlayers} registered</Text>
        <Text style={styles.cardMeta}>
          🎯 Level: {item.startLevel} – {item.endLevel}
        </Text>
        {item.fee ? (
          <Text style={styles.cardMeta}>💵 Fee: {item.fee}</Text>
        ) : null}
        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => item.url && Linking.openURL(item.url)}
        >
          <Text style={styles.registerText}>Register Now →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [allData, setAllData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch(SCRAPER_URL);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? `Server responded with ${response.status}`);
        }

        const json = await response.json();
        if (!Array.isArray(json)) throw new Error("Unexpected response from scraper");

        setAllData(json);
        setDisplayedData(json);
      } catch (err) {
        setError(err.message || "Failed to load tournaments.");
        console.error("[Scraper fetch]", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const applyFilter = (value) => {
    setActiveFilter(value);
    if (value === "All") {
      setDisplayedData(allData);
    } else {
      setDisplayedData(allData.filter((t) => t.singlesDoubles === value));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable hitSlop={10} onPress={() => router.push("/(tabs)/friends")}>
          <Ionicons name="people-outline" size={28} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <Pressable hitSlop={10}>
          <Ionicons name="trophy-outline" size={28} color={colors.white} />
        </Pressable>
      </LinearGradient>

      <FlatList
        data={displayedData}
        keyExtractor={(item, index) => String(item.tournamentID ?? index)}
        renderItem={({ item }) => <TournamentCard item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {error ?? "No tournaments found."}
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          <>
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Available Tournaments</Text>
                <Text style={styles.sectionCount}>
                  {loading ? "…" : `${displayedData.length} events`}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
              >
                {FILTERS.map((f) => (
                  <FilterButton
                    key={f.value}
                    label={f.label}
                    active={activeFilter === f.value}
                    onPress={() => applyFilter(f.value)}
                  />
                ))}
              </ScrollView>
            </View>

            {loading && (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primaryEnd} />
              </View>
            )}
          </>
        }
      />
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

  section: { padding: 20, paddingBottom: 8 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.textDark },
  sectionCount: { fontSize: 13, color: colors.textGray, fontWeight: "600" },
  filters: { gap: 10, paddingBottom: 4 },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: { backgroundColor: colors.primaryEnd, borderColor: colors.primaryEnd },
  filterText: { color: "#374151", fontWeight: "600" },
  filterTextActive: { color: colors.white },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontSize: 15, color: colors.textGray, textAlign: "center" },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.primaryEnd,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  cardContent: { padding: 16 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 10,
    color: colors.textDark,
  },
  cardMeta: { fontSize: 14, marginBottom: 4, color: "#374151" },
  cardDescription: { marginTop: 10, fontSize: 14, color: "#4b5563" },
  registerButton: {
    marginTop: 16,
    backgroundColor: colors.primaryEnd,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  registerText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
