import { Audio } from "expo-av";
import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { SoundJson } from "../types";

type UseWeatherParams = {
  apiKey: string;
  url: string;
  isDarkMode: boolean;
  soundsData: SoundJson[];
  stopAllSounds: () => Promise<void>;
  downloadedIds: string[];
  unlockedIds: string[];
  playSoundDirect: (fileName: string) => Promise<Audio.Sound | null>;
  dailyUsageCount: number;
  freeLimit: number;
  setDailyUsageCount: React.Dispatch<React.SetStateAction<number>>;
  downloadSound: (id: string, fileName: string) => Promise<string | null>;
  setActiveSounds: React.Dispatch<
    React.SetStateAction<Record<string, Audio.Sound>>
  >;
};

export type UseWeatherReturn = ReturnType<typeof useWeather>;

export const useWeather = ({
  apiKey,
  url,
  isDarkMode,
  soundsData,
  stopAllSounds,
  downloadedIds,
  unlockedIds,
  playSoundDirect,
  dailyUsageCount,
  freeLimit,
  setDailyUsageCount,
  downloadSound,
  setActiveSounds,
}: UseWeatherParams) => {
  const [weatherCache, setWeatherCache] = useState<{
    data: any;
    timestamp: number;
  } | null>(null);
  const [isWeatherSyncing, setIsWeatherSyncing] = useState(false);
  const [weatherColors, setWeatherColors] = useState<
    readonly [string, string, ...string[]]
  >(["#f8fafc", "#e2e8f0"]);

  const applyWeatherToApp = useCallback(
    async (data: any) => {
      const condition = data.weather[0].main;
      const temp = data.main.temp;
      if (!isDarkMode) {
        if (condition === "Clouds") setWeatherColors(["#f1f5f9", "#94a3b8"]);
        else if (condition === "Rain") setWeatherColors(["#e0e7ff", "#818cf8"]);
        else if (condition === "Clear" || temp > 28)
          setWeatherColors(["#fff7ed", "#fb923c"]);
        else setWeatherColors(["#f8fafc", "#bae6fd"]);
      }
      const matching = soundsData.filter(
        (s) =>
          s.weatherTags?.includes(condition) ||
          (temp > 28 && s.weatherTags?.includes("Hot")),
      );
      if (matching.length > 0) {
        Alert.alert("Smart Sync", `Weather detected: ${condition}`);
        await stopAllSounds();
        const toPlay = matching.slice(0, 2);
        const newActiveMap: Record<string, Audio.Sound> = {};
        for (const item of toPlay) {
          if (
            downloadedIds.includes(item.id) ||
            unlockedIds.includes(item.id)
          ) {
            const sound = await playSoundDirect(item.fileName);
            if (sound) newActiveMap[item.id] = sound;
          } else if (dailyUsageCount < freeLimit) {
            setDailyUsageCount((prev) => prev + 1);
            const uri = await downloadSound(item.id, item.fileName);
            if (uri) {
              const sound = await playSoundDirect(item.fileName);
              if (sound) newActiveMap[item.id] = sound;
            }
          }
        }
        setActiveSounds(newActiveMap);
      }
    },
    [
      isDarkMode,
      soundsData,
      stopAllSounds,
      setActiveSounds,
      downloadedIds,
      unlockedIds,
      dailyUsageCount,
      freeLimit,
      playSoundDirect,
      setDailyUsageCount,
      downloadSound,
    ],
  );

  const syncWeather = async () => {
    if (isWeatherSyncing) return;
    const now = Date.now();
    if (weatherCache && now - weatherCache.timestamp < 10 * 60 * 1000) {
      applyWeatherToApp(weatherCache.data);
      return;
    }
    setIsWeatherSyncing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Audio.PermissionStatus.GRANTED) {
        Alert.alert("Error", "Location permission is required.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const res = await fetch(
        `${url}?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&appid=${apiKey}&units=metric`,
      );

      const data = await res.json();
      setWeatherCache({ data, timestamp: now });
      applyWeatherToApp(data);
    } catch {
      Alert.alert("Error", "Could not sync weather.");
    } finally {
      setIsWeatherSyncing(false);
    }
  };

  return {
    syncWeather,
    weatherColors,
    isWeatherSyncing,
  };
};
