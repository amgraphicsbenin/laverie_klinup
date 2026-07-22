import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onAnimationFinish, isReady = false }) {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(15)).current;
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  // Pulse & Ripple loop values
  const rippleScale1 = useRef(new Animated.Value(0.8)).current;
  const rippleOpacity1 = useRef(new Animated.Value(0.6)).current;
  const rippleScale2 = useRef(new Animated.Value(0.8)).current;
  const rippleOpacity2 = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  // Bubble floating values
  const bubble1Y = useRef(new Animated.Value(0)).current;
  const bubble2Y = useRef(new Animated.Value(0)).current;
  const bubble3Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation (Logo scale & fade in)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.2)),
          }),
        ]),
      ]),
      // Fake smooth progress line
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.quad),
      }),
    ]).start();

    // 2. Continuous Ripple Animation 1
    const createRippleLoop = (scaleVal, opacityVal, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleVal, {
              toValue: 1.85,
              duration: 2400,
              useNativeDriver: true,
              easing: Easing.out(Easing.sine),
            }),
            Animated.timing(opacityVal, {
              toValue: 0,
              duration: 2400,
              useNativeDriver: true,
              easing: Easing.out(Easing.quad),
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleVal, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacityVal, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const ripple1 = createRippleLoop(rippleScale1, rippleOpacity1, 0);
    const ripple2 = createRippleLoop(rippleScale2, rippleOpacity2, 1200);
    ripple1.start();
    ripple2.start();

    // 3. Glow breathing loop
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.85,
          duration: 1400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sine),
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sine),
        }),
      ])
    );
    glowLoop.start();

    // 4. Subtle floating background bubbles
    const floatBubble = (animVal, distance, duration, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animVal, {
            toValue: -distance,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sine),
          }),
          Animated.timing(animVal, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sine),
          }),
        ])
      );
    };

    const b1 = floatBubble(bubble1Y, 14, 2800, 0);
    const b2 = floatBubble(bubble2Y, 20, 3400, 500);
    const b3 = floatBubble(bubble3Y, 10, 2200, 1000);
    b1.start();
    b2.start();
    b3.start();

    return () => {
      ripple1.stop();
      ripple2.stop();
      glowLoop.stop();
      b1.stop();
      b2.stop();
      b3.stop();
    };
  }, []);

  // 5. Handle exit transition when isReady becomes true
  useEffect(() => {
    if (isReady) {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(containerScale, {
          toValue: 1.08,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start(() => {
        if (onAnimationFinish) {
          onAnimationFinish();
        }
      });
    }
  }, [isReady]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
      {/* Background Gradient - Signature KLIN UP Deep Vibrant Blue */}
      <LinearGradient
        colors={['#040a17', '#0a1d3f', '#1d4ed8', '#1e40af']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Water / Air Bubble Decorative Elements */}
      <Animated.View
        style={[
          styles.bubble,
          styles.bubble1,
          { transform: [{ translateY: bubble1Y }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          styles.bubble2,
          { transform: [{ translateY: bubble2Y }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          styles.bubble3,
          { transform: [{ translateY: bubble3Y }] },
        ]}
      />

      {/* Ambient Radial Light Glow Behind Logo */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowOpacity }]} />

      {/* Central Logo Container */}
      <View style={styles.centerContent}>
        {/* Animated Ripple Waves */}
        <Animated.View
          style={[
            styles.rippleRing,
            {
              transform: [{ scale: rippleScale1 }],
              opacity: rippleOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.rippleRing,
            {
              transform: [{ scale: rippleScale2 }],
              opacity: rippleOpacity2,
            },
          ]}
        />

        {/* Logo Glass Card Badge */}
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

        {/* Title & Branding Text */}
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

      {/* Footer / Progress Indicator */}
      <Animated.View style={[styles.footerContainer, { opacity: textOpacity }]}>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingStatus}>Chargement de la plateforme...</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1d3f',
  },
  ambientGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
    ...(Platform.OS === 'web' ? { filter: 'blur(40px)' } : {}),
  },
  bubble: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bubble1: {
    width: 90,
    height: 90,
    top: '15%',
    left: '10%',
  },
  bubble2: {
    width: 140,
    height: 140,
    bottom: '20%',
    right: '8%',
  },
  bubble3: {
    width: 60,
    height: 60,
    top: '25%',
    right: '18%',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.6)',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  logoBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    textShadowColor: 'rgba(37, 99, 235, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  badgeLine: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  progressBarTrack: {
    width: 180,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#60a5fa',
  },
  loadingStatus: {
    fontSize: 11,
    color: '#bfdbfe',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});
