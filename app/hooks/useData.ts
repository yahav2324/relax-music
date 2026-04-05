import { useState } from "react";
import { SoundsData } from "../types";
import { Audio } from "expo-av";

type UseAudioPlayerParams = {};
export const useAudioPlayer = ({}: UseAudioPlayerParams) => {
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  const [soundsData, setSoundsData] = useState<SoundsData[]>([]);
  const [activeSounds, setActiveSounds] = useState<Record<string, Audio.Sound>>(
    {},
  );
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>(
    {},
  );
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  return {};
};
