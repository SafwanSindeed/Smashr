// app/(tabs)/programs/index.jsx

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";

function formatTime(dateStr) {
  const d = new Date(dateStr);
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${mins} ${ampm}`;
}

function formatDateLabel(date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, tomorrow)) return "Tomorrow";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

function getStatusInfo(spotsRemaining) {
  if (spotsRemaining <= 0)
    return { text: "WAITLIST", bg: "#FEF3C7", color: "#D97706" };
  if (spotsRemaining === 1)
    return { text: "1 SPOT LEFT", bg: "#FEE2E2", color: "#DC2626" };
  if (spotsRemaining <= 3)
    return { text: `${spotsRemaining} SPOTS LEFT`, bg: "#FFEDD5", color: "#EA580C" };
  return { text: "AVAILABLE", bg: "#D1FAE5", color: "#059669" };
}

function getLevelColor(level) {
  const map = {
    all: "#3B82F6",
    beginner: "#22C55E",
    intermediate: "#F59E0B",
    advanced: "#EF4444",
  };
  return map[level] || "#6B7280";
}

const CATEGORIES = [
  { id: "open-play", label: "Open Play" },
  { id: "clinics", label: "Clinics" },
  { id: "leagues", label: "Leagues" },
];

const GPN_BASE = "https://www.globalpickleball.network/component/api";
const GPN_DEV_KEY = "264784-q4jMNhO3X";

function mapLevel(startLevel, endLevel) {
  const start = parseFloat(startLevel) || 0;
  const end = parseFloat(endLevel) || start;
  const avg = (start + end) / 2;
  if (avg <= 2.5) return "beginner";
  if (avg <= 3.5) return "intermediate";
  if (avg > 3.5) return "advanced";
  return "all";
}

function mapCategory(singlesDoubles) {
  if (singlesDoubles === "S") return "open-play";
  if (singlesDoubles === "D") return "leagues";
  return "clinics";
}

function mapTournamentToSession(item, index) {
  return {
    _id: String(item.tournamentID || index),
    start_time: new Date(item.startDate).getTime(),
    end_time: new Date(item.endDate).getTime(),
    spots_remaining: Math.max(
      0,
      (parseInt(item.maxPlayers, 10) || 32) - (parseInt(item.totalPlayers, 10) || 0)
    ),
    price: parseFloat(item.fee) || 0,
    category: mapCategory(item.singlesDoubles),
    instructor_name: item.directorName || null,
    notes: item.description || null,
    url: item.url || null,
    program_id: {
      name: item.name || "Unnamed Tournament",
      level: mapLevel(item.startLevel, item.endLevel),
      description: item.description || "No description available.",
    },
    location_id: {
      name: item.venueName || item.city || "TBD",
      address: item.address || "",
      city: item.city ? `${item.city}, ${item.country || ""}`.trim() : "TBD",
    },
  };
}

function ProgramDetailModal({ session, onClose }) {
  if (!session) return null;

  const program = session.program_id;
  const location = session.location_id;
  const spotsRemaining = session.spots_remaining ?? 0;
  const isFull = spotsRemaining <= 0;
  const levelColor = getLevelColor(program.level);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Program Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="calendar" size={64} color={colors.primaryEnd} />
            </View>

            <Text style={styles.programTitle}>{program.name}</Text>
            <Text style={styles.programDescription}>{program.description}</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={20} color={colors.primaryEnd} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(session.start_time)} – {formatTime(session.end_time)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={20} color={colors.primaryEnd} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{location.name}</Text>
                  <Text style={styles.detailSubtext}>
                    {location.address}, {location.city}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="cellular-outline" size={20} color={colors.primaryEnd} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Level</Text>
                  <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
                    <Text style={styles.levelBadgeText}>
                      {program.level.charAt(0).toUpperCase() + program.level.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {session.instructor_name && (
                <View style={styles.detailItem}>
                  <Ionicons name="person-outline" size={20} color={colors.primaryEnd} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Instructor</Text>
                    <Text style={styles.detailValue}>{session.instructor_name}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={20} color={colors.primaryEnd} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.priceValue}>${session.price}</Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.capacityInfo,
                isFull ? styles.capacityWarning : styles.capacitySuccess,
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={isFull ? "#D97706" : "#059669"}
              />
              <Text style={[styles.capacityText, { color: isFull ? "#D97706" : "#059669" }]}>
                {isFull
                  ? "Session Full – Waitlist Available"
                  : `${spotsRemaining} spot${spotsRemaining !== 1 ? "s" : ""} remaining`}
              </Text>
            </View>

            {session.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => {
                if (session.url) Linking.openURL(session.url);
                onClose();
              }}
            >
              <Text style={styles.bookButtonText}>
                {session.url ? "Register Now" : isFull ? "Join Waitlist" : "Book Now"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function Programs() {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `${GPN_BASE}?apiCall=getTournaments&format=raw&devKey=${GPN_DEV_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        const mapped = (Array.isArray(json) ? json : []).map(mapTournamentToSession);
        setSessions(mapped);
      } catch (err) {
        console.error("Failed to fetch programs:", err);
        setError("Unable to load programs. Pull down to retry.");
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const fallsOnDate = (session, date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const sessionStart = new Date(session.start_time);
    const sessionEnd = new Date(session.end_time);
    return sessionStart <= dayEnd && sessionEnd >= dayStart;
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesDate = fallsOnDate(s, dates[selectedDateIndex]);
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    return matchesDate && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Programs</Text>
        <View style={styles.headerActions}>
          <Ionicons name="search-outline" size={24} color={colors.textGray} />
          <View style={styles.bellContainer}>
            <Ionicons name="notifications-outline" size={24} color={colors.textGray} />
            <View style={styles.notificationDot} />
          </View>
          <Ionicons name="filter-outline" size={24} color={colors.textGray} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateSelector}
      >
        {dates.map((date, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedDateIndex(index)}
            style={[styles.dateButton, selectedDateIndex === index && styles.dateButtonActive]}
          >
            <Text
              style={[
                styles.dateButtonText,
                selectedDateIndex === index && styles.dateButtonTextActive,
              ]}
            >
              {formatDateLabel(date)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabs}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() =>
              setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
            }
            style={[
              styles.categoryButton,
              selectedCategory === cat.id && styles.categoryButtonActive,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Programs</Text>
        <View style={styles.sessionCountBadge}>
          <Text style={styles.sessionCountText}>
            {loading ? "..." : `${filteredSessions.length} sessions`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.sessionsList}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primaryEnd} />
            <Text style={styles.emptyText}>Loading programs...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cloud-offline-outline" size={64} color={colors.textGray} />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textGray} />
            <Text style={styles.emptyText}>No sessions available for this date</Text>
          </View>
        ) : (
          filteredSessions.map((session) => {
            const program = session.program_id;
            const location = session.location_id;
            const status = getStatusInfo(session.spots_remaining ?? 0);
            const levelColor = getLevelColor(program.level);

            return (
              <TouchableOpacity
                key={session._id}
                style={styles.sessionCard}
                onPress={() => setSelectedSession(session)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={styles.timeInfo}>
                    <Ionicons name="time-outline" size={16} color={colors.textGray} />
                    <Text style={styles.timeText}>
                      {formatTime(session.start_time)} – {formatTime(session.end_time)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.text}
                    </Text>
                  </View>
                </View>

                <Text style={styles.programName}>{program.name}</Text>

                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={16} color={colors.textGray} />
                  <Text style={styles.locationText}>{location.name}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
                    <Ionicons name="cellular-outline" size={12} color="#fff" />
                    <Text style={styles.levelBadgeText}>
                      {program.level.charAt(0).toUpperCase() + program.level.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.price}>${session.price}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <ProgramDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: colors.textDark },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  bellContainer: { position: "relative" },
  notificationDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: colors.white,
  },

  dateSelector: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.border,
    marginRight: 6,
  },
  dateButtonActive: { backgroundColor: colors.primaryEnd },
  dateButtonText: { fontSize: 12, fontWeight: "500", color: colors.textDark },
  dateButtonTextActive: { color: colors.white, fontWeight: "600" },

  categoryTabs: { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: 6,
  },
  categoryButtonActive: { backgroundColor: colors.primaryEnd, borderColor: colors.primaryEnd },
  categoryText: { fontSize: 12, fontWeight: "500", color: colors.textDark },
  categoryTextActive: { color: colors.white, fontWeight: "600" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  sessionCountBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sessionCountText: { fontSize: 11, color: colors.textGray, fontWeight: "500" },

  sessionsList: { paddingHorizontal: 12, paddingBottom: 24, gap: 8 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 64,
    gap: 12,
  },
  emptyText: { fontSize: 16, color: colors.textGray },

  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timeInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 14, color: colors.textGray },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" },
  programName: { fontSize: 17, fontWeight: "800", color: colors.textDark, marginBottom: 6 },
  locationInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  locationText: { fontSize: 14, color: colors.textGray },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeText: { fontSize: 12, fontWeight: "700", color: colors.white },
  price: { fontSize: 16, fontWeight: "700", color: colors.textDark },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.textDark },
  closeButton: { padding: 4 },
  modalBody: { padding: 16 },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  programTitle: { fontSize: 22, fontWeight: "900", color: colors.textDark, marginBottom: 6 },
  programDescription: { fontSize: 15, color: colors.textGray, lineHeight: 22, marginBottom: 20 },
  detailsGrid: { gap: 16, marginBottom: 20 },
  detailItem: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: colors.textGray, fontWeight: "500", marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: "600", color: colors.textDark },
  detailSubtext: { fontSize: 13, color: colors.textGray, marginTop: 2 },
  priceValue: { fontSize: 26, fontWeight: "900", color: colors.textDark },
  capacityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  capacitySuccess: { backgroundColor: "#D1FAE5" },
  capacityWarning: { backgroundColor: "#FEF3C7" },
  capacityText: { fontSize: 15, fontWeight: "600" },
  notesContainer: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 14, marginBottom: 14 },
  notesLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6 },
  notesText: { fontSize: 14, color: colors.textGray, lineHeight: 20 },
  bookButton: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  bookButtonText: { color: colors.white, fontSize: 17, fontWeight: "700" },
});
