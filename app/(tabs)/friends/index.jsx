import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../services/firebaseConfig";
import { colors } from "../../../constants/colors";

const MOCK_FRIENDS = [
  { uid: "mock1", displayName: "Jordan Lee", email: "jordan@example.com", dupr: "3.8" },
  { uid: "mock2", displayName: "Alex Chen", email: "alex@example.com", dupr: "4.2" },
  { uid: "mock3", displayName: "Sam Rivera", email: "sam@example.com", dupr: "3.5" },
];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

const AVATAR_GRADIENTS = [
  ["#6A8FD2", "#3274EF"],
  ["#A78BFA", "#7C3AED"],
  ["#34D399", "#059669"],
  ["#FB923C", "#DC2626"],
  ["#F472B6", "#DB2777"],
];

function avatarGradient(uid) {
  const idx = uid ? uid.charCodeAt(uid.length - 1) % AVATAR_GRADIENTS.length : 0;
  return AVATAR_GRADIENTS[idx];
}

function FriendRow({ friend, onChallenge }) {
  const grad = avatarGradient(friend.uid);
  return (
    <View style={styles.friendRow}>
      <LinearGradient colors={grad} style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(friend.displayName)}</Text>
      </LinearGradient>

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.displayName}</Text>
        <Text style={styles.friendEmail} numberOfLines={1}>{friend.email}</Text>
      </View>

      {friend.dupr ? (
        <View style={styles.duprBadge}>
          <Text style={styles.duprText}>{friend.dupr}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.challengeBtn}
        onPress={() => onChallenge(friend)}
        activeOpacity={0.8}
      >
        <Ionicons name="flash" size={15} color={colors.white} />
        <Text style={styles.challengeBtnText}>Challenge</Text>
      </TouchableOpacity>
    </View>
  );
}

function AddFriendModal({ visible, onClose }) {
  const [searchInput, setSearchInput] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSearch = async () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setSearching(true);
    setFoundUser(null);
    setNotFound(false);
    try {
      const q = query(
        collection(db, "users"),
        where("displayName", "==", trimmed)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setNotFound(true);
      } else {
        const d = snap.docs[0];
        setFoundUser({ uid: d.id, ...d.data() });
      }
    } catch (_) {
      Alert.alert("Error", "Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    const me = auth.currentUser;
    if (!me || !foundUser) return;
    if (foundUser.uid === me.uid) {
      Alert.alert("Oops", "You can't add yourself as a friend.");
      return;
    }
    setAdding(true);
    try {
      await setDoc(doc(db, "users", me.uid, "friends", foundUser.uid), {
        uid: foundUser.uid,
        displayName: foundUser.displayName || "",
        email: foundUser.email || "",
        addedAt: new Date().toISOString(),
      });
      Alert.alert("Friend Added!", `${foundUser.displayName} has been added to your friends.`);
      setSearchInput("");
      setFoundUser(null);
      onClose();
    } catch (_) {
      Alert.alert("Error", "Could not add friend. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSearchInput("");
    setFoundUser(null);
    setNotFound(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} onPress={handleClose} activeOpacity={1}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add Friend</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetLabel}>Enter display name</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.sheetInput}
                placeholder="e.g. Jordan Lee"
                placeholderTextColor={colors.textGray}
                value={searchInput}
                onChangeText={(v) => { setSearchInput(v); setFoundUser(null); setNotFound(false); }}
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleSearch}
                disabled={searching}
                activeOpacity={0.8}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="search" size={18} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>

            {notFound && (
              <View style={styles.notFoundBox}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <Text style={styles.notFoundText}>No user found with that name</Text>
              </View>
            )}

            {foundUser && (
              <View style={styles.foundCard}>
                <LinearGradient colors={avatarGradient(foundUser.uid)} style={styles.foundAvatar}>
                  <Text style={styles.avatarText}>{getInitials(foundUser.displayName)}</Text>
                </LinearGradient>
                <View style={styles.foundInfo}>
                  <Text style={styles.foundName}>{foundUser.displayName}</Text>
                  <Text style={styles.foundEmail}>{foundUser.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={handleAdd}
                  disabled={adding}
                  activeOpacity={0.8}
                >
                  {adding ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.addBtnText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [realFriends, setRealFriends] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "friends"),
      (snap) => {
        setRealFriends(snap.docs.map((d) => ({ ...d.data() })));
      },
      () => {}
    );
    return unsub;
  }, []);

  const allFriends = [
    ...realFriends,
    ...MOCK_FRIENDS.filter((m) => !realFriends.some((r) => r.uid === m.uid)),
  ];

  const filtered = allFriends.filter((f) =>
    f.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleChallenge = (friend) => {
    router.push({
      pathname: "/findmatch",
      params: {
        type: "friendly",
        friendUid: friend.uid,
        friendName: friend.displayName,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Friends</Text>
        <Pressable hitSlop={10} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="person-add-outline" size={28} color={colors.white} />
        </Pressable>
      </LinearGradient>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textGray} />
        <TextInput
          placeholder="Search friends by name..."
          placeholderTextColor={colors.textGray}
          style={styles.input}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(f) => f.uid}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the person-add icon to find and add friends
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <FriendRow friend={item} onChallenge={handleChallenge} />
        )}
      />

      <AddFriendModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 72,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 12,
    color: colors.textGray,
  },
  duprBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  duprText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryEnd,
  },
  challengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryEnd,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  challengeBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 64,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: colors.textDark },
  sheetBody: { padding: 16 },
  sheetLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textGray,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  sheetInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBtn: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  notFoundText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  foundCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginBottom: 12,
  },
  foundAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  foundInfo: { flex: 1 },
  foundName: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  foundEmail: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 52,
    alignItems: "center",
  },
  addBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
