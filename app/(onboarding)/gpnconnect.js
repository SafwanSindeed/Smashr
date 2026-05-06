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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";
import { colors } from "../../constants/colors";

export default function GPNConnect() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [focused, setFocused] = useState(false);

  const scaleBtn = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scaleBtn, { toValue: 0.97, useNativeDriver: true }).start();

  const pressOut = () =>
    Animated.spring(scaleBtn, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const onConnect = async () => {
    Keyboard.dismiss();
    try {
      const response = await fetch(
        `https://www.globalpickleball.network/component/api?apiCall=registerUser&format=raw&devKey=264784-q4jMNhO3X&firstName=${firstName}&lastName=${lastName}&username=${username}&email=${email}&country=${country}&state=${state}&city=${city}&level=${level}&gender=${gender}&birthdate=${birthDate}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Object.hasOwn(data, "message")) {
        Alert.alert(data.message);
      } else {
        router.replace("home/homepage");
      }
    } catch (error) {
      console.error("Fetch Error:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const API_URL = "https://www.globalpickleball.network/component/api?apiCall=registerUser&format=raw&devKey=264784-q4jMNhO3X";
  
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>

            {/* HEADER */}
            <Text style={styles.title}>Create a GPN Account today</Text>
            <Text style={styles.subtitle}>
              Register and Connect to a GPN Account to access an abundance of Events
            </Text>

            {/* FEATURE CARDS */}
            <View style={styles.cardRow}>
              <View style={styles.card}>
                <Ionicons
                  name="trophy-outline"
                  size={22}
                  color={colors.primaryEnd}
                />
                <Text style={styles.cardTitle}>Verified Rating</Text>
                <Text style={styles.cardSub}>Official DUPR sync</Text>
              </View>

              <View style={styles.card}>
                <Ionicons
                  name="trending-up-outline"
                  size={22}
                  color={colors.primaryEnd}
                />
                <Text style={styles.cardTitle}>Track Progress</Text>
                <Text style={styles.cardSub}>Watch your rating grow</Text>
              </View>
            </View>

            {/* INPUT BLOCK */}
            <View style={styles.block}>
              <Text style={styles.label}>DUPR ID or Profile URL</Text>

              <View style={[styles.inputWrap, focused && styles.inputFocused]}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.textGray}
                />

                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={level}
                  onChangeText={setLevel}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={gender}
                  onChangeText={setGender}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />

                <TextInput
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="Enter your information"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>
              

              {/* CONNECT BUTTON */}
              <Pressable onPress={onConnect} onPressIn={pressIn} onPressOut={pressOut}>
                <Animated.View style={{ transform: [{ scale: scaleBtn }] }}>
                  <LinearGradient
                    colors={[colors.primaryStart, colors.primaryEnd]}
                    style={styles.button}
                  >
                    <Ionicons name="link-outline" size={18} color={colors.white} />
                    <Text style={styles.buttonText}>
                      Connect GPN Account
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </View>

          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textDark,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textGray,
    textAlign: "center",
    marginBottom: 24,
  },

  cardRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
  },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "800",
    color: colors.textDark,
  },

  cardSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textGray,
  },

  block: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 8,
  },

  inputWrap: {
    height: 55,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  inputFocused: {
    borderColor: colors.primaryEnd,
  },

  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },

  helper: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "600",
  },

  button: {
    marginTop: 18,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
});