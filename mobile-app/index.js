import { registerRootComponent } from 'expo';
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

function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);
