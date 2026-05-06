import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createGpnCredentials } from "../../functions/DatabaseFunctions.js";
import { colors } from "../../constants/colors";

function FormField({ label, icon, value, onChangeText, placeholder, keyboardType = "default", autoCapitalize = "none" }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputFocused]}>
        <Ionicons name={icon} size={17} color={focused ? colors.primaryEnd : colors.textGray} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textGray}
          style={styles.input}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

export default function GPNConnect() {
  const router = useRouter();
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [email, setEmail]           = useState("");
  const [country, setCountry]       = useState("");
  const [state, setState]           = useState("");
  const [city, setCity]             = useState("");
  const [level, setLevel]           = useState("");
  const [gender, setGender]         = useState("");
  const [birthDate, setBirthDate]   = useState("");
  const [loading, setLoading]       = useState(false);

  const scaleBtn = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scaleBtn, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleBtn, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const onRegister = async () => {
    if (!firstName || !lastName || !username || !password || !email) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    try {
      Keyboard.dismiss();
      setLoading(true);

      const API = `https://www.globalpickleball.network/component/api?apiCall=registerUser&format=raw&devKey=264784-q4jMNhO3X&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&email=${email}&country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}&level=${encodeURIComponent(level)}&gender=${encodeURIComponent(gender)}&birthdate=${encodeURIComponent(birthDate)}`;

      const response = await fetch(API);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("RAW GPN RESPONSE:", text);
        Alert.alert("GPN Error", "Unexpected response from server. Check console.");
        return;
      }

      if (data?.message) {
        Alert.alert("Registration Notice", data.message);
        return;
      }

      const sessionId  = data.sessionId ?? data.session_id ?? data.session ?? data.sessionID ?? null;
      const gpnId      = data.id ?? data.userId ?? null;
      const gpnUsername = data.username ?? data.user_name ?? data.login ?? username;

      if (!sessionId || !gpnId) {
        Alert.alert("Error", "Invalid GPN response.");
        console.log("GPN RAW RESPONSE:", data);
        return;
      }

      try {
        await createGpnCredentials({
          id: String(gpnId),
          sessionId: String(sessionId),
          username: String(gpnUsername),
        });
      } catch (dbError) {
        console.error("Firestore error:", dbError);
        Alert.alert("Database Error", "GPN account created but failed to save locally.");
      }

      Alert.alert("Success", "GPN account created!");
      router.replace("/home/homepage");

    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Create a GPN Account</Text>
            <Text style={styles.subtitle}>
              Register to access an abundance of events and sync your DUPR rating.
            </Text>

            <View style={styles.cardRow}>
              <View style={styles.card}>
                <Ionicons name="trophy-outline" size={22} color={colors.primaryEnd} />
                <Text style={styles.cardTitle}>Verified Rating</Text>
                <Text style={styles.cardSub}>Official DUPR sync</Text>
              </View>
              <View style={styles.card}>
                <Ionicons name="trending-up-outline" size={22} color={colors.primaryEnd} />
                <Text style={styles.cardTitle}>Track Progress</Text>
                <Text style={styles.cardSub}>Watch your rating grow</Text>
              </View>
            </View>

            <View style={styles.formBlock}>
              <SectionHeader title="Personal Info" />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="First Name *"
                    icon="person-outline"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Jane"
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.rowGap} />
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Last Name *"
                    icon="person-outline"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <FormField
                label="Date of Birth *"
                icon="calendar-outline"
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Gender"
                    icon="male-female-outline"
                    value={gender}
                    onChangeText={setGender}
                    placeholder="e.g. Male"
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.rowGap} />
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Skill Level"
                    icon="stats-chart-outline"
                    value={level}
                    onChangeText={setLevel}
                    placeholder="e.g. 3.5"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <SectionHeader title="Account Info" />
              <FormField
                label="Username *"
                icon="at-outline"
                value={username}
                onChangeText={setUsername}
                placeholder="pickleball_pro"
              />
              <FormField
                label="Password *"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
              />
              <FormField
                label="Email Address *"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="jane@example.com"
                keyboardType="email-address"
              />

              <SectionHeader title="Location" />
              <FormField
                label="Country"
                icon="globe-outline"
                value={country}
                onChangeText={setCountry}
                placeholder="United States"
                autoCapitalize="words"
              />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="State / Province"
                    icon="map-outline"
                    value={state}
                    onChangeText={setState}
                    placeholder="New York"
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.rowGap} />
                <View style={{ flex: 1 }}>
                  <FormField
                    label="City"
                    icon="location-outline"
                    value={city}
                    onChangeText={setCity}
                    placeholder="Brooklyn"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <Pressable
                onPress={onRegister}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
              >
                <Animated.View style={{ transform: [{ scale: scaleBtn }] }}>
                  <LinearGradient
                    colors={[colors.primaryStart, colors.primaryEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, loading && { opacity: 0.7 }]}
                  >
                    <Ionicons
                      name={loading ? "hourglass-outline" : "person-add-outline"}
                      size={18}
                      color={colors.white}
                    />
                    <Text style={styles.buttonText}>
                      {loading ? "Registering…" : "Create GPN Account"}
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              <Text style={styles.requiredNote}>* Required fields</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },

  title: { fontSize: 28, fontWeight: "900", color: colors.textDark, textAlign: "center" },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textGray,
    textAlign: "center",
    marginBottom: 24,
  },

  cardRow: { flexDirection: "row", gap: 14, marginBottom: 24 },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { marginTop: 10, fontSize: 14, fontWeight: "800", color: colors.textDark },
  cardSub: { marginTop: 4, fontSize: 12, fontWeight: "600", color: colors.textGray },

  formBlock: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, marginBottom: 2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.border },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textGray,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  row: { flexDirection: "row" },
  rowGap: { width: 12 },

  fieldWrapper: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "800", color: colors.textDark, letterSpacing: 0.2 },
  inputWrap: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.background,
  },
  inputFocused: { borderColor: colors.primaryEnd, backgroundColor: colors.white },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textDark },

  button: {
    marginTop: 8,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: "900" },

  requiredNote: {
    fontSize: 11,
    color: colors.textGray,
    fontWeight: "600",
    textAlign: "right",
    marginTop: -6,
  },
});
