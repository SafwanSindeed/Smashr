// app/edit-profile.jsx

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { updateProfile } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { colors } from "../constants/colors";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;

  const currentName = user?.displayName || user?.email?.split("@")[0] || "";
  const [displayName, setDisplayName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const initials = (displayName || currentName)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const onSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert("Invalid Name", "Display name cannot be empty.");
      return;
    }
    if (trimmed === currentName) {
      router.back();
      return;
    }
    try {
      setSaving(true);
      await updateProfile(user, { displayName: trimmed });
      Alert.alert("Saved", "Your display name has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 26 }} />
      </LinearGradient>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.avatarHint}>Your initials are used as your avatar</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={colors.textGray} />
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textGray}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={40}
                />
              </View>
              <Text style={styles.hint}>
                This is the name other players see when you challenge them.
              </Text>

              <View style={styles.divider} />

              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={[styles.inputWrap, styles.inputDisabled]}>
                <Ionicons name="mail-outline" size={18} color={colors.textGray} />
                <Text style={styles.inputReadOnly}>{user?.email ?? "—"}</Text>
                <Ionicons name="lock-closed-outline" size={14} color="#D1D5DB" />
              </View>
              <Text style={styles.hint}>Email cannot be changed here. Contact support if needed.</Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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

  scroll: { padding: 20, paddingBottom: 48 },

  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryEnd,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 36, fontWeight: "900", color: colors.white },
  avatarHint: { fontSize: 13, color: colors.textGray, fontWeight: "500" },

  formCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textDark,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
  },
  inputDisabled: { backgroundColor: "#F9FAFB" },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textDark },
  inputReadOnly: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textGray },
  hint: { fontSize: 12, color: colors.textGray, lineHeight: 17, marginTop: -2 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 4 },

  saveButton: {
    backgroundColor: colors.primaryEnd,
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
});
