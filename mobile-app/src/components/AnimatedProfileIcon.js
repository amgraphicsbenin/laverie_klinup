import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback
} from 'react';
import { Platform, Animated, Easing } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * AnimatedProfileIcon (Native Mobile iOS & Android)
 * Replicates avatar nod and breathing bounce using Animated.
 */
export const AnimatedProfileIcon = forwardRef(function AnimatedProfileIcon(
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

  const startAnimation = useCallback(() => {
    scaleAnim.setValue(0.88);

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 180,
      useNativeDriver: false,
    }).start();
  }, [scaleAnim]);

  useImperativeHandle(ref, () => ({
    startAnimation,
    stopAnimation: () => {
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
        <Circle cx="12" cy="8" r="5" />
        <Path d="M20 21a8 8 0 0 0-16 0" />
      </Svg>
    </Animated.View>
  );
});

export default AnimatedProfileIcon;

