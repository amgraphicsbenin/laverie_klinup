"use client";
// motion-primitives / react-native morphing dialog
// Reversible spring transition with spatial awareness & smooth exit animations

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  isValidElement,
  cloneElement,
} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { db } from '../../services/db';

const MorphingDialogContext = createContext(null);

export function useMorphingDialog(componentName = 'useMorphingDialog') {
  const ctx = useContext(MorphingDialogContext);
  if (!ctx) {
    throw new Error(`${componentName} must be used within <MorphingDialog>`);
  }
  return ctx;
}

export function MorphingDialog({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  transition = {
    type: 'spring',
    bounce: 0.05,
    duration: 0.25,
    damping: 18,
    stiffness: 200,
  },
  isDarkMode: propDarkMode,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = controlledOpen !== undefined;
  const isOpen = controlled ? controlledOpen : internalOpen;

  const [isRendered, setIsRendered] = useState(defaultOpen);
  const triggerRef = useRef(null);
  const [triggerLayout, setTriggerLayout] = useState(null);

  const animProgress = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const isDarkMode = propDarkMode !== undefined ? propDarkMode : (db.isDarkMode ? db.isDarkMode() : false);

  const setOpen = useCallback(
    (next) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange]
  );

  const openDialog = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const toggleDialog = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  // Spring animation on open & smooth bezier exit on close
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      Animated.spring(animProgress, {
        toValue: 1,
        damping: transition?.damping || 18,
        stiffness: transition?.stiffness || 200,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
    } else if (isRendered) {
      Animated.timing(animProgress, {
        toValue: 0,
        duration: 170,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
      });
    }
  }, [isOpen, animProgress, transition]);

  const contextValue = useMemo(
    () => ({
      isOpen,
      isRendered,
      openDialog,
      closeDialog,
      toggleDialog,
      setOpen,
      transition,
      triggerRef,
      triggerLayout,
      setTriggerLayout,
      animProgress,
      isDarkMode,
    }),
    [
      isOpen,
      isRendered,
      openDialog,
      closeDialog,
      toggleDialog,
      setOpen,
      transition,
      triggerLayout,
      animProgress,
      isDarkMode,
    ]
  );

  return (
    <MorphingDialogContext.Provider value={contextValue}>
      {children}
    </MorphingDialogContext.Provider>
  );
}

export function MorphingDialogTrigger({
  children,
  style,
  disabled = false,
  onPress,
}) {
  const { openDialog, setTriggerLayout, triggerRef } = useMorphingDialog('MorphingDialogTrigger');

  const handlePress = useCallback(
    (e) => {
      if (disabled) return;
      onPress?.(e);
      if (triggerRef.current?.measureInWindow) {
        triggerRef.current.measureInWindow((x, y, width, height) => {
          setTriggerLayout({ x, y, width, height });
          openDialog();
        });
      } else {
        openDialog();
      }
    },
    [disabled, onPress, triggerRef, setTriggerLayout, openDialog]
  );

  return (
    <TouchableOpacity
      ref={triggerRef}
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );
}

export function MorphingDialogContainer({ children, style }) {
  const { isRendered, closeDialog, animProgress, isDarkMode } = useMorphingDialog('MorphingDialogContainer');

  if (!isRendered) return null;

  const backdropOpacity = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });

  return (
    <Modal
      visible={isRendered}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={closeDialog}
    >
      <TouchableWithoutFeedback onPress={closeDialog}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDarkMode ? '#000000' : '#0F172A',
                opacity: backdropOpacity,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      <View style={[styles.containerCenter, style]} pointerEvents="box-none">
        {children}
      </View>
    </Modal>
  );
}

export function MorphingDialogContent({ children, style }) {
  const { animProgress, isDarkMode } = useMorphingDialog('MorphingDialogContent');

  const scale = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  const translateY = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const opacity = animProgress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <Animated.View
      style={[
        styles.contentCard,
        isDarkMode && styles.contentCardDark,
        {
          opacity,
          transform: [{ scale }, { translateY }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function MorphingDialogTitle({ children, style, numberOfLines }) {
  const { isDarkMode } = useMorphingDialog('MorphingDialogTitle');
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.title,
        isDarkMode && styles.titleDark,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function MorphingDialogSubtitle({ children, style, numberOfLines }) {
  const { isDarkMode } = useMorphingDialog('MorphingDialogSubtitle');
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.subtitle,
        isDarkMode && styles.subtitleDark,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function MorphingDialogImage({ src, source, alt, style, resizeMode = 'cover' }) {
  const imageSource = source || (src ? { uri: src } : null);
  if (!imageSource) return null;

  return (
    <Image
      source={imageSource}
      accessibilityLabel={alt}
      resizeMode={resizeMode}
      style={[styles.image, style]}
    />
  );
}

export function MorphingDialogDescription({ children, style }) {
  const { animProgress } = useMorphingDialog('MorphingDialogDescription');

  const descOpacity = animProgress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.4, 1],
  });

  const descTranslateY = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <Animated.View
      style={[
        {
          opacity: descOpacity,
          transform: [{ translateY: descTranslateY }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function MorphingDialogClose({ style, children, color, size = 16 }) {
  const { closeDialog, isDarkMode } = useMorphingDialog('MorphingDialogClose');

  const iconColor = color || (isDarkMode ? '#F8FAFC' : '#1E293B');

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={closeDialog}
      style={[
        styles.closeBtn,
        isDarkMode && styles.closeBtnDark,
        style,
      ]}
      accessibilityLabel="Fermer"
    >
      {children || <X size={size} color={iconColor} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  contentCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  contentCardDark: {
    backgroundColor: '#18181b',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  titleDark: {
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  subtitleDark: {
    color: '#94A3B8',
  },
  image: {
    width: '100%',
    height: 180,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  closeBtnDark: {
    backgroundColor: 'rgba(39, 39, 42, 0.90)',
  },
});

export default MorphingDialog;
