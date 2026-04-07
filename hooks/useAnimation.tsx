import { useEffect, useRef } from "react";
import { Animated, Easing, Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export const useAnimation = (shouldAnimate: boolean) => {
  const cloudAnimation = useRef(new Animated.Value(-150)).current;
  const micAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (shouldAnimate) {
      Animated.loop(
        Animated.timing(cloudAnimation, {
          toValue: SCREEN_WIDTH + 50,
          duration: 25000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      cloudAnimation.stopAnimation();
    }
  }, [shouldAnimate, cloudAnimation]);

  return { cloudAnimation, micAnimation };
};
