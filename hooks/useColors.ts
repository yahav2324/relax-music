import { useState } from "react";

export type UseColorsReturn = ReturnType<typeof useColors>;

export const useColors = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isBlackMode, setIsBlackMode] = useState(false);

  const textColor = isDarkMode ? "#ffffff" : "#1e293b";
  const subTextColor = isDarkMode ? "#94a3b8" : "#475569";

  return {
    isDarkMode,
    setIsDarkMode,
    isBlackMode,
    setIsBlackMode,
    textColor,
    subTextColor,
  };
};
