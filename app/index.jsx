// MainPage.js (Expo + iOS)
import React, { useRef } from "react";
import { StyleSheet, Text, View, Pressable, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // ✅ correct router hook
import Logo from "../assets/img/Logo.jpg";

const MainPage = () => {
  const router = useRouter(); // ✅ router instance

  const scaleCreate = useRef(new Animated.Value(1)).current;
  const scaleLogin = useRef(new Animated.Value(1)).current;

  const pressIn = (anim) => {
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const pressOut = (anim) => {
    Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  const onCreate = () => {
    router.push("/createAccount"); // change if your file name differs
  };

  const onLogin = () => {
    router.push("/login"); // must match file inside /app folder
  };
  const onForgetPassword = () => {
    router.push("/forgetpassword"); // must match file inside /app folder
  }; 
  const onGoogle = () => {
    // handle google sign in
  };

  const onApple = () => {
    // handle apple sign in
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        {/* CENTER CONTENT */}
        <View style={styles.content}>
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
        {/* FORGET PASSWORD */}
        <Pressable onPress={() => router.push("/forgetpassword")}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Pressable>
        <View>
          <Text>------------------------------------------------------</Text>
        </View>

        {/* BOTTOM ICONS */}
        <View style={styles.footer}>
          <View style={styles.bottomIcons}>
            <Pressable onPress={onGoogle} style={styles.iconButton}>
              <FontAwesome name="google" size={26} color="#DB4437" />
            </Pressable>

            <Pressable onPress={onApple} style={styles.iconButton}>
              <Ionicons name="logo-apple" size={28} color="#000" />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF8EB" },

  screen: { flex: 1, padding: 24 },

  content: { flex: 1, alignItems: "center", justifyContent: "center" },

  footer: { alignItems: "center", paddingBottom: 6 },

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

  buttonWrapper: { width: "100%", marginTop: 12 },

  animatedWrap: {
    width: "100%",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  primaryButton: {
    height: 72,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryText: { color: "white", fontSize: 20, fontWeight: "900" },

  secondaryButton: {
    height: 72,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  secondaryText: { color: "#374151", fontSize: 24, fontWeight: "900" },
  forgotText: {
    marginTop: -2,
    fontSize: 15,
    color: "#333333",
    fontWeight: "800",
  },
  bottomIcons: { flexDirection: "row", justifyContent: "center", gap: 24 },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
});