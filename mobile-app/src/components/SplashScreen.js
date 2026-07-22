import React from 'react';
import { StyleSheet, View, Text, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ onAnimationFinish }) {
  React.useEffect(() => {
    if (onAnimationFinish) {
      const timer = setTimeout(() => {
        onAnimationFinish();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onAnimationFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#040a17', '#0a1d3f', '#1d4ed8', '#1e40af']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.centerContent}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoBadgeInner}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.brandTitle}>KLIN UP</Text>
          <View style={styles.badgeLine}>
            <Text style={styles.brandSub}>PRESSING & LAVERIE AUTOMATIQUE</Text>
          </View>
        </View>
      </View>
    </View>
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
