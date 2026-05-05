// app/(tabs)/booking/index.jsx

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../../../hooks/useBooking";
import { auth } from "../../../services/firebaseConfig";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

function formatDate(dateStr) {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function BookingCard({ item }) {
  const startDate = new Date(item.startDate || item.start_date || item.startdate || "");
  const isValid = !isNaN(startDate.getTime());
  const isPast = isValid && startDate < new Date();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>Tournament</Text>
        </View>
        <View style={[styles.statusDot, isPast ? styles.statusPast : styles.statusUpcoming]} />
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.name || item.tournamentName || "Tournament"}
      </Text>

      <View style={styles.cardMeta}>
        <Ionicons name="calendar-outline" size={15} color="#6B7280" />
        <Text style={styles.cardMetaText}>
          {isValid ? formatDate(startDate) : "Date TBD"}
        </Text>
      </View>

      {(item.venueName || item.city) ? (
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={15} color="#6B7280" />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {item.venueName || item.city}
          </Text>
        </View>
      ) : null}

      {item.singlesDoubles ? (
        <View style={styles.cardMeta}>
          <Ionicons name="people-outline" size={15} color="#6B7280" />
          <Text style={styles.cardMetaText}>
            {item.singlesDoubles === "S" ? "Singles" : "Doubles"}
          </Text>
        </View>
      ) : null}

      {item.url ? (
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => Linking.openURL(item.url)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const userId = auth.currentUser?.uid;
  const { bookings, loading } = useBookings(userId);

  const now = new Date();
  const upcoming = bookings.filter((b) => {
    const d = new Date(b.startDate || b.start_date || b.startdate || "");
    return isNaN(d.getTime()) || d >= now;
  });
  const past = bookings.filter((b) => {
    const d = new Date(b.startDate || b.start_date || b.startdate || "");
    return !isNaN(d.getTime()) && d < now;
  });

  const displayed = activeTab === "upcoming" ? upcoming : past;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        {bookings.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{bookings.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
              {tab.id === "upcoming" && upcoming.length > 0 ? ` (${upcoming.length})` : ""}
              {tab.id === "past" && past.length > 0 ? ` (${past.length})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3274EF" />
          <Text style={styles.centerText}>Loading your bookings...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {activeTab === "upcoming" ? "No upcoming tournaments" : "No past tournaments"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "upcoming"
              ? "Register for a tournament in the Programs tab"
              : "Your completed tournaments will appear here"}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {displayed.map((item, i) => (
            <BookingCard key={item.tournamentID ?? i} item={item} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#212325" },
  countBadge: {
    backgroundColor: "#3274EF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#3274EF" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#3274EF" },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  centerText: { fontSize: 15, color: "#6B7280", marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },

  list: { padding: 16, gap: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardBadgeText: { fontSize: 12, fontWeight: "700", color: "#1D4ED8" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusUpcoming: { backgroundColor: "#22C55E" },
  statusPast: { backgroundColor: "#9CA3AF" },

  cardTitle: { fontSize: 17, fontWeight: "800", color: "#212325", marginBottom: 10 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  cardMetaText: { fontSize: 14, color: "#6B7280", flex: 1 },

  viewButton: {
    marginTop: 12,
    backgroundColor: "#3274EF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  viewButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
