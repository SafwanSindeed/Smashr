import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
import { MOCK_TOURNAMENTS } from "../../../constants/mockData";
import { colors } from "../../../constants/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const FORMAT_LABELS = { S: "Singles", D: "Doubles" };
const FORMAT_COLORS = { S: colors.primaryEnd, D: "#7C3AED" };

function formatDateRange(start, end) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts = { month: "short", day: "numeric" };
  if (start === end)
    return s.toLocaleDateString("en-CA", { ...opts, year: "numeric" });
  return `${s.toLocaleDateString("en-CA", opts)} – ${e.toLocaleDateString("en-CA", {
    ...opts,
    year: "numeric",
  })}`;
}

// ─── Success overlay shown after registering ─────────────────────────────────

function SuccessOverlay({ visible }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[ms.successOverlay, { opacity }]}>
      <Animated.View style={[ms.successBox, { transform: [{ scale }] }]}>
        <View style={ms.successCircle}>
          <Ionicons name="checkmark" size={44} color="#fff" />
        </View>
        <Text style={ms.successTitle}>You're Registered!</Text>
        <Text style={ms.successSub}>Check your Bookings tab to see it.</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Tournament Detail Modal ──────────────────────────────────────────────────

function TournamentDetailModal({ tournament, onClose, signedUpIds, onSignedUp }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [signingUp, setSigningUp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const alreadySignedUp = tournament ? signedUpIds.has(tournament.id) : false;
  const visible = !!tournament;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      setShowSuccess(false);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSignUp = async () => {
    const user = auth.currentUser;
    if (!user) {
      handleClose();
      return;
    }
    setSigningUp(true);
    try {
      await setDoc(doc(db, "users", user.uid, "bookings", tournament.id), {
        type: "tournament",
        itemId: tournament.id,
        name: tournament.name,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        location: `${tournament.city}, ${tournament.country}`,
        fee: tournament.fee,
        format: tournament.format,
        registeredAt: serverTimestamp(),
      });
      onSignedUp(tournament.id);
      setShowSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      // show nothing — just close gracefully
    } finally {
      setSigningUp(false);
    }
  };

  if (!tournament) return null;

  const spotsLeft = tournament.maxPlayers - tournament.totalPlayers;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableOpacity
        style={ms.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Sheet */}
      <Animated.View
        style={[ms.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        {/* Drag handle */}
        <View style={ms.handle} />

        {/* Header */}
        <LinearGradient
          colors={[colors.primaryStart, colors.primaryEnd]}
          style={ms.header}
        >
          <View style={[ms.formatPill, { backgroundColor: FORMAT_COLORS[tournament.format] }]}>
            <Text style={ms.formatPillText}>{FORMAT_LABELS[tournament.format]}</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={ms.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ms.body}>
          <Text style={ms.name}>{tournament.name}</Text>
          <Text style={ms.description}>{tournament.description}</Text>

          <View style={ms.detailsCard}>
            <DetailRow icon="calendar-outline" label="Dates" value={formatDateRange(tournament.startDate, tournament.endDate)} />
            <DetailRow icon="location-outline" label="Location" value={`${tournament.city}, ${tournament.country}`} />
            <DetailRow icon="stats-chart-outline" label="Level" value={`Level ${tournament.levelRange}`} />
            <DetailRow icon="cash-outline" label="Entry Fee" value={`$${tournament.fee}`} />
            <DetailRow
              icon="people-outline"
              label="Spots"
              value={`${tournament.totalPlayers}/${tournament.maxPlayers} registered`}
              valueExtra={spotsLeft <= 8 ? `· ${spotsLeft} spots left!` : null}
              urgentExtra={true}
            />
          </View>

          {spotsLeft <= 0 ? (
            <View style={[ms.capacityBanner, ms.capacityFull]}>
              <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
              <Text style={[ms.capacityText, { color: "#D97706" }]}>Tournament Full</Text>
            </View>
          ) : spotsLeft <= 8 ? (
            <View style={[ms.capacityBanner, ms.capacityUrgent]}>
              <Ionicons name="flame-outline" size={18} color="#DC2626" />
              <Text style={[ms.capacityText, { color: "#DC2626" }]}>Only {spotsLeft} spots remaining — register now!</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              ms.signUpBtn,
              (alreadySignedUp || spotsLeft <= 0) && ms.signUpBtnDone,
              signingUp && { opacity: 0.7 },
            ]}
            onPress={handleSignUp}
            disabled={alreadySignedUp || spotsLeft <= 0 || signingUp}
            activeOpacity={0.85}
          >
            <Text style={[ms.signUpBtnText, alreadySignedUp && ms.signUpBtnTextDone]}>
              {alreadySignedUp ? "Registered ✓" : spotsLeft <= 0 ? "Tournament Full" : signingUp ? "Registering…" : "Sign Up"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <SuccessOverlay visible={showSuccess} />
      </Animated.View>
    </Modal>
  );
}

function DetailRow({ icon, label, value, valueExtra, urgentExtra }) {
  return (
    <View style={ms.detailRow}>
      <Ionicons name={icon} size={18} color={colors.primaryEnd} style={{ width: 24 }} />
      <View style={ms.detailRowBody}>
        <Text style={ms.detailLabel}>{label}</Text>
        <Text style={ms.detailValue}>
          {value}
          {valueExtra ? (
            <Text style={urgentExtra ? ms.detailUrgent : null}> {valueExtra}</Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

// ─── Tournament Card (tappable, no sign-up inline) ───────────────────────────

function TournamentCard({ t, alreadySignedUp, onPress }) {
  const spotsLeft = t.maxPlayers - t.totalPlayers;
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(t)} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{t.name}</Text>
        <View style={[styles.formatBadge, { backgroundColor: FORMAT_COLORS[t.format] }]}>
          <Text style={styles.formatBadgeText}>{FORMAT_LABELS[t.format]}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.textGray} />
        <Text style={styles.metaText}>{formatDateRange(t.startDate, t.endDate)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={14} color={colors.textGray} />
        <Text style={styles.metaText}>{t.city}, {t.country}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="people-outline" size={14} color={colors.textGray} />
        <Text style={styles.metaText}>
          {t.totalPlayers}/{t.maxPlayers} registered
          {spotsLeft <= 8 && (
            <Text style={styles.urgentText}>  · {spotsLeft} spots left!</Text>
          )}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="cash-outline" size={14} color={colors.textGray} />
        <Text style={styles.metaText}>${t.fee} entry fee</Text>
      </View>

      <View style={styles.cardFooter}>
        {alreadySignedUp ? (
          <View style={styles.registeredBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.registeredBadgeText}>Registered</Text>
          </View>
        ) : (
          <View style={styles.viewDetailsBadge}>
            <Text style={styles.viewDetailsText}>View Details & Register</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primaryEnd} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TournamentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [signedUp, setSignedUp] = useState(new Set());
  const [selectedTournament, setSelectedTournament] = useState(null);

  useEffect(() => {
    loadExistingBookings();
  }, []);

  const loadExistingBookings = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "bookings"),
        where("type", "==", "tournament")
      );
      const snap = await getDocs(q);
      setSignedUp(new Set(snap.docs.map((d) => d.data().itemId)));
    } catch (_) {}
  };

  const filtered =
    filter === "All"
      ? MOCK_TOURNAMENTS
      : MOCK_TOURNAMENTS.filter((t) =>
          filter === "Singles" ? t.format === "S" : t.format === "D"
        );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[colors.primaryStart, colors.primaryEnd]} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/(tabs)/home/homepage")}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <View style={styles.headerBtn}>
          <Ionicons name="trophy-outline" size={24} color={colors.white} />
        </View>
      </LinearGradient>

      <View style={styles.filterRow}>
        {["All", "Singles", "Doubles"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item: t }) => (
          <TournamentCard
            t={t}
            alreadySignedUp={signedUp.has(t.id)}
            onPress={setSelectedTournament}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <TournamentDetailModal
        tournament={selectedTournament}
        onClose={() => setSelectedTournament(null)}
        signedUpIds={signedUp}
        onSignedUp={(id) => setSignedUp((prev) => new Set([...prev, id]))}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.white, letterSpacing: 0.3 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: { backgroundColor: colors.primaryEnd, borderColor: colors.primaryEnd },
  filterPillText: { fontSize: 13, fontWeight: "600", color: colors.textGray },
  filterPillTextActive: { color: colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  cardName: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.textDark, lineHeight: 22 },
  formatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  formatBadgeText: { fontSize: 11, fontWeight: "700", color: colors.white, letterSpacing: 0.2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  metaText: { fontSize: 13, color: colors.textGray },
  urgentText: { color: "#EF4444", fontWeight: "600" },
  cardFooter: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10 },
  registeredBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  registeredBadgeText: { fontSize: 13, fontWeight: "700", color: "#059669" },
  viewDetailsBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewDetailsText: { fontSize: 13, fontWeight: "700", color: colors.primaryEnd },
});

const ms = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.92,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 6,
  },
  formatPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
  },
  formatPillText: { fontSize: 13, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20, paddingBottom: 32 },
  name: { fontSize: 22, fontWeight: "900", color: colors.textDark, marginBottom: 10, lineHeight: 30 },
  description: { fontSize: 14, color: colors.textGray, lineHeight: 22, marginBottom: 22 },
  detailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailRowBody: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: "600", color: colors.textDark },
  detailUrgent: { color: "#EF4444", fontWeight: "700" },
  capacityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  capacityFull: { backgroundColor: "#FEF3C7" },
  capacityUrgent: { backgroundColor: "#FEF2F2" },
  capacityText: { fontSize: 14, fontWeight: "600", flex: 1 },
  signUpBtn: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  signUpBtnDone: { backgroundColor: "#D1FAE5" },
  signUpBtnText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  signUpBtnTextDone: { color: "#059669" },
  // Success overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  successBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 36,
    alignItems: "center",
    gap: 12,
    marginHorizontal: 32,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: { fontSize: 22, fontWeight: "900", color: colors.textDark },
  successSub: { fontSize: 14, color: colors.textGray, textAlign: "center" },
});
