import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  Easing,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { Check, X } from 'lucide-react-native';

/**
 * StatefulButton (Adapted for React Native from beui.dev/components/motion/button)
 *
 * Modern tactile action button with animated states:
 * - States: "idle" | "loading" | "success" | "error"
 * - Smooth vertical slide swap for text labels
 * - Expanding/collapsing animated icon slot
 * - Tactile spring scale on press
 * - Micro-haptics on press & success
 * - 100% backward-compatible alias for SlideActionButton
 */
export function StatefulButton({
  state: controlledState,
  children = 'Confirmer',
  loadingText = 'En cours...',
  successText = 'Validé !',
  errorText = 'Réessayer',
  completeLabel,
  icon,
  thumbIcon,
  onPress,
  onComplete,
  color = '#4f46e5',
  isDarkMode = false,
  disabled = false,
  height = 42,
  resetDelay = 1200,
  minLoadingDuration = 1500,
  style,
  ...props
}) {
  // ── Uncontrolled internal state support ─────────────────────────────────────
  const [internalState, setInternalState] = useState('idle');
  const currentState = controlledState || internalState;
  const isBusy = currentState === 'loading';
  const isDisabled = disabled || isBusy;

  // Format label text cleanly (strips legacy "Glisser pour " prefixes automatically)
  const formatText = useCallback((text) => {
    if (typeof text !== 'string') return text;
    let cleaned = text.trim();
    if (/^glisser pour\s+/i.test(cleaned)) {
      cleaned = cleaned.replace(/^glisser pour\s+/i, '');
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
  }, []);

  const displaySuccessText = completeLabel || successText;

  // ── Snapshot of active action props ──────────────────────────────────────────
  // Freezes props (labels, icon, color) for the duration of the action (loading + success)
  // so background parent re-renders don't flash or preview the subsequent action.
  const activePropsRef = useRef(null);
  const isActionActive = internalState === 'loading' || internalState === 'success' || internalState === 'error';
  const effectiveProps = (isActionActive && activePropsRef.current) ? activePropsRef.current : {
    children,
    loadingText,
    displaySuccessText,
    errorText,
    color,
    icon: icon || thumbIcon,
  };

  // Determine current active text based on state
  const currentLabel = useMemo(() => {
    switch (currentState) {
      case 'loading':
        return effectiveProps.loadingText;
      case 'success':
        return effectiveProps.displaySuccessText;
      case 'error':
        return effectiveProps.errorText;
      default:
        return formatText(children);
    }
  }, [currentState, effectiveProps, formatText, children]);

  // ── Animated values ───────────────────────────────────────────────────────────
  const pressScale = useRef(new Animated.Value(1)).current;
  const textTranslateY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;

  const previousState = useRef(currentState);
  const resetTimerRef = useRef(null);

  // ── Haptic feedback helper ───────────────────────────────────────────────────
  const triggerHaptic = useCallback((type = 'tick') => {
    try {
      if (Platform.OS === 'web') return;
      if (type === 'tick') Vibration.vibrate(6);
      else if (type === 'success') Vibration.vibrate([0, 15, 60, 25]);
      else if (type === 'error') Vibration.vibrate([0, 30, 40, 30]);
    } catch (e) { /* graceful fallback */ }
  }, []);

  // ── Transition animation on state change ─────────────────────────────────────
  useEffect(() => {
    if (previousState.current !== currentState) {
      previousState.current = currentState;

      // Vertical text swap: slide down & out, then in from top
      Animated.sequence([
        Animated.parallel([
          Animated.timing(textTranslateY, {
            toValue: -8,
            duration: 90,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(iconScale, {
            toValue: 0.6,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(iconOpacity, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(textTranslateY, {
            toValue: 8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(textTranslateY, {
            toValue: 0,
            damping: 15,
            stiffness: 280,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 140,
            useNativeDriver: true,
          }),
          Animated.spring(iconScale, {
            toValue: 1,
            damping: 13,
            stiffness: 300,
            useNativeDriver: true,
          }),
          Animated.timing(iconOpacity, {
            toValue: 1,
            duration: 140,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      if (currentState === 'success') {
        triggerHaptic('success');
      } else if (currentState === 'error') {
        triggerHaptic('error');
      }
    }
  }, [currentState, textTranslateY, textOpacity, iconScale, iconOpacity, triggerHaptic]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // ── Press Handlers ───────────────────────────────────────────────────────────
  const handlePressIn = () => {
    if (isDisabled) return;
    Animated.spring(pressScale, {
      toValue: 0.965,
      damping: 14,
      stiffness: 350,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 14,
      stiffness: 350,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    if (isDisabled) return;
    triggerHaptic('tick');

    const action = onPress || onComplete;

    // If controlled, delegate immediately
    if (controlledState !== undefined) {
      if (typeof action === 'function') action();
      return;
    }

    // Freeze active props snapshot so incoming prop changes from parent re-renders
    // (such as order status updating in background) do not overwrite or preview the next action!
    activePropsRef.current = {
      children,
      loadingText,
      displaySuccessText: completeLabel || successText,
      errorText,
      color,
      icon: icon || thumbIcon,
    };

    // Uncontrolled state machine: idle -> loading -> success -> idle
    setInternalState('loading');
    const startTime = Date.now();

    try {
      if (action) {
        const result = action();
        if (result && typeof result.then === 'function') {
          const res = await result;
          if (res === false) {
            activePropsRef.current = null;
            setInternalState('idle');
            return;
          }
        }
      }

      // Guarantee minimum spinner duration (smooth feedback)
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingDuration - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setInternalState('success');

      if (resetDelay > 0) {
        resetTimerRef.current = setTimeout(() => {
          activePropsRef.current = null;
          setInternalState('idle');
        }, resetDelay);
      } else {
        activePropsRef.current = null;
        setInternalState('idle');
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingDuration - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setInternalState('error');
      if (resetDelay > 0) {
        resetTimerRef.current = setTimeout(() => {
          activePropsRef.current = null;
          setInternalState('idle');
        }, resetDelay);
      } else {
        activePropsRef.current = null;
        setInternalState('idle');
      }
    }
  };

  // ── Active Background Color ──────────────────────────────────────────────────
  const buttonColor = useMemo(() => {
    if (disabled) return isDarkMode ? '#334155' : '#94a3b8';
    if (currentState === 'success') return '#059669'; // Emerald success
    if (currentState === 'error') return '#dc2626'; // Red error
    return effectiveProps.color || color;
  }, [disabled, currentState, effectiveProps.color, color, isDarkMode]);

  // ── Icon rendering ───────────────────────────────────────────────────────────
  const renderIcon = () => {
    if (currentState === 'loading') {
      return <ActivityIndicator size="small" color="#ffffff" style={styles.iconElement} />;
    }
    if (currentState === 'success') {
      return <Check size={18} color="#ffffff" strokeWidth={3} style={styles.iconElement} />;
    }
    if (currentState === 'error') {
      return <X size={18} color="#ffffff" strokeWidth={3} style={styles.iconElement} />;
    }

    // Idle state: custom icon or thumbIcon
    const activeIcon = effectiveProps.icon || icon || thumbIcon;
    if (activeIcon && React.isValidElement(activeIcon)) {
      return React.cloneElement(activeIcon, {
        color: '#ffffff',
        size: activeIcon.props.size || 17,
        strokeWidth: activeIcon.props.strokeWidth || 2.4,
        style: [activeIcon.props.style, styles.iconElement],
      });
    }

    return null;
  };

  return (
    <Animated.View style={[{ transform: [{ scale: pressScale }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled}
        style={[
          styles.button,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: buttonColor,
            shadowColor: buttonColor,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        {...props}
      >
        <View style={styles.contentRow}>
          {/* Animated Icon Slot */}
          <Animated.View
            style={[
              styles.iconSlot,
              {
                transform: [{ scale: iconScale }],
                opacity: iconOpacity,
              },
            ]}
          >
            {renderIcon()}
          </Animated.View>

          {/* Animated Text Slot */}
          <Animated.View
            style={[
              styles.textSlot,
              {
                transform: [{ translateY: textTranslateY }],
                opacity: textOpacity,
              },
            ]}
          >
            <Text numberOfLines={1} style={styles.labelText}>
              {currentLabel}
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.26,
    shadowRadius: 6,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconElement: {
    marginRight: 8,
  },
  textSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.25,
    textAlign: 'center',
  },
});

// Full backward-compatible exports
export const SlideActionButton = StatefulButton;
export default StatefulButton;
