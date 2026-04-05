import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { File, Paths } from "expo-file-system";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { SoundJson } from "../types";

type UseAudioPlayerParams = { videoFolder: string };
export const useAudioPlayer = ({ videoFolder }: UseAudioPlayerParams) => {
  const pendingSoundRef = useRef<string | null>(null);
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  const [soundsJson, setSoundsJson] = useState<SoundJson[]>([]);
  const [activeSounds, setActiveSounds] = useState<Record<string, Audio.Sound>>(
    {},
  );
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>(
    {},
  );

  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  const stopAllSounds = useCallback(async () => {
    const ids = Object.keys(activeSounds);
    for (const id of ids) {
      try {
        await activeSounds[id].stopAsync();
        await activeSounds[id].unloadAsync();
      } catch {
        console.error("Can't to stop all sounds");
      }
    }
    setActiveSounds({});
    setTimerSeconds(null);
  }, [activeSounds]);

  const downloadSound = useCallback(
    async (id: string, fileName: string) => {
      const cleanFileName = fileName.trim();
      const downloadUrl = videoFolder + cleanFileName;
      const localFile = new File(Paths.document, cleanFileName);
      setDownloadingIds((prev) => ({ ...prev, [id]: true }));
      try {
        await File.downloadFileAsync(downloadUrl, localFile);
        const currentDownloads = await AsyncStorage.getItem("downloaded_songs");
        let downloadsArr = currentDownloads ? JSON.parse(currentDownloads) : [];
        if (!downloadsArr.includes(id)) {
          downloadsArr.push(id);
          await AsyncStorage.setItem(
            "downloaded_songs",
            JSON.stringify(downloadsArr),
          );
          setDownloadedIds(downloadsArr);
        }
        return localFile.uri;
      } catch {
        return null;
      } finally {
        setDownloadingIds((prev) => ({ ...prev, [id]: false }));
      }
    },
    [videoFolder],
  );

  const toggleSound = useCallback(
    async (soundId: string, fileName: string) => {
      const localFile = new File(Paths.document, fileName);
      if (activeSounds[soundId]) {
        try {
          await activeSounds[soundId].stopAsync();
          await activeSounds[soundId].unloadAsync();
        } catch {
          console.error("Error can`t open this audio");
        }
        setActiveSounds((prev) => {
          const ns = { ...prev };
          delete ns[soundId];
          return ns;
        });
        return;
      }
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: localFile.uri },
          { shouldPlay: true, isLooping: true, volume: 0.7 },
        );
        setActiveSounds((prev) => ({ ...prev, [soundId]: sound }));
      } catch {
        setDownloadedIds((prev) => {
          const ns = prev.filter((id) => id !== soundId);
          AsyncStorage.setItem("downloaded_songs", JSON.stringify(ns));
          return ns;
        });
      }
    },
    [activeSounds],
  );

  const playSoundDirect = useCallback(
    async (fileName: string): Promise<Audio.Sound | null> => {
      const localFile = new File(Paths.document, fileName);
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: localFile.uri },
          { shouldPlay: true, isLooping: true, volume: 0.7 },
        );
        return sound;
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (timerSeconds !== null && timerSeconds <= 60 && timerSeconds > 0) {
      const vol = timerSeconds / 60;
      Object.values(activeSounds).forEach((s) => s.setVolumeAsync(vol));
    }
  }, [timerSeconds, activeSounds]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timerSeconds === 0) {
      stopAllSounds();
      Alert.alert("Rest Time", "The timer has finished. Sleep well!");
    }
    return () => clearInterval(interval);
  }, [timerSeconds, stopAllSounds, setTimerSeconds]);

  return {
    soundsJson,
    showTimerPicker,
    pendingSoundRef,
    downloadedIds,
    downloadSound,
    activeSounds,
    timerSeconds,
    unlockedIds,
    stopAllSounds,
    toggleSound,
    setActiveSounds,
    setSoundsJson,
    setDownloadedIds,
    setUnlockedIds,
    setTimerSeconds,
    downloadingIds,
    setShowTimerPicker,
    playSoundDirect,
  };
};
