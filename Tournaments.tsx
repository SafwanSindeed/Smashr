import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        {/* HERO SECTION */}
        <LinearGradient
          colors={["#1e40af", "#2563eb"]}
          style={styles.hero}
        >
          <Text style={styles.heroBadge}>🏆 Pickleball Tournaments</Text>
          <Text style={styles.heroTitle}>
            Find Your Next{"\n"}
            <Text style={styles.heroHighlight}>Pickleball Match</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Register for singles or doubles pickleball tournaments and compete
            with the best players in your area
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Active Events</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Registrations</Text>
            </View>
          </View>
        </LinearGradient>

        {/* AVAILABLE TOURNAMENTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Available Tournaments</Text>

            <View style={styles.filters}>
              <FilterButton label="All Events" active />
              <FilterButton label="Singles"  active/>
              <FilterButton label="Doubles"  active/>
            </View>
          </View>

          <TournamentCard />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const FilterButton = ({ label, active }: {label: string, active: boolean}) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      active && styles.filterButtonActive,
    ]}
  >
    <Text
      style={[
        styles.filterText,
        active && styles.filterTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const TournamentCard = () => (
  <View style={styles.card}>
    <Image
      source={{ uri: "https://images.unsplash.com/photo-1599058917212-d750089bc07b" }}
      style={styles.cardImage}
    />

    <View style={styles.badge}>
      <Text style={styles.badgeText}>Doubles</Text>
    </View>

    <View style={styles.cardContent}>
      <Text style={styles.cardCategory}>Pickleball</Text>
      <Text style={styles.cardTitle}>Pickleball Doubles Festival</Text>

      <Text style={styles.cardMeta}>📅 August 31, 2024</Text>
      <Text style={styles.cardMeta}>📍 Riverside Park Courts</Text>
      <Text style={styles.cardMeta}>👥 0 / 24 teams</Text>
      <Text style={styles.cardMeta}>💵 $45 entry fee</Text>
      <Text style={styles.cardMeta}>🏆 $1,200 prize pool</Text>

      <Text style={styles.cardDescription}>
        Join the pickleball craze! This friendly doubles tournament welcomes
        all ages and skill levels.
      </Text>

      <TouchableOpacity style={styles.registerButton}>
        <Text style={styles.registerText}>Register Now →</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ddcc80",
  },

  hero: {
    padding: 24,
    paddingBottom: 40,
  },
  heroBadge: {
    color: "#bfdbfe",
    fontWeight: "600",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 40,
  },
  heroHighlight: {
    color: "#93c5fd",
  },
  heroSubtitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#e0f2fe",
    maxWidth: 340,
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 16,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 16,
    borderRadius: 12,
    width: 140,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#a9ad92",
  },
  statLabel: {
    color: "#d3dbbd",
    marginTop: 4,
  },

  section: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },

  filters: {
    flexDirection: "row",
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#cccbad",
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
  },
  filterText: {
    color: "#374151",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#d5dac3",
  },

  card: {
    backgroundColor: "#c4ceae",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  cardContent: {
    padding: 16,
  },
  cardCategory: {
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardMeta: {
    fontSize: 14,
    marginBottom: 4,
    color: "#374151",
  },
  cardDescription: {
    marginTop: 10,
    fontSize: 14,
    color: "#4b5563",
  },

  registerButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  registerText: {
    color: "#c2d3b2",
    fontWeight: "700",
    fontSize: 16,
  },
});

