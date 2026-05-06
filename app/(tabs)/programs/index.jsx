// app/(tabs)/programs/index.jsx

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";

const GPN_BASE = "https://www.globalpickleball.network/component/api";
const GPN_DEV_KEY = "264784-q4jMNhO3X";

const CATEGORIES = [
  { id: "open-play", label: "Open Play" },
  { id: "clinics", label: "Clinics" },
  { id: "leagues", label: "Leagues" },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts) {
  const d = new Date(ts);
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

function formatDateTabLabel(date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, tomorrow)) return "Tomorrow";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
}

function mapLevel(startLevel, endLevel) {
  const start = parseFloat(startLevel) || 0;
  const end = parseFloat(endLevel) || start;
  const avg = (start + end) / 2;
  if (avg <= 2.5) return "Beginner";
  if (avg <= 3.5) return "Intermediate";
  return "Advanced";
}

function getLevelColor(level) {
  if (level === "Beginner") return "#22C55E";
  if (level === "Intermediate") return "#F59E0B";
  if (level === "Advanced") return "#EF4444";
  return "#6B7280";
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

function fallsOnDate(session, date) {
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  return new Date(session.start_time) <= dayEnd && new Date(session.end_time) >= dayStart;
}

// ─── Detail Modal ────────────────────────────────────────────────────────────

function ProgramDetailModal({ session, onClose }) {
  if (!session) return null;
  const program  = session.program_id;
  const location = session.location_id;
  const spots    = session.spots_remaining ?? 0;
  const isFull   = spots <= 0;
  const levelColor = getLevelColor(program.level);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Program Details</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetBanner}>
              <Ionicons name="calendar" size={56} color={colors.primaryEnd} />
            </View>

            <Text style={styles.sheetProgramTitle}>{program.name}</Text>
            <Text style={styles.sheetDescription}>{program.description}</Text>

            <View style={styles.sheetDetails}>
              <View style={styles.sheetRow}>
                <Ionicons name="time-outline" size={18} color={colors.primaryEnd} />
                <View style={styles.sheetRowBody}>
                  <Text style={styles.sheetRowLabel}>Time</Text>
                  <Text style={styles.sheetRowValue}>
                    {formatTime(session.start_time)} – {formatTime(session.end_time)}
                  </Text>
                </View>
              </View>

              <View style={styles.sheetRow}>
                <Ionicons name="location-outline" size={18} color={colors.primaryEnd} />
                <View style={styles.sheetRowBody}>
                  <Text style={styles.sheetRowLabel}>Location</Text>
                  <Text style={styles.sheetRowValue}>{location.name}</Text>
                  {location.city ? (
                    <Text style={styles.sheetRowSub}>{location.city}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.sheetRow}>
                <Ionicons name="cellular-outline" size={18} color={colors.primaryEnd} />
                <View style={styles.sheetRowBody}>
                  <Text style={styles.sheetRowLabel}>Level</Text>
                  <View style={[styles.levelPill, { backgroundColor: levelColor }]}>
                    <Text style={styles.levelPillText}>{program.level}</Text>
                  </View>
                </View>
              </View>

              {session.instructor_name ? (
                <View style={styles.sheetRow}>
                  <Ionicons name="person-outline" size={18} color={colors.primaryEnd} />
                  <View style={styles.sheetRowBody}>
                    <Text style={styles.sheetRowLabel}>Instructor</Text>
                    <Text style={styles.sheetRowValue}>{session.instructor_name}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.sheetRow}>
                <Ionicons name="cash-outline" size={18} color={colors.primaryEnd} />
                <View style={styles.sheetRowBody}>
                  <Text style={styles.sheetRowLabel}>Price</Text>
                  <Text style={styles.sheetPrice}>${session.price}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.capacityBar, isFull ? styles.capacityFull : styles.capacityOpen]}>
              <Ionicons
                name={isFull ? "alert-circle-outline" : "checkmark-circle-outline"}
                size={18}
                color={isFull ? "#D97706" : "#059669"}
              />
              <Text style={[styles.capacityText, { color: isFull ? "#D97706" : "#059669" }]}>
                {isFull
                  ? "Session Full — Waitlist Available"
                  : `${spots} spot${spots !== 1 ? "s" : ""} remaining`}
              </Text>
            </View>

            {session.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => { if (session.url) Linking.openURL(session.url); onClose(); }}
            >
              <Text style={styles.registerBtnText}>
                {session.url ? "Register Now" : isFull ? "Join Waitlist" : "Book Now"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Session Row ─────────────────────────────────────────────────────────────

function SessionRow({ session, onPress, isLast }) {
  const program  = session.program_id;
  const location = session.location_id;
  const levelColor = getLevelColor(program.level);

  return (
    <TouchableOpacity
      style={[styles.sessionRow, !isLast && styles.sessionRowBorder]}
      onPress={() => onPress(session)}
      activeOpacity={0.7}
    >
      <View style={[styles.sessionDot, { backgroundColor: colors.primaryEnd }]} />

      <View style={styles.sessionBody}>
        <Text style={styles.sessionTime}>
          {formatTime(session.start_time)} – {formatTime(session.end_time)}
        </Text>
        <Text style={styles.sessionName} numberOfLines={2}>
          {program.name}
        </Text>
        <View style={styles.sessionMetaRow}>
          <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          <Text style={styles.sessionLocation} numberOfLines={1}>{location.name}</Text>
        </View>
        <View style={styles.sessionMetaRow}>
          <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
          <Text style={styles.sessionLevelText}>{program.level}</Text>
          {session.price > 0 ? (
            <Text style={styles.sessionPrice}>· ${session.price}</Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function Programs() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSession, setSelectedSession]   = useState(null);
  const [sessions, setSessions]                 = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [error, setError]                       = useState(null);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchPrograms = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const url = `${GPN_BASE}?apiCall=getTournaments&format=raw&devKey=${GPN_DEV_KEY}`;
      const response = await fetch(url);
      const text = await response.text();
      if (text.trim().startsWith("<")) {
        const match = text.match(/<message>(.*?)<\/message>/i);
        throw new Error(match ? match[1] : "GPN API error");
      }
      const json = JSON.parse(text);
      setSessions((Array.isArray(json) ? json : []).map(mapTournamentToSession));
    } catch (err) {
      console.error("[Programs]", err.message);
      setError("Unable to load programs. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const filtered = sessions.filter((s) => {
    const matchDate = fallsOnDate(s, dates[selectedDateIndex]);
    const matchCat  = !selectedCategory || s.category === selectedCategory;
    return matchDate && matchCat;
  });

  // Build flat list with section headers
  const listItems = [];
  let lastLabel = null;
  filtered.forEach((session, i) => {
    const label = formatDateLabel(new Date(session.start_time));
    if (label !== lastLabel) {
      listItems.push({ type: "header", label, key: `h-${label}` });
      lastLabel = label;
    }
    listItems.push({ type: "session", session, key: session._id, index: i });
  });

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable hitSlop={10} onPress={() => router.push("/(tabs)/friends")}>
          <Ionicons name="people-outline" size={28} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Programs</Text>
        <Pressable hitSlop={10}>
          <Ionicons name="search-outline" size={28} color={colors.white} />
        </Pressable>
      </LinearGradient>

      {/* ── Date Tabs (underline style) ── */}
      <View style={styles.dateSelectorWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateTabsContent}
        >
          {dates.map((date, index) => {
            const active = selectedDateIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateTab, active && styles.dateTabActive]}
                onPress={() => setSelectedDateIndex(index)}
              >
                <Text style={[styles.dateTabText, active && styles.dateTabTextActive]}>
                  {formatDateTabLabel(date)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Category Chips (solid filled pills) ── */}
      <View style={styles.chipRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRowContent}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(active ? null : cat.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Session List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryEnd} />
          <Text style={styles.centerText}>Loading programs…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Couldn't load programs</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPrograms()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPrograms(true)}
              tintColor={colors.primaryEnd}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No sessions today</Text>
              <Text style={styles.emptySubtitle}>Try a different date or category</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            if (item.type === "header") {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{item.label}</Text>
                </View>
              );
            }
            // find if this session is last before the next header or end
            const next = listItems[index + 1];
            const isLast = !next || next.type === "header";
            return (
              <SessionRow
                session={item.session}
                onPress={setSelectedSession}
                isLast={isLast}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}

      <ProgramDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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

  // Date tabs — underline style
  dateSelectorWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateTabsContent: {
    paddingHorizontal: 12,
    gap: 0,
  },
  dateTab: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 4,
  },
  dateTabActive: {
    borderBottomColor: colors.primaryEnd,
  },
  dateTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textGray,
  },
  dateTabTextActive: {
    fontWeight: "700",
    color: colors.primaryEnd,
  },

  // Category chips — filled pills
  chipRow: {
    backgroundColor: colors.white,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipRowContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: colors.primaryEnd,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  chipTextActive: {
    color: colors.white,
  },

  // List
  listContent: { paddingBottom: 32 },

  // Section header
  sectionHeader: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Session row — flat with divider
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sessionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
    marginTop: 3,
    alignSelf: "flex-start",
  },
  sessionBody: {
    flex: 1,
  },
  sessionTime: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 3,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 5,
    lineHeight: 21,
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  sessionLocation: {
    fontSize: 13,
    color: "#9CA3AF",
    flex: 1,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionLevelText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  sessionPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },

  // States
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  centerText: { fontSize: 14, color: colors.textGray, marginTop: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 4,
    backgroundColor: colors.primaryEnd,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },

  // ── Modal / Bottom Sheet ──
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: colors.textDark },
  sheetBody: { padding: 16 },
  sheetBanner: {
    width: "100%",
    height: 160,
    backgroundColor: "#DBEAFE",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  sheetProgramTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textDark,
    marginBottom: 6,
  },
  sheetDescription: {
    fontSize: 14,
    color: colors.textGray,
    lineHeight: 21,
    marginBottom: 20,
  },
  sheetDetails: { gap: 14, marginBottom: 18 },
  sheetRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  sheetRowBody: { flex: 1 },
  sheetRowLabel: { fontSize: 11, color: colors.textGray, fontWeight: "600", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  sheetRowValue: { fontSize: 14, fontWeight: "600", color: colors.textDark },
  sheetRowSub: { fontSize: 13, color: colors.textGray, marginTop: 2 },
  sheetPrice: { fontSize: 24, fontWeight: "900", color: colors.textDark },
  levelPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  levelPillText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  capacityBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  capacityOpen: { backgroundColor: "#D1FAE5" },
  capacityFull: { backgroundColor: "#FEF3C7" },
  capacityText: { fontSize: 14, fontWeight: "600" },
  notesBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  notesLabel: { fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 6 },
  notesText: { fontSize: 13, color: colors.textGray, lineHeight: 19 },
  registerBtn: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  registerBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
