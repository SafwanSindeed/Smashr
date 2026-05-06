import { LinearGradient } from "expo-linear-gradient";
import {useEffect, useState} from "react";
import { colors } from "../../../constants/colors";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  Alert
} from "react-native";
import { SafeAreaView} from "react-native-safe-area-context";

export default function Screen() {
  return (
    <SafeAreaView style={styles.container}>

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
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Registrations</Text>
            </View>
          </View>
        </LinearGradient>

        {/* AVAILABLE TOURNAMENTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Available Tournaments</Text>
            <TournamentGrab/>
          </View>
        </View>
    </SafeAreaView>
  );
}


//Global Pickeball Network API (Provides tournament information)
const API_URL = "https://www.globalpickleball.network/component/api?apiCall=getTournaments&format=raw&devKey=264784-q4jMNhO3X&limit=100";
const categories = ['All', 'Singles', 'Doubles'];

const TournamentGrab = () => {
  const [data, setData] = useState([]); //Full
  const [displayedData, setDisplayedData] = useState([]); //Filtered
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const test = async () => {
    const result = await getUserSessionId();
     Alert.alert(result);
     return
  }

  useEffect(() => {
    fetchTournaments();
    test();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      setData(json);
      setDisplayedData(data);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = (category) => {
    if (category === 'All') {
      setDisplayedData(data);
    } else {
      const filtered = data.filter(item => item.singlesDoubles === category);
      setDisplayedData(filtered);
    }
  };

  const FilterButton = ({ label, active, category }) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      active && styles.filterButtonActive,
    ]}
    onPress={() => filterByCategory("All")}
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.singlesDoubles === "S" ? "Singles" : "Doubles"}</Text>
      </View>


      <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{item.name}</Text>

      <Text style={styles.cardMeta}>📅 Date: {item.startDate} → {item.endDate}</Text>
      <Text style={styles.cardMeta}>📍 Location: {item.city}, {item.country}</Text>
      <Text style={styles.cardMeta}>👥 Registered Players: {item.totalPlayers}</Text>
      <Text style={styles.cardMeta}>👥 Skill Level: {item.startLevel} - {item.endLevel}</Text>
      <Text style={styles.cardMeta}>💵 Fee: {item.fee}</Text>
      <Text style={styles.cardDescription}>Description: {item.description}</Text>

      <TouchableOpacity style={styles.registerButton} onPress={() => Linking.openURL(item.url)}>
        <Text style={styles.registerText}>Register Now →</Text>
      </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles2.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles2.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{}}>
      <View style={styles.filters}>
        <FilterButton label="All Events" active category="All"/>
        <FilterButton label="Singles" active category="S"/>
        <FilterButton label="Doubles" active category="D"/>
      </View>

      <FlatList
      data={data}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      />
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  hero: {
    padding: 24,
    paddingBottom: 40,
  },
  heroBadge: {
    color: colors.primaryStart,
    fontWeight: "600",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.white,
    lineHeight: 40,
  },
  heroHighlight: {
    color: "#93c5fd",
  },
  heroSubtitle: {
    marginTop: 12,
    fontSize: 16,
    color: colors.white,
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
    color: colors.white,
  },
  statLabel: {
    color: colors.white,
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
    backgroundColor: colors.white,
  },
  filterButtonActive: {
    backgroundColor: colors.primaryEnd,
  },
  filterText: {
    color: "#374151",
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.white,
  },
  card: {
    backgroundColor: "#ecece3",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.primaryEnd,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 12,
  },

  cardContent: {
    padding: 16,
  },
  cardCategory: {
    color: colors.primaryEnd,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
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
    backgroundColor: colors.primaryEnd,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  registerText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});

const styles2 = StyleSheet.create({
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
