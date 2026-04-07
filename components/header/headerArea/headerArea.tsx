import {
  UseAudioPlayerReturn,
  UseFilteredReturn,
  UseWeatherReturn,
} from "@/hooks";
import { UseColorsReturn } from "@/hooks/useColors";
import { UseUserCreditsReturn } from "@/hooks/useUserCredits";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { HeaderRow } from "./headerRow";
import { createStyles } from "./headerArea.styles";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

type HeaderAreaProps = {
  weather: UseWeatherReturn;
  filter: UseFilteredReturn;
  audioPlayer: UseAudioPlayerReturn;
  colors: UseColorsReturn;
  userCredits: UseUserCreditsReturn;
  handlePress: (item: any) => Promise<void>;
  micAnimation: Animated.Value;
  style?: StyleProp<ViewStyle>;
};

export const HeaderArea = ({
  weather,
  filter,
  audioPlayer,
  colors,
  userCredits,
  handlePress,
  micAnimation,
  style,
}: HeaderAreaProps) => {
  const styles = createStyles();

  const { isWeatherSyncing, syncWeather } = weather;

  const {
    categories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
  } = filter;

  const {
    activeSounds,
    setShowTimerPicker,
    soundsJson,
    stopAllSounds,
    timerSeconds,
  } = audioPlayer;

  const {
    isBlackMode,
    isDarkMode,
    setIsBlackMode,
    setIsDarkMode,
    subTextColor,
    textColor,
  } = colors;

  const { setShowCouponModal } = userCredits;

  return (
    <View style={[styles.headerArea, style]}>
      <HeaderRow
        activeSounds={activeSounds}
        handlePress={handlePress}
        isBlackMode={isBlackMode}
        isDarkMode={isDarkMode}
        micAnimation={micAnimation}
        setIsBlackMode={setIsBlackMode}
        setShowCouponModal={setShowCouponModal}
        setIsDarkMode={setIsDarkMode}
        soundsJson={soundsJson}
        stopAllSounds={stopAllSounds}
        textColor={textColor}
      />

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
                  color: selectedCategory === category ? "#000" : subTextColor,
                },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
