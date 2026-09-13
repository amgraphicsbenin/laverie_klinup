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
 * AnimatedGestionIcon (Native Mobile iOS & Android)
 * Replicates the document text lines animation using react-native-svg and Animated.
 */
export const AnimatedGestionIcon = forwardRef(function AnimatedGestionIcon(
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
  const lineAnim = useRef(new Animated.Value(0)).current;
  const [line1Offset, setLine1Offset] = useState(0);
  const [line2Offset, setLine2Offset] = useState(0);
  const [line3Offset, setLine3Offset] = useState(0);

  const startAnimation = useCallback(() => {
    lineAnim.setValue(0);
    scaleAnim.setValue(0.88);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 180,
        useNativeDriver: false,
      }),
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 750,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [lineAnim, scaleAnim]);

  useImperativeHandle(ref, () => ({
    startAnimation,
    stopAnimation: () => {
      lineAnim.setValue(0);
      setLine1Offset(0);
      setLine2Offset(0);
      setLine3Offset(0);
    },
  }));

  useEffect(() => {
    const id = lineAnim.addListener(({ value }) => {
      // Calculate [1, 0, 1] wave for each line with offset
      // val 0 -> 1 -> 0
      const calcOffset = (progress, delay, maxLen) => {
        const adjusted = Math.max(0, Math.min(1, (progress - delay) / 0.5));
        // sine wave from 0 to 1 back to 0
        const factor = Math.sin(adjusted * Math.PI);
        return maxLen * factor;
      };

      setLine1Offset(calcOffset(value, 0.0, 2));
      setLine2Offset(calcOffset(value, 0.2, 8));
      setLine3Offset(calcOffset(value, 0.4, 8));
    });
    return () => {
      lineAnim.removeListener(id);
    };
  }, [lineAnim]);

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
        {/* Document Outline */}
        <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        
        {/* Folded Corner */}
        <Path d="M14 2v4a2 2 0 0 0 2 2h4" />

        {/* Text Line 1 */}
        <Path
          d="M10 9H8"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={[2, 2]}
          strokeDashoffset={line1Offset}
        />

        {/* Text Line 2 */}
        <Path
          d="M16 13H8"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={[8, 8]}
          strokeDashoffset={line2Offset}
        />

        {/* Text Line 3 */}
        <Path
          d="M16 17H8"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={[8, 8]}
          strokeDashoffset={line3Offset}
        />
      </Svg>
    </Animated.View>
  );
});

export default AnimatedGestionIcon;

