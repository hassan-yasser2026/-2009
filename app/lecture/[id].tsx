import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import { createElement, type CSSProperties } from "react";
import { COLORS, FONTS } from "../../src/core/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../src/services/api";

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
  const { id, url, title } = useLocalSearchParams<{ id: string; url: string; title?: string }>();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const playerRef = useRef<any>(null);

  const decodedUrl = url ? decodeURIComponent(url) : "";
  const videoId = extractYoutubeId(decodedUrl);
  const lectureTitle = title ? decodeURIComponent(title) : "المحاضرة";
  useEffect(() => {
    void AsyncStorage.getItem("lecture_playback_speed").then((value) => {
      if (value) setSpeed(Number(value));
    });
    if (id) {
      void api.get<LectureNote[]>(`/lectures/${id}/notes`).then(({ data }) => setNotes(data));
      void api.get<{ bookmarked: boolean }>(`/lectures/${id}/bookmark`).then(({ data }) => setBookmarked(data.bookmarked));
    }
  }, [id]);
  const changeSpeed = (value: number) => {
    setSpeed(value);
    void AsyncStorage.setItem("lecture_playback_speed", String(value));
  };
  const toggleBookmark = async () => {
    if (!id) return;
    const { data } = await api.post<{ bookmarked: boolean }>(`/lectures/${id}/bookmark`);
    setBookmarked(data.bookmarked);
  };
  const saveNote = async () => {
    if (!id || !noteText.trim()) return;
    const timestamp = noteTimestamp ? Math.round((await playerRef.current?.getCurrentTime?.()) || 0) : null;
    const { data } = await api.post<LectureNote>(`/lectures/${id}/notes`, {
      content: noteText.trim(),
      timestamp,
    });
    setNotes((current) => [data, ...current]);
    setNoteText("");
    setNoteTimestamp(false);
    setNoteModal(false);
  };
  const deleteNote = async (noteId: string) => {
    await api.delete(`/notes/${noteId}`);
    setNotes((current) => current.filter((note) => note.id !== noteId));
  };

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
            ref={playerRef}
            height={250}
            play={playing}
            playbackRate={speed}
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
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => void toggleBookmark()} style={styles.bookmarkButton}>
            <Ionicons name={bookmarked ? "star" : "star-outline"} size={25} color={bookmarked ? COLORS.secondary : COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.toolbarTitle}>سرعة التشغيل</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.speedRow}>
            {[0.5, 1, 1.25, 1.5, 1.75, 2].map((value) => (
              <TouchableOpacity key={value} onPress={() => changeSpeed(value)} style={[styles.speedButton, speed === value && styles.speedButtonActive]}>
                <Text style={[styles.speedText, speed === value && styles.speedTextActive]}>{value}x</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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

        <View style={styles.helpCard}>
          <Text style={styles.cardTitle}>ℹ️ لو الفيديو مش شغال</Text>
          <Text style={styles.helpText}>لو الفيديو مش شغال، جرب الخطوات دي:</Text>
          {["تأكد من اتصالك بالإنترنت", "اضغط على زر مشاهدة على YouTube", "لو الفيديو محظور، استخدم VPN", "اتواصل مع الدعم: 01099536320"].map((item, index) => (
            <Text key={item} style={styles.listItem}>{index + 1}. {item}</Text>
          ))}
          <TouchableOpacity style={styles.largeYoutubeButton} onPress={openInYouTube}>
            <Ionicons name="logo-youtube" size={21} color="#FFF" />
            <Text style={styles.youtubeBtnText}>مشاهدة على YouTube</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.helpCard}>
          <Text style={styles.cardTitle}>💡 نصايح للمذاكرة</Text>
          <Text style={styles.listItem}>• استخدم دفتر الملاحظات عشان تكتب أهم النقاط</Text>
          <Text style={styles.listItem}>• غيّر سرعة الفيديو لو الشرح سريع</Text>
          <Text style={styles.listItem}>• راجع المحاضرة أكتر من مرة لو مش فاهم</Text>
        </View>
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Text style={styles.cardTitle}>📝 ملاحظاتي</Text>
            <TouchableOpacity style={styles.addNoteButton} onPress={() => setNoteModal(true)}>
              <Text style={styles.addNoteText}>+ إضافة ملاحظة</Text>
            </TouchableOpacity>
          </View>
          {notes.length === 0 ? <Text style={styles.emptyNotes}>لسه مفيش ملاحظات على المحاضرة</Text> : notes.map((note) => (
            <View key={note.id} style={styles.noteItem}>
              <Text style={styles.noteContent}>{note.content}</Text>
              <View style={styles.noteMeta}>
                <Text style={styles.noteDate}>{note.timestamp != null ? `${formatTimestamp(note.timestamp)} · ` : ""}{new Date(note.createdAt).toLocaleDateString("ar-EG")}</Text>
                <TouchableOpacity onPress={() => void deleteNote(note.id)}><Ionicons name="trash-outline" size={18} color={COLORS.error} /></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal visible={noteModal} transparent animationType="slide" onRequestClose={() => setNoteModal(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>إضافة ملاحظة</Text>
          <TextInput value={noteText} onChangeText={setNoteText} multiline placeholder="اكتب ملاحظتك هنا..." placeholderTextColor={COLORS.textLight} style={styles.noteInput} />
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setNoteTimestamp((value) => !value)}>
            <Ionicons name={noteTimestamp ? "checkbox" : "square-outline"} size={22} color={COLORS.primary} />
            <Text style={styles.noteOption}>أضف الوقت الحالي للفيديو</Text>
          </TouchableOpacity>
          <View style={styles.modalActions}><TouchableOpacity onPress={() => setNoteModal(false)}><Text style={styles.cancelText}>إلغاء</Text></TouchableOpacity><TouchableOpacity style={styles.saveButton} onPress={() => void saveNote()}><Text style={styles.saveText}>حفظ</Text></TouchableOpacity></View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

interface LectureNote { id: string; content: string; timestamp: number | null; createdAt: string; }
function formatTimestamp(total: number) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
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
  toolbar: { backgroundColor: COLORS.surface, borderRadius: 14, marginBottom: 16, padding: 12 },
  toolbarTitle: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 14, textAlign: "right", marginBottom: 8 },
  bookmarkButton: { alignSelf: "flex-end", padding: 4 },
  speedRow: { flexDirection: "row", gap: 8 },
  speedButton: { borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  speedButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  speedText: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 12 },
  speedTextActive: { color: "#FFF" },
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
  helpCard: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 16 },
  cardTitle: { color: COLORS.textDark, fontFamily: FONTS.bold, fontSize: 15, textAlign: "right", marginBottom: 10 },
  helpText: { color: COLORS.textDark, fontFamily: FONTS.regular, fontSize: 13, textAlign: "right", marginBottom: 6 },
  listItem: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 23, textAlign: "right" },
  largeYoutubeButton: { alignItems: "center", backgroundColor: COLORS.error, borderRadius: 10, flexDirection: "row-reverse", gap: 8, justifyContent: "center", marginTop: 12, padding: 13 },
  notesCard: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 16 },
  notesHeader: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between" },
  addNoteButton: { backgroundColor: "#EFF6FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  addNoteText: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 12 },
  emptyNotes: { color: COLORS.textLight, fontFamily: FONTS.regular, paddingVertical: 12, textAlign: "right" },
  noteItem: { borderTopColor: COLORS.border, borderTopWidth: 1, marginTop: 8, paddingTop: 12 },
  noteContent: { color: COLORS.textDark, fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, textAlign: "right" },
  noteMeta: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 8 },
  noteDate: { color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 11 },
  modalBackdrop: { backgroundColor: "rgba(15,23,42,.55)", flex: 1, justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 },
  modalTitle: { color: COLORS.textDark, fontFamily: FONTS.extraBold, fontSize: 18, marginBottom: 14, textAlign: "right" },
  noteInput: { borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, color: COLORS.textDark, fontFamily: FONTS.regular, minHeight: 120, padding: 12, textAlign: "right", textAlignVertical: "top" },
  checkboxRow: { alignItems: "center", flexDirection: "row-reverse", gap: 8, marginTop: 14 },
  noteOption: { color: COLORS.textDark, fontFamily: FONTS.regular },
  modalActions: { alignItems: "center", flexDirection: "row-reverse", gap: 14, justifyContent: "flex-start", marginTop: 18 },
  cancelText: { color: COLORS.textLight, fontFamily: FONTS.bold, padding: 12 },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  saveText: { color: "#FFF", fontFamily: FONTS.bold },
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