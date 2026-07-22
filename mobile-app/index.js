import { registerRootComponent } from 'expo';
import { Text, TextInput, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import App from './App';

// Polyfill String.prototype.replaceAll for Android Hermes / JavaScript Engine compatibility
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(searchValue, replaceValue) {
    if (Object.prototype.toString.call(searchValue) === '[object RegExp]') {
      return this.replace(searchValue, replaceValue);
    }
    return this.replace(new RegExp(String(searchValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceValue);
  };
}

// Set the Google Sans-serif (sans-serif / Roboto) style font as the default for the entire app
const defaultFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
});

try {
  if (Text.defaultProps) {
    Text.defaultProps.style = { fontFamily: defaultFont, ...Text.defaultProps.style };
  } else {
    Text.defaultProps = { style: { fontFamily: defaultFont } };
  }

  if (TextInput.defaultProps) {
    TextInput.defaultProps.style = { fontFamily: defaultFont, ...TextInput.defaultProps.style };
  } else {
    TextInput.defaultProps = { style: { fontFamily: defaultFont } };
  }
} catch (e) {
  console.warn("Font defaultProps setup warning:", e);
}

function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);
