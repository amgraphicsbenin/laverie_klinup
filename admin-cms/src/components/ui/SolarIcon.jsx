/**
 * SolarIcon — wrapper léger pour @iconify/react avec la collection Solar Bold-Duotone.
 * Usage : <SolarIcon name="monitor-smartphone" size={16} className="..." style={{...}} />
 * Les noms correspondent aux icônes Solar sans le préfixe "solar:" ni le suffixe "-bold-duotone".
 * Exemples : "monitor-smartphone", "smartphone", "lock-password", "star-shine", "users-group-two-rounded"
 */
import React from 'react';
import { Icon } from '@iconify/react';

export default function SolarIcon({ name, size = 16, className, style, color }) {
  return (
    <Icon
      icon={`solar:${name}-bold-duotone`}
      width={size}
      height={size}
      className={className}
      style={style}
      color={color}
    />
  );
}

/**
 * SolarIconLine — variante outline/linear pour les contextes plus sobres.
 */
export function SolarIconLine({ name, size = 16, className, style, color }) {
  return (
    <Icon
      icon={`solar:${name}-linear`}
      width={size}
      height={size}
      className={className}
      style={style}
      color={color}
    />
  );
}

/**
 * SolarIconBold — variante full bold (monochrome).
 */
export function SolarIconBold({ name, size = 16, className, style, color }) {
  return (
    <Icon
      icon={`solar:${name}-bold`}
      width={size}
      height={size}
      className={className}
      style={style}
      color={color}
    />
  );
}
