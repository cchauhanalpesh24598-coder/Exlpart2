module.exports = {
  expo: {
    name: "OCR Excel App",
    slug: "ocr-excel-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1a73e8"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ocrexcel.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a73e8"
      },
      package: "com.ocrexcel.app",
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.CAMERA",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
        "android.permission.POST_NOTIFICATIONS"
      ],
      intentFilters: [
        {
          action: "android.intent.action.SEND",
          category: ["android.intent.category.DEFAULT"],
          data: [
            { mimeType: "text/plain" },
            { mimeType: "image/*" }
          ]
        },
        {
          action: "android.intent.action.SEND_MULTIPLE",
          category: ["android.intent.category.DEFAULT"],
          data: [
            { mimeType: "text/plain" },
            { mimeType: "image/*" }
          ]
        }
      ]
    },
    plugins: [
      "expo-router",
      "expo-image-picker",
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos."
        }
      ],
      "./plugins/withOverlayService"
    ],
    experiments: {
      typedRoutes: true
    },
    scheme: "ocrexcel"
  }
};
