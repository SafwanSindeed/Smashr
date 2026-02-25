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

import { colors } from "../../constants/colors";

export default function DuprConnect() {
  const [duprValue, setDuprValue] = useState("");
  const [focused, setFocused] = useState(false);

  const scaleBtn = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scaleBtn, { toValue: 0.97, useNativeDriver: true }).start();

  const pressOut = () =>
    Animated.spring(scaleBtn, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const onConnect = () => {
    Keyboard.dismiss();
  
    if (!duprValue.trim()) {
      Alert.alert("Missing info", "Please enter your DUPR ID or profile URL.");
      return;
    }

    Alert.alert("DUPR Connected", "API hookup coming next 🔥");
  };
  
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>

            {/* HEADER */}
            <Text style={styles.title}>Connect Your DUPR</Text>
            <Text style={styles.subtitle}>
              Link your account to sync your rating and find perfect matches
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
                  value={duprValue}
                  onChangeText={setDuprValue}
                  placeholder="Enter your DUPR ID"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>

              <Text style={styles.helper}>
                Find your ID at mydupr.com/profile
              </Text>

              {/* CONNECT BUTTON */}
              <Pressable onPress={onConnect} onPressIn={pressIn} onPressOut={pressOut}>
                <Animated.View style={{ transform: [{ scale: scaleBtn }] }}>
                  <LinearGradient
                    colors={[colors.primaryStart, colors.primaryEnd]}
                    style={styles.button}
                  >
                    <Ionicons name="link-outline" size={18} color={colors.white} />
                    <Text style={styles.buttonText}>
                      Connect DUPR Account
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