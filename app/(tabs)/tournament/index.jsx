import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
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

const FORMAT_LABELS = { S: "Singles", D: "Doubles" };
const FORMAT_COLORS = { S: colors.primaryEnd, D: "#7C3AED" };

export default function TournamentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [signedUp, setSignedUp] = useState(new Set());
  const [loadingSignups, setLoadingSignups] = useState(true);

  useEffect(() => {
    loadExistingBookings();
  }, []);

  const loadExistingBookings = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoadingSignups(false);
      return;
    }
    try {
      const q = query(
        collection(db, "users", user.uid, "bookings"),
        where("type", "==", "tournament")
      );
      const snap = await getDocs(q);
      const ids = new Set(snap.docs.map((d) => d.data().itemId));
      setSignedUp(ids);
    } catch (_) {}
    finally {
      setLoadingSignups(false);
    }
  };

  const handleSignUp = async (t) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to register for tournaments.");
      return;
    }
    try {
      await setDoc(doc(db, "users", user.uid, "bookings", t.id), {
        type: "tournament",
        itemId: t.id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        location: `${t.city}, ${t.country}`,
        fee: t.fee,
        format: t.format,
        registeredAt: serverTimestamp(),
      });
      setSignedUp((prev) => new Set([...prev, t.id]));
      Alert.alert("Registered!", `You're registered for ${t.name}!`);
    } catch (_) {
      Alert.alert("Error", "Could not complete registration. Please try again.");
    }
  };

  const filtered =
    filter === "All"
      ? MOCK_TOURNAMENTS
      : MOCK_TOURNAMENTS.filter((t) =>
          filter === "Singles" ? t.format === "S" : t.format === "D"
        );

  const formatDateRange = (start, end) => {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    const opts = { month: "short", day: "numeric" };
    if (start === end)
      return s.toLocaleDateString("en-CA", { ...opts, year: "numeric" });
    return `${s.toLocaleDateString("en-CA", opts)} – ${e.toLocaleDateString("en-CA", {
      ...opts,
      year: "numeric",
    })}`;
  };

  const renderCard = ({ item: t }) => {
    const alreadySignedUp = signedUp.has(t.id);
    const spotsLeft = t.maxPlayers - t.totalPlayers;
    return (
      <View style={styles.card}>
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
          <Text style={styles.metaText}>
            {t.city}, {t.country}
          </Text>
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
          <Ionicons name="stats-chart-outline" size={14} color={colors.textGray} />
          <Text style={styles.metaText}>Level {t.levelRange}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={14} color={colors.textGray} />
          <Text style={styles.metaText}>${t.fee} entry fee</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {t.description}
        </Text>

        <TouchableOpacity
          style={[styles.signUpBtn, alreadySignedUp && styles.signUpBtnDone]}
          onPress={() => handleSignUp(t)}
          disabled={alreadySignedUp}
          activeOpacity={0.8}
        >
          <Text style={[styles.signUpBtnText, alreadySignedUp && styles.signUpBtnTextDone]}>
            {alreadySignedUp ? "Registered ✓" : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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

      {loadingSignups ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primaryEnd} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primaryEnd,
    borderColor: colors.primaryEnd,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textGray,
  },
  filterPillTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
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
  cardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
    lineHeight: 22,
  },
  formatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formatBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  metaText: {
    fontSize: 13,
    color: colors.textGray,
  },
  urgentText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    color: colors.textGray,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 14,
  },
  signUpBtn: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  signUpBtnDone: {
    backgroundColor: "#D1FAE5",
  },
  signUpBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
  signUpBtnTextDone: {
    color: "#059669",
  },
});
