import { COLORS, SPACING, SIZES, OPACITY } from "@/common/constant/theme";
import { StyleSheet } from "react-native";

export const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background.default,
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.background.default,
    },
    scrollContent: {
      padding: SPACING.element.xl,
      paddingBottom: SPACING.layout.footerBottom,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    cardContainer: {
      width: "31%",
      marginHorizontal: SPACING.layout.gridGap,
      marginBottom: SPACING.element.l,
    },
    card: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: SIZES.radius.card,
      backgroundColor: COLORS.glass.white03,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.element.m,
    },
    icon: {
      width: "45%",
      height: "45%",
      marginBottom: SPACING.element.xs,
    },
    label: {
      fontSize: SIZES.font.tiny,
      fontWeight: "800",
    },
    slider: {
      width: "100%",
      height: 30,
    },
    adContainer: {
      position: "absolute",
      bottom: SPACING.element.ml,
      width: "100%",
      alignItems: "center",
    },
    blackScreen: {
      flex: 1,
      backgroundColor: COLORS.background.default,
      justifyContent: "center",
      alignItems: "center",
    },
    blackScreenText: {
      color: "#111",
      fontSize: SIZES.font.caption,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.background.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: COLORS.background.modal,
      width: "80%",
      borderRadius: SIZES.radius.xl,
      padding: SPACING.element.xxl,
      alignItems: "center",
    },
    modalTitle: {
      color: COLORS.text.primary,
      fontSize: SIZES.font.title,
      fontWeight: "bold",
      marginBottom: SPACING.element.xl,
    },
    modalInput: {
      width: "100%",
      height: SIZES.input.height,
      backgroundColor: COLORS.glass.white10,
      borderRadius: SIZES.radius.s,
      color: COLORS.text.primary,
      paddingHorizontal: SPACING.element.xl,
      textAlign: "center",
      marginBottom: SPACING.element.xxl,
    },
    modalBtn: {
      backgroundColor: COLORS.status.success,
      paddingVertical: SPACING.element.ml,
      paddingHorizontal: 30,
      borderRadius: SIZES.radius.s,
    },
    modalBtnText: {
      color: COLORS.primary.contrast,
      fontWeight: "bold",
    },
    modalOption: {
      padding: SPACING.element.xl,
      width: "100%",
      borderBottomWidth: 0.5,
      borderColor: "#333",
    },
    modalOptionText: {
      color: COLORS.text.primary,
      textAlign: "center",
      fontSize: SIZES.font.subtitle,
    },
    modalClose: {
      marginTop: SPACING.element.xl,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 30,
      marginBottom: SPACING.element.xxl,
      opacity: OPACITY.faded,
    },
    footerBtn: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.element.ml,
    },
    footerText: {
      fontSize: SIZES.font.footer,
      fontWeight: "600",
    },
    footerSeparator: {
      width: 1,
      height: 15,
      backgroundColor: COLORS.glass.white20,
      marginHorizontal: SPACING.element.xl,
    },
  });
