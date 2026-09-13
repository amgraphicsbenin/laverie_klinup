import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback
} from 'react';
import { Platform, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * AnimatedHomeIcon (Native Mobile iOS & Android)
 * Replicates the pathLength & opacity draw animation of the door using react-native-svg.
 */
export const AnimatedHomeIcon = forwardRef(function AnimatedHomeIcon(
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
  const animProgress = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [doorOffset, setDoorOffset] = useState(0);
  const [doorOpacity, setDoorOpacity] = useState(1);

  const startAnimation = useCallback(() => {
    animProgress.setValue(0);
    scaleAnim.setValue(0.85);

    Animated.parallel([
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 600,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [animProgress, scaleAnim]);

  useImperativeHandle(ref, () => ({
    startAnimation,
    stopAnimation: () => {
      animProgress.setValue(1);
      setDoorOffset(0);
      setDoorOpacity(1);
    },
  }));

  useEffect(() => {
    const id = animProgress.addListener(({ value }) => {
      setDoorOffset(24 * (1 - value));
      setDoorOpacity(Math.min(1, value * 3));
    });
    return () => {
      animProgress.removeListener(id);
    };
  }, [animProgress]);

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
        {/* Main House Outline */}
        <Path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        
        {/* Animated Door */}
        <Path
          d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
          strokeDasharray={[24, 24]}
          strokeDashoffset={doorOffset}
          opacity={doorOpacity}
        />
      </Svg>
    </Animated.View>
  );
});

export default AnimatedHomeIcon;
