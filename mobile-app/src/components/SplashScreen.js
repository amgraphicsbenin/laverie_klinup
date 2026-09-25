import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Premium Modern Splash Screen for Pressing Pro
 * Features:
 * - Fluid entrance and breathing animations
 * - Ambient radial gradient glow (cross-platform Android, iOS & Web compatible)
 * - Precision typography and brand hierarchy
 * - Smooth capsule progress indicator (rock-solid width interpolation)
 * - Seamless exit dissolve transition into the app
 * - Guaranteed fail-safe timeouts to prevent stuck screens on any mobile OS
 * - Full Dark Mode & Light Mode support
 */
export default function SplashScreen({
  isReady = false,
  isDarkMode = false,
  onFinish = () => {},
  minDisplayTime = 1600,
}) {
  const [statusText, setStatusText] = useState('Initialisation de votre espace...');
  const [canExit, setCanExit] = useState(false);
  const finishedRef = useRef(false);

  // Animated values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(18)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.92)).current;
  const haloOpacity = useRef(new Animated.Value(0.3)).current;
  const progressAnim = useRef(new Animated.Value(0.05)).current;

  const useNative = Platform.OS !== 'web';

  const safeFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (typeof onFinish === 'function') {
      onFinish();
    }
  };

  // 1. Entrance animation sequence
  useEffect(() => {
    Animated.parallel([
      // Logo spring entrance
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: useNative,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
      // Content slide & fade in
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 550,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
    ]).start();

    // Ambient pulsing glow loop
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 1.15,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: useNative,
          }),
          Animated.timing(haloOpacity, {
            toValue: isDarkMode ? 0.6 : 0.45,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: useNative,
          }),
        ]),
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 0.92,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: useNative,
          }),
          Animated.timing(haloOpacity, {
            toValue: isDarkMode ? 0.25 : 0.2,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: useNative,
          }),
        ]),
      ])
    );
    haloLoop.start();

    // Progress bar animation to 85%
    Animated.timing(progressAnim, {
      toValue: 0.85,
      duration: minDisplayTime,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Status step messages
    const t1 = setTimeout(() => {
      setStatusText('Synchronisation sécurisée...');
    }, 600);

    const t2 = setTimeout(() => {
      setStatusText('Chargement des données...');
    }, 1200);

    const t3 = setTimeout(() => {
      setCanExit(true);
    }, minDisplayTime);

    // Absolute fallback: force finish after max 3.2s so splash never stays stuck
    const safetyTimer = setTimeout(() => {
      safeFinish();
    }, Math.max(3000, minDisplayTime + 1200));

    return () => {
      haloLoop.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(safetyTimer);
    };
  }, []);

  // 2. Trigger exit transition when backend is ready and minimum display time elapsed
  useEffect(() => {
    if (isReady && canExit && !finishedRef.current) {
      setStatusText('Prêt !');
      // Finish progress bar to 100%
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start(() => {
        // Dissolve exit animation
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: useNative,
          }),
          Animated.timing(contentScale, {
            toValue: 1.05,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: useNative,
          }),
        ]).start(() => {
          safeFinish();
        });
      });
    }
  }, [isReady, canExit]);

  const bgColor = isDarkMode ? '#08080a' : '#ffffff';
  const subtextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const trackBg = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 44, 247, 0.08)';

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          opacity: containerOpacity,
        },
      ]}
    >
      {/* Background Ambient Glow Halo using smooth LinearGradient (cross-platform) */}
      <Animated.View
        style={[
          styles.ambientHaloWrapper,
          {
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      >
        <LinearGradient
          colors={
            isDarkMode
              ? ['rgba(0, 44, 247, 0.22)', 'rgba(0, 44, 247, 0.06)', 'transparent']
              : ['rgba(0, 44, 247, 0.12)', 'rgba(0, 44, 247, 0.03)', 'transparent']
          }
          style={styles.ambientHaloGradient}
        />
      </Animated.View>

      {/* Center Branding Content */}
      <Animated.View
        style={[
          styles.centerBox,
          {
            transform: [{ scale: contentScale }],
          },
        ]}
      >
        {/* Animated Brand Icon */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              backgroundColor: isDarkMode ? '#121216' : '#ffffff',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 44, 247, 0.12)',
              shadowColor: '#002cf7',
            },
          ]}
        >
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Titles & Taglines */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <View style={styles.brandTitleRow}>
            <Text style={[styles.brandTitle, { color: '#002cf7' }]}>PRESSING</Text>
            <Text style={[styles.brandTitle, { color: isDarkMode ? '#ffffff' : '#09090b', marginLeft: 6 }]}>PRO</Text>
          </View>

          <Text style={[styles.brandSubtitle, { color: subtextColor }]}>
            PRESSING & BLANCHISSERIE PROFESSIONNELLE
          </Text>

          {/* Capsule Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Dynamic Status Text */}
          <Text style={[styles.statusText, { color: isDarkMode ? '#71717a' : '#94a3b8' }]}>
            {statusText}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Footer Meta Badge */}
      <Animated.View style={[styles.footerContainer, { opacity: contentOpacity }]}>
        <View style={[styles.versionPill, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
          <View style={styles.statusDot} />
          <Text style={[styles.footerText, { color: isDarkMode ? '#52525b' : '#94a3b8' }]}>
            PRESSING PRO OS • v1.0.0
          </Text>
        </View>
      </Animated.View>
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
    elevation: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ambientHaloWrapper: {
    position: 'absolute',
    width: 360,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  ambientHaloGradient: {
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  iconWrapper: {
    width: 104,
    height: 104,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  logoImage: {
    width: 74,
    height: 74,
  },
  textContainer: {
    alignItems: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    textAlign: 'center',
    marginBottom: 28,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: 140,
    height: 4,
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#002cf7',
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    height: 18,
  },
  footerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 28,
    alignItems: 'center',
    zIndex: 10,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
