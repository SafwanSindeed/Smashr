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
          Smashr ("we", "our", or "us") is a pickleball matchmaking and tournament
          discovery app. This Privacy Policy explains what information we collect, how
          we use it, and your rights regarding that information. By using Smashr you
          agree to this policy.
        </Text>

        <Section title="1. Information We Collect">
          {"Account information: When you register, we collect your email address and create a Firebase Authentication account. Your display name is stored in Firebase.\n\nLocation data: When you use the VsV (Versus) match-finding feature, we request your device's GPS coordinates. Location is used only in the moment to find nearby players and courts — we do not store your GPS history.\n\nMatch data: Scores, game types (singles/doubles/friendly), and opponent identifiers from completed matches are saved to Firestore to support DUPR rating submission.\n\nGPN data: If you create a Global Pickleball Network account through Smashr, your GPN credentials (ID, username, session token) are stored in your user profile in Firestore.\n\nDevice information: We do not collect device identifiers, advertising IDs, or crash logs beyond what Expo and Firebase provide by default."}
        </Section>

        <Section title="2. How We Use Your Information">
          {"Match-finding: Your real-time GPS coordinates are shared temporarily with Firestore to display you in the nearby player lobby. This data is deleted when you leave the match-finding screen.\n\nRating submission: Match results are queued in Firestore and submitted to DUPR (Dynamic Universal Pickleball Rating) when our API credentials are activated. This is the core purpose of match logging.\n\nTournament access: Your GPN credentials are used to display tournaments you have registered for in the My Bookings tab.\n\nApp improvement: We use aggregate, anonymized usage patterns to improve features. We do not sell individual user data."}
        </Section>

        <Section title="3. Third-Party Services">
          {"Firebase (Google): Provides authentication and our Firestore database. Firebase processes data under Google's privacy policy. Project: smashr-55708.\n\nGlobal Pickleball Network (GPN): A third-party tournament platform. When you create a GPN account or register for tournaments, your information is also governed by GPN's own privacy policy at globalpickleball.network.\n\nDUPR (Dynamic Universal Pickleball Rating): Match results are submitted to DUPR to update your official rating. DUPR's privacy policy applies to data they receive.\n\nOpenStreetMap / Overpass API: Used to find nearby courts. Only the GPS midpoint between two matched players is sent — no personal identifiers.\n\nExpo: The app build platform. Expo collects minimal telemetry under their own policy."}
        </Section>

        <Section title="4. Data Retention">
          {"Match records in Firestore are kept indefinitely to maintain your match history and support retroactive DUPR submission. You may request deletion at any time (see Section 7).\n\nLobby data (vsv_lobby) is ephemeral — entries are removed when you leave the matchmaking screen or the app goes to the background.\n\nAccount data persists until you delete your account."}
        </Section>

        <Section title="5. Data Security">
          {"Your data is stored in Google Firebase, which is protected by Google's enterprise-grade security infrastructure. We use Firebase Security Rules to ensure users can only read and write their own data. Passwords are never stored by Smashr — Firebase Authentication handles credential security.\n\nNo system is 100% secure. If you believe your account has been compromised, contact us immediately."}
        </Section>

        <Section title="6. Children's Privacy">
          {"Smashr is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly."}
        </Section>

        <Section title="7. Your Rights">
          {"You have the right to:\n\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your account and associated data\n• Withdraw consent for location access at any time via device settings\n• Opt out of DUPR submission by not using the VsV match feature\n\nTo exercise any of these rights, contact us at the address below."}
        </Section>

        <Section title="8. Changes to This Policy">
          {"We may update this policy as the app grows. When we make material changes, we will update the 'Last updated' date at the top and notify users via the app. Continued use after changes constitutes acceptance."}
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
