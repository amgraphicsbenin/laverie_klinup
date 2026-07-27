import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { playNotificationSound } from './soundService';

// Configure notification behavior for foreground and background
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

/**
 * Initializes system notifications for Android & iOS (channel creation + permissions request).
 */
export async function initSystemNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications KLIN UP',
        importance: Notifications.Importance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#002cf7',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('System notification permissions not granted.');
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        await window.Notification.requestPermission();
      }
    }
  } catch (err) {
    console.warn('Error initializing system notifications:', err);
  }
}

/**
 * Triggers an immediate system notification in the Android status bar / lockscreen (hors-app).
 * 
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} data - Optional payload data
 */
export async function sendSystemNotification(title, body, data = {}) {
  try {
    // Trigger in-app sound and haptic vibration
    playNotificationSound();

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'KLIN UP',
          body: body || 'Nouvelle notification',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data,
        },
        trigger: null, // Immediate display
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title || 'KLIN UP', {
        body: body || 'Nouvelle notification',
      });
    }
  } catch (err) {
    console.warn('Error triggering system notification:', err);
  }
}
