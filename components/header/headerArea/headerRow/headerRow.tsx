import {
  Animated,
  Switch,
  TouchableOpacity,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useCryDetection } from "@/hooks";
import { SoundJson } from "@/types";
import { createStyles } from "./headerRow.styles";

type HeaderRowProps = {
  stopAllSounds: () => Promise<void>;
  activeSounds: Record<string, Audio.Sound>;
  setShowCouponModal: (value: React.SetStateAction<boolean>) => void;
  setIsBlackMode: (value: React.SetStateAction<boolean>) => void;
  setIsDarkMode: (value: React.SetStateAction<boolean>) => void;
  textColor: string;
  isDarkMode: boolean;
  handlePress: (item: any) => Promise<void>;
  soundsJson: SoundJson[];
  isBlackMode: boolean;
  style?: StyleProp<ViewStyle>;
  micAnimation: Animated.Value;
};

export const HeaderRow = ({
  stopAllSounds,
  activeSounds,
  setShowCouponModal,
  setIsBlackMode,
  setIsDarkMode,
  textColor,
  isDarkMode,
  handlePress,
  soundsJson,
  isBlackMode,
  micAnimation,
  style,
}: HeaderRowProps) => {
  const styles = createStyles();
  const { isCryDetectionActive, toggleCryDetection } = useCryDetection({
    micAnimation,
    activeSounds,
    handlePress,
    soundsJson,
    stopAllSounds,
    isBlackMode,
  });

  return (
    <View style={[styles.headerRow, style]}>
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
            style={Object.keys(activeSounds).length === 0 && { opacity: 0.3 }}
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
  );
};
