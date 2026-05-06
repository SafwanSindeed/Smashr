import "dotenv/config";

export default {
  expo: {
    scheme: "smashr",
    name: "smashr",
    slug: "smashr",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/img/Logo.jpg",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/img/Logo.jpg",
      resizeMode: "contain",
      backgroundColor: "#FFF8EB",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/img/Logo.jpg",
        backgroundColor: "#FFF8EB",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/img/Logo.jpg",
    },
    plugins: ["expo-router"],
    extra: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      SB: process.env.SB,
      MSG_ID: process.env.MSG_ID,
      APP_ID: process.env.APP_ID,
    },
  },
};
