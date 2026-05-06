// app/scoresummary.jsx

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { auth } from "../services/firebaseConfig";
import { submitMatch } from "../services/duprService";
import { colors } from "../constants/colors";

const TYPE_COLORS = {
  singles:  [colors.primaryStart, colors.primaryEnd],
  doubles:  ["#7C3AED", "#9333EA"],
  friendly: ["#059669", "#10B981"],
};

export default function ScoreSummary() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const opponent   = params.opponent   ? JSON.parse(params.opponent)  : null;
  const gameType   = params.gameType   || "singles";
  const courtName  = params.courtName  || "Local Court";

  const me     = auth.currentUser;
  const myName = me?.displayName || me?.email?.split("@")[0] || "You";

  const gradColors = TYPE_COLORS[gameType] || TYPE_COLORS.singles;

  // Games: array of { team1: number, team2: number }
  const [games,      setGames]      = useState([{ team1: 0, team2: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [queued,     setQueued]     = useState(false);

  const updateScore = (gameIdx, team, delta) =>
    setGames((prev) =>
      prev.map((g, i) =>
        i === gameIdx ? { ...g, [team]: Math.max(0, g[team] + delta) } : g
      )
    );

  const addGame = () => {
    if (games.length < 3) setGames((prev) => [...prev, { team1: 0, team2: 0 }]);
  };

  const removeGame = (idx) => {
    if (games.length > 1) setGames((prev) => prev.filter((_, i) => i !== idx));
  };

  const team1Wins = games.filter((g) => g.team1 > g.team2).length;
  const team2Wins = games.filter((g) => g.team2 > g.team1).length;
  const winner =
    team1Wins > team2Wins ? "team1" : team2Wins > team1Wins ? "team2" : null;

  const onSubmit = async () => {
    const hasScores = games.some((g) => g.team1 > 0 || g.team2 > 0);
    if (!hasScores) {
      Alert.alert("Enter Scores", "Please enter at least one game score.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitMatch({
        gameType,
        courtName,
        playedAt: new Date().toISOString(),
        team1: [{ uid: me?.uid, displayName: myName,                          duprId: null }],
        team2: [{ uid: opponent?.uid || null, displayName: opponent?.displayName || "Opponent", duprId: opponent?.duprId || null }],
        scores: games,
        winner,
      });

      setQueued(!!result.queued);
      setSubmitted(true);
    } catch (err) {
      Alert.alert("Error", "Could not save match. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={["left", "right"]}>
        <LinearGradient
          colors={gradColors}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <View style={{ width: 28 }} />
          <Text style={styles.headerTitle}>Match Complete</Text>
          <View style={{ width: 28 }} />
        </LinearGradient>

        <View style={styles.successBlock}>
          <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
          <Text style={styles.successTitle}>Match Logged!</Text>

          {queued ? (
            <>
              <Text style={styles.successSub}>
                Saved to your match history on Smashr.
              </Text>
              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={18} color="#D97706" />
                <Text style={styles.pendingText}>
                  Pending DUPR submission — will sync automatically once Smashr's
                  club API credentials are activated.
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.successSub}>
              Match submitted to DUPR under the{" "}
              <Text style={{ fontWeight: "800" }}>Smashr</Text> club. Ratings will
              update shortly.
            </Text>
          )}

          <TouchableOpacity
            style={styles.doneButton}
            activeOpacity={0.85}
            onPress={() => router.replace("/(tabs)/home/homepage")}
          >
            <LinearGradient colors={gradColors} style={styles.doneGradient}>
              <Text style={styles.doneText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Score entry ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={gradColors}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Score</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>

        {/* Players */}
        <View style={styles.playersRow}>
          <View style={styles.playerChip}>
            <View style={[styles.playerDot, { backgroundColor: gradColors[1] }]} />
            <Text style={styles.playerChipName} numberOfLines={1}>
              {myName}
            </Text>
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.playerChip}>
            <View style={[styles.playerDot, { backgroundColor: "#9333EA" }]} />
            <Text style={styles.playerChipName} numberOfLines={1}>
              {opponent?.displayName || "Opponent"}
            </Text>
          </View>
        </View>

        <Text style={styles.courtLabel}>📍 {courtName}</Text>

        {/* Column headers */}
        <View style={styles.scoreHeader}>
          <Text style={styles.colLabel} numberOfLines={1}>
            {myName}
          </Text>
          <Text style={styles.colCenter}>Game</Text>
          <Text style={styles.colLabel} numberOfLines={1}>
            {opponent?.displayName || "Opponent"}
          </Text>
        </View>

        {/* Game rows */}
        {games.map((game, idx) => (
          <View key={idx} style={styles.gameRow}>
            {/* Team 1 */}
            <View style={styles.scoreControl}>
              <TouchableOpacity
                style={styles.scoreBtn}
                onPress={() => updateScore(idx, "team1", -1)}
              >
                <Ionicons name="remove" size={22} color={colors.textGray} />
              </TouchableOpacity>
              <Text
                style={[
                  styles.scoreValue,
                  game.team1 > game.team2 && styles.scoreWinner,
                ]}
              >
                {game.team1}
              </Text>
              <TouchableOpacity
                style={styles.scoreBtn}
                onPress={() => updateScore(idx, "team1", 1)}
              >
                <Ionicons name="add" size={22} color={gradColors[1]} />
              </TouchableOpacity>
            </View>

            {/* Game label + remove */}
            <View style={styles.gameLabelWrap}>
              <Text style={styles.gameLabel}>G{idx + 1}</Text>
              {games.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeGame(idx)}
                  hitSlop={6}
                >
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Team 2 */}
            <View style={styles.scoreControl}>
              <TouchableOpacity
                style={styles.scoreBtn}
                onPress={() => updateScore(idx, "team2", -1)}
              >
                <Ionicons name="remove" size={22} color={colors.textGray} />
              </TouchableOpacity>
              <Text
                style={[
                  styles.scoreValue,
                  game.team2 > game.team1 && styles.scoreWinner,
                ]}
              >
                {game.team2}
              </Text>
              <TouchableOpacity
                style={styles.scoreBtn}
                onPress={() => updateScore(idx, "team2", 1)}
              >
                <Ionicons name="add" size={22} color="#9333EA" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add game */}
        {games.length < 3 && (
          <TouchableOpacity style={styles.addGameBtn} onPress={addGame}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primaryEnd} />
            <Text style={styles.addGameText}>Add Game</Text>
          </TouchableOpacity>
        )}

        {/* Series summary */}
        {(team1Wins > 0 || team2Wins > 0) && (
          <View style={styles.seriesSummary}>
            <Text style={styles.seriesScore}>
              {team1Wins} – {team2Wins}
            </Text>
            <Text style={styles.seriesLabel}>
              {winner === "team1"
                ? `${myName} wins!`
                : winner === "team2"
                ? `${opponent?.displayName || "Opponent"} wins!`
                : "Tied series"}
            </Text>
          </View>
        )}

        {/* DUPR notice */}
        <View style={styles.duprNotice}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primaryEnd}
          />
          <Text style={styles.duprNoticeText}>
            Scores will be submitted to DUPR under{" "}
            <Text style={{ fontWeight: "800" }}>Smashr</Text> once club API
            credentials are activated. Nothing is lost in the meantime.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient colors={gradColors} style={styles.submitGradient}>
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={colors.white}
                />
                <Text style={styles.submitText}>Submit Match</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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

  body: { padding: 20, paddingBottom: 48 },

  // ── Players row ──
  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  playerChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  playerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playerChipName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textDark,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textGray,
    paddingHorizontal: 4,
  },

  courtLabel: {
    fontSize: 13,
    color: colors.textGray,
    marginBottom: 20,
    textAlign: "center",
  },

  // ── Score table ──
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  colLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textGray,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colCenter: {
    width: 60,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textGray,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreControl: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.textDark,
    minWidth: 34,
    textAlign: "center",
  },
  scoreWinner: { color: "#22C55E" },

  gameLabelWrap: {
    width: 60,
    alignItems: "center",
    gap: 4,
  },
  gameLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textGray,
  },

  addGameBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 4,
  },
  addGameText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryEnd,
  },

  // ── Series summary ──
  seriesSummary: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seriesScore: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.textDark,
  },
  seriesLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textGray,
    marginTop: 4,
  },

  // ── DUPR notice ──
  duprNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  duprNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#1D4ED8",
    lineHeight: 19,
  },

  // ── Submit ──
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  submitText: { color: colors.white, fontSize: 17, fontWeight: "800" },

  // ── Success ──
  successBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textDark,
  },
  successSub: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    maxWidth: 320,
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 19,
  },
  doneButton: {
    marginTop: 8,
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  doneGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  doneText: { color: colors.white, fontSize: 17, fontWeight: "800" },
});
