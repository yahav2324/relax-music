import { SPACING, SIZES, COLORS } from "@/common/constant/theme";
import { StyleSheet } from "react-native";

export const createStyles = () =>
  StyleSheet.create({
    miniActionBtn: {
      padding: SPACING.element.s,
      marginLeft: SPACING.element.sm,
      borderRadius: SIZES.radius.s,
      backgroundColor: COLORS.glass.white05,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.element.l,
    },
    header: {
      fontSize: SIZES.font.h1,
      fontWeight: "900",
    },
    topActions: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      justifyContent: "flex-end",
    },
  });
