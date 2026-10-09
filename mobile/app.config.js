// Expo app configuration (a .js config so any future secret can come from the environment).
// The maps are drawn with Leaflet over OpenStreetMap inside a WebView, so there is no map key here:
// see docs/evidence/m02/deviations.md for how to switch back to Google Maps if a key is available.

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
    },
    plugins: [
      'expo-router',
      [
        // A release APK blocks plain HTTP by default, so without this the built app cannot reach the
        // project's own API at all: every request fails before it leaves the phone. The API is
        // served over HTTP on a laptop or a LAN address for this project, not HTTPS, so cleartext
        // has to be allowed. Debug builds already allow it; this is what carries it into a release.
        'expo-build-properties',
        { android: { usesCleartextTraffic: true } },
      ],
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
