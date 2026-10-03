// Expo app configuration (replaces app.json so secrets such as the Google Maps key come from the environment).

/** Splash background = palette "Surface" (#FFFFFF), matching the white background of the logo artwork. */
const SPLASH_BACKGROUND_COLOR = '#FFFFFF';
/** Adaptive icon background = palette "Primary 100" (#E6F0FA). */
const ADAPTIVE_ICON_BACKGROUND_COLOR = '#E6F0FA';
const SPLASH_IMAGE_WIDTH = 220;

module.exports = {
  expo: {
    name: 'Ceylon Smart Bus',
    slug: 'ceylon-smart-bus',
    scheme: 'ceylonsmartbus',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'lk.ceylonsmartbus.app',
    },
    android: {
      package: 'lk.ceylonsmartbus.app',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: ADAPTIVE_ICON_BACKGROUND_COLOR,
      },
      config: {
        // react-native-maps needs this key inside the built APK, otherwise the map is blank.
        googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
      },
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash.png',
          imageWidth: SPLASH_IMAGE_WIDTH,
          resizeMode: 'contain',
          backgroundColor: SPLASH_BACKGROUND_COLOR,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Ceylon Smart Bus uses your location while the app is open to show nearby buses. Drivers share the bus position during a trip.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Ceylon Smart Bus uses the camera so drivers can scan passenger ticket QR codes.',
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
    ],
  },
};
