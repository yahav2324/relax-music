export const COLORS = {
  primary: {
    main: "#00E676",
    contrast: "#000000",
  },
  text: {
    primary: "#ffffff",
    secondary: "#94a3b8",
    muted: "#475569",
    dark: "#1e293b",
  },
  background: {
    default: "#000000",
    modal: "#1e1b4b",
    overlay: "rgba(0,0,0,0.8)",
    gradientDark: ["#0f172a", "#020617", "#1e1b4b"] as const,
  },
  glass: {
    white03: "rgba(255,255,255,0.03)",
    white05: "rgba(255,255,255,0.05)",
    white10: "rgba(255,255,255,0.1)",
    white20: "rgba(255,255,255,0.2)",
  },
  status: {
    success: "#00E676",
    warning: "#FFEB3B",
  },
  border: "rgba(255,255,255,0.05)",
};

export const SPACING = {
  layout: {
    headerTop: 45,
    screenPadding: 20,
    footerBottom: 110,
    // שינוי כאן: React Native מעדיף "1%" כערך ישיר ולא כמשתנה string כללי ב-TS לעיתים
    gridGap: "1%" as const,
  },
  element: {
    xs: 4,
    s: 5,
    sm: 6,
    m: 8,
    ml: 10, // הוספתי ml שהיה חסר
    l: 12,
    xl: 16, // הוספתי xl שהיה חסר
    xxl: 24, // הוספתי xxl שהיה חסר
  },
};

export const SIZES = {
  font: {
    tiny: 9,
    small: 10,
    footer: 13, // הוספתי footer שהיה חסר
    caption: 12,
    body: 14,
    subtitle: 16,
    title: 18,
    h1: 22,
  },
  radius: {
    s: 10,
    m: 12,
    l: 15,
    xl: 20,
    card: 22,
  },
  input: {
    height: 45,
    searchBar: 38,
  },
};

export const OPACITY = {
  faded: 0.6,
};
