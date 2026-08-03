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
      if (buttons && buttons.length > 1) {
        const confirmBtn = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];
        const cancelBtn = buttons.find(b => b.style === 'cancel');
        const ok = window.confirm(`${title}\n\n${message}`);
        if (ok) {
          if (confirmBtn && typeof confirmBtn.onPress === 'function') confirmBtn.onPress();
        } else {
          if (cancelBtn && typeof cancelBtn.onPress === 'function') cancelBtn.onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        if (buttons && buttons[0] && typeof buttons[0].onPress === 'function') {
          buttons[0].onPress();
        }
      }
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
