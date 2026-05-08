// app/privacy-policy.jsx

import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../constants/colors";

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 26 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: May 2026</Text>

        <Text style={styles.intro}>
          Smashr is a pickleball matchmaking and tournament discovery app. This Privacy
          Policy explains what information is collected, how it is used, and your rights
          regarding that information. By using Smashr you agree to this policy.
        </Text>

        <Section title="1. Information Collected">
          {"Account information: At registration, an email address is collected and a Firebase Authentication account is created. Display names are stored in Firebase.\n\nLocation data: When using the VsV (Versus) match-finding feature, device GPS coordinates are requested. Location is used only in the moment to find nearby players and courts — GPS history is not stored.\n\nMatch data: Scores, game types (singles/doubles/friendly), and opponent identifiers from completed matches are saved to Firestore to support DUPR rating submission.\n\nGPN data: If a Global Pickleball Network account is created through Smashr, GPN credentials (ID, username, session token) are stored in the user profile in Firestore.\n\nDevice information: Smashr does not collect device identifiers, advertising IDs, or crash logs beyond what Expo and Firebase provide by default."}
        </Section>

        <Section title="2. How Information Is Used">
          {"Match-finding: Real-time GPS coordinates are shared temporarily with Firestore to display players in the nearby lobby. This data is deleted when leaving the match-finding screen.\n\nRating submission: Match results are queued in Firestore and submitted to DUPR (Dynamic Universal Pickleball Rating) when API credentials are activated. This is the core purpose of match logging.\n\nTournament access: GPN credentials are used to display tournaments registered for in the My Bookings tab.\n\nApp improvement: Aggregate, anonymized usage patterns are used to improve features. Individual user data is not sold."}
        </Section>

        <Section title="3. Third-Party Services">
          {"Firebase (Google): Provides authentication and the Firestore database. Firebase processes data under Google's privacy policy. Project: smashr-55708.\n\nGlobal Pickleball Network (GPN): A third-party tournament platform. When creating a GPN account or registering for tournaments, information is also governed by GPN's privacy policy at globalpickleball.network.\n\nDUPR (Dynamic Universal Pickleball Rating): Match results are submitted to DUPR to update official ratings. DUPR's privacy policy applies to data they receive.\n\nOpenStreetMap / Overpass API: Used to find nearby courts. Only the GPS midpoint between two matched players is sent — no personal identifiers are included.\n\nExpo: The app build platform. Expo collects minimal telemetry under their own policy."}
        </Section>

        <Section title="4. Data Retention">
          {"Match records in Firestore are kept indefinitely to maintain match history and support retroactive DUPR submission. Deletion can be requested at any time (see Section 7).\n\nLobby data (vsv_lobby) is ephemeral — entries are removed when leaving the matchmaking screen or when the app goes to the background.\n\nAccount data persists until the account is deleted."}
        </Section>

        <Section title="5. Data Security">
          {"All data is stored in Google Firebase, protected by Google's enterprise-grade security infrastructure. Firebase Security Rules ensure each user can only read and write their own data. Passwords are never stored by Smashr — Firebase Authentication handles all credential security.\n\nNo system is 100% secure. If an account appears to be compromised, contact the support team immediately."}
        </Section>

        <Section title="6. Children's Privacy">
          {"Smashr is not directed at children under 13. Personal information from children under 13 is not knowingly collected. If a child appears to have provided personal information, contact support and it will be deleted promptly."}
        </Section>

        <Section title="7. Your Rights">
          {"Users have the right to:\n\n• Access the personal data held on their account\n• Request correction of inaccurate data\n• Request deletion of their account and associated data\n• Withdraw consent for location access at any time via device settings\n• Opt out of DUPR submission by not using the VsV match feature\n\nTo exercise any of these rights, contact Smashr at the address below."}
        </Section>

        <Section title="8. Changes to This Policy">
          {"This policy may be updated as the app grows. When material changes are made, the 'Last updated' date at the top will be revised and users will be notified via the app. Continued use after changes constitutes acceptance."}
        </Section>

        <View style={styles.contactBox}>
          <Ionicons name="mail-outline" size={20} color={colors.primaryEnd} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Contact Us</Text>
            <Text style={styles.contactText}>
              Questions about this policy? Reach us at{"\n"}
              <Text style={styles.contactEmail}>privacy@smashrapp.com</Text>
            </Text>
          </View>
        </View>
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

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

  lastUpdated: {
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "600",
    marginBottom: 14,
  },
  intro: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 23,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryEnd,
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },

  contactBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 4,
  },
  contactText: { fontSize: 14, color: colors.textGray, lineHeight: 20 },
  contactEmail: { color: colors.primaryEnd, fontWeight: "700" },
});
