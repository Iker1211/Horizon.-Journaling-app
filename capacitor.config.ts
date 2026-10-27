import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.horizon.app',
  appName: 'Horizon',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#fffaf0',
  },
  plugins: {
    SystemBars: {
      // Unlike StatusBar's DARK, SystemBars LIGHT means a light surface with dark icons.
      // Horizon's canvas stays light even when Android uses its dark theme.
      style: 'LIGHT',
      // MainActivity owns insets; avoid a second listener/padding policy on the decor view.
      insetsHandling: 'disable',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#fffaf0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#fffaf0',
    },
  },
};

export default config;
