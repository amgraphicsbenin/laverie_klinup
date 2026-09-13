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
  StatusBar as RNStatusBar,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Premium Modern Splash Screen for KLIN UP
 * Features:
 * - Fluid entrance and breathing animations
 * - Ambient radial glowing aura
 * - Precision typography and brand hierarchy
 * - Animated capsule progress indicator with dynamic loading phases
 * - Seamless exit dissolve transition into the app
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

  // Animated values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(18)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.88)).current;
  const haloOpacity = useRef(new Animated.Value(0.25)).current;
  const progressScaleX = useRef(new Animated.Value(0.05)).current;

  const useNative = Platform.OS !== 'web';

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
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
      // Content slide & fade in
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 650,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
    ]).start();

    // Ambient pulsing glow loop
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 1.18,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: useNative,
          }),
          Animated.timing(haloOpacity, {
            toValue: isDarkMode ? 0.55 : 0.4,
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
            toValue: isDarkMode ? 0.22 : 0.18,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: useNative,
          }),
        ]),
      ])
    );
    haloLoop.start();

    // Progress bar animation
    Animated.timing(progressScaleX, {
      toValue: 0.85,
      duration: minDisplayTime,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNative,
    }).start();

    // Status step messages
    const t1 = setTimeout(() => {
      setStatusText('Synchronisation sécurisée...');
    }, 700);

    const t2 = setTimeout(() => {
      setStatusText('Chargement des données...');
    }, 1300);

    const t3 = setTimeout(() => {
      setCanExit(true);
    }, minDisplayTime);

    return () => {
      haloLoop.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // 2. Trigger exit transition when backend is ready and minimum display time elapsed
  useEffect(() => {
    if (isReady && canExit) {
      setStatusText('Prêt !');
      // Finish progress bar to 100%
      Animated.timing(progressScaleX, {
        toValue: 1,
        duration: 180,
        easing: Easing.ease,
        useNativeDriver: useNative,
      }).start(() => {
        // Dissolve exit animation
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 380,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: useNative,
          }),
          Animated.timing(containerScale, {
            toValue: 1.04,
            duration: 380,
            easing: Easing.out(Easing.quad),
            useNativeDriver: useNative,
          }),
        ]).start(() => {
          onFinish();
        });
      });
    }
  }, [isReady, canExit]);

  const bgColor = isDarkMode ? '#08080a' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#09090b';
  const subtextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const trackBg = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 44, 247, 0.08)';
  const haloColor = isDarkMode ? 'rgba(0, 44, 247, 0.28)' : 'rgba(0, 44, 247, 0.15)';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      {/* Background Ambient Glow Halo */}
      <Animated.View
        style={[
          styles.ambientHalo,
          {
            backgroundColor: haloColor,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />

      {/* Center Branding Content */}
      <View style={styles.centerBox}>
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
            <Text style={[styles.brandTitle, { color: '#002cf7' }]}>KLIN</Text>
            <Text style={[styles.brandTitle, { color: isDarkMode ? '#ffffff' : '#09090b', marginLeft: 6 }]}>UP</Text>
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
                  transform: [{ scaleX: progressScaleX }],
                },
              ]}
            />
          </View>

          {/* Dynamic Status Text */}
          <Text style={[styles.statusText, { color: isDarkMode ? '#71717a' : '#94a3b8' }]}>
            {statusText}
          </Text>
        </Animated.View>
      </View>

      {/* Footer Meta Badge */}
      <Animated.View style={[styles.footerContainer, { opacity: contentOpacity }]}>
        <View style={[styles.versionPill, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
          <View style={styles.statusDot} />
          <Text style={[styles.footerText, { color: isDarkMode ? '#52525b' : '#94a3b8' }]}>
            KLIN UP OS • v1.0.0
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ambientHalo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '30%',
    filter: Platform.OS === 'web' ? 'blur(60px)' : undefined,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    width: '100%',
    height: '100%',
    backgroundColor: '#002cf7',
    borderRadius: 9999,
    transformOrigin: 'left',
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
