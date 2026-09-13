"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

const AdaptiveStepperContext = createContext(null);

export function useAdaptiveStepperContext(component = 'AdaptiveStepper') {
  const context = useContext(AdaptiveStepperContext);
  if (!context) {
    throw new Error(`${component} must be used within <AdaptiveStepper>`);
  }
  return context;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * AdaptiveStepper
 * 
 * Composable numeric stepper whose fixed footprint adapts at its minimum and maximum
 * while the value rolls between steps with spring animations.
 */
export function AdaptiveStepper({
  children,
  value: controlledValue,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  disabled = false,
  formatValueText,
  isDarkMode = false,
  size = 'sm', // 'sm' | 'md'
  style,
  className,
  'aria-label': ariaLabel = 'Quantité',
  ...props
}) {
  const isControlled = controlledValue !== undefined;
  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max) ? max : 99;
  const stride = Number.isFinite(step) && step > 0 ? step : 1;

  const [internalValue, setInternalValue] = useState(() =>
    clamp(Number.isFinite(defaultValue) ? defaultValue : lower, lower, upper)
  );

  const currentValue = clamp(
    Number.isFinite(isControlled ? controlledValue : internalValue)
      ? (isControlled ? controlledValue : internalValue)
      : lower,
    lower,
    upper
  );

  const prevValueRef = useRef(currentValue);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (currentValue !== prevValueRef.current) {
      setDirection(currentValue > prevValueRef.current ? 1 : -1);
      prevValueRef.current = currentValue;
    }
  }, [currentValue]);

  const commit = useCallback(
    (nextVal) => {
      const clamped = clamp(nextVal, lower, upper);
      if (clamped === currentValue) return;
      if (!isControlled) {
        setInternalValue(clamped);
      }
      onValueChange?.(clamped);
    },
    [currentValue, isControlled, lower, onValueChange, upper]
  );

  const decrement = useCallback(() => {
    if (disabled || currentValue <= lower) return;
    commit(currentValue - stride);
  }, [commit, currentValue, disabled, lower, stride]);

  const increment = useCallback(() => {
    if (disabled || currentValue >= upper) return;
    commit(currentValue + stride);
  }, [commit, currentValue, disabled, upper, stride]);

  const atMin = currentValue <= lower;
  const atMax = currentValue >= upper;

  const contextValue = useMemo(
    () => ({
      value: currentValue,
      valueText: formatValueText ? formatValueText(currentValue) : String(currentValue),
      direction,
      atMin,
      atMax,
      min: lower,
      max: upper,
      disabled,
      isDarkMode,
      size,
      decrement,
      increment,
    }),
    [atMax, atMin, currentValue, decrement, direction, disabled, formatValueText, increment, isDarkMode, lower, size, upper]
  );

  const isSmall = size === 'sm';
  const containerHeight = isSmall ? 34 : 40;

  return (
    <AdaptiveStepperContext.Provider value={contextValue}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={ariaLabel}
        accessibilityValue={{ min: lower, max: upper, now: currentValue }}
        style={[
          styles.container,
          {
            height: containerHeight,
            backgroundColor: isDarkMode ? '#1f1f23' : '#f4f4f5',
            borderColor: isDarkMode ? '#333338' : '#e4e4e7',
          },
          disabled && styles.containerDisabled,
          style,
        ]}
        {...props}
      >
        {children || (
          <>
            <AdaptiveStepperDecrement />
            <AdaptiveStepperValue />
            <AdaptiveStepperIncrement />
          </>
        )}
      </View>
    </AdaptiveStepperContext.Provider>
  );
}

/**
 * AdaptiveStepperDecrement
 * 
 * Decreases value. Smoothly adapts and collapses into the pill when value is at minimum.
 */
export function AdaptiveStepperDecrement({ style, ...props }) {
  const { atMin, decrement, disabled, isDarkMode, size } = useAdaptiveStepperContext('AdaptiveStepperDecrement');
  const isSmall = size === 'sm';
  const btnSize = isSmall ? 28 : 34;

  const animWidth = useRef(new Animated.Value(atMin ? 0 : btnSize)).current;
  const animOpacity = useRef(new Animated.Value(atMin ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animWidth, {
        toValue: atMin ? 0 : btnSize,
        damping: 18,
        stiffness: 220,
        useNativeDriver: false,
      }),
      Animated.timing(animOpacity, {
        toValue: atMin ? 0 : 1,
        duration: 140,
        useNativeDriver: false,
      }),
    ]).start();
  }, [atMin, btnSize]);

  return (
    <Animated.View
      style={[
        {
          width: animWidth,
          opacity: animOpacity,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <TouchableOpacity
        onPress={decrement}
        disabled={disabled || atMin}
        activeOpacity={0.65}
        accessibilityLabel="Diminuer la quantité"
        style={[
          styles.actionBtn,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
          },
          style,
        ]}
        {...props}
      >
        <Minus
          size={isSmall ? 13 : 15}
          color={isDarkMode ? (atMin ? '#52525b' : '#f4f4f5') : (atMin ? '#a1a1aa' : '#18181b')}
          strokeWidth={2.6}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * AdaptiveStepperIncrement
 * 
 * Increases value. Smoothly adapts and collapses into the pill when value is at maximum.
 */
export function AdaptiveStepperIncrement({ style, ...props }) {
  const { atMax, increment, disabled, isDarkMode, size } = useAdaptiveStepperContext('AdaptiveStepperIncrement');
  const isSmall = size === 'sm';
  const btnSize = isSmall ? 28 : 34;

  const animWidth = useRef(new Animated.Value(atMax ? 0 : btnSize)).current;
  const animOpacity = useRef(new Animated.Value(atMax ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animWidth, {
        toValue: atMax ? 0 : btnSize,
        damping: 18,
        stiffness: 220,
        useNativeDriver: false,
      }),
      Animated.timing(animOpacity, {
        toValue: atMax ? 0 : 1,
        duration: 140,
        useNativeDriver: false,
      }),
    ]).start();
  }, [atMax, btnSize]);

  return (
    <Animated.View
      style={[
        {
          width: animWidth,
          opacity: animOpacity,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <TouchableOpacity
        onPress={increment}
        disabled={disabled || atMax}
        activeOpacity={0.65}
        accessibilityLabel="Augmenter la quantité"
        style={[
          styles.actionBtn,
          {
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.25)' : '#002cf7',
          },
          style,
        ]}
        {...props}
      >
        <Plus
          size={isSmall ? 13 : 15}
          color="#ffffff"
          strokeWidth={2.6}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * AdaptiveStepperValue
 * 
 * Displays the current value with a rolling slot-machine transition.
 */
export function AdaptiveStepperValue({ children, style, ...props }) {
  const { value, valueText, direction, atMin, atMax, isDarkMode, size } = useAdaptiveStepperContext('AdaptiveStepperValue');
  const isSmall = size === 'sm';

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const [displayedValue, setDisplayedValue] = useState(value);

  useEffect(() => {
    if (value !== displayedValue) {
      const enterOffset = direction > 0 ? 14 : -14;
      const exitOffset = direction > 0 ? -14 : 14;

      // Animate current out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: exitOffset,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.1,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setDisplayedValue(value);
        translateY.setValue(enterOffset);
        // Animate new in
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            damping: 15,
            stiffness: 220,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 140,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      });
    }
  }, [value, direction]);

  const renderContent = typeof children === 'function' ? children(displayedValue) : (children ?? displayedValue);

  return (
    <View
      style={[
        styles.valueContainer,
        {
          paddingHorizontal: atMin || atMax ? 10 : 8,
          minWidth: isSmall ? 36 : 44,
        },
        style,
      ]}
      {...props}
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={[
            styles.valueText,
            {
              fontSize: isSmall ? 13.5 : 15,
              color: isDarkMode ? '#ffffff' : '#09090b',
            },
          ]}
        >
          {renderContent}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 3,
    paddingVertical: 2,
    alignSelf: 'flex-end',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  valueText: {
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});

export default AdaptiveStepper;

