import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { Audio } from "expo-av";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.log("Audio mode setup error:", e);
      }
    };
    setupAudio();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          },
          animation: "fade",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
