import React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Official Flaticon UIcons Interface Icon Component
 * Render Flaticon UIcons (Regular Rounded / Solid Rounded) vector paths
 */
export default function FlaticonIcon({ name, active = false, color = '#002cf7', size = 22 }) {
  switch (name) {
    case 'home':
    case 'accueil':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {active ? (
            <Path
              d="M12,2.094,1,12h3v9a1,1,0,0,0,1,1h5V16a2,2,0,0,1,4,0v6h5a1,1,0,0,0,1-1V12h3Z"
              fill={color}
            />
          ) : (
            <Path
              d="M12,3.314,3.707,11H5v9H9V15a3,3,0,0,1,6,0v5h4V11h1.293L12,3.314M12,1,23,11H20v9a2,2,0,0,1-2,2H14a1,1,0,0,1-1-1V15a1,1,0,0,0-2,0v5a1,1,0,0,1-1,1H4a2,2,0,0,1-2-2V11H1Z"
              fill={color}
            />
          )}
        </Svg>
      );
    case 'gestion':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {active ? (
            <Path
              d="M19,3H16.82a2.97,2.97,0,0,0-5.64,0H5A3,3,0,0,0,2,6V20a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V6A3,3,0,0,0,19,3ZM14,3a1,1,0,1,1-1,1A1,1,0,0,1,14,3Z"
              fill={color}
            />
          ) : (
            <Path
              d="M19,3H16.82a2.97,2.97,0,0,0-5.64,0H5A3,3,0,0,0,2,6V20a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V6A3,3,0,0,0,19,3ZM14,3a1,1,0,1,1-1,1H5a1,1,0,0,1-1-1V6A1,1,0,0,1,5,5H7V7H17V5h2a1,1,0,0,1,1,1Z"
              fill={color}
            />
          )}
        </Svg>
      );
    case 'ajouter':
    case 'creer_commande':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {active ? (
            <Path
              d="M12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Zm1,11H13v4H11V13H7V11h4V7h2v4h4v2Z"
              fill={color}
            />
          ) : (
            <Path
              d="M12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.009,8.009,0,0,1,12,20Zm1-13H11v4H7v2h4v4h2V13h4V11H13Z"
              fill={color}
            />
          )}
        </Svg>
      );
    case 'historique':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {active ? (
            <Path
              d="M12,2a10,10,0,0,0-7.07,2.93L3,3V8H8L6.2,6.2A8,8,0,1,1,4,12H2A10,10,0,1,0,12,2Zm1,5H11v6l5.2,3.1.8-1.3L13,12.3Z"
              fill={color}
            />
          ) : (
            <Path
              d="M12,2A10,10,0,0,0,4.93,4.93L3,3V8H8L6.2,6.2A8,8,0,1,1,4,12H2A10,10,0,1,0,12,2ZM12.5,7h-1v5.5l4.5,2.7.5-.83L12.5,12Z"
              fill={color}
            />
          )}
        </Svg>
      );
    case 'profile':
    case 'profil':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {active ? (
            <Path
              d="M12,12A5,5,0,1,0,7,7,5.006,5.006,0,0,0,12,12Zm0,2c-4.418,0-8,2.239-8,5v3H20V19C20,16.239,16.418,14,12,14Z"
              fill={color}
            />
          ) : (
            <Path
              d="M12,12A5,5,0,1,0,7,7,5.006,5.006,0,0,0,12,12Zm0-8A3,3,0,1,1,9,7,3,3,0,0,1,12,4Zm0,10c-4.418,0-8,2.239-8,5v3H20V19C20,16.239,16.418,14,12,14Zm-6,6c.38-1.573,2.784-3,6-3s5.62,1.427,6,3Z"
              fill={color}
            />
          )}
        </Svg>
      );
    default:
      return null;
  }
}
