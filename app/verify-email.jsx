import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendEmailVerification, signOut, reload } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { colors } from "../constants/colors";
import styles from "./styles";

export default function VerifyEmail() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  const email = auth.currentUser?.email ?? "";

  const checkVerified = async () => {
    try {
      setChecking(true);
      await reload(auth.currentUser);
      if (auth.currentUser?.emailVerified) {
        router.replace("/(tabs)/home/homepage");
      } else {
        Alert.alert("Not verified yet", "We haven't received your verification yet. Check your inbox and click the link, then try again.");
      }
    } catch (err) {
      Alert.alert("Error", err?.message || "Could not check verification status.");
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    try {
      setResending(true);
      await sendEmailVerification(auth.currentUser);
      Alert.alert("Email sent", `A new verification link was sent to ${email}.`);
    } catch (err) {
      Alert.alert("Error", err?.message || "Could not resend email.");
    } finally {
      setResending(false);
    }
  };

  const backToLogin = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={vs.iconWrap}>
            <Ionicons name="mail-outline" size={44} color={colors.primaryEnd} />
          </View>

          <Text style={styles.title}>Check your email</Text>
          <Text style={vs.subtitle}>
            A verification link was sent to{"\n"}
            <Text style={vs.email}>{email}</Text>
          </Text>
          <Text style={vs.hint}>
            Open the email and tap the link, then come back and press the button below.
          </Text>

          <Pressable
            onPress={checkVerified}
            disabled={checking}
            style={[styles.buttonWrapper, checking && { opacity: 0.7 }]}
          >
            <LinearGradient
              colors={[colors.primaryStart, colors.primaryEnd]}
              style={styles.primaryButton}
            >
              {checking
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryText}>I've verified my email</Text>
              }
            </LinearGradient>
          </Pressable>

          <Pressable onPress={resend} disabled={resending} style={vs.secondaryBtn}>
            {resending
              ? <ActivityIndicator color={colors.primaryEnd} />
              : <Text style={vs.secondaryText}>Resend verification email</Text>
            }
          </Pressable>

          <View style={styles.divider} />

          <Pressable onPress={backToLogin}>
            <Text style={vs.backLink}>Back to Log In</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const vs = StyleSheet.create({
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  email: {
    color: colors.primaryEnd,
    fontWeight: "800",
  },
  hint: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  secondaryBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 15,
    color: colors.primaryEnd,
    fontWeight: "700",
  },
  backLink: {
    fontSize: 15,
    color: colors.textGray,
    fontWeight: "600",
    textAlign: "center",
  },
});
