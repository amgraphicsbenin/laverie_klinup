import { Alert, Platform } from 'react-native';

let alertHandler = null;

export const registerAlertHandler = (handler) => {
  alertHandler = handler;
};

export const customAlert = (title, message, buttons) => {
  if (alertHandler) {
    alertHandler({ title, message, buttons });
  } else {
    // Fallback if the custom handler is not registered yet
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message, buttons);
    }
  }
};

// Patch the default React Native Alert
const originalAlert = Alert.alert;
Alert.alert = (title, message, buttons) => {
  // Convert standard buttons formats to array of objects
  let normalizedButtons = [{ text: 'OK' }];
  if (buttons && Array.isArray(buttons)) {
    normalizedButtons = buttons;
  } else if (buttons && typeof buttons === 'string') {
    normalizedButtons = [{ text: buttons }];
  }

  customAlert(title, message, normalizedButtons);
};
