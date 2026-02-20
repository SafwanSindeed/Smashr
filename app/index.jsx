// MainPage.js (Expo + iOS)
// Fixes the top/bottom “border” by setting the SafeArea background,
// and keeps your content centered inside an inner View.

import React, { useRef } from "react";
import { StyleSheet, Text, View, Pressable, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "../assets/img/Logo.jpg";

const MainPage = ({ navigation }) => {
  // UseRef so the Animated.Value doesn't reset on re-render
  const scaleCreate = useRef(new Animated.Value(1)).current;
  const scaleLogin = useRef(new Animated.Value(1)).current;

  const pressIn = (anim) => {
    Animated.spring(anim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = (anim) => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const onCreate = () => {
    // navigation?.navigate("CreateAccount");
  };

  const onLogin = () => {
    // navigation?.navigate("Login");
  };

  return (
    // IMPORTANT: backgroundColor here covers the SAFE AREA too (top/bottom)
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Inner container holds layout/padding/centering */}
      <View style={styles.screen}>
        <Image source={Logo} style={styles.image} />

        <Text style={styles.title}>SMASHR</Text>

        <Text style={styles.tagline}>Your Pickleball Community</Text>

        <Text style={styles.description}>
          Connect your DUPR rating and find players at your level
        </Text>

        {/* CREATE ACCOUNT BUTTON */}
        <Pressable
          onPress={onCreate}
          onPressIn={() => pressIn(scaleCreate)}
          onPressOut={() => pressOut(scaleCreate)}
          style={styles.buttonWrapper}
        >
          <Animated.View style={[styles.animatedWrap, { transform: [{ scale: scaleCreate }] }]}>
            <LinearGradient colors={["#6A8FD2", "#3274EF"]} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Create Account</Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* LOGIN BUTTON */}
        <Pressable
          onPress={onLogin}
          onPressIn={() => pressIn(scaleLogin)}
          onPressOut={() => pressOut(scaleLogin)}
          style={styles.buttonWrapper}
        >
          <Animated.View style={[styles.animatedWrap, { transform: [{ scale: scaleLogin }] }]}>
            <View style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Log In</Text>
            </View>
          </Animated.View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  // SafeAreaView MUST have the background color to avoid top/bottom “borders”
  safe: {
    flex: 1,
    backgroundColor: "#FFF8EB",
  },

  // Your actual screen layout
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  image: {
    width: 150,
    height: 150,
    borderRadius: 24,
    resizeMode: "cover",
    marginBottom: 16,
  },

  title: {
    fontSize: 60,
    fontWeight: "900",
    color: "#212325",
    letterSpacing: 1,
  },

  tagline: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 18,
    fontWeight: "500",
    textAlign: "center",
  },

  description: {
    fontSize: 17,
    color: "#6B7280",
    marginTop: 18,
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 15,
  },

  buttonWrapper: {
    width: "100%",
    marginTop: 12,
  },

  animatedWrap: {
    width: "100%",
  },

  primaryButton: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  secondaryButton: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  secondaryText: {
    color: "#374151",
    fontSize: 18,
    fontWeight: "600",
  },
});