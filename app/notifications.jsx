// app/notifications.jsx

import { useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../constants/colors";

const NOTIFICATION_GROUPS = [
  {
    title: "Match Activity",
    items: [
      { id: "match_challenge", icon: "tennisball-outline", label: "Match Challenges", desc: "When a nearby player challenges you to a match" },
      { id: "match_result", icon: "trophy-outline", label: "Match Results", desc: "Confirmation when a match score is submitted" },
      { id: "court_suggestion", icon: "location-outline", label: "Court Suggestions", desc: "Nearby court recommendations when you open VsV" },
    ],
  },
  {
    title: "Tournaments & Programs",
    items: [
      { id: "tournament_reminder", icon: "calendar-outline", label: "Tournament Reminders", desc: "24-hour reminder before tournaments you're registered for" },
      { id: "new_tournaments", icon: "megaphone-outline", label: "New Tournaments", desc: "When new tournaments are posted in your area" },
      { id: "program_spots", icon: "people-outline", label: "Spot Availability", desc: "When a sold-out program gets a cancellation" },
    ],
  },
  {
    title: "Account",
    items: [
      { id: "dupr_update", icon: "trending-up-outline", label: "DUPR Rating Updates", desc: "When your DUPR rating changes after a match" },
      { id: "gpn_activity", icon: "globe-outline", label: "GPN Activity", desc: "Updates from your Global Pickleball Network account" },
    ],
  },
];

function NotificationRow({ item, value, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={item.icon} size={19} color={colors.primaryEnd} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>{item.desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#E5E7EB", true: `${colors.primaryEnd}55` }}
        thumbColor={value ? colors.primaryEnd : "#9CA3AF"}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const initialState = {};
  NOTIFICATION_GROUPS.forEach((g) => g.items.forEach((item) => { initialState[item.id] = true; }));
  const [prefs, setPrefs] = useState(initialState);

  const toggle = (id) => setPrefs((p) => ({ ...p, [id]: !p[id] }));

  const allOn  = Object.values(prefs).every(Boolean);
  const anyOn  = Object.values(prefs).some(Boolean);
  const toggleAll = () => {
    const next = !anyOn;
    const updated = {};
    Object.keys(prefs).forEach((k) => { updated[k] = next; });
    setPrefs(updated);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 26 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Master toggle */}
        <View style={styles.masterCard}>
          <View style={styles.masterLeft}>
            <Ionicons name="notifications-outline" size={22} color={colors.primaryEnd} />
            <View>
              <Text style={styles.masterLabel}>All Notifications</Text>
              <Text style={styles.masterSub}>{allOn ? "All enabled" : anyOn ? "Some enabled" : "All disabled"}</Text>
            </View>
          </View>
          <Switch
            value={anyOn}
            onValueChange={toggleAll}
            trackColor={{ false: "#E5E7EB", true: `${colors.primaryEnd}55` }}
            thumbColor={anyOn ? colors.primaryEnd : "#9CA3AF"}
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        <Text style={styles.permissionNote}>
          Make sure notifications are enabled in your device Settings for Smashr.
        </Text>

        {NOTIFICATION_GROUPS.map((group) => (
          <View key={group.title}>
            <Text style={styles.groupLabel}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, i) => (
                <View key={item.id}>
                  <NotificationRow
                    item={item}
                    value={prefs[item.id]}
                    onToggle={() => toggle(item.id)}
                  />
                  {i < group.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}
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
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: "900", letterSpacing: 0.3 },

  scroll: { padding: 16, paddingBottom: 48 },

  masterCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  masterLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  masterLabel: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  masterSub: { fontSize: 12, color: colors.textGray, marginTop: 2 },

  permissionNote: {
    fontSize: 12,
    color: colors.textGray,
    paddingHorizontal: 4,
    marginBottom: 20,
    lineHeight: 17,
  },

  groupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "700", color: colors.textDark, marginBottom: 2 },
  rowDesc: { fontSize: 12, color: colors.textGray, lineHeight: 16 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 64 },
});
