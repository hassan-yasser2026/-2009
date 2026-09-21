import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP, COLORS, FONTS } from "../../src/core/constants";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = width * 0.42;

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ]).start(() => animateDots());
    };
    animateDots();

    const timer = setTimeout(() => {
      router.replace("/register/step1");
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryLight, "#3B82F6"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.photoWrapper,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.photoBorder}>
              <Image
                source={require("../../assets/images/instructor.png")}
                style={styles.photo}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.textWrapper,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.platformName}>{APP.name}</Text>
            <View style={styles.divider} />
            <Text style={styles.slogan}>{APP.slogan}</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.dotsRow, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </Animated.View>

        <Text style={styles.version}>الإصدار 1.0.0</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  photoWrapper: { marginBottom: 36 },
  photoBorder: {
    width: PHOTO_SIZE + 12,
    height: PHOTO_SIZE + 12,
    borderRadius: (PHOTO_SIZE + 12) / 2,
    borderWidth: 5,
    borderColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  textWrapper: { alignItems: "center" },
  platformName: {
    fontFamily: FONTS.extraBold,
    fontSize: 26,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 40,
  },
  divider: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
    marginVertical: 16,
  },
  slogan: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: 100,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 6,
  },
  version: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    position: "absolute",
    bottom: 30,
  },
});