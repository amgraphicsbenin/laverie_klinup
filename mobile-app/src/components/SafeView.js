import React from 'react';
import { View } from 'react-native';

export function SafeView({ animate, from, transition, exit, state, style, children, ...props }) {
  // If animate specifies opacity: 0, do not render (prevents hidden views blocking touches)
  if (animate && animate.opacity === 0) {
    return null;
  }

  let extraStyle = {};
  if (animate && typeof animate === 'object') {
    const { opacity, backgroundColor, borderColor, borderWidth, borderRadius, width, height } = animate;
    if (typeof opacity === 'number') extraStyle.opacity = opacity;
    if (backgroundColor) extraStyle.backgroundColor = backgroundColor;
    if (borderColor) extraStyle.borderColor = borderColor;
    if (typeof borderWidth === 'number') extraStyle.borderWidth = borderWidth;
    if (typeof borderRadius === 'number') extraStyle.borderRadius = borderRadius;
    if (width !== undefined) extraStyle.width = width;
    if (height !== undefined) extraStyle.height = height;
  }

  return (
    <View style={[style, extraStyle]} {...props}>
      {children}
    </View>
  );
}

export const MotiView = SafeView;
export default SafeView;
