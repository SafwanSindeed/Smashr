// app/(tabs)/tournament/index.jsx

import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Linking,
  ScrollView,
} from "react-native";

const GPN_URL =
  "https://www.globalpickleball.network/component/api?apiCall=getTournaments&format=raw&devKey=264784-q4jMNhO3X&limit=100";

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
        <Text style={styles.cardMeta}>📍 {item.city}, {item.country}</Text>
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
  const [allData, setAllData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch(GPN_URL);
        const json = await response.json();
        setAllData(json);
        setDisplayedData(json);
      } catch (err) {
        setError("Failed to load tournaments. Check your connection.");
        console.error(err);
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
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
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
            <LinearGradient colors={["#1e40af", "#2563eb"]} style={styles.hero}>
              <Text style={styles.heroBadge}>🏆 Pickleball Tournaments</Text>
              <Text style={styles.heroTitle}>
                Find Your Next{"\n"}
                <Text style={styles.heroHighlight}>Pickleball Match</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Register for singles or doubles pickleball tournaments and
                compete with the best players in your area
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {loading ? "…" : displayedData.length}
                  </Text>
                  <Text style={styles.statLabel}>Active Events</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Available Tournaments</Text>
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
  container: { flex: 1, backgroundColor: colors.background },

  hero: { padding: 24, paddingBottom: 40 },
  heroBadge: { color: colors.primaryStart, fontWeight: "600", marginBottom: 12 },
  heroTitle: { fontSize: 34, fontWeight: "800", color: colors.white, lineHeight: 40 },
  heroHighlight: { color: "#93c5fd" },
  heroSubtitle: { marginTop: 12, fontSize: 16, color: colors.white, maxWidth: 340 },
  statsRow: { flexDirection: "row", marginTop: 24, gap: 16 },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 16,
    borderRadius: 12,
    minWidth: 140,
  },
  statNumber: { fontSize: 22, fontWeight: "700", color: colors.white },
  statLabel: { color: colors.white, marginTop: 4 },

  section: { padding: 20, paddingBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  filters: { gap: 10, paddingBottom: 4 },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginRight: 8,
  },
  filterButtonActive: { backgroundColor: colors.primaryEnd },
  filterText: { color: "#374151", fontWeight: "600" },
  filterTextActive: { color: colors.white },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontSize: 15, color: colors.textGray, textAlign: "center" },

  card: {
    backgroundColor: "#ecece3",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
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
  cardTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 10 },
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
