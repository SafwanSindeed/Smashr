// app/help-faq.jsx

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../constants/colors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_SECTIONS = [
  {
    section: "Getting Started",
    items: [
      {
        q: "What is Smashr?",
        a: "Smashr is a pickleball app that helps you find opponents near you, discover tournaments, and track your DUPR rating — all in one place.",
      },
      {
        q: "How do I create an account?",
        a: "Tap 'Create Account' on the login screen and enter your email and password. That's it — your Smashr account is ready immediately.",
      },
      {
        q: "Is Smashr free?",
        a: "Yes, Smashr is free to download and use. Some tournaments listed in the Programs and Tournaments tabs may have registration fees charged directly by the organizer.",
      },
    ],
  },
  {
    section: "VsV Match Finding",
    items: [
      {
        q: "How does VsV (Versus) work?",
        a: "Tap a match type on the VsV tab (Singles, Doubles, or Friendly Battle). Smashr uses your GPS to find other players who are also searching nearby. When you spot someone you want to challenge, tap 'Challenge' to see the best court between you both.",
      },
      {
        q: "Why does Smashr need my location?",
        a: "Location is used only to find players and courts near you. It is never stored permanently — your coordinates are written to a temporary lobby and deleted when you leave the screen.",
      },
      {
        q: "How is the 'best court' chosen?",
        a: "Smashr fetches real pickleball and tennis courts from OpenStreetMap and ranks them by the total combined travel distance for both players. The court with the lowest combined distance is shown first — the fairest spot for everyone.",
      },
      {
        q: "What if no courts are found?",
        a: "Smashr first searches 15 km for pickleball courts, then tennis courts, and then retries both at 30 km. If nothing is found it will say so — in that case you can agree on a court manually with your opponent.",
      },
    ],
  },
  {
    section: "DUPR Rating",
    items: [
      {
        q: "What is DUPR?",
        a: "DUPR (Dynamic Universal Pickleball Rating) is the official global rating system for pickleball. Your rating reflects your skill level and updates after every recorded match.",
      },
      {
        q: "How do I connect my DUPR account?",
        a: "Go to Account → Connect DUPR and follow the steps. You'll need a DUPR account at mydupr.com first.",
      },
      {
        q: "When will my match appear on DUPR?",
        a: "Every match you play through Smashr is saved immediately. Submission to DUPR will happen automatically once we receive our official API credentials — all your past matches will be submitted at that point.",
      },
    ],
  },
  {
    section: "GPN & Tournaments",
    items: [
      {
        q: "What is GPN?",
        a: "GPN (Global Pickleball Network) is a tournament platform. Creating a GPN account lets you register for tournaments directly from the Programs and Tournaments tabs in Smashr.",
      },
      {
        q: "How do I register for a tournament?",
        a: "Find a tournament in the Tournaments or Programs tab and tap 'Register Now'. This opens the GPN registration page in your browser where you can complete sign-up.",
      },
      {
        q: "Why does the tournaments list sometimes show an error?",
        a: "Tournament data is pulled live from GPN's servers. If the GPN API key needs renewal or GPN is temporarily unavailable, you may see an error. Pull down to retry.",
      },
    ],
  },
  {
    section: "Account & Privacy",
    items: [
      {
        q: "How do I change my display name?",
        a: "Go to Account → Edit Profile and update your display name there.",
      },
      {
        q: "How do I delete my account?",
        a: "Email us at support@smashrapp.com and we will permanently delete your account and all associated data within 7 business days.",
      },
      {
        q: "What data does Smashr store?",
        a: "Smashr stores your email (via Firebase Auth), display name, match history (for DUPR submission), and GPN credentials if you connect GPN. Location is never stored long-term. See our Privacy Policy for full details.",
      },
    ],
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <TouchableOpacity style={styles.faqItem} onPress={toggle} activeOpacity={0.7}>
      <View style={styles.faqRow}>
        <Text style={styles.faqQuestion}>{item.q}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textGray}
        />
      </View>
      {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpFAQ() {
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
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 26 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro banner */}
        <View style={styles.banner}>
          <Ionicons name="help-buoy-outline" size={28} color={colors.primaryEnd} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>How can we help?</Text>
            <Text style={styles.bannerSub}>Tap a question to expand the answer.</Text>
          </View>
        </View>

        {FAQ_SECTIONS.map((section) => (
          <View key={section.section}>
            <Text style={styles.sectionLabel}>{section.section}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, i) => (
                <View key={item.q}>
                  <FAQItem item={item} />
                  {i < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Contact card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSub}>
            Can't find the answer you're looking for? Reach out directly.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL("mailto:support@smashrapp.com")}
          >
            <Ionicons name="mail-outline" size={16} color={colors.white} />
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
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
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: "900", letterSpacing: 0.3 },

  scroll: { padding: 16, paddingBottom: 48 },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  bannerTitle: { fontSize: 15, fontWeight: "800", color: colors.textDark },
  bannerSub: { fontSize: 13, color: colors.textGray, marginTop: 2 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 20,
  },

  faqItem: { paddingHorizontal: 16, paddingVertical: 14 },
  faqRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.textDark, lineHeight: 20 },
  faqAnswer: {
    marginTop: 10,
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
  },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },

  contactCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 8,
  },
  contactTitle: { fontSize: 16, fontWeight: "800", color: colors.textDark },
  contactSub: { fontSize: 14, color: colors.textGray, textAlign: "center", lineHeight: 20 },
  contactButton: {
    marginTop: 6,
    backgroundColor: colors.primaryEnd,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
