"use client";
// Adapted for React Native & React Native Web from beui.dev/components/motion/scroll-animation

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  ScrollView as RNScrollView,
  FlatList as RNFlatList,
  Platform,
  Animated,
} from 'react-native';

/**
 * Lenis' own expo-out curve — the canonical smooth-scroll easing function.
 * (t: number [0..1]) => number
 */
export const EASE_SCROLL = (t) => Math.min(1, 1.001 - 2 ** (-10 * t));

/**
 * Context fournissant les métriques de scroll temps-réel et la fonction scrollTo
 */
export const SmoothScrollContext = createContext({
  scrollY: 0,
  progress: 0,
  velocity: 0,
  scrollTo: () => {},
});

/**
 * Hook pour lire l'état du défilement fluide
 */
export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

/**
 * Moteur de défilement fluide Web avec physique Lenis (inertie, lerp et courbe exponentielle)
 */
function useWebSmoothScrollEngine({
  scrollRef,
  enabled = true,
  lerp = 0.1,
  wheelMultiplier = 1,
  onScrollMetrics,
}) {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    let targetNode = null;
    const refCurrent = scrollRef.current;
    if (refCurrent) {
      targetNode = typeof refCurrent.getScrollableNode === 'function'
        ? refCurrent.getScrollableNode()
        : refCurrent;
    }

    if (!targetNode || typeof targetNode.addEventListener !== 'function') return;

    let currentY = targetNode.scrollTop;
    let targetY = targetNode.scrollTop;
    let rafId = null;
    let lastTime = performance.now();

    const handleWheel = (e) => {
      // Ignore si shift est pressé (scroll horizontal)
      if (e.shiftKey) return;

      const maxScroll = Math.max(0, targetNode.scrollHeight - targetNode.clientHeight);
      if (maxScroll <= 0) return;

      // Empêche le saut brutal natif du navigateur
      e.preventDefault();

      // Accumule le déplacement cible avec le multiplicateur
      const delta = e.deltaY * wheelMultiplier;
      targetY = Math.max(0, Math.min(maxScroll, targetY + delta));

      if (!rafId) {
        lastTime = performance.now();
        const update = (now) => {
          const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
          lastTime = now;

          const diff = targetY - currentY;
          if (Math.abs(diff) < 0.5) {
            currentY = targetY;
            targetNode.scrollTop = currentY;
            rafId = null;
            if (onScrollMetrics) {
              onScrollMetrics(currentY, maxScroll, 0);
            }
            return;
          }

          // Formule d'interpolation fluide frame-rate indépendante (Lenis lerp)
          const lerpFactor = 1 - Math.exp(-lerp * 60 * dt);
          currentY += diff * lerpFactor;
          targetNode.scrollTop = currentY;

          const frameVelocity = diff * lerpFactor;
          if (onScrollMetrics) {
            onScrollMetrics(currentY, maxScroll, frameVelocity);
          }

          rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);
      }
    };

    // Synchronise la cible quand l'utilisateur touche l'écran ou utilise la barre de défilement
    const handleNativeScroll = () => {
      if (!rafId) {
        currentY = targetNode.scrollTop;
        targetY = targetNode.scrollTop;
        const maxScroll = Math.max(1, targetNode.scrollHeight - targetNode.clientHeight);
        if (onScrollMetrics) {
          onScrollMetrics(currentY, maxScroll, 0);
        }
      }
    };

    targetNode.addEventListener('wheel', handleWheel, { passive: false });
    targetNode.addEventListener('scroll', handleNativeScroll, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      targetNode.removeEventListener('wheel', handleWheel);
      targetNode.removeEventListener('scroll', handleNativeScroll);
    };
  }, [enabled, scrollRef, lerp, wheelMultiplier, onScrollMetrics]);
}

/**
 * SmoothScrollView : Composant de défilement vertical enrichi
 * - Sur Web : Défilement ultra-fluide avec physique Lenis (lerp & courbe expo-out).
 * - Sur Mobile (iOS/Android) : Physique inertielle native optimisée (60/120fps, momentum, rebond).
 * - Fournit les métriques (scrollY, progress 0..1, velocity) et la méthode scrollTo.
 */
export const SmoothScrollView = forwardRef(function SmoothScrollView(
  {
    children,
    lerp = 0.1,
    duration = 1.2,
    wheelMultiplier = 1,
    showsVerticalScrollIndicator = false,
    decelerationRate = 'normal',
    scrollEventThrottle = 16,
    bounces = true,
    overScrollMode = 'always',
    onScroll,
    style,
    contentContainerStyle,
    ...props
  },
  ref
) {
  const internalRef = useRef(null);
  const [metrics, setMetrics] = useState({ scrollY: 0, progress: 0, velocity: 0 });

  const updateMetrics = useCallback((y, max, vel) => {
    const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    setMetrics({ scrollY: y, progress, velocity: vel });
  }, []);

  // Activer le moteur Lenis sur le web
  useWebSmoothScrollEngine({
    scrollRef: internalRef,
    enabled: true,
    lerp,
    wheelMultiplier,
    onScrollMetrics: updateMetrics,
  });

  // Programmatique scrollTo avec prise en compte de la courbe EASE_SCROLL
  const scrollTo = useCallback((target, options = {}) => {
    const offset = options.offset || 0;
    let targetY = 0;

    if (typeof target === 'number') {
      targetY = target + offset;
    } else if (target === 'top') {
      targetY = 0;
    }

    if (Platform.OS === 'web' && internalRef.current) {
      const node = typeof internalRef.current.getScrollableNode === 'function'
        ? internalRef.current.getScrollableNode()
        : internalRef.current;
      if (node) {
        if (options.immediate) {
          node.scrollTop = targetY;
        } else {
          const startY = node.scrollTop;
          const diff = targetY - startY;
          const startTime = performance.now();
          const totalDuration = (options.duration || duration) * 1000;

          const animateStep = (now) => {
            const elapsed = Math.min(1, (now - startTime) / totalDuration);
            const eased = EASE_SCROLL(elapsed);
            node.scrollTop = startY + diff * eased;

            if (elapsed < 1) {
              requestAnimationFrame(animateStep);
            }
          };
          requestAnimationFrame(animateStep);
        }
        return;
      }
    }

    // Fallback natif
    internalRef.current?.scrollTo({
      y: targetY,
      animated: !options.immediate,
    });
  }, [duration]);

  // Expose toutes les méthodes natives du ScrollView au parent via ref
  useImperativeHandle(ref, () => ({
    scrollTo: (options) => internalRef.current?.scrollTo(options),
    scrollToEnd: (options) => internalRef.current?.scrollToEnd(options),
    flashScrollIndicators: () => internalRef.current?.flashScrollIndicators(),
    getScrollResponder: () => internalRef.current?.getScrollResponder(),
    getScrollableNode: () => internalRef.current?.getScrollableNode?.(),
    smoothScrollTo: scrollTo,
  }));

  const handleNativeScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const contentHeight = e.nativeEvent.contentSize.height;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const max = Math.max(1, contentHeight - layoutHeight);
    const vel = e.nativeEvent.velocity?.y || 0;

    updateMetrics(y, max, vel);

    if (onScroll) {
      onScroll(e);
    }
  };

  const contextValue = useMemo(() => ({
    scrollY: metrics.scrollY,
    progress: metrics.progress,
    velocity: metrics.velocity,
    scrollTo,
  }), [metrics, scrollTo]);

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      <RNScrollView
        ref={internalRef}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        decelerationRate={decelerationRate}
        scrollEventThrottle={scrollEventThrottle}
        bounces={bounces}
        overScrollMode={overScrollMode}
        onScroll={handleNativeScroll}
        style={style}
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </RNScrollView>
    </SmoothScrollContext.Provider>
  );
});

/**
 * SmoothFlatList : Composant FlatList vertical enrichi avec défilement fluide
 */
export const SmoothFlatList = forwardRef(function SmoothFlatList(
  {
    lerp = 0.1,
    duration = 1.2,
    wheelMultiplier = 1,
    showsVerticalScrollIndicator = false,
    decelerationRate = 'normal',
    scrollEventThrottle = 16,
    bounces = true,
    overScrollMode = 'always',
    onScroll,
    ...props
  },
  ref
) {
  const internalRef = useRef(null);
  const [metrics, setMetrics] = useState({ scrollY: 0, progress: 0, velocity: 0 });

  const updateMetrics = useCallback((y, max, vel) => {
    const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    setMetrics({ scrollY: y, progress, velocity: vel });
  }, []);

  useWebSmoothScrollEngine({
    scrollRef: internalRef,
    enabled: true,
    lerp,
    wheelMultiplier,
    onScrollMetrics: updateMetrics,
  });

  const scrollTo = useCallback((target, options = {}) => {
    const offset = options.offset || 0;
    const targetY = typeof target === 'number' ? target + offset : 0;

    if (Platform.OS === 'web' && internalRef.current) {
      const node = typeof internalRef.current.getScrollableNode === 'function'
        ? internalRef.current.getScrollableNode()
        : internalRef.current;
      if (node) {
        if (options.immediate) {
          node.scrollTop = targetY;
        } else {
          const startY = node.scrollTop;
          const diff = targetY - startY;
          const startTime = performance.now();
          const totalDuration = (options.duration || duration) * 1000;

          const animateStep = (now) => {
            const elapsed = Math.min(1, (now - startTime) / totalDuration);
            const eased = EASE_SCROLL(elapsed);
            node.scrollTop = startY + diff * eased;

            if (elapsed < 1) {
              requestAnimationFrame(animateStep);
            }
          };
          requestAnimationFrame(animateStep);
        }
        return;
      }
    }

    internalRef.current?.scrollToOffset({
      offset: targetY,
      animated: !options.immediate,
    });
  }, [duration]);

  useImperativeHandle(ref, () => ({
    scrollToOffset: (options) => internalRef.current?.scrollToOffset(options),
    scrollToIndex: (options) => internalRef.current?.scrollToIndex(options),
    scrollToItem: (options) => internalRef.current?.scrollToItem(options),
    scrollToEnd: (options) => internalRef.current?.scrollToEnd(options),
    flashScrollIndicators: () => internalRef.current?.flashScrollIndicators(),
    getScrollResponder: () => internalRef.current?.getScrollResponder(),
    getScrollableNode: () => internalRef.current?.getScrollableNode?.(),
    smoothScrollTo: scrollTo,
  }));

  const handleNativeScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const contentHeight = e.nativeEvent.contentSize.height;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const max = Math.max(1, contentHeight - layoutHeight);
    const vel = e.nativeEvent.velocity?.y || 0;

    updateMetrics(y, max, vel);

    if (onScroll) {
      onScroll(e);
    }
  };

  const contextValue = useMemo(() => ({
    scrollY: metrics.scrollY,
    progress: metrics.progress,
    velocity: metrics.velocity,
    scrollTo,
  }), [metrics, scrollTo]);

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      <RNFlatList
        ref={internalRef}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        decelerationRate={decelerationRate}
        scrollEventThrottle={scrollEventThrottle}
        bounces={bounces}
        overScrollMode={overScrollMode}
        onScroll={handleNativeScroll}
        {...props}
      />
    </SmoothScrollContext.Provider>
  );
});

/**
 * Provider / Wrapper SmoothScroll générique
 */
export function SmoothScroll({ children, ...props }) {
  return <SmoothScrollView {...props}>{children}</SmoothScrollView>;
}

export default SmoothScrollView;
