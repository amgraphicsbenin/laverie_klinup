import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';

// Ignorer les avertissements informatifs d'environnement de développement Expo Go
LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'expo-notifications: Android Push notifications',
  'Android Push notifications (remote notifications) functionality',
  'Require cycle:',
]);

// Polyfill String.prototype.replaceAll for Android Hermes / JavaScript Engine compatibility
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(searchValue, replaceValue) {
    if (Object.prototype.toString.call(searchValue) === '[object RegExp]') {
      return this.replace(searchValue, replaceValue);
    }
    return this.replace(new RegExp(String(searchValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceValue);
  };
}

function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);
