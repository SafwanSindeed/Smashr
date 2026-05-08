// app/(auth)/login.jsx

import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import styles from "../styles";
import { colors } from "../../constants/colors";
import { auth } from "../../services/firebaseConfig";

// Stable focus-aware input — never causes a re-render on focus/blur
function FocusInput({ icon, errorStyle, inputRef, ...inputProps }) {
  const borderColor = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    Animated.timing(borderColor, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    inputProps.onFocus?.();
  };
  const onBlur = () => {
    Animated.timing(borderColor, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    inputProps.onBlur?.();
  };

  const animatedBorder = borderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primaryEnd],
  });

  return (
    <Animated.View
      style={[
        ls.inputWrap,
        errorStyle,
        { borderColor: animatedBorder },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={colors.textGray}
        style={ls.inputIcon}
      />
      <TextInput
        ref={inputRef}
        placeholderTextColor={colors.textGray}
        style={ls.input}
        {...inputProps}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </Animated.View>
  );
}

export default function Login() {
  const router = useRouter();
  const scaleLogin = useRef(new Animated.Value(1)).current;
  const passwordRef = useRef(null);

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const pressIn  = () => Animated.timing(scaleLogin, { toValue: 0.97, duration: 120, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scaleLogin, { toValue: 1,    duration: 120, useNativeDriver: true }).start();

  const onLogin = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }
    try {
      setLoading(true);
      const { user } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      if (!user.emailVerified) {
        await signOut(auth);
        Alert.alert(
          "Email not verified",
          "Please check your inbox and click the verification link before logging in.",
          [{ text: "OK" }]
        );
        return;
      }
      router.replace("/(tabs)/home/homepage");
    } catch (err) {
      Alert.alert("Login failed", err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.screen}>
            <View style={styles.content}>
              <Text style={styles.title}>Log In</Text>
              <Text style={ls.subtitle}>Welcome back — sign in to continue</Text>

              {/* Email */}
              <FocusInput
                icon="mail-outline"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              {/* Password */}
              <Animated.View style={ls.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textGray} style={ls.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  placeholder="Password"
                  placeholderTextColor={colors.textGray}
                  value={password}
                  onChangeText={setPassword}
                  style={[ls.input, { paddingRight: 44 }]}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={onLogin}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                  style={ls.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textGray}
                  />
                </Pressable>
              </Animated.View>

              {/* Forgot password */}
              <Pressable onPress={() => router.push("/forgetpassword")} style={ls.forgotWrap}>
                <Text style={ls.forgotText}>Forgot Password?</Text>
              </Pressable>

              {/* Login button */}
              <Pressable
                onPress={onLogin}
                disabled={loading}
                onPressIn={() => !loading && pressIn()}
                onPressOut={() => !loading && pressOut()}
                style={[styles.buttonWrapper, loading && { opacity: 0.7 }]}
              >
                <Animated.View style={[styles.animatedWrap, { transform: [{ scale: scaleLogin }] }]}>
                  <LinearGradient
                    colors={[colors.primaryStart, colors.primaryEnd]}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryText}>
                      {loading ? "Logging in…" : "Log In"}
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              <View style={styles.divider} />

              {/* Create account link */}
              <Pressable onPress={() => router.push("/createAccount")}>
                <Text style={ls.bottomLink}>
                  Don't have an account?{" "}
                  <Text style={ls.bottomLinkBold}>Create one</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const ls = {
  subtitle: {
    fontSize: 15,
    color: colors.textGray,
    marginTop: 8,
    marginBottom: 28,
    fontWeight: "600",
    textAlign: "center",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
    fontWeight: "600",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginBottom: 10,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 14,
    color: colors.primaryEnd,
    fontWeight: "700",
  },
  bottomLink: {
    fontSize: 15,
    color: colors.textGray,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomLinkBold: {
    color: colors.primaryEnd,
    fontWeight: "900",
  },
};