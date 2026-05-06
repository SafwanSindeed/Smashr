// app/(tabs)/account/index.jsx

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../../../services/firebaseConfig";
import { colors } from "../../../constants/colors";

function MenuItem({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? "#EF4444" : colors.primaryEnd} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.textGray} />}
    </TouchableOpacity>
  );
}

export default function Account() {
  const router = useRouter();
  const user = auth.currentUser;
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Player";
  const email = user?.email ?? "";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            setSigningOut(true);
            await signOut(auth);
            router.replace("/");
          } catch (e) {
            Alert.alert("Error", e.message);
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <LinearGradient
          colors={[colors.primaryStart, colors.primaryEnd]}
          style={styles.profileHeader}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>DUPR Rating</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxBorder]}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Tournaments</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => Alert.alert("Coming soon", "Profile editing is coming soon.")}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="link-outline"
            label="Connect DUPR"
            onPress={() => router.push("/duprconnect")}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => Alert.alert("Coming soon", "Notification settings are coming soon.")}
          />
        </View>

        {/* Support Section */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => Alert.alert("Coming soon", "Help center is coming soon.")}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => Alert.alert("Coming soon", "Privacy policy is coming soon.")}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            label={signingOut ? "Logging out…" : "Log Out"}
            onPress={onLogout}
            danger
          />
        </View>

        <Text style={styles.version}>Smashr v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { paddingBottom: 40 },

  profileHeader: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
  displayName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  email: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: { fontSize: 20, fontWeight: "900", color: colors.textDark },
  statLabel: { fontSize: 12, color: colors.textGray, marginTop: 2, fontWeight: "500" },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },

  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconDanger: { backgroundColor: "#FEE2E2" },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textDark },
  menuLabelDanger: { color: "#EF4444" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 64 },

  version: {
    textAlign: "center",
    marginTop: 28,
    fontSize: 12,
    color: "#9CA3AF",
  },
});
