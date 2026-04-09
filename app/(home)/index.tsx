import { COLORS } from "@/common/constant/theme";
import { HeaderArea } from "@/components/header/headerArea/headerArea";
import { useAudioPlayer, useFiltered, useWeather } from "@/hooks";
import { useAnimation } from "@/hooks/useAnimation";
import { useColors } from "@/hooks/useColors";
import { useUserCredits } from "@/hooks/useUserCredits";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
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
import { createStyles } from "./index.styles";

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

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
  const styles = createStyles();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [adLoaded, setAdLoaded] = useState(false);

  const userCreditsData = useUserCredits();
  const {
    couponInput,
    dailyUsageCount,
    freeLimit,
    isPremium,
    setCouponInput,
    setDailyUsageCount,
    setFreeLimit,
    setIsPremium,
    setShowCouponModal,
    showCouponModal,
  } = userCreditsData;

  const colorsData = useColors();
  const { isBlackMode, isDarkMode, setIsBlackMode, subTextColor, textColor } =
    colorsData;

  const AudioPlayerData = useAudioPlayer({
    videoFolder: VIDEO_FOLDER,
  });

  const {
    soundsJson,
    pendingSoundRef,
    showTimerPicker,
    downloadSound,
    downloadedIds,
    activeSounds,
    stopAllSounds,
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
  } = AudioPlayerData;

  const weatherData = useWeather({
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

  const shouldShowMovingCloud =
    !isDarkMode && !!weatherData.weatherColors?.length;
  const { cloudAnimation, micAnimation } = useAnimation(shouldShowMovingCloud);

  const filteredData = useFiltered({ soundsJson: soundsJson });
  const { filtered } = filteredData;

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
    setIsPremium,
    setDailyUsageCount,
    setFreeLimit,
  ]);

  if (isLoadingData)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDarkMode
            ? COLORS.background.gradientDark
            : weatherData.weatherColors?.length > 0
              ? weatherData.weatherColors
              : ["#4facfe", "#00f2fe"]
        }
        style={StyleSheet.absoluteFill}
      />

      {shouldShowMovingCloud && (
        <AnimatedIonicons
          name="cloud"
          size={120}
          color="#ffffff"
          style={{
            position: "absolute",
            top: 100,
            opacity: 0.2,
            transform: [{ translateX: cloudAnimation }],
          }}
        />
      )}

      <HeaderArea
        filter={filteredData}
        weather={weatherData}
        audioPlayer={AudioPlayerData}
        colors={colorsData}
        handlePress={handlePress}
        userCredits={userCreditsData}
        micAnimation={micAnimation}
      />

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
                  {!downloadedIds.includes(item.id) && (
                    <View
                      style={{
                        position: "absolute",
                        left: -4,
                        bottom: -4,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        borderRadius: 10,
                        padding: 2,
                      }}
                    >
                      <Ionicons
                        name="cloud-download-outline"
                        size={14}
                        color="white"
                      />
                    </View>
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
              Rate App
            </Text>
          </TouchableOpacity>
          <View style={styles.footerSeparator} />
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            style={styles.footerBtn}
          >
            <Ionicons name="mail-outline" size={16} color={subTextColor} />
            <Text style={[styles.footerText, { color: subTextColor }]}>
              Support
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isBlackMode && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsBlackMode(false)}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#000",
              zIndex: 1000,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <StatusBar hidden />
          <Text style={{ color: "#333", fontWeight: "500" }}>
            tap to return
          </Text>
        </TouchableOpacity>
      )}

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
          unitId={process.env.EXPO_PUBLIC_BANNER_ID || ""}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      </View>
    </View>
  );
}
