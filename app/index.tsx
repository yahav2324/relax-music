import Slider from "@react-native-community/slider";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  Switch,
  Image,
} from "react-native";
import {
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

// ה-IDs המעודכנים מהצילום מסך שלך
const REWARDED_ID = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-3949660461162879/5954664365"; // מעודכן ל-Rewarded_Unlock_Sound

const BANNER_ID = __DEV__
  ? TestIds.BANNER
  : "ca-app-pub-3949660461162879/6520672972"; // מעודכן ל-Banner_Main_Screen

const rewarded = RewardedAd.createForAdRequest(REWARDED_ID, {
  requestNonPersonalizedAdsOnly: true,
});

const FREE_LIMIT_PER_DAY = 5;

const SOUNDS_DATA = [
  {
    id: "rain",
    label: "Rain",
    file: require("../assets/rain.mp3"),
    icon: require("../assets/images/rain.png"),
    glow: "#4CAF50",
  },
  {
    id: "waves",
    label: "Ocean",
    file: require("../assets/waves.mp3"),
    icon: require("../assets/images/waves.png"),
    glow: "#2196F3",
  },
  {
    id: "fire",
    label: "Fire",
    file: require("../assets/fire.mp3"),
    icon: require("../assets/images/fire.png"),
    glow: "#F44336",
  },
  {
    id: "white_noise",
    label: "White Noise",
    file: require("../assets/white_noise.mp3"),
    icon: require("../assets/images/white_noise.png"),
    glow: "#E0E0E0",
  },
  {
    id: "thunder",
    label: "Thunder",
    file: require("../assets/thunder.mp3"),
    icon: require("../assets/images/thunder.png"),
    glow: "#FFEB3B",
  },
  {
    id: "forest",
    label: "Forest",
    file: require("../assets/forest.mp3"),
    icon: require("../assets/images/forest.png"),
    glow: "#00E676",
  },
  {
    id: "birds",
    label: "Birds",
    file: require("../assets/birds.mp3"),
    icon: require("../assets/images/birds.png"),
    glow: "#2196F3",
  },
  {
    id: "desert",
    label: "Desert",
    file: require("../assets/desert.mp3"),
    icon: require("../assets/images/desert.png"),
    glow: "#F44336",
  },
  {
    id: "wind",
    label: "Wind",
    file: require("../assets/wind.mp3"),
    icon: require("../assets/images/wind.png"),
    glow: "#E0E0E0",
  },
  {
    id: "train",
    label: "Train",
    file: require("../assets/train.mp3"),
    icon: require("../assets/images/train.png"),
    glow: "#FFEB3B",
  },
  {
    id: "airplane",
    label: "Airplane",
    file: require("../assets/airplane.mp3"),
    icon: require("../assets/images/airplane.png"),
    glow: "#4CAF50",
  },
  {
    id: "city",
    label: "City",
    file: require("../assets/city.mp3"),
    icon: require("../assets/images/city.png"),
    glow: "#2196F3",
  },
  {
    id: "piano",
    label: "Piano",
    file: require("../assets/piano.mp3"),
    icon: require("../assets/images/piano.png"),
    glow: "#F44336",
  },
  {
    id: "meditation",
    label: "Meditation",
    file: require("../assets/meditation.mp3"),
    icon: require("../assets/images/meditation.png"),
    glow: "#E0E0E0",
  },
];

export default function HomeScreen() {
  const [activeSounds, setActiveSounds] = useState<Record<string, Audio.Sound>>(
    {},
  );
  const [loadingSounds, setLoadingSounds] = useState<Record<string, boolean>>(
    {},
  );
  const [dailyUsageCount, setDailyUsageCount] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pendingSoundRef = useRef<string | null>(null);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: false,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const toggleSound = useCallback(async (soundId: string, file: any) => {
    setActiveSounds((currentActive) => {
      const existingSound = currentActive[soundId];
      if (existingSound) {
        existingSound.stopAsync().then(() => existingSound.unloadAsync());
        const newState = { ...currentActive };
        delete newState[soundId];
        return newState;
      }

      setLoadingSounds((prev) => ({ ...prev, [soundId]: true }));
      Audio.Sound.createAsync(file, {
        shouldPlay: true,
        isLooping: true,
        volume: 0.7,
      })
        .then(({ sound }) => {
          setActiveSounds((prev) => ({ ...prev, [soundId]: sound }));
        })
        .finally(() => {
          setLoadingSounds((prev) => {
            const newState = { ...prev };
            delete newState[soundId];
            return newState;
          });
        });

      return currentActive;
    });
  }, []);

  const unlockAndPlay = useCallback(
    (soundId: string) => {
      const item = SOUNDS_DATA.find((s) => s.id === soundId);
      if (item) toggleSound(item.id, item.file);
      pendingSoundRef.current = null;
    },
    [toggleSound],
  );

  useEffect(() => {
    const init = async () => {
      await setupAudio();
      const savedMode = await AsyncStorage.getItem("darkMode");
      if (savedMode !== null) setIsDarkMode(JSON.parse(savedMode));
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem("lastUsageDate");
      const count = await AsyncStorage.getItem("usageCount");
      if (lastDate !== today) {
        await AsyncStorage.multiSet([
          ["lastUsageDate", today],
          ["usageCount", "0"],
        ]);
        setDailyUsageCount(0);
      } else {
        setDailyUsageCount(Number(count) || 0);
      }
    };
    init();

    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setAdLoaded(true);
        if (isAdLoading)
          rewarded.show().catch(() => {
            setIsAdLoading(false);
            rewarded.load();
          });
      },
    );

    // הוספת מאזין לשגיאות - חשוב מאוד למקרה שאין מלאי מודעות!
    const unsubError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log("Ad Error: ", error);
        setAdLoaded(false);
        setIsAdLoading(false);
        // אם יש שגיאה בטעינה, נטעין מחדש בשקט
        rewarded.load();
      },
    );

    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setDailyUsageCount((prev) => {
          const nc = Math.max(0, prev - 5);
          AsyncStorage.setItem("usageCount", nc.toString());
          return nc;
        });
        if (pendingSoundRef.current) unlockAndPlay(pendingSoundRef.current);
      },
    );

    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      setIsAdLoading(false);
      rewarded.load();
      Object.values(activeSounds).forEach((s) => s.playAsync().catch(() => {}));
    });

    rewarded.load();
    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
    };
  }, [isAdLoading, unlockAndPlay, activeSounds]);

  const handlePress = async (item: any) => {
    if (loadingSounds[item.id]) return;
    if (activeSounds[item.id] || dailyUsageCount < FREE_LIMIT_PER_DAY) {
      if (!activeSounds[item.id]) {
        const nc = dailyUsageCount + 1;
        setDailyUsageCount(nc);
        AsyncStorage.setItem("usageCount", nc.toString());
      }
      toggleSound(item.id, item.file);
    } else {
      Alert.alert(
        "Limit Reached",
        "Watch a short ad to unlock 5 more free uses!",
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Watch Ad",
            onPress: () => {
              pendingSoundRef.current = item.id;
              setIsAdLoading(true);
              if (adLoaded) {
                rewarded.show().catch(() => {
                  setIsAdLoading(false);
                  rewarded.load();
                });
              } else {
                rewarded.load();
                // אם אחרי 5 שניות עדיין לא נטען, נשחרר את ה-Modal
                setTimeout(() => setIsAdLoading(false), 5000);
              }
            },
          },
        ],
      );
    }
  };

  const updateVolume = async (soundId: string, volume: number) => {
    const sound = activeSounds[soundId];
    if (sound) await sound.setVolumeAsync(volume);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDarkMode
            ? ["#0f172a", "#020617", "#1e1b4b"]
            : ["#f8fafc", "#cbd5e1"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BlurView
        tint={isDarkMode ? "dark" : "light"}
        intensity={isDarkMode ? 15 : 10}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text
            style={[styles.header, { color: isDarkMode ? "#fff" : "#000" }]}
          >
            Relax & Focus
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={async (v) => {
              setIsDarkMode(v);
              await AsyncStorage.setItem("darkMode", JSON.stringify(v));
            }}
            trackColor={{ false: "#767577", true: "#00E676" }}
          />
        </View>

        <View
          style={[
            styles.badge,
            {
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.1)",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isDarkMode ? "#cbd5e1" : "#475569" },
            ]}
          >
            {dailyUsageCount}/{FREE_LIMIT_PER_DAY} Free Uses Today
          </Text>
        </View>

        <View style={styles.grid}>
          {SOUNDS_DATA.map((item) => {
            const isActive = !!activeSounds[item.id];
            const isLoading = !!loadingSounds[item.id];
            return (
              <View key={item.id} style={styles.cardContainer}>
                <TouchableOpacity
                  activeOpacity={isLoading ? 1 : 0.8}
                  style={[
                    styles.card,
                    {
                      borderColor: isDarkMode
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                    },
                    isActive && {
                      borderColor: item.glow,
                      backgroundColor: `${item.glow}25`,
                      shadowColor: item.glow,
                      elevation: 15,
                      shadowOpacity: 0.7,
                      shadowRadius: 20,
                    },
                  ]}
                  onPress={() => handlePress(item)}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#00E676" />
                  ) : (
                    <Image source={item.icon} style={styles.icon} />
                  )}
                  <Text
                    style={[
                      styles.label,
                      { color: isDarkMode ? "#fff" : "#1e293b" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
                {isActive && (
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={0.7}
                    onSlidingComplete={(val) => updateVolume(item.id, val)}
                    minimumTrackTintColor={item.glow}
                    maximumTrackTintColor={
                      isDarkMode
                        ? "rgba(255, 255, 255, 0.3)"
                        : "rgba(0, 0, 0, 0.1)"
                    }
                    thumbTintColor="#ffffff"
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={isAdLoading && !adLoaded}
        animationType="fade"
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#00E676" />
            <Text style={styles.loaderText}>Preparing Ad...</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.adContainer}>
        <BannerAd
          unitId={BANNER_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scrollContent: { padding: 15, paddingTop: 60, paddingBottom: 110 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  header: { fontSize: 34, fontWeight: "900", letterSpacing: -1.5 },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 35,
    borderWidth: 1,
    alignSelf: "center",
  },
  badgeText: { fontSize: 13, fontWeight: "800" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardContainer: { width: "31%", marginBottom: 25, alignItems: "center" },
  card: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  icon: { width: "65%", height: "65%", marginBottom: 8, borderRadius: 14 },
  label: { fontSize: 11, fontWeight: "800", textAlign: "center" },
  slider: { width: "100%", height: 40, marginTop: 8 },
  adContainer: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    alignItems: "center",
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    backgroundColor: "#111",
    padding: 35,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  loaderText: { color: "#fff", marginTop: 20, fontWeight: "700", fontSize: 16 },
});
