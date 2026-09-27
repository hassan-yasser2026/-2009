import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import { createElement, type CSSProperties } from "react";
import { COLORS, FONTS } from "../../src/core/constants";

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export default function LectureScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const decodedUrl = url ? decodeURIComponent(url) : "";
  const videoId = extractYoutubeId(decodedUrl);
  const lectureTitle = title ? decodeURIComponent(title) : "المحاضرة";

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") setPlaying(false);
    if (state === "playing") {
      setLoading(false);
      setError(false);
    }
    if (state === "buffering") setLoading(true);
  }, []);

  const onError = useCallback((playerError: string) => {
    console.error("YouTube player error:", playerError);
    setError(true);
    setLoading(false);
  }, []);

  const openInYouTube = () => {
    if (decodedUrl) {
      void Linking.openURL(decodedUrl);
    }
  };

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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {lectureTitle}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Video */}
      <View style={styles.videoContainer}>
        {loading && !error ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>جارٍ التحميل...</Text>
          </View>
        ) : null}
        {Platform.OS === "web" ? (
          createElement("iframe", {
            src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
            title: lectureTitle,
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowFullScreen: true,
            onLoad: () => setLoading(false),
            style: {
              width: "100%",
              height: "100%",
              border: 0,
              position: "absolute",
              inset: 0,
            } satisfies CSSProperties,
          })
        ) : error ? (
          <View style={styles.errorOverlay}>
            <Ionicons name="warning-outline" size={60} color={COLORS.secondary} />
            <Text style={styles.errorOverlayText}>
              الفيديو مش متاح للتشغيل داخل التطبيق
            </Text>
            <TouchableOpacity style={styles.youtubeBtn} onPress={openInYouTube}>
              <Ionicons name="logo-youtube" size={20} color="#FFF" />
              <Text style={styles.youtubeBtnText}>مشاهدة على YouTube</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <YoutubePlayer
            height={250}
            play={playing}
            videoId={videoId}
            onChangeState={onStateChange}
            onError={onError}
            initialPlayerParams={{
              preventFullScreen: false,
              controls: true,
              rel: false,
              modestbranding: true,
              cc_lang_pref: "ar",
            }}
            webViewProps={{
              androidLayerType: "hardware",
              allowsFullscreenVideo: true,
              userAgent:
                "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            }}
          />
        )}
      </View>

      {/* Info */}
      <ScrollView contentContainerStyle={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.playIcon}>
            <Ionicons name="play-circle" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>{lectureTitle}</Text>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.noteText}>
            لو الفيديو مش شغال، تأكد من اتصالك بالإنترنت. في حالة استمرار المشكلة،
            استخدم زر "مشاهدة على YouTube".
          </Text>
        </View>

        <TouchableOpacity style={styles.openYouTubeBtn} onPress={openInYouTube}>
          <Ionicons name="logo-youtube" size={20} color={COLORS.error} />
          <Text style={styles.openYouTubeText}>مشاهدة على YouTube</Text>
        </TouchableOpacity>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 10,
  },
  loadingText: {
    color: "#FFF",
    marginTop: 12,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    padding: 20,
  },
  errorOverlayText: {
    color: "#FFF",
    marginTop: 16,
    marginBottom: 20,
    fontFamily: FONTS.bold,
    fontSize: 15,
    textAlign: "center",
  },
  youtubeBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF0000",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  youtubeBtnText: {
    color: "#FFF",
    fontFamily: FONTS.bold,
    fontSize: 14,
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
  openYouTubeBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 12,
  },
  openYouTubeText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.error,
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