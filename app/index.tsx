import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";
import {
  useAudioPlayer,
  useCryDetection,
  useFiltered,
  useWeather,
} from "../hooks";

const REMOTE_ASSETS_BASE = process.env.EXPO_PUBLIC_REMOTE_ASSETS_BASE;
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const WEATHER_URL = process.env.EXPO_PUBLIC_WEATHER_URL;
const CONTACT_EMAIL = process.env.EXPO_PUBLIC_CONTACT_EMAIL;
const APP_PACKAGE_NAME = process.env.EXPO_PUBLIC_APP_PACKAGE_NAME;

const VIDEO_FOLDER = `${REMOTE_ASSETS_BASE}/video/`;
const SOUND_CONFIG_JSON = `${VIDEO_FOLDER}sounds.json`;
const COUPONS_CONFIG_JSON = `${REMOTE_ASSETS_BASE}/coupons.json`;

const rewarded = RewardedAd.createForAdRequest(
  process.env.EXPO_PUBLIC_REWARDED_ID,
  {
    requestNonPersonalizedAdsOnly: true,
  },
);

export default function HomeScreen() {
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [adLoaded, setAdLoaded] = useState(false);

  const [freeLimit, setFreeLimit] = useState(5);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyUsageCount, setDailyUsageCount] = useState(0);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponInput, setCouponInput] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isBlackMode, setIsBlackMode] = useState(false);
  const textColor = isDarkMode ? "#ffffff" : "#1e293b";
  const subTextColor = isDarkMode ? "#94a3b8" : "#475569";

  const cloudAnimation = useRef(new Animated.Value(-100)).current;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const {
    soundsJson,
    pendingSoundRef,
    showTimerPicker,
    downloadSound,
    downloadedIds,
    activeSounds,
    stopAllSounds,
    timerSeconds,
    toggleSound,
    unlockedIds,
    setActiveSounds,
    setSoundsJson,
    setDownloadedIds,
    setUnlockedIds,
    setTimerSeconds,
    downloadingIds,
    setShowTimerPicker,
    playSoundDirect,
  } = useAudioPlayer({
    videoFolder: VIDEO_FOLDER,
  });

  const { isWeatherSyncing, syncWeather, weatherColors } = useWeather({
    apiKey: WEATHER_API_KEY,
    dailyUsageCount,
    downloadedIds,
    downloadSound,
    freeLimit,
    isDarkMode,
    playSoundDirect,
    setActiveSounds,
    setDailyUsageCount,
    soundsData: soundsJson,
    stopAllSounds,
    unlockedIds,
    url: WEATHER_URL,
  });

  const {
    categories,
    filtered,
    setSearchQuery,
    setSelectedCategory,
    searchQuery,
    selectedCategory,
  } = useFiltered({ soundsJson: soundsJson });

  const checkCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await fetch(`${COUPONS_CONFIG_JSON}?t=${Date.now()}`);
      const data = await res.json();
      const coupon = data.find(
        (c: any) => c.code === couponInput.trim().toUpperCase(),
      );
      if (coupon) {
        if (coupon.type === "FREE_FOREVER") {
          setIsPremium(true);
          await AsyncStorage.setItem("is_premium", "true");
          await AsyncStorage.setItem("active_coupon_code", coupon.code);
          Alert.alert("Success!", "VIP Unlocked.");
        } else if (coupon.type === "EXTRA_SONGS") {
          setFreeLimit(coupon.amount);
          Alert.alert("Success!", `Limit increased to ${coupon.amount}`);
        }
        setCouponInput("");
        setShowCouponModal(false);
      } else {
        Alert.alert("Error", "Invalid coupon code.");
      }
    } catch {
      Alert.alert("Error", "Could not verify coupon.");
    }
  };

  const handlePress = async (item: any) => {
    const isDownloaded = downloadedIds.includes(item.id);
    const isUnlocked = unlockedIds.includes(item.id) || isPremium;
    if (isDownloaded || isUnlocked) {
      const uri = isDownloaded
        ? true
        : await downloadSound(item.id, item.fileName);
      if (uri) toggleSound(item.id, item.fileName);
      return;
    }
    if (dailyUsageCount < freeLimit) {
      const nextCount = dailyUsageCount + 1;
      setDailyUsageCount(nextCount);
      await AsyncStorage.setItem("usageCount", nextCount.toString());
      const uri = await downloadSound(item.id, item.fileName);
      if (uri) toggleSound(item.id, item.fileName);
    } else {
      Alert.alert("Unlock Sound", "Watch an ad to unlock this sound forever!", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Watch Now",
          onPress: () => {
            pendingSoundRef.current = item.id;
            if (adLoaded) rewarded.show();
            else rewarded.load();
          },
        },
      ]);
    }
  };

  const { isCryDetectionActive, toggleCryDetection, micAnimation } =
    useCryDetection({
      activeSounds,
      handlePress,
      soundsJson,
      stopAllSounds,
      isBlackMode,
    });

  useEffect(() => {
    Animated.loop(
      Animated.timing(cloudAnimation, {
        toValue: 450,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [cloudAnimation]);

  useEffect(() => {
    const init = async () => {
      const storedExpiry = await AsyncStorage.getItem("premium_expiry");
      const storedIsPremium = await AsyncStorage.getItem("is_premium");
      const activeCoupon = await AsyncStorage.getItem("active_coupon_code");
      if (storedIsPremium === "true") setIsPremium(true);
      if (storedExpiry && Date.now() < Number(storedExpiry)) setIsPremium(true);

      try {
        const res = await fetch(`${SOUND_CONFIG_JSON}?t=${Date.now()}`);
        const data = await res.json();
        setSoundsJson(data);
        if (activeCoupon) {
          const couponRes = await fetch(
            `${COUPONS_CONFIG_JSON}?t=${Date.now()}`,
          );
          const coupons = await couponRes.json();
          const validCoupon = coupons.find((c: any) => c.code === activeCoupon);
          if (!validCoupon) {
            setIsPremium(false);
            setFreeLimit(5);
            await AsyncStorage.removeItem("is_premium");
            await AsyncStorage.removeItem("active_coupon_code");
          }
        }
      } catch (error: unknown) {
        const cached = await AsyncStorage.getItem("cached_sounds_config");
        if (cached) setSoundsJson(JSON.parse(cached));
      } finally {
        setIsLoadingData(false);
      }

      const downloads = await AsyncStorage.getItem("downloaded_songs");
      if (downloads) setDownloadedIds(JSON.parse(downloads));
      const unlocked = await AsyncStorage.getItem("unlocked_songs");
      if (unlocked) setUnlockedIds(JSON.parse(unlocked));
      const count = await AsyncStorage.getItem("usageCount");
      setDailyUsageCount(Number(count) || 0);
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });
    };
    init();

    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setAdLoaded(true),
    );
    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        if (pendingSoundRef.current) {
          const soundId = pendingSoundRef.current;
          setUnlockedIds((prev) => {
            const newList = [...prev, soundId];
            AsyncStorage.setItem("unlocked_songs", JSON.stringify(newList));
            return newList;
          });
          const item = soundsJson.find((s) => s.id === soundId);
          if (item) {
            await downloadSound(item.id, item.fileName);
            toggleSound(item.id, item.fileName);
          }
          pendingSoundRef.current = null;
        }
      },
    );
    rewarded.load();
    return () => {
      unsubLoaded();
      unsubEarned();
    };
  }, [
    soundsJson,
    downloadSound,
    toggleSound,
    setDownloadedIds,
    setUnlockedIds,
    setSoundsJson,
    pendingSoundRef,
  ]);

  if (isLoadingData)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );

  if (isBlackMode)
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setIsBlackMode(false)}
        style={styles.blackScreen}
      >
        <StatusBar hidden />
        <Text style={styles.blackScreenText}>tap to return</Text>{" "}
      </TouchableOpacity>
    );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ["#0f172a", "#020617", "#1e1b4b"] : weatherColors}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          <Text style={[styles.header, { color: textColor }]}>Relax Songs</Text>
          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => stopAllSounds()}
              style={styles.miniActionBtn}
              disabled={Object.keys(activeSounds).length === 0}
            >
              <Ionicons
                name="stop"
                size={18}
                color="#ff2200"
                style={
                  Object.keys(activeSounds).length === 0 && { opacity: 0.3 }
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCouponModal(true)}
              style={styles.miniActionBtn}
            >
              <Ionicons name="gift-outline" size={18} color="#FFD700" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsBlackMode(true)}
              style={styles.miniActionBtn}
            >
              <Ionicons name="moon-outline" size={18} color={textColor} />
            </TouchableOpacity>

            <Animated.View style={{ opacity: micAnimation }}>
              <TouchableOpacity
                onPress={toggleCryDetection}
                style={[
                  styles.miniActionBtn,
                  isCryDetectionActive && { backgroundColor: "#ff5252" },
                ]}
              >
                <Ionicons
                  name="mic-outline"
                  size={18}
                  color={isCryDetectionActive ? "#fff" : "#00E676"}
                />
              </TouchableOpacity>
            </Animated.View>

            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: "#767577", true: "#00E676" }}
              style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
            />
          </View>
        </View>

        <TextInput
          style={[
            styles.searchBar,
            {
              color: textColor,
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
            },
          ]}
          placeholder="Search sounds..."
          placeholderTextColor={subTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.toolsRow}>
          <TouchableOpacity
            style={[styles.toolButton, isWeatherSyncing && styles.activeTool]}
            onPress={syncWeather}
            disabled={isWeatherSyncing}
          >
            {isWeatherSyncing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="cloudy-night-outline" size={15} color="#00E676" />
            )}
            <Text
              style={[
                styles.toolText,
                { color: isWeatherSyncing ? "#000" : textColor },
              ]}
            >
              {isWeatherSyncing ? "Syncing..." : "Smart Sync"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolButton,
              timerSeconds !== null ? styles.activeTimer : null,
            ]}
            onPress={() => setShowTimerPicker(true)}
          >
            <Ionicons
              name="timer-outline"
              size={15}
              color={timerSeconds ? "#000" : "#00E676"}
            />
            <Text
              style={[
                styles.toolText,
                { color: timerSeconds ? "#000" : textColor },
              ]}
            >
              {timerSeconds ? formatTime(timerSeconds) : "Timer"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.catTab,
                selectedCategory === category ? styles.activeCat : null,
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  {
                    color:
                      selectedCategory === category ? "#000" : subTextColor,
                  },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {filtered.map((item) => {
            const isActive = !!activeSounds[item.id];
            return (
              <View key={item.id} style={styles.cardContainer}>
                <TouchableOpacity
                  style={[
                    styles.card,
                    isActive && {
                      borderColor: item.glow,
                      backgroundColor: `${item.glow}20`,
                    },
                  ]}
                  onPress={() => handlePress(item)}
                >
                  {downloadingIds[item.id] ? (
                    <ActivityIndicator size="small" color="#00E676" />
                  ) : (
                    <Image
                      source={{ uri: item.iconUrl }}
                      style={styles.icon}
                      contentFit="contain"
                    />
                  )}
                  <Text
                    style={[styles.label, { color: textColor }]}
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
                    onSlidingComplete={(v) =>
                      activeSounds[item.id]?.setVolumeAsync(v)
                    }
                    minimumTrackTintColor={item.glow}
                  />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(`market://details?id=${APP_PACKAGE_NAME}`)
            }
            style={styles.footerBtn}
          >
            <Ionicons name="star-outline" size={16} color={subTextColor} />
            <Text style={[styles.footerText, { color: subTextColor }]}>
              Rate App{" "}
            </Text>
          </TouchableOpacity>
          <View style={styles.footerSeparator} />
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            style={styles.footerBtn}
          >
            <Ionicons name="mail-outline" size={16} color={subTextColor} />
            <Text style={[styles.footerText, { color: subTextColor }]}>
              Support{" "}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showCouponModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCouponModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCouponModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Enter Coupon Code</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="coupon..."
              placeholderTextColor="#666"
              autoCapitalize="characters"
              value={couponInput}
              onChangeText={setCouponInput}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={checkCoupon}>
              <Text style={styles.modalBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showTimerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimerPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimerPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Turn off in:</Text>
            {[15, 30, 45, 60, 90].map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.modalOption}
                onPress={() => {
                  setTimerSeconds(m * 60);
                  setShowTimerPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{m} mins</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => {
                setTimerSeconds(null);
                setShowTimerPicker(false);
              }}
            >
              <Text style={{ color: "#ff5252", fontWeight: "bold" }}>
                Cancel Timer
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.adContainer}>
        <BannerAd
          unitId={process.env.EXPO_PUBLIC_BANNER_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  headerArea: { paddingTop: 45, paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  header: { fontSize: 22, fontWeight: "900" },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  miniActionBtn: {
    padding: 7,
    marginLeft: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  searchBar: {
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  toolButton: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  activeTool: { backgroundColor: "#00E676" },
  activeTimer: { backgroundColor: "#FFEB3B" },
  toolText: { marginLeft: 5, fontWeight: "700", fontSize: 10 },
  catScroll: { marginVertical: 5 },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: 6,
  },
  activeCat: { backgroundColor: "#00E676" },
  catText: { fontWeight: "700", fontSize: 10 },
  scrollContent: { padding: 15, paddingBottom: 110 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cardContainer: { width: "31%", marginHorizontal: "1%", marginBottom: 12 },
  card: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  icon: { width: "45%", height: "45%", marginBottom: 4 },
  label: { fontSize: 9, fontWeight: "800" },
  slider: { width: "100%", height: 30 },
  adContainer: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    alignItems: "center",
  },
  blackScreen: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  blackScreenText: { color: "#111", fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1e1b4b",
    width: "80%",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    width: "100%",
    height: 45,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#fff",
    paddingHorizontal: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: "#00E676",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalBtnText: { color: "#000", fontWeight: "bold" },
  modalOption: {
    padding: 15,
    width: "100%",
    borderBottomWidth: 0.5,
    borderColor: "#333",
  },
  modalOptionText: { color: "#fff", textAlign: "center", fontSize: 16 },
  modalClose: { marginTop: 15 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
    opacity: 0.6,
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  footerText: { fontSize: 13, fontWeight: "600" },
  footerSeparator: {
    width: 1,
    height: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 15,
  },
});
