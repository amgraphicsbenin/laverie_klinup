"use client";
// beui.dev/components/motion/popover (Native Mobile iOS & Android)

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
  StyleSheet,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';

export const GOO_OPEN_SPRING = {
  friction: 6,
  tension: 170,
};

export const GOO_CLOSE_SPRING = {
  duration: 200,
  easing: Easing.bezier(0.32, 0, 0.67, 0),
};

const PopoverContext = createContext(null);

export function usePopoverContext(component = 'PopoverContext') {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error(`${component} must be used within <Popover>`);
  return ctx;
}

export function Popover({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  trigger = 'click',
  side = 'bottom',
  align = 'end',
  sideOffset = 10,
  panelRadius = 22,
  gooStrength = 8,
  popoverBg,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;

  const [isRendered, setIsRendered] = useState(defaultOpen);
  const triggerRef = useRef(null);
  const [triggerLayout, setTriggerLayout] = useState(null);

  const animProgress = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const setOpen = useCallback(
    (next) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange]
  );

  const measureAndOpen = useCallback(() => {
    if (triggerRef.current?.measureInWindow) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  }, [setOpen]);

  const toggle = useCallback(() => {
    if (!open) {
      measureAndOpen();
    } else {
      setOpen(false);
    }
  }, [open, measureAndOpen, setOpen]);

  // Spring animations for open and close
  useEffect(() => {
    if (open) {
      setIsRendered(true);
      Animated.spring(animProgress, {
        toValue: 1,
        friction: GOO_OPEN_SPRING.friction,
        tension: GOO_OPEN_SPRING.tension,
        useNativeDriver: true,
      }).start();
    } else if (isRendered) {
      Animated.timing(animProgress, {
        toValue: 0,
        duration: GOO_CLOSE_SPRING.duration,
        easing: GOO_CLOSE_SPRING.easing,
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
      });
    }
  }, [open, animProgress]);

  const ctx = useMemo(
    () => ({
      open,
      isRendered,
      setOpen,
      toggle,
      side,
      align,
      sideOffset,
      panelRadius,
      popoverBg,
      triggerRef,
      triggerLayout,
      animProgress,
    }),
    [
      open,
      isRendered,
      setOpen,
      toggle,
      side,
      align,
      sideOffset,
      panelRadius,
      popoverBg,
      triggerLayout,
      animProgress,
    ]
  );

  return (
    <PopoverContext.Provider value={ctx}>
      <View style={{ position: 'relative' }}>
        {children}
      </View>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children }) {
  const ctx = usePopoverContext('PopoverTrigger');

  if (!isValidElement(children)) return children;

  const child = children;
  const originalOnPress = child.props.onPress;

  return cloneElement(child, {
    ref: (node) => {
      ctx.triggerRef.current = node;
      if (typeof child.ref === 'function') child.ref(node);
      else if (child.ref && typeof child.ref === 'object') child.ref.current = node;
    },
    onPress: (e) => {
      originalOnPress?.(e);
      ctx.toggle();
    },
  });
}

export function PopoverContent({ children, style, popoverBg: propBg }) {
  const ctx = usePopoverContext('PopoverContent');
  const {
    open,
    isRendered,
    setOpen,
    triggerLayout,
    sideOffset,
    panelRadius,
    animProgress,
    popoverBg: ctxBg,
  } = ctx;

  const bg = propBg || ctxBg || '#ffffff';
  const windowDims = Dimensions.get('window');

  if (!isRendered) return null;

  const top = triggerLayout
    ? triggerLayout.y + triggerLayout.height + sideOffset
    : 70;
  const right = triggerLayout
    ? Math.max(12, windowDims.width - (triggerLayout.x + triggerLayout.width))
    : 16;

  const scale = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  const translateY = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  const opacity = animProgress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.8, 1],
  });

  const backdropOpacity = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <Modal
      visible={isRendered}
      transparent={true}
      animationType="none"
      onRequestClose={() => setOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setOpen(false)}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#000000',
                opacity: backdropOpacity,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.contentWrapper,
          {
            top,
            right,
            borderRadius: panelRadius,
            backgroundColor: bg,
            opacity,
            transform: [{ scale }, { translateY }],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    position: 'absolute',
    zIndex: 99999,
  },
});

export default Popover;
