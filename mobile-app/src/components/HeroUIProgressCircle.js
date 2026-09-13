import React, { useEffect, useRef } from 'react';
import { View, Platform, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * HeroUI ProgressCircle (Indeterminate)
 * 
 * Replicates @heroui/react:
 * <ProgressCircle isIndeterminate aria-label="Loading">
 *   <ProgressCircle.Track>
 *     <ProgressCircle.TrackCircle />
 *     <ProgressCircle.FillCircle />
 *   </ProgressCircle.Track>
 * </ProgressCircle>
 */
export const HeroUIProgressCircle = ({
  size = 48,
  strokeWidth = 3.5,
  color = '#002cf7',
  trackColor,
  isDarkMode = false,
  style,
  ...props
}) => {
  const finalTrackColor = trackColor || (isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 44, 247, 0.12)');
  const finalFillColor = color || (isDarkMode ? '#38bdf8' : '#002cf7');

  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Native spin animation
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [spinAnim]);

  if (Platform.OS === 'web') {
    const dashLength = circumference * 0.75;
    return (
      <div
        aria-label="Loading"
        role="progressbar"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          ...style,
        }}
        {...props}
      >
        <style>{`
          @keyframes heroui_circle_spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes heroui_circle_dash {
            0% {
              stroke-dasharray: 1, ${circumference};
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: ${dashLength}, ${circumference};
              stroke-dashoffset: -${circumference * 0.25};
            }
            100% {
              stroke-dasharray: ${dashLength}, ${circumference};
              stroke-dashoffset: -${circumference};
            }
          }
        `}</style>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          style={{
            animation: 'heroui_circle_spin 1.4s linear infinite',
            transformOrigin: 'center center',
          }}
        >
          {/* ProgressCircle.TrackCircle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={finalTrackColor}
            strokeWidth={strokeWidth}
          />
          {/* ProgressCircle.FillCircle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={finalFillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              animation: 'heroui_circle_dash 1.4s ease-in-out infinite',
              transformOrigin: 'center center',
            }}
          />
        </svg>
      </div>
    );
  }

  // Native Mobile (iOS / Android)
  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ rotate: spinInterpolate }],
        },
        style,
      ]}
      {...props}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* ProgressCircle.TrackCircle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={finalTrackColor}
          strokeWidth={strokeWidth}
        />
        {/* ProgressCircle.FillCircle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={finalFillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={[circumference * 0.7, circumference * 0.3]}
        />
      </Svg>
    </Animated.View>
  );
};

export default HeroUIProgressCircle;

