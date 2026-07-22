import React from 'react';
import { View } from 'react-native';

export function SafeView({ animate, from, transition, exit, state, style, children, ...props }) {
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
}

export const MotiView = SafeView;
export default SafeView;
