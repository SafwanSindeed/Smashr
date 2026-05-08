import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SectionList,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../services/firebaseConfig";
import { getMockSessions } from "../../../constants/mockData";
import { colors } from "../../../constants/colors";

const CATEGORIES = [
  { id: "open-play", label: "Open Play" },
  { id: "clinics", label: "Clinics" },
  { id: "leagues", label: "Leagues" },
];

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
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
}

function fallsOnDate(session, date) {
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  return new Date(session.start_time) <= dayEnd && new Date(session.end_time) >= dayStart;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function ProgramDetailModal({ session, onClose, bookedIds, onBooked }) {
  if (!session) return null;

  const alreadyBooked = bookedIds.has(session._id);
  const spotsLeft = session.maxSpots - session.spots;
  const isFull = spotsLeft <= 0;

  const handleBook = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to book sessions.");
      return;
    }
    try {
      await setDoc(doc(db, "users", user.uid, "bookings", session._id), {
        type: "program",
        itemId: session._id,
        name: session.name,
        startDate: new Date(session.start_time).toISOString(),
        endDate: new Date(session.end_time).toISOString(),
        location: session.location,
        fee: session.price,
        format: null,
        registeredAt: serverTimestamp(),
      });
      onBooked(session._id);
      Alert.alert("Booked!", "Check your Bookings tab.");
      onClose();
    } catch (err) {
      Alert.alert("Booking Failed", err?.message || "Could not complete booking. Please try again.");
    }
  };

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

            <Text style={styles.sheetProgramTitle}>{session.name}</Text>
            <Text style={styles.sheetDescription}>{session.description}</Text>

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
                  <Text style={styles.sheetRowValue}>{session.location}</Text>
                  {session.city ? (
                    <Text style={styles.sheetRowSub}>{session.city}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.sheetRow}>
                <Ionicons name="cellular-outline" size={18} color={colors.primaryEnd} />
                <View style={styles.sheetRowBody}>
                  <Text style={styles.sheetRowLabel}>Level</Text>
                  <View style={[styles.levelPill, { backgroundColor: session.levelColor }]}>
                    <Text style={styles.levelPillText}>{session.level}</Text>
                  </View>
                </View>
              </View>

              {session.instructor ? (
                <View style={styles.sheetRow}>
                  <Ionicons name="person-outline" size={18} color={colors.primaryEnd} />
                  <View style={styles.sheetRowBody}>
                    <Text style={styles.sheetRowLabel}>Instructor</Text>
                    <Text style={styles.sheetRowValue}>{session.instructor}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.sheetRow}>
                <Ionicons name="cash-outline" size={18} color={colors.primaryEnd} />
                <View style={styles.sheetRowBody}>
                  <Text style={styles.sheetRowLabel}>Price</Text>
                  <Text style={styles.sheetPrice}>
                    {session.price === 0 ? "Free" : `$${session.price}`}
                  </Text>
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
                  : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining`}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, alreadyBooked && styles.registerBtnDone]}
              onPress={handleBook}
              disabled={alreadyBooked}
              activeOpacity={0.8}
            >
              <Text style={[styles.registerBtnText, alreadyBooked && styles.registerBtnTextDone]}>
                {alreadyBooked ? "Booked ✓" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session, onPress, isLast }) {
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
          {session.name}
        </Text>
        <View style={styles.sessionMetaRow}>
          <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          <Text style={styles.sessionLocation} numberOfLines={1}>{session.location}</Text>
        </View>
        <View style={styles.sessionMetaRow}>
          <View style={[styles.levelDot, { backgroundColor: session.levelColor }]} />
          <Text style={styles.sessionLevelText}>{session.level}</Text>
          {session.price > 0 ? (
            <Text style={styles.sessionPrice}>· ${session.price}</Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Programs() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sectionListRef = useRef(null);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions] = useState(() => getMockSessions());
  const [bookedIds, setBookedIds] = useState(new Set());

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    loadExistingBookings();
  }, []);

  const loadExistingBookings = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "bookings"),
        where("type", "==", "program")
      );
      const snap = await getDocs(q);
      const ids = new Set(snap.docs.map((d) => d.data().itemId));
      setBookedIds(ids);
    } catch (_) {}
  };

  const handleBooked = (id) => {
    setBookedIds((prev) => new Set([...prev, id]));
  };

  // Build sections: all 7 days, filtered by category only (date tabs just scroll)
  const sections = dates
    .map((date) => ({
      title: formatDateLabel(date),
      date,
      data: sessions.filter(
        (s) => fallsOnDate(s, date) && (!selectedCategory || s.category === selectedCategory)
      ),
    }))
    .filter((s) => s.data.length > 0);

  const handleDateTabPress = (index) => {
    setSelectedDateIndex(index);
    const targetDate = dates[index];
    const sectionIdx = sections.findIndex((s) => {
      const sd = s.date;
      return (
        sd.getFullYear() === targetDate.getFullYear() &&
        sd.getMonth() === targetDate.getMonth() &&
        sd.getDate() === targetDate.getDate()
      );
    });
    if (sectionIdx >= 0 && sectionListRef.current) {
      try {
        sectionListRef.current.scrollToLocation({
          sectionIndex: sectionIdx,
          itemIndex: 0,
          animated: true,
          viewOffset: 0,
        });
      } catch (_) {}
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable hitSlop={10} onPress={() => router.push("/(tabs)/home/homepage")}>
          <Ionicons name="arrow-back" size={28} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Programs</Text>
        <Pressable hitSlop={10}>
          <Ionicons name="search-outline" size={28} color={colors.white} />
        </Pressable>
      </LinearGradient>

      {/* Date tabs — tap to scroll to that section */}
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
                onPress={() => handleDateTabPress(index)}
              >
                <Text style={[styles.dateTabText, active && styles.dateTabTextActive]}>
                  {formatDateLabel(date)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category chips — filter sessions */}
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
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
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

      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item) => item._id}
        stickySectionHeadersEnabled={false}
        onScrollToIndexFailed={() => {}}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, section, index }) => {
          const isLast = index === section.data.length - 1;
          return (
            <SessionRow session={item} onPress={setSelectedSession} isLast={isLast} />
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No sessions found</Text>
            <Text style={styles.emptySubtitle}>Try a different category</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <ProgramDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        bookedIds={bookedIds}
        onBooked={handleBooked}
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
  dateSelectorWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateTabsContent: { paddingHorizontal: 12, gap: 0 },
  dateTab: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 4,
  },
  dateTabActive: { borderBottomColor: colors.primaryEnd },
  dateTabText: { fontSize: 13, fontWeight: "500", color: colors.textGray },
  dateTabTextActive: { fontWeight: "700", color: colors.primaryEnd },
  chipRow: {
    backgroundColor: colors.white,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipRowContent: { paddingHorizontal: 14, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 6,
  },
  chipActive: { backgroundColor: colors.primaryEnd },
  chipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  chipTextActive: { color: colors.white },
  listContent: { paddingBottom: 32 },
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
  sessionBody: { flex: 1 },
  sessionTime: { fontSize: 12, color: "#9CA3AF", fontWeight: "500", marginBottom: 3 },
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
  sessionLocation: { fontSize: 13, color: "#9CA3AF", flex: 1 },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  sessionLevelText: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  sessionPrice: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },
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
  sheetRowLabel: {
    fontSize: 11,
    color: colors.textGray,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
  registerBtn: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  registerBtnDone: { backgroundColor: "#D1FAE5" },
  registerBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  registerBtnTextDone: { color: "#059669" },
});
