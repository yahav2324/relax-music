import { useState } from "react";

export type UseUserCreditsReturn = ReturnType<typeof useUserCredits>;

export const useUserCredits = () => {
  const [freeLimit, setFreeLimit] = useState(5);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyUsageCount, setDailyUsageCount] = useState(0);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponInput, setCouponInput] = useState("");

  return {
    freeLimit,
    setFreeLimit,
    isPremium,
    setIsPremium,
    dailyUsageCount,
    setDailyUsageCount,
    showCouponModal,
    setShowCouponModal,
    couponInput,
    setCouponInput,
  };
};
