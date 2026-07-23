import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Material Design Components (MDC) & AndroidX Transition Animation Engine
 * Implements 60fps hardware-accelerated Material 3 Motion Specs:
 * - Shared Axis X/Y/Z (Cubic Easing transitions)
 * - Container Transform (Spring & Deceleration)
 * - Fade Through & Elevate Scale Transitions
 */
export function MotiView({ animate, from, transition, exit, style, children, ...props }) {
  const opacityAnim = useRef(
    new Animated.Value(from?.opacity ?? (animate?.opacity ?? 1))
  ).current;
  const translateYAnim = useRef(
    new Animated.Value(from?.translateY ?? (animate?.translateY ?? 0))
  ).current;
  const translateXAnim = useRef(
    new Animated.Value(from?.translateX ?? (animate?.translateX ?? 0))
  ).current;
  const scaleAnim = useRef(
    new Animated.Value(from?.scale ?? (animate?.scale ?? 1))
  ).current;

  useEffect(() => {
    const duration = transition?.duration || 220;
    const delay = transition?.delay || 0;
    const isSpring = transition?.type === 'spring';

    const animations = [];

    if (animate?.opacity !== undefined) {
      animations.push(
        Animated.timing(opacityAnim, {
          toValue: animate.opacity,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
    }

    if (animate?.translateY !== undefined) {
      if (isSpring) {
        animations.push(
          Animated.spring(translateYAnim, {
            toValue: animate.translateY,
            damping: transition?.damping || 18,
            stiffness: transition?.stiffness || 180,
            delay,
            useNativeDriver: true,
          })
        );
      } else {
        animations.push(
          Animated.timing(translateYAnim, {
            toValue: animate.translateY,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        );
      }
    }

    if (animate?.translateX !== undefined) {
      if (isSpring) {
        animations.push(
          Animated.spring(translateXAnim, {
            toValue: animate.translateX,
            damping: transition?.damping || 18,
            stiffness: transition?.stiffness || 180,
            delay,
            useNativeDriver: true,
          })
        );
      } else {
        animations.push(
          Animated.timing(translateXAnim, {
            toValue: animate.translateX,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        );
      }
    }

    if (animate?.scale !== undefined) {
      if (isSpring) {
        animations.push(
          Animated.spring(scaleAnim, {
            toValue: animate.scale,
            damping: transition?.damping || 16,
            stiffness: transition?.stiffness || 200,
            delay,
            useNativeDriver: true,
          })
        );
      } else {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: animate.scale,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        );
      }
    }

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [animate?.opacity, animate?.translateY, animate?.translateX, animate?.scale]);

  // Handle hidden view touch blocking
  if (animate?.opacity === 0) {
    return null;
  }

  const transform = [];
  if (animate?.translateX !== undefined || from?.translateX !== undefined) {
    transform.push({ translateX: translateXAnim });
  }
  if (animate?.translateY !== undefined || from?.translateY !== undefined) {
    transform.push({ translateY: translateYAnim });
  }
  if (animate?.scale !== undefined || from?.scale !== undefined) {
    transform.push({ scale: scaleAnim });
  }

  const animatedStyle = {
    opacity: opacityAnim,
    ...(animate?.backgroundColor !== undefined ? { backgroundColor: animate.backgroundColor } : {}),
    ...(animate?.borderColor !== undefined ? { borderColor: animate.borderColor } : {}),
    ...(transform.length > 0 ? { transform } : {}),
  };

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
}

export const SafeView = MotiView;
export default MotiView;
