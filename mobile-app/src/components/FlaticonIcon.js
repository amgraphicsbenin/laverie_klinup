import React from 'react';
import AnimatedHomeIcon from './AnimatedHomeIcon';
import AnimatedGestionIcon from './AnimatedGestionIcon';
import AnimatedAddIcon from './AnimatedAddIcon';
import AnimatedHistoryIcon from './AnimatedHistoryIcon';
import AnimatedProfileIcon from './AnimatedProfileIcon';

/**
 * Navigation Bar Animated Icons
 * Uses authentic motion vector components for all 5 navigation tabs.
 */
export default function FlaticonIcon({ name, active = false, color = '#002cf7', size = 24, trigger = 0, ...props }) {
  switch (name) {
    case 'home':
    case 'accueil':
      return (
        <AnimatedHomeIcon
          active={active}
          color={color}
          size={size}
          trigger={trigger}
          {...props}
        />
      );
    case 'gestion':
    case 'manage':
      return (
        <AnimatedGestionIcon
          active={active}
          color={color}
          size={size}
          trigger={trigger}
          {...props}
        />
      );
    case 'ajouter':
    case 'add':
    case 'creer_commande':
      return (
        <AnimatedAddIcon
          active={active}
          color={color}
          size={size}
          trigger={trigger}
          {...props}
        />
      );
    case 'historique':
    case 'history':
      return (
        <AnimatedHistoryIcon
          active={active}
          color={color}
          size={size}
          trigger={trigger}
          {...props}
        />
      );
    case 'profile':
    case 'profil':
      return (
        <AnimatedProfileIcon
          active={active}
          color={color}
          size={size}
          trigger={trigger}
          {...props}
        />
      );
    default:
      return null;
  }
}
