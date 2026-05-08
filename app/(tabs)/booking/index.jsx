import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookings } from "../../../hooks/useBooking";
import { colors } from "../../../constants/colors";
import { auth } from "../../../services/firebaseConfig";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

const BADGE_COLORS = {
  tournament: { bg: "#DBEAFE", text: "#1D4ED8" },
  program: { bg: "#F3E8FF", text: "#7C3AED" },
};

function formatDate(dateStr) {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "TBD";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getBadgeLabel(item) {
  if (item.type === "tournament") {
    return item.format === "S" ? "Singles" : item.format === "D" ? "Doubles" : "Tournament";
  }
  return "Program";
}

function BookingCard({ item }) {
  const startDate = new Date(item.startDate || "");
  const isValid = !isNaN(startDate.getTime());
  const isPast = isValid && startDate < new Date();
  const badgeLabel = getBadgeLabel(item);
  const badgeColor = BADGE_COLORS[item.type] || BADGE_COLORS.program;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardBadge, { backgroundColor: badgeColor.bg }]}>
          <Text style={[styles.cardBadgeText, { color: badgeColor.text }]}>{badgeLabel}</Text>
        </View>
        <View style={[styles.statusDot, isPast ? styles.statusPast : styles.statusUpcoming]} />
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.name || "Booking"}
      </Text>

      <View style={styles.cardMeta}>
        <Ionicons name="calendar-outline" size={15} color={colors.textGray} />
        <Text style={styles.cardMetaText}>
          {isValid ? formatDate(item.startDate) : "Date TBD"}
        </Text>
      </View>

      {item.location ? (
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={15} color={colors.textGray} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
      ) : null}

      {item.fee != null ? (
        <View style={styles.cardMeta}>
          <Ionicons name="cash-outline" size={15} color={colors.textGray} />
          <Text style={styles.cardMetaText}>
            {item.fee === 0 ? "Free" : `$${item.fee} entry fee`}
          </Text>
        </View>
      ) : null}

      <View style={[styles.statusBanner, isPast ? styles.statusBannerPast : styles.statusBannerUpcoming]}>
        <Ionicons
          name={isPast ? "checkmark-circle-outline" : "time-outline"}
          size={15}
          color={isPast ? "#6B7280" : "#059669"}
        />
        <Text style={[styles.statusBannerText, { color: isPast ? "#6B7280" : "#059669" }]}>
          {isPast ? "Completed" : "Confirmed"}
        </Text>
      </View>
    </View>
  );
}

export default function MyBookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("upcoming");
  const userId = auth.currentUser?.uid;
  const { bookings, loading } = useBookings(userId);

  const now = new Date();
  const upcoming = bookings.filter((b) => {
    const d = new Date(b.startDate || "");
    return isNaN(d.getTime()) || d >= now;
  });
  const past = bookings.filter((b) => {
    const d = new Date(b.startDate || "");
    return !isNaN(d.getTime()) && d < now;
  });

  const displayed = activeTab === "upcoming" ? upcoming : past;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable hitSlop={10} onPress={() => router.push("/(tabs)/home/homepage")}>
          <Ionicons name="arrow-back" size={28} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Pressable hitSlop={10} onPress={() => router.push("/(tabs)/programs")}>
          <Ionicons name="calendar-outline" size={28} color={colors.white} />
        </Pressable>
      </LinearGradient>

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
          <ActivityIndicator size="large" color={colors.primaryEnd} />
          <Text style={styles.centerText}>Loading your bookings...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "upcoming"
              ? "Sign up for tournaments or programs to see them here"
              : "Your completed bookings will appear here"}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {displayed.map((item, i) => (
            <BookingCard key={item.id ?? i} item={item} />
          ))}
        </ScrollView>
      )}
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
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: colors.primaryEnd },
  tabText: { fontSize: 15, fontWeight: "600", color: colors.textGray },
  tabTextActive: { color: colors.primaryEnd },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  centerText: { fontSize: 15, color: colors.textGray, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardBadgeText: { fontSize: 12, fontWeight: "700" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusUpcoming: { backgroundColor: "#22C55E" },
  statusPast: { backgroundColor: "#9CA3AF" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: colors.textDark, marginBottom: 10 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  cardMetaText: { fontSize: 14, color: colors.textGray, flex: 1 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
  },
  statusBannerUpcoming: { backgroundColor: "#D1FAE5" },
  statusBannerPast: { backgroundColor: "#F3F4F6" },
  statusBannerText: { fontSize: 13, fontWeight: "600" },
});
