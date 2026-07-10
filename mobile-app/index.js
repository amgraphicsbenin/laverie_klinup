import { registerRootComponent } from 'expo';
import { Text, TextInput, Platform } from 'react-native';

import App from './App';

// Set the Google Sans-serif (sans-serif / Roboto) style font as the default for the entire app
const defaultFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
});

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

registerRootComponent(App);
