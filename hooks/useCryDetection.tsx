import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Linking } from "react-native";
import { SoundJson } from "../types";

type UseCryDetection = {
  soundsJson: SoundJson[];
  stopAllSounds: () => Promise<void>;
  activeSounds: Record<string, Audio.Sound>;
  handlePress: (item: any) => Promise<void>;
  isBlackMode: boolean;
};

export const useCryDetection = ({
  soundsJson,
  stopAllSounds,
  activeSounds,
  handlePress,
  isBlackMode,
}: UseCryDetection) => {
  const micAnimation = useRef(new Animated.Value(1)).current;

  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isCryDetectionActive, setIsCryDetectionActive] = useState(false);

  const toggleCryDetection = async () => {
    await stopAllSounds();
    if (isCryDetectionActive) {
      setIsCryDetectionActive(false);
      try {
        await recordingRef.current?.stopAndUnloadAsync();
      } catch (e) {
        console.error("Error can't start cry detection", e);
      }
      recordingRef.current = null;
      return;
    }
    const { status, canAskAgain } = await Audio.getPermissionsAsync();
    if (status === "denied" && !canAskAgain) {
      Alert.alert(
        "Microphone Required",
        "Microphone access is disabled. Please enable it in settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    const { status: newStatus } = await Audio.requestPermissionsAsync();
    if (newStatus === "granted") {
      startCryDetectionLogic();
    }
  };

  const startCryDetectionLogic = async () => {
    try {
      setIsCryDetectionActive(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY,
      );
      recording.setProgressUpdateInterval(500);
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering && status.metering > -25) {
          triggerAutoPlay();
        }
      });
      await recording.startAsync();
      recordingRef.current = recording;
    } catch (err) {
      console.error("Cry Detection failed:", err);
      setIsCryDetectionActive(false);
    }
  };

  const triggerAutoPlay = () => {
    if (Object.keys(activeSounds).length > 0) return;
    const babySound = soundsJson.find(
      (s) => s.category === "Baby" || s.label.includes("White Noise"),
    );
    if (babySound) handlePress(babySound);
  };

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isCryDetectionActive) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(micAnimation, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(micAnimation, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      micAnimation.setValue(1);
    }
    return () => animation?.stop();
  }, [isCryDetectionActive, micAnimation, isBlackMode]);

  return {
    toggleCryDetection,
    isCryDetectionActive,
    micAnimation,
  };
};
