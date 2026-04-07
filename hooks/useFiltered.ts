import { useMemo, useState } from "react";
import { SoundJson } from "../types";

type UseFilteredParams = {
  soundsJson: SoundJson[];
};

export const useFiltered = ({ soundsJson }: UseFilteredParams) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = useMemo(
    () => [
      "All",
      ...new Set(soundsJson.map((s) => s.category).filter(Boolean)),
    ],
    [soundsJson],
  );
  const filtered = useMemo(
    () =>
      soundsJson.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (selectedCategory === "All" || s.category === selectedCategory),
      ),
    [searchQuery, soundsJson, selectedCategory],
  );

  return {
    filtered,
    setSearchQuery,
    setSelectedCategory,
    categories,
    searchQuery,
    selectedCategory,
  };
};

export type UseFilteredReturn = ReturnType<typeof useFiltered>;
