// app/(tabs)/programs/index.jsx

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";

// ─── Helper: format a Date into "9:00 AM" style ───────────────────────────────
function formatTime(dateStr) {
  const d = new Date(dateStr);
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${mins} ${ampm}`;
}

// ─── Helper: format a Date into "Mon 3/24" style ──────────────────────────────
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

// ─── Helper: status badge info based on spots left ───────────────────────────
function getStatusInfo(spotsRemaining) {
  if (spotsRemaining <= 0)
    return { text: "WAITLIST", bg: "#FEF3C7", color: "#D97706" };
  if (spotsRemaining === 1)
    return { text: "1 SPOT LEFT", bg: "#FEE2E2", color: "#DC2626" };
  if (spotsRemaining <= 3)
    return { text: `${spotsRemaining} SPOTS LEFT`, bg: "#FFEDD5", color: "#EA580C" };
  return { text: "AVAILABLE", bg: "#D1FAE5", color: "#059669" };
}

// ─── Helper: level badge color ────────────────────────────────────────────────
function getLevelColor(level) {
  const map = {
    all: "#3B82F6",
    beginner: "#22C55E",
    intermediate: "#F59E0B",
    advanced: "#EF4444",
  };
  return map[level] || "#6B7280";
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "open-play", label: "Open Play" },
  { id: "clinics", label: "Clinics" },
  { id: "leagues", label: "Leagues" },
];

// ─── Mock data (replace with real API later) ──────────────────────────────────
const MOCK_SESSIONS = [
  {
    _id: "1",
    start_time: new Date().setHours(9, 0),
    end_time: new Date().setHours(10, 30),
    spots_remaining: 5,
    price: 20,
    category: "open-play",
    instructor_name: "Coach Mike",
    notes: "Bring your own paddle.",
    program_id: { name: "Morning Open Play", level: "all", description: "Open play for all skill levels. Come join the fun!" },
    location_id: { name: "Court A", address: "123 Main St", city: "New York" },
  },
  {
    _id: "2",
    start_time: new Date().setHours(11, 0),
    end_time: new Date().setHours(12, 0),
    spots_remaining: 1,
    price: 35,
    category: "clinics",
    instructor_name: "Coach Sarah",
    notes: null,
    program_id: { name: "Beginner Clinic", level: "beginner", description: "Learn the basics of pickleball in a fun, supportive environment." },
    location_id: { name: "Court B", address: "123 Main St", city: "New York" },
  },
  {
    _id: "3",
    start_time: new Date().setHours(14, 0),
    end_time: new Date().setHours(16, 0),
    spots_remaining: 0,
    price: 15,
    category: "leagues",
    instructor_name: null,
    notes: "Round-robin format.",
    program_id: { name: "Afternoon League", level: "intermediate", description: "Competitive league play for intermediate players." },
    location_id: { name: "Court C", address: "123 Main St", city: "New York" },
  },
  {
    _id: "4",
    start_time: new Date().setHours(17, 0),
    end_time: new Date().setHours(18, 30),
    spots_remaining: 8,
    price: 25,
    category: "clinics",
    instructor_name: "Coach Alex",
    notes: null,
    program_id: { name: "Advanced Drills", level: "advanced", description: "High-intensity drill sessions for advanced players." },
    location_id: { name: "Court A", address: "123 Main St", city: "New York" },
  },
];

// ─── Program Detail Modal ─────────────────────────────────────────────────────
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
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Program Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Image placeholder */}
            <View style={styles.imagePlaceholder}>
              <Ionicons name="calendar" size={64} color={colors.primaryEnd} />
            </View>

            {/* Program name & description */}
            <Text style={styles.programTitle}>{program.name}</Text>
            <Text style={styles.programDescription}>{program.description}</Text>

            {/* Details */}
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

            {/* Capacity */}
            <View style={[styles.capacityInfo, isFull ? styles.capacityWarning : styles.capacitySuccess]}>
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

            {/* Notes */}
            {session.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            )}

            {/* Book button */}
            <TouchableOpacity style={styles.bookButton} onPress={onClose}>
              <Text style={styles.bookButtonText}>
                {isFull ? "Join Waitlist" : "Book Now"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Programs Screen ─────────────────────────────────────────────────────
export default function Programs() {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  // Build next 4 days
  const dates = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Filter sessions by category
  const filteredSessions = MOCK_SESSIONS.filter(
    (s) => !selectedCategory || s.category === selectedCategory
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      {/* ── Header ── */}
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

      {/* ── Date Selector ── */}
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
              style={[styles.dateButtonText, selectedDateIndex === index && styles.dateButtonTextActive]}
            >
              {formatDateLabel(date)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Category Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabs}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            style={[styles.categoryButton, selectedCategory === cat.id && styles.categoryButtonActive]}
          >
            <Text
              style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{formatDateLabel(dates[selectedDateIndex])}</Text>
        <View style={styles.sessionCountBadge}>
          <Text style={styles.sessionCountText}>{filteredSessions.length} sessions</Text>
        </View>
      </View>

      {/* ── Sessions List ── */}
      <ScrollView contentContainerStyle={styles.sessionsList}>
        {filteredSessions.length === 0 ? (
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
                {/* Card top: time + status */}
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

                {/* Program name */}
                <Text style={styles.programName}>{program.name}</Text>

                {/* Location */}
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={16} color={colors.textGray} />
                  <Text style={styles.locationText}>{location.name}</Text>
                </View>

                {/* Card footer: level + price */}
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

      {/* ── Detail Modal ── */}
      <ProgramDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Header
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
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.textDark,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bellContainer: {
    position: "relative",
  },
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

  // Date Selector
  dateSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  dateButtonActive: {
    backgroundColor: colors.primaryEnd,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  dateButtonTextActive: {
    color: colors.white,
    fontWeight: "600",
  },

  // Category Tabs
  categoryTabs: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: colors.primaryEnd,
    borderColor: colors.primaryEnd,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: "600",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textDark,
  },
  sessionCountBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionCountText: {
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "500",
  },

  // Sessions List
  sessionsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textGray,
  },

  // Session Card
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
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: colors.textGray,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  programName: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 6,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: colors.textGray,
  },
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
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
  },

  // Modal
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  programTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textDark,
    marginBottom: 6,
  },
  programDescription: {
    fontSize: 15,
    color: colors.textGray,
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  detailSubtext: {
    fontSize: 13,
    color: colors.textGray,
    marginTop: 2,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.textDark,
  },
  capacityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  capacitySuccess: {
    backgroundColor: "#D1FAE5",
  },
  capacityWarning: {
    backgroundColor: "#FEF3C7",
  },
  capacityText: {
    fontSize: 15,
    fontWeight: "600",
  },
  notesContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: colors.textGray,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
});