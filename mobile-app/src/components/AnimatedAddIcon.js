import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback
} from 'react';
import { Platform, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

/**
 * AnimatedAddIcon (Native Mobile iOS & Android)
 * Uses react-native-svg and Animated for rotation and spring bounce.
 */
export const AnimatedAddIcon = forwardRef(function AnimatedAddIcon(
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
    scaleAnim.setValue(0.86);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 180,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 500,
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
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ scale: scaleAnim }, { rotate: spin }],
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
        <Circle cx="12" cy="12" r="10" />
        <Path d="M8 12h8" />
        <Path d="M12 8v8" />
      </Svg>
    </Animated.View>
  );
});

export default AnimatedAddIcon;

