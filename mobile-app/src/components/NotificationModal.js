import React from 'react';
import { View } from 'react-native';
import { NotificationPopover } from './NotificationPopover';

/**
 * NotificationModal
 * Modern Bottom Sheet Notification Center (backward-compatible modal wrapper)
 */
export function NotificationModal({ visible, onClose, notifications = [], isDarkMode = false }) {
  if (!visible) return null;

  return (
    <NotificationPopover
      visible={visible}
      onClose={onClose}
      notifications={notifications}
      isDarkMode={isDarkMode}
    >
      <View />
    </NotificationPopover>
  );
}

export { NotificationPopover } from './NotificationPopover';
export default NotificationModal;
