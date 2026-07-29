import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, Animated, Easing, Platform, StatusBar as RNStatusBar } from 'react-native';

export default function SplashScreen({ isReady, onAnimationFinish }) {
  const isWeb = Platform.OS === 'web';
  const useNativeDriver = !isWeb;
  const hasFinishedRef = useRef(false);

  // Animation drivers
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  const triggerFinish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNativeDriver,
    }).start(() => {
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    });

    // Fallback if animation callback doesn't fire on web
    setTimeout(() => {
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    }, 400);
  };

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: useNativeDriver,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: useNativeDriver,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: useNativeDriver,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 150,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: useNativeDriver,
      }),
    ]).start();

    // 2. Pulse aura loop
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNativeDriver,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNativeDriver,
        }),
      ])
    );
    pulseAnimation.start();

    // Safety fallback timer: auto-finish after max 1500ms even if DB status is delayed
    const maxSafetyTimer = setTimeout(() => {
      triggerFinish();
    }, 1500);

    return () => {
      pulseAnimation.stop();
      clearTimeout(maxSafetyTimer);
    };
  }, []);

  // When database is ready
  useEffect(() => {
    if (isReady) {
      const finishTimer = setTimeout(() => {
        triggerFinish();
      }, 500);

      return () => clearTimeout(finishTimer);
    }
  }, [isReady]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {Platform.OS === 'android' && (
        <RNStatusBar backgroundColor="#002cf7" barStyle="light-content" translucent />
      )}
      <View style={styles.centerContent}>
        
        {/* Pulsing Aura Ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale }],
            },
          ]}
        />

        {/* Logo Badge Container */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoBadgeInner}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Brand Title & Tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>KLIN UP</Text>
          <View style={styles.badgeLine}>
            <Text style={styles.brandSub}>PRESSING & LAVERIE AUTOMATIQUE</Text>
          </View>
        </Animated.View>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002cf7', // Solid unified blue background
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  logoBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 6,
  },
  badgeLine: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
});
