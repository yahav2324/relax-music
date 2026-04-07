import { SPACING, SIZES, COLORS } from "@/common/constant/theme";
import { StyleSheet } from "react-native";

export const createStyles = () =>
  StyleSheet.create({
    headerArea: {
      paddingTop: SPACING.layout.headerTop,
      paddingHorizontal: SPACING.layout.screenPadding,
    },
    searchBar: {
      height: SIZES.input.searchBar,
      borderRadius: SIZES.radius.s,
      paddingHorizontal: SPACING.element.l,
      fontSize: SIZES.font.body,
      marginBottom: SPACING.element.m,
    },
    toolsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: SPACING.element.s,
    },
    toolButton: {
      flex: 0.48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.glass.white03,
      paddingVertical: SPACING.element.m,
      borderRadius: SIZES.radius.m,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    activeTool: {
      backgroundColor: COLORS.status.success,
    },
    activeTimer: {
      backgroundColor: COLORS.status.warning,
    },
    toolText: {
      marginLeft: SPACING.element.s,
      fontWeight: "700",
      fontSize: SIZES.font.small,
    },
    catScroll: {
      marginVertical: SPACING.element.s,
    },
    catTab: {
      paddingHorizontal: SPACING.element.l,
      paddingVertical: SPACING.element.s,
      borderRadius: SIZES.radius.l,
      backgroundColor: COLORS.glass.white05,
      marginRight: SPACING.element.sm,
    },
    activeCat: {
      backgroundColor: COLORS.primary.main,
    },
    catText: {
      fontWeight: "700",
      fontSize: SIZES.font.small,
    },
  });
