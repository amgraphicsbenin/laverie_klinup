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
} from 'react-native';
import { Check, X } from 'lucide-react-native';

/*
 *  StatefulButton — Style ButtonRoot + SpinnerRoot
 *
 *  idle:     [Icon] Label           — pleine opacité, cliquable
 *  pending:  [Spinner] Label        — opacité réduite, non cliquable
 *  success:  [✓] Label              — couleur verte
 *  error:    [✗] Label              — couleur rouge
 */

// ── Spinner : arc rotatif simple ───────────────────────────────────────────
function Spinner({ size = 15, color = '#ffffff', strokeWidth = 2 }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1, duration: 650, easing: Easing.linear, useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  return (
    <Animated.View
      style={{
        marginRight: 7,
        transform: [{
          rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
        }],
      }}
    >
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: color,
        }}
      />
    </Animated.View>
  );
}

// ── StatefulButton ─────────────────────────────────────────────────────────
export function StatefulButton({
  state: controlledState,
  children = 'Confirmer',
  loadingText = 'En cours…',
  indeterminateText,
  completionLabel = 'Toucher pour valider',
  successText = 'Validé !',
  errorText = 'Réessayer',
  completeLabel,
  icon, thumbIcon, indeterminateIcon,
  onPress, onComplete, onHumanComplete,
  transitionsToIndeterminate = false,
  persistIntermediate = false,
  color = '#4f46e5',
  isDarkMode = false,
  disabled = false,
  height = 42,
  resetDelay = 1200,
  minLoadingDuration = 1500,
  style,
  ...props
}) {
  const goesIndeterminate = transitionsToIndeterminate || persistIntermediate || !!indeterminateText;

  // ── State machine ──────────────────────────────────────────────────────
  const [internalState, setInternalState] = useState('idle');
  const [optimisticState, setOptimisticState] = useState(null);

  useEffect(() => {
    if (optimisticState === null || controlledState === undefined) return;
    if (controlledState !== 'idle') setOptimisticState(null);
  }, [controlledState, optimisticState]);

  const currentState = optimisticState || controlledState || internalState;
  const isIndeterminate = currentState === 'indeterminate' || currentState === 'in_progress';
  const isBusy = currentState === 'loading';
  const isPending = isIndeterminate || isBusy;
  const isDisabled = disabled || isBusy;

  // ── Label ──────────────────────────────────────────────────────────────
  const formatText = useCallback((t) => {
    if (typeof t !== 'string') return t;
    let c = t.trim();
    if (/^glisser pour\s+/i.test(c)) {
      c = c.replace(/^glisser pour\s+/i, '');
      c = c.charAt(0).toUpperCase() + c.slice(1);
    }
    return c;
  }, []);

  const displaySuccessText = completeLabel || successText;
  const activePropsRef = useRef(null);
  const isActionActive =
    internalState === 'indeterminate' || optimisticState === 'indeterminate' ||
    internalState === 'loading' || internalState === 'success' || internalState === 'error';

  const effectiveProps = (isActionActive && activePropsRef.current) ? activePropsRef.current : {
    children, loadingText, indeterminateText: indeterminateText || loadingText,
    completionLabel, displaySuccessText, errorText, color,
    icon: icon || thumbIcon, indeterminateIcon,
  };

  const currentLabel = useMemo(() => {
    switch (currentState) {
      case 'indeterminate': case 'in_progress':
        return effectiveProps.indeterminateText || effectiveProps.loadingText || 'En cours…';
      case 'loading':  return effectiveProps.loadingText;
      case 'success':  return effectiveProps.displaySuccessText;
      case 'error':    return effectiveProps.errorText;
      default:         return formatText(children);
    }
  }, [currentState, effectiveProps, formatText, children]);

  const resetTimerRef = useRef(null);

  // ── Haptics ────────────────────────────────────────────────────────────
  const triggerHaptic = useCallback((type = 'tick') => {
    try {
      if (Platform.OS === 'web') return;
      if (type === 'tick')         Vibration.vibrate(6);
      else if (type === 'success') Vibration.vibrate([0, 15, 60, 25]);
      else if (type === 'error')   Vibration.vibrate([0, 30, 40, 30]);
    } catch (_) {}
  }, []);

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  // ── Haptic feedback on state change ────────────────────────────────────
  const prevStateRef = useRef(currentState);
  useEffect(() => {
    if (prevStateRef.current === currentState) return;
    prevStateRef.current = currentState;
    if (currentState === 'success') triggerHaptic('success');
    else if (currentState === 'error') triggerHaptic('error');
  }, [currentState, triggerHaptic]);

  // ── Press ──────────────────────────────────────────────────────────────
  const handlePress = async () => {
    if (isDisabled) return;
    triggerHaptic('tick');

    if (isIndeterminate) {
      const handler = onHumanComplete || onComplete;
      setOptimisticState('loading');
      setInternalState('loading');
      try {
        if (typeof handler === 'function') {
          const res = handler();
          if (res && typeof res.then === 'function') {
            const r = await res;
            if (r === false) { setOptimisticState(null); setInternalState('indeterminate'); return; }
          }
        }
        triggerHaptic('success');
        setOptimisticState('success'); setInternalState('success');
        scheduleReset();
      } catch (_) {
        triggerHaptic('error');
        setOptimisticState(null); setInternalState('error');
        scheduleReset();
      }
      return;
    }

    activePropsRef.current = {
      children, loadingText, indeterminateText: indeterminateText || loadingText,
      completionLabel, displaySuccessText: completeLabel || successText,
      errorText, color, icon: icon || thumbIcon, indeterminateIcon,
    };
    const action = onPress || onComplete;

    if (goesIndeterminate) {
      setOptimisticState('indeterminate'); setInternalState('indeterminate');
      if (typeof action === 'function') {
        try {
          const result = action();
          if (result && typeof result.then === 'function') {
            const res = await result;
            if (res === false) { activePropsRef.current = null; setOptimisticState(null); setInternalState('idle'); }
          }
        } catch (_) {
          triggerHaptic('error'); activePropsRef.current = null;
          setOptimisticState(null); setInternalState('error'); scheduleReset();
        }
      }
      return;
    }

    if (controlledState !== undefined) { if (typeof action === 'function') action(); return; }

    setInternalState('loading');
    const t0 = Date.now();
    try {
      if (action) {
        const result = action();
        if (result && typeof result.then === 'function') {
          const res = await result;
          if (res === false) { activePropsRef.current = null; setInternalState('idle'); return; }
        }
      }
      const w = Math.max(0, minLoadingDuration - (Date.now() - t0));
      if (w > 0) await new Promise(r => setTimeout(r, w));
      setInternalState('success'); scheduleReset();
    } catch (_) {
      const w = Math.max(0, minLoadingDuration - (Date.now() - t0));
      if (w > 0) await new Promise(r => setTimeout(r, w));
      setInternalState('error'); scheduleReset();
    }
  };

  const scheduleReset = useCallback(() => {
    if (resetDelay > 0) {
      resetTimerRef.current = setTimeout(() => {
        activePropsRef.current = null; setOptimisticState(null); setInternalState('idle');
      }, resetDelay);
    } else {
      activePropsRef.current = null; setOptimisticState(null); setInternalState('idle');
    }
  }, [resetDelay]);

  // ── Derived ────────────────────────────────────────────────────────────
  const bgColor = useMemo(() => {
    if (disabled) return isDarkMode ? '#334155' : '#94a3b8';
    if (currentState === 'success') return '#059669';
    if (currentState === 'error')   return '#dc2626';
    return effectiveProps.color || color;
  }, [disabled, currentState, effectiveProps.color, color, isDarkMode]);

  // ── Icon ───────────────────────────────────────────────────────────────
  const renderLeading = () => {
    if (isPending) return <Spinner size={15} color="#ffffff" strokeWidth={2} />;
    if (currentState === 'success') return <Check size={16} color="#fff" strokeWidth={3} style={s.mr} />;
    if (currentState === 'error')   return <X size={16} color="#fff" strokeWidth={3} style={s.mr} />;
    const ic = effectiveProps.icon || icon || thumbIcon;
    if (ic && React.isValidElement(ic)) {
      return React.cloneElement(ic, {
        color: '#fff', size: ic.props.size || 16,
        strokeWidth: ic.props.strokeWidth || 2.4,
        style: [ic.props.style, s.mr],
      });
    }
    return null;
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: bgColor,
          shadowColor: bgColor,
          opacity: disabled ? 0.5 : isPending ? 0.8 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...props}
    >
      <View style={s.row}>
        {renderLeading()}
        <View style={s.labels}>
          <Text numberOfLines={1} style={s.label}>{currentLabel}</Text>
          {isIndeterminate && effectiveProps.completionLabel ? (
            <Text numberOfLines={1} style={s.hint}>{effectiveProps.completionLabel}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mr: { marginRight: 7 },
  labels: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
});

export const SlideActionButton = StatefulButton;
export default StatefulButton;
