// SplashScreen.web.js — Dynamic Antigravity Morphing Splash Screen (Continuous Fluid Web Version)
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Image,
  Animated, Easing,
} from 'react-native';

export default function SplashScreen({ isReady, onAnimationFinish }) {
  const hasFinishedRef = useRef(false);
  const pulseLoopRef   = useRef(null);
  const isCollapsedRef = useRef(false);

  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale   = useRef(new Animated.Value(1)).current;

  const textTranslateX   = useRef(new Animated.Value(0)).current;
  const textOpacity      = useRef(new Animated.Value(1)).current;

  const badgeScale       = useRef(new Animated.Value(1)).current;
  const badgeOpacity     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(badgeOpacity, {
      toValue: 1, duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        collapseText();
      }, 300);
    });

    const safety = setTimeout(() => finishSequence(), 3800);
    return () => {
      clearTimeout(safety);
      if (pulseLoopRef.current) pulseLoopRef.current.stop();
    };
  }, []);

  const collapseText = () => {
    Animated.parallel([
      Animated.timing(textTranslateX, {
        toValue: -90,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      isCollapsedRef.current = true;
      startPulse();
      if (isReady && !hasFinishedRef.current) {
        setTimeout(() => finishSequence(), 700);
      }
    });
  };

  const startPulse = () => {
    if (hasFinishedRef.current) return;
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 0.92,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(badgeScale, {
          toValue: 1.05,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(badgeScale, {
          toValue: 1.0,
          duration: 350,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    pulseLoopRef.current.start();
  };

  const finishSequence = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    if (pulseLoopRef.current) pulseLoopRef.current.stop();

    Animated.parallel([
      Animated.spring(badgeScale, {
        toValue: 1, friction: 7, tension: 45,
        useNativeDriver: false,
      }),
      Animated.timing(textTranslateX, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: false,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(containerScale, {
          toValue: 1.06,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        if (onAnimationFinish) onAnimationFinish();
      });
    });
  };

  useEffect(() => {
    if (isReady && isCollapsedRef.current && !hasFinishedRef.current) {
      const t = setTimeout(() => {
        finishSequence();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isReady]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      <Animated.View style={[styles.lockupRow, { opacity: badgeOpacity }]}>
        <Animated.View
          style={[
            styles.badgeWrapper,
            { transform: [{ scale: badgeScale }] },
          ]}
        >
          <View style={styles.badgeInner}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.badgeImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textWrapper,
            {
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }],
            },
          ]}
        >
          <Text style={styles.brandText}>KLIN UP</Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const BADGE_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002cf7',
  },
  lockupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    zIndex: 10,
    elevation: 10,
  },
  badgeInner: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE * 0.24,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(0, 0, 0, 0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeImage: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },
  textWrapper: {
    zIndex: 5,
    marginLeft: 14,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
