// components/ChatBot.jsx
// Floating AI chat assistant powered by Gemini 3 Flash
// Get a free API key at aistudio.google.com → paste it below

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

// ─── Gemini config ───────────────────────────────────────────────────────────
const GEMINI_KEY = "AIzaSyC0U25_F7mW-AzXEYaarYKl_zYewi-ACDw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are Smashr's AI pickleball assistant — friendly, knowledgeable, and concise.

Smashr is a pickleball app that helps players:
- Find nearby opponents for Singles, Doubles, or Friendly matches (VsV feature uses GPS + OpenStreetMap)
- Discover and register for tournaments via the Global Pickleball Network (GPN)
- Browse training programs and clinics in the Programs tab
- Track their DUPR (Dynamic Universal Pickleball Rating)
- Log match scores that automatically queue for DUPR submission

You can help with:
- Pickleball rules, scoring (rally scoring vs side-out), and strategy
- How to use Smashr's features (VsV, Tournaments, Programs, Bookings, Account)
- Understanding and improving DUPR ratings
- Tournament registration and preparation tips
- Shot techniques, drills, and player improvement
- Court etiquette and pickleball culture

Keep responses short and friendly (2–4 sentences max unless explaining multi-step rules).
Use pickleball terminology naturally. If someone asks about a Smashr feature, explain it accurately.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGeminiBody(history) {
  return JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: history.map((m) => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
  });
}

async function callGemini(history) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: buildGeminiBody(history),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || "Gemini API error";
    throw new Error(msg);
  }
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't understand that.";
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={bubble.typingWrap}>
      <View style={bubble.botAvatarSmall}>
        <Ionicons name="sparkles" size={12} color={colors.primaryEnd} />
      </View>
      <View style={bubble.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[bubble.dot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <View style={bubble.userRow}>
        <LinearGradient colors={[colors.primaryStart, colors.primaryEnd]} style={bubble.userBubble}>
          <Text style={bubble.userText}>{msg.text}</Text>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={bubble.botRow}>
      <View style={bubble.botAvatar}>
        <Ionicons name="sparkles" size={14} color={colors.primaryEnd} />
      </View>
      <View style={bubble.botBubble}>
        <Text style={bubble.botText}>{msg.text}</Text>
      </View>
    </View>
  );
}

const bubble = StyleSheet.create({
  userRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 10, paddingLeft: 48 },
  userBubble: { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "100%" },
  userText: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: "500" },

  botRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10, paddingRight: 48 },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexShrink: 0,
  },
  botAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexShrink: 0,
  },
  botBubble: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  botText: { color: colors.textDark, fontSize: 14, lineHeight: 21 },

  typingWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10, paddingRight: 48 },
  typingBubble: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#9CA3AF" },
});

// ─── Main ChatBot component ───────────────────────────────────────────────────

const GREET = {
  id: "greet",
  role: "bot",
  text: "Hey! I'm Smashr AI 🎾 Ask me anything about pickleball, how to use the app, your DUPR rating, tournaments — whatever you need!",
};

const SLIDE_OUT = Dimensions.get("window").height;

export default function ChatBot({ tabBarHeight = 68 }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREET]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(SLIDE_OUT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setOpen(true);
    slideAnim.setValue(SLIDE_OUT);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 58, friction: 13, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SLIDE_OUT, duration: 300, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const pressFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    open ? closeSheet() : openSheet();
  };

  const scrollBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  useEffect(() => {
    if (open) scrollBottom();
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { id: Date.now().toString(), role: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      if (!GEMINI_KEY) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "bot",
              text: "No Gemini API key set yet. Add your free key from aistudio.google.com into components/ChatBot.jsx to activate me!",
            },
          ]);
          setLoading(false);
        }, 600);
        return;
      }

      const history = nextMessages.filter((m) => m.id !== "greet");
      const reply = await callGemini(history);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bot", text: reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bot", text: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fabBottom = tabBarHeight + (insets.bottom > 0 ? 0 : 12) + 12;

  return (
    <>
      {/* ── Floating Action Button ── */}
      <Animated.View
        style={[
          styles.fab,
          {
            bottom: fabBottom,
            transform: [{ scale: fabScale }],
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity onPress={pressFab} activeOpacity={0.9}>
          <LinearGradient
            colors={open ? ["#374151", "#1F2937"] : [colors.primaryStart, colors.primaryEnd]}
            style={styles.fabGradient}
          >
            <Ionicons
              name={open ? "close" : "sparkles"}
              size={22}
              color={colors.white}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Chat Sheet Modal ── */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
        statusBarTranslucent
      >
        {/* Fading backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} pointerEvents="auto">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.sheetWrapper}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            {/* ── Header ── */}
            <LinearGradient
              colors={[colors.primaryStart, colors.primaryEnd]}
              style={styles.sheetHeader}
            >
              <View style={styles.sheetHeaderLeft}>
                <View style={styles.headerIconWrap}>
                  <Ionicons name="sparkles" size={16} color={colors.primaryEnd} />
                </View>
                <View>
                  <Text style={styles.sheetTitle}>Smashr AI</Text>
                  <Text style={styles.sheetSubtitle}>Pickleball assistant</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeSheet} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="chevron-down" size={22} color={colors.white} />
              </TouchableOpacity>
            </LinearGradient>

            {/* ── Messages ── */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => <MessageBubble msg={item} />}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollBottom}
              ListFooterComponent={loading ? <TypingDots /> : null}
            />

            {/* ── Input bar ── */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about pickleball…"
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                onSubmitEditing={send}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                onPress={send}
                disabled={!input.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="arrow-up" size={18} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── FAB ──
  fab: {
    position: "absolute",
    right: 16,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 10,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Modal overlay ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  sheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  // ── Sheet ──
  sheet: {
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Dimensions.get("window").height * 0.88,
    overflow: "hidden",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: colors.white },
  sheetSubtitle: { fontSize: 11, color: "rgba(255,255,255,0.72)", fontWeight: "500", marginTop: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Messages ──
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    flexGrow: 1,
  },

  // ── Input ──
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: "#F3F4F6",
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textDark,
    fontWeight: "500",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryEnd,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: "#D1D5DB" },
});
