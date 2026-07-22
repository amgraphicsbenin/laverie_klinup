import React from 'react';
import { View } from 'react-native';

export function SafeView({ animate, from, transition, exit, state, style, children, ...props }) {
  // If animate specifies opacity: 0, do not render (prevents invisible views blocking touches/modals staying open)
  if (animate && animate.opacity === 0) {
    return null;
  }

  let extraStyle = {};
  if (animate && typeof animate.opacity === 'number') {
    extraStyle.opacity = animate.opacity;
  }

  return (
    <View style={[style, extraStyle]} {...props}>
      {children}
    </View>
  );
}

export const MotiView = SafeView;
export default SafeView;
