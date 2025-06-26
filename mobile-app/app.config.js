// app.config.js
module.exports = {
  name: 'MiniTranslate',
  slug: 'minitranslate',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'minitranslate',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.minitranslate'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.yourcompany.minitranslate'
  },
  web: {
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-notifications'
  ],
  extra: {
    eas: {
      projectId: 'd06417c3-d3c2-4431-94c5-54175f7faa4f'
    }
  }
}; 