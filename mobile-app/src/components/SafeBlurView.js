import React from 'react';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export function SafeBlurView({ intensity = 85, tint = 'light', style, children, ...props }) {
  if (Platform.OS === 'android') {
    const isDark = tint === 'dark';
    const bg = isDark 
      ? 'rgba(15, 23, 42, 0.88)' 
      : 'rgba(241, 245, 249, 0.90)';
    return (
      <View style={[style, { backgroundColor: bg }]} {...props}>
        {children}
      </View>
    );
  }
  return (
    <BlurView intensity={intensity} tint={tint} style={style} {...props}>
      {children}
    </BlurView>
  );
}

export default SafeBlurView;
