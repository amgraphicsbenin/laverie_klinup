"use client";
// Adapted for React Native / Expo from beui.dev/components/motion/animated-badge

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Easing,
  Vibration,
} from 'react-native';
import {
  AlertTriangle,
  Check,
  Circle,
  Info,
  LoaderCircle,
  X,
  Clock,
  Sparkles,
} from 'lucide-react-native';

/**
 * Standard badge statuses supported by beui.dev
 * + extended statuses for laundry workflow
 */
export const STATUS_THEMES = {
  neutral: {
    bg: '#f1f5f9',
    bgDark: 'rgba(255, 255, 255, 0.06)',
    text: '#64748b',
    textDark: '#94a3b8',
    border: '#e2e8f0',
    borderDark: 'rgba(255, 255, 255, 0.12)',
    icon: Circle,
  },
  info: {
    bg: 'rgba(37, 99, 235, 0.08)',
    bgDark: 'rgba(56, 189, 248, 0.15)',
    text: '#2563eb',
    textDark: '#38bdf8',
    border: 'rgba(37, 99, 235, 0.25)',
    borderDark: 'rgba(56, 189, 248, 0.3)',
    icon: Info,
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.08)',
    bgDark: 'rgba(16, 185, 129, 0.18)',
    text: '#059669',
    textDark: '#34d399',
    border: 'rgba(16, 185, 129, 0.28)',
    borderDark: 'rgba(16, 185, 129, 0.35)',
    icon: Check,
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.08)',
    bgDark: 'rgba(245, 158, 11, 0.18)',
    text: '#d97706',
    textDark: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.28)',
    borderDark: 'rgba(245, 158, 11, 0.35)',
    icon: AlertTriangle,
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.08)',
    bgDark: 'rgba(239, 68, 68, 0.18)',
    text: '#dc2626',
    textDark: '#f87171',
    border: 'rgba(239, 68, 68, 0.28)',
    borderDark: 'rgba(239, 68, 68, 0.35)',
    icon: X,
  },
  loading: {
    bg: 'rgba(79, 70, 229, 0.08)',
    bgDark: 'rgba(129, 140, 248, 0.18)',
    text: '#4f46e5',
    textDark: '#818cf8',
    border: 'rgba(79, 70, 229, 0.28)',
    borderDark: 'rgba(129, 140, 248, 0.35)',
    icon: LoaderCircle,
  },
  purple: {
    bg: 'rgba(124, 58, 237, 0.08)',
    bgDark: 'rgba(168, 85, 247, 0.18)',
    text: '#7c3aed',
    textDark: '#c084fc',
    border: 'rgba(124, 58, 237, 0.28)',
    borderDark: 'rgba(168, 85, 247, 0.35)',
    icon: Sparkles,
  },
  teal: {
    bg: 'rgba(13, 148, 136, 0.08)',
    bgDark: 'rgba(45, 212, 191, 0.18)',
    text: '#0d9488',
    textDark: '#2dd4bf',
    border: 'rgba(13, 148, 136, 0.28)',
    borderDark: 'rgba(45, 212, 191, 0.35)',
    icon: LoaderCircle,
  },
};

/**
 * Mapping des statuts de commande métier vers le thème visuel du badge
 */
export const ORDER_STATUS_CONFIG = {
  attente: { theme: 'warning', label: 'En attente', icon: Clock, pulse: false, spin: false },
  en_attente: { theme: 'warning', label: 'En attente', icon: Clock, pulse: false, spin: false },
  pending: { theme: 'warning', label: 'En attente', icon: Clock, pulse: false, spin: false },
  traitement: { theme: 'purple', label: 'Traitement', icon: LoaderCircle, pulse: true, spin: true },
  en_traitement: { theme: 'purple', label: 'Traitement', icon: LoaderCircle, pulse: true, spin: true },
  lavage_cours: { theme: 'info', label: 'Lavage', icon: LoaderCircle, pulse: true, spin: true },
  en_cours_lavage: { theme: 'info', label: 'Lavage', icon: LoaderCircle, pulse: true, spin: true },
  lavage: { theme: 'info', label: 'Lavage', icon: LoaderCircle, pulse: true, spin: true },
  repassage_cours: { theme: 'teal', label: 'Repassage', icon: LoaderCircle, pulse: true, spin: true },
  en_cours_repassage: { theme: 'teal', label: 'Repassage', icon: LoaderCircle, pulse: true, spin: true },
  repassage: { theme: 'teal', label: 'Repassage', icon: LoaderCircle, pulse: true, spin: true },
  pret: { theme: 'success', label: 'Prêt', icon: Check, pulse: false, spin: false },
  a_recuperer: { theme: 'warning', label: 'À récupérer', icon: AlertTriangle, pulse: false, spin: false },
  a_livrer: { theme: 'loading', label: 'À livrer', icon: Info, pulse: false, spin: false },
  en_cours_livraison: { theme: 'loading', label: 'En livraison', icon: LoaderCircle, pulse: true, spin: true },
  livraison: { theme: 'loading', label: 'En livraison', icon: LoaderCircle, pulse: true, spin: true },
  livre: { theme: 'neutral', label: 'Commande livrée', icon: Check, pulse: false, spin: false },
  restitue: { theme: 'neutral', label: 'Commande récupérée', icon: Check, pulse: false, spin: false },
  annule: { theme: 'danger', label: 'Annulée', icon: X, pulse: false, spin: false },
  retard: { theme: 'danger', label: 'En retard', icon: AlertTriangle, pulse: true, spin: false },
};

export function AnimatedBadge({
  status = 'neutral',
  statusColor, // Optional custom colors: { bg, text, border, label }
  size = 'sm',
  children,
  icon: customIcon,
  showIcon = true,
  pulse: controlledPulse,
  contentKey,
  isDarkMode = false,
  style,
  textStyle,
  ...rest
}) {
  // Déterminer la configuration du statut (soit statut brut, soit statut commande Pressing Pro)
  const orderCfg = ORDER_STATUS_CONFIG[status];
  const resolvedThemeKey = orderCfg ? orderCfg.theme : (STATUS_THEMES[status] ? status : 'neutral');
  const resolvedLabel = children ?? (statusColor?.label || (orderCfg ? orderCfg.label : String(status)));
  const resolvedContentKey = contentKey ?? (typeof children === 'string' || typeof children === 'number' ? children : `${status}_${resolvedLabel}`);

  const shouldPulse = controlledPulse !== undefined
    ? controlledPulse
    : (orderCfg ? orderCfg.pulse : status === 'loading');

  const shouldSpin = orderCfg ? orderCfg.spin : (status === 'loading');

  // Trackers d'état interne pour animer la transition de sortie puis d'entrée
  const [displayedContent, setDisplayedContent] = useState({
    label: resolvedLabel,
    icon: customIcon,
    status: status,
    themeKey: resolvedThemeKey,
    statusColor: statusColor,
    shouldPulse,
    shouldSpin,
  });

  // Résolution des couleurs selon le thème affiché actuellement
  const activeTheme = STATUS_THEMES[displayedContent.themeKey] || STATUS_THEMES.neutral;
  const ActiveIcon = displayedContent.icon ? null : (ORDER_STATUS_CONFIG[displayedContent.status]?.icon || activeTheme.icon || Circle);

  const activeTextColor = displayedContent.statusColor?.text || (isDarkMode ? activeTheme.textDark : activeTheme.text);
  const activeBgColor = displayedContent.statusColor?.bg || (isDarkMode ? activeTheme.bgDark : activeTheme.bg);
  const activeBorderColor = displayedContent.statusColor?.border || (isDarkMode ? activeTheme.borderDark : activeTheme.border);

  // ── Valeurs animées ──────────────────────────────────────────────────────────
  // Icon roll animators
  const iconTranslateY = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const iconRotate = useRef(new Animated.Value(0)).current; // -8 to 8 deg mapped
  const iconOpacity = useRef(new Animated.Value(1)).current;

  // Text roll animators
  const textTranslateY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  // Pulse & Spin loops
  const pulseScale = useRef(new Animated.Value(0.96)).current;
  const pulseOpacity = useRef(new Animated.Value(0.08)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const prevKeyRef = useRef(resolvedContentKey);
  const isInitialMount = useRef(true);

  // ── Pulse Loop Animation ───────────────────────────────────────────────────
  useEffect(() => {
    let pulseLoop = null;
    if (displayedContent.shouldPulse) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1.08,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.2,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 0.94,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.08,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
        ])
      );
      pulseLoop.start();
    } else {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [displayedContent.shouldPulse]);

  // ── Continuous Spin Loop (Loading / In-Progress) ────────────────────────────
  useEffect(() => {
    let spinLoop = null;
    if (displayedContent.shouldSpin && !displayedContent.icon) {
      spinAnim.setValue(0);
      spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
      spinLoop.start();
    } else {
      spinAnim.setValue(0);
    }

    return () => {
      if (spinLoop) spinLoop.stop();
    };
  }, [displayedContent.shouldSpin, displayedContent.icon]);

  // ── Roll Animation lors d'un changement de statut / label ──────────────────
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevKeyRef.current = resolvedContentKey;
      return;
    }

    if (prevKeyRef.current !== resolvedContentKey) {
      prevKeyRef.current = resolvedContentKey;

      // Déclenche une micro-vibration haptique discrète lors du changement
      try {
        if (Platform.OS !== 'web') {
          Vibration.vibrate(8);
        }
      } catch (_) {}

      // 1. Sortie (Exit) : translation vers le haut (-80%), rotation +8 deg, fade out
      Animated.parallel([
        Animated.timing(iconTranslateY, {
          toValue: -11,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(iconOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(iconRotate, {
          toValue: 8,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(iconScale, {
          toValue: 0.94,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(textTranslateY, {
          toValue: -11,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        // Met à jour le contenu affiché
        setDisplayedContent({
          label: resolvedLabel,
          icon: customIcon,
          status: status,
          themeKey: resolvedThemeKey,
          statusColor: statusColor,
          shouldPulse,
          shouldSpin,
        });

        // 2. Préparation Entrée : positionne en bas (+80%), rotation -8 deg, échelle 0.92
        iconTranslateY.setValue(11);
        iconRotate.setValue(-8);
        iconScale.setValue(0.92);
        iconOpacity.setValue(0.2);

        textTranslateY.setValue(11);
        textOpacity.setValue(0.2);

        // 3. Entrée (Animate with Spring conformant to beui.dev specification)
        Animated.parallel([
          Animated.spring(iconTranslateY, {
            toValue: 0,
            damping: 24,
            stiffness: 210,
            mass: 0.85,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(iconScale, {
            toValue: 1,
            damping: 24,
            stiffness: 250,
            mass: 0.75,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(iconRotate, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(iconOpacity, {
            toValue: 1,
            duration: 240,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(textTranslateY, {
            toValue: 0,
            damping: 24,
            stiffness: 210,
            mass: 0.85,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 260,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      });
    }
  }, [resolvedContentKey, resolvedLabel, customIcon, status, resolvedThemeKey, statusColor, shouldPulse, shouldSpin]);

  // Formatage des rotations
  const rotateDeg = iconRotate.interpolate({
    inputRange: [-8, 0, 8],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const continuousSpinDeg = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 11.5 : 13.5;

  return (
    <Animated.View
      style={[
        styles.badge,
        isSmall ? styles.sizeSm : styles.sizeMd,
        {
          backgroundColor: activeBgColor,
          borderColor: activeBorderColor,
        },
        style,
      ]}
      {...rest}
    >
      {/* Halo Pulsant (Pulse Effect) */}
      {displayedContent.shouldPulse && (
        <Animated.View
          style={[
            styles.pulseHalo,
            {
              backgroundColor: activeTextColor,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Emplacement Icône Roulante */}
      {showIcon && (
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                opacity: iconOpacity,
                transform: [
                  { translateY: iconTranslateY },
                  { scale: iconScale },
                  { rotate: rotateDeg },
                ],
              },
            ]}
          >
            {displayedContent.shouldSpin && !displayedContent.icon ? (
              <Animated.View style={{ transform: [{ rotate: continuousSpinDeg }] }}>
                <ActiveIcon size={iconSize} color={activeTextColor} strokeWidth={2.4} />
              </Animated.View>
            ) : (
              displayedContent.icon ?? (
                <ActiveIcon size={iconSize} color={activeTextColor} strokeWidth={2.4} />
              )
            )}
          </Animated.View>
        </View>
      )}

      {/* Emplacement Texte Roulant */}
      {displayedContent.label != null && (
        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.label,
              isSmall ? styles.labelSm : styles.labelMd,
              {
                color: activeTextColor,
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {displayedContent.label}
          </Animated.Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  sizeSm: {
    height: 22,
    paddingHorizontal: 8,
    gap: 5,
  },
  sizeMd: {
    height: 28,
    paddingHorizontal: 10,
    gap: 6,
  },
  pulseHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9999,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  labelSm: {
    fontSize: 10.5,
  },
  labelMd: {
    fontSize: 11.5,
  },
});

export default AnimatedBadge;
