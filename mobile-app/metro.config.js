const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .web.js files are resolved before .js for web platform
// This allows platform-specific files like SplashScreen.web.js to override SplashScreen.js on web
// preventing native-only modules (e.g. lottie-react-native) from being bundled for web
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

module.exports = config;
