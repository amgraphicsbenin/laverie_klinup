import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback
} from 'react';
import { Platform, Animated, Easing } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

/**
 * AnimatedHistoryIcon (Native Mobile iOS & Android)
 * Replicates time rewind: clock hands spin full 360° with spring bounce using Animated.
 */
export const AnimatedHistoryIcon = forwardRef(function AnimatedHistoryIcon(
  {
    size = 24,
    color = '#002cf7',
    active = false,
    trigger = 0,
    style,
    ...props
  },
  ref
) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const startAnimation = useCallback(() => {
    rotateAnim.setValue(0);
    scaleAnim.setValue(0.88);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 180,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [rotateAnim, scaleAnim]);

  useImperativeHandle(ref, () => ({
    startAnimation,
    stopAnimation: () => {
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
    },
  }));

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (active || trigger > 0) {
      startAnimation();
    }
  }, [active, trigger, startAnimation]);

  const spin = rotateAnim.interpolate({
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
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
      {...props}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Counter-clockwise Circular Arrow */}
        <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <Path d="M3 3v5h5" />

        {/* Clock Hands */}
        <Path d="M12 7v5" />
        <Path d="M12 12l3 2" />
      </Svg>
    </Animated.View>
  );
});

export default AnimatedHistoryIcon;

