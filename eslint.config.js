// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    plugins: ["react-native"],
    rules: {
      "react-native/no-unused-styles": 2,
    },
    ignores: ["dist/*"],
  },
]);
