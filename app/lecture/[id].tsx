import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { COLORS, FONTS } from "../../src/core/constants";

// استخراج YouTube ID من الرابط
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function LectureScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const [loading, setLoading] = useState(true);

  const decodedUrl = url ? decodeURIComponent(url) : "";
  const videoId = extractYoutubeId(decodedUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #000;
            height: 100%;
            overflow: hidden;
          }
          iframe {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe
          src="${embedUrl}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;

  const onLoadEnd = useCallback(() => setLoading(false), []);

  if (!videoId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
          <Text style={styles.errorTitle}>رابط الفيديو غير صحيح</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title ? decodeURIComponent(title) : "المحاضرة"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Video */}
      <View style={styles.videoContainer}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : null}
        <WebView
          source={{ html }}
          style={styles.webview}
          onLoadEnd={onLoadEnd}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
        />
      </View>

      {/* Info */}
      <ScrollView contentContainerStyle={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.playIcon}>
            <Ionicons name="play-circle" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>{title ? decodeURIComponent(title) : ""}</Text>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.noteText}>
            لو الفيديو مش شغال، تأكد من اتصالك بالإنترنت وحاول تحديث الشاشة.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: "#FFF",
    flex: 1,
    textAlign: "center",
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
  },
  webview: { flex: 1, backgroundColor: "#000" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    zIndex: 10,
  },
  info: {
    padding: 20,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  playIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.textDark,
    flex: 1,
    textAlign: "right",
    lineHeight: 26,
  },
  noteBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 12,
  },
  noteText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
    textAlign: "right",
    lineHeight: 20,
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  errorTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: "#FFF",
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  backButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: "#FFF",
  },
});