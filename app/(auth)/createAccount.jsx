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

import styles from "../styles";
import { colors } from "../../constants/colors";
import { auth } from "../../services/firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { createUser } from "../../functions/DatabaseFunctions.js";

export default function CreateAccount() {
  const router = useRouter();
  const scaleCreate = useRef(new Animated.Value(1)).current;

  const [firstName, setFirstName]               = useState("");
  const [lastName, setLastName]                 = useState("");
  const [email, setEmail]                       = useState("");
  const [password, setPassword]                 = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [loading, setLoading]                   = useState(false);

  const [firstFocused, setFirstFocused]         = useState(false);
  const [lastFocused, setLastFocused]           = useState(false);
  const [emailFocused, setEmailFocused]         = useState(false);
  const [passFocused, setPassFocused]           = useState(false);
  const [confirmFocused, setConfirmFocused]     = useState(false);

  const pressIn  = () => Animated.timing(scaleCreate, { toValue: 0.97, duration: 120, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scaleCreate, { toValue: 1,    duration: 120, useNativeDriver: true }).start();

  const passwordsMatch =
    password.length === 0 && confirmPassword.length === 0
      ? true
      : password === confirmPassword;

  const onCreateAccount = async () => {
    Keyboard.dismiss();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (!passwordsMatch) {
      Alert.alert("Password Mismatch", "Your passwords don't match.");
      return;
    }
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid = userCredential.user.uid;
      await updateProfile(userCredential.user, { displayName: `${firstName.trim()} ${lastName.trim()}` });
      await createUser(uid, firstName.trim(), lastName.trim(), email.trim().toLowerCase());
      sendEmailVerification(userCredential.user).catch(() => {});
      router.replace("/(tabs)/home/homepage");
    } catch (err) {
      Alert.alert("Error", err?.message || "Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.screen}>
              <View style={styles.content}>
                <Text style={styles.title}>Create</Text>
                <Text style={cs.subtitle}>Make your Smashr account in seconds</Text>

                {/* First Name */}
                <View style={[cs.inputWrap, firstFocused && cs.inputWrapFocused]}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={firstFocused ? colors.primaryEnd : colors.textGray}
                    style={cs.inputIcon}
                  />
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor={colors.textGray}
                    value={firstName}
                    onChangeText={setFirstName}
                    style={cs.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="givenName"
                    returnKeyType="next"
                    onFocus={() => setFirstFocused(true)}
                    onBlur={() => setFirstFocused(false)}
                  />
                </View>

                {/* Last Name */}
                <View style={[cs.inputWrap, lastFocused && cs.inputWrapFocused]}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={lastFocused ? colors.primaryEnd : colors.textGray}
                    style={cs.inputIcon}
                  />
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor={colors.textGray}
                    value={lastName}
                    onChangeText={setLastName}
                    style={cs.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="familyName"
                    returnKeyType="next"
                    onFocus={() => setLastFocused(true)}
                    onBlur={() => setLastFocused(false)}
                  />
                </View>

                {/* Email */}
                <View style={[cs.inputWrap, emailFocused && cs.inputWrapFocused]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={emailFocused ? colors.primaryEnd : colors.textGray}
                    style={cs.inputIcon}
                  />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={colors.textGray}
                    value={email}
                    onChangeText={setEmail}
                    style={cs.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>

                {/* Password */}
                <View style={[cs.inputWrap, passFocused && cs.inputWrapFocused]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passFocused ? colors.primaryEnd : colors.textGray}
                    style={cs.inputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={colors.textGray}
                    value={password}
                    onChangeText={setPassword}
                    style={[cs.input, { paddingRight: 44 }]}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                  />
                  <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={10} style={cs.eyeBtn}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textGray} />
                  </Pressable>
                </View>

                {/* Confirm Password */}
                <View style={[cs.inputWrap, confirmFocused && cs.inputWrapFocused, !passwordsMatch && cs.inputWrapError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={confirmFocused ? colors.primaryEnd : colors.textGray}
                    style={cs.inputIcon}
                  />
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.textGray}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={[cs.input, { paddingRight: 44 }]}
                    secureTextEntry={!showConfirm}
                    textContentType="newPassword"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={onCreateAccount}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                  />
                  <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={10} style={cs.eyeBtn}>
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textGray} />
                  </Pressable>
                </View>

                {!passwordsMatch && (
                  <Text style={cs.errorText}>Passwords do not match.</Text>
                )}

                {/* Create button */}
                <Pressable
                  onPress={onCreateAccount}
                  disabled={loading}
                  onPressIn={() => !loading && pressIn()}
                  onPressOut={() => !loading && pressOut()}
                  style={[styles.buttonWrapper, loading && { opacity: 0.7 }]}
                >
                  <Animated.View style={[styles.animatedWrap, { transform: [{ scale: scaleCreate }] }]}>
                    <LinearGradient
                      colors={[colors.primaryStart, colors.primaryEnd]}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryText}>
                        {loading ? "Creating…" : "Create Account"}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                </Pressable>

                <View style={styles.divider} />

                {__DEV__ && (
                  <Pressable onPress={() => router.replace("/(tabs)/home/homepage")} style={{ marginBottom: 14 }}>
                    <Text style={{ textAlign: "center", color: "red", fontWeight: "800" }}>
                      DEV: Skip to Home
                    </Text>
                  </Pressable>
                )}

                <Pressable onPress={() => router.push("/login")}>
                  <Text style={cs.bottomLink}>
                    Already have an account?{" "}
                    <Text style={cs.bottomLinkBold}>Log in</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cs = {
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

  inputWrapFocused: {
    borderColor: colors.primaryEnd,
    shadowColor: colors.primaryEnd,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  inputWrapError: {
    borderColor: "#EF4444",
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

  errorText: {
    width: "100%",
    marginTop: -6,
    marginBottom: 10,
    color: "#EF4444",
    fontSize: 14,
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
