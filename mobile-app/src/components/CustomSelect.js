import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { SmoothScrollView as ScrollView } from './SmoothScroll';
import { db } from '../services/db';

/**
 * ============================================================================
 * MORPH SELECT (beui.dev/components/motion/select for React Native)
 *
 * - Shared-layout morph: trigger box grows seamlessly into panel and collapses back
 * - Mirrored header: panel top row mirrors trigger with 180° rotating ChevronDown
 * - 1px divider between header and options
 * - Staggered entrance animation for items
 * - Selected item: subtle background highlight + Checkmark aligned on the RIGHT
 * - Auto-detects light / dark mode via db.isDarkMode()
 * ============================================================================
 */

// Context for composable MorphSelect usage
const MorphContext = createContext(null);

export function useMorphContext(componentName = 'MorphSelect') {
  const ctx = useContext(MorphContext);
  if (!ctx) {
    throw new Error(`${componentName} must be used within <MorphSelect>`);
  }
  return ctx;
}

/**
 * Staggered entrance item component matching beui.dev variants:
 * ITEM: hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0 }
 */
function StaggeredItem({ index, children }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index * 24, 180);
    const timeout = setTimeout(() => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

/**
 * MorphSelect - Root Provider
 */
export function MorphSelect({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  options = [],
  children,
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const [labels, setLabels] = useState(() => {
    const initialMap = new Map();
    if (Array.isArray(options)) {
      options.forEach((o) => {
        if (o && o.value !== undefined) {
          initialMap.set(String(o.value), { label: o.label, count: 1 });
        }
      });
    }
    return initialMap;
  });
  const [placeholder, setPlaceholder] = useState('Sélectionner...');
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 220, height: 42 });
  const triggerRef = useRef(null);
  const closeDropdownRef = useRef(null);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  // Keep labels in sync if options change
  useEffect(() => {
    if (Array.isArray(options) && options.length > 0) {
      setLabels((prev) => {
        const next = new Map(prev);
        options.forEach((o) => {
          if (o && o.value !== undefined) {
            const existing = next.get(String(o.value));
            next.set(String(o.value), { label: o.label, count: existing ? existing.count : 1 });
          }
        });
        return next;
      });
    }
  }, [options]);

  const select = useCallback(
    (next) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange]
  );

  const register = useCallback((v, label) => {
    setLabels((m) => {
      const next = new Map(m);
      next.set(String(v), { label, count: (m.get(String(v))?.count ?? 0) + 1 });
      return next;
    });
  }, []);

  const unregister = useCallback((v) => {
    setLabels((m) => {
      const entry = m.get(String(v));
      if (!entry) return m;
      const next = new Map(m);
      if (entry.count <= 1) next.delete(String(v));
      else next.set(String(v), { label: entry.label, count: entry.count - 1 });
      return next;
    });
  }, []);

  const labelFor = useCallback(
    (v) => (v === undefined || v === null ? undefined : labels.get(String(v))?.label),
    [labels]
  );

  const updateTriggerLayout = useCallback((cb) => {
    if (triggerRef.current?.measureInWindow) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        const layout = { x, y, width, height };
        setTriggerLayout(layout);
        cb?.(layout);
      });
    } else if (triggerRef.current?.getBoundingClientRect) {
      const r = triggerRef.current.getBoundingClientRect();
      const layout = { x: r.left, y: r.top, width: r.width, height: r.height };
      setTriggerLayout(layout);
      cb?.(layout);
    } else {
      cb?.(triggerLayout);
    }
  }, [triggerLayout]);

  const toggle = useCallback(() => {
    if (open) {
      if (closeDropdownRef.current) {
        closeDropdownRef.current();
      } else {
        setOpen(false);
      }
    } else {
      updateTriggerLayout(() => {
        setOpen(true);
      });
    }
  }, [open, updateTriggerLayout]);

  const ctx = useMemo(
    () => ({
      value: current,
      open,
      setOpen,
      select,
      register,
      unregister,
      labelFor,
      placeholder,
      setPlaceholder,
      disabled,
      triggerRef,
      triggerLayout,
      setTriggerLayout,
      updateTriggerLayout,
      closeDropdownRef,
      toggle,
    }),
    [
      current,
      open,
      select,
      register,
      unregister,
      labelFor,
      placeholder,
      disabled,
      triggerLayout,
      updateTriggerLayout,
      toggle,
    ]
  );

  return (
    <MorphContext.Provider value={ctx}>
      <View style={{ position: 'relative' }}>
        {children}
      </View>
    </MorphContext.Provider>
  );
}

/**
 * MorphSelectValue - displays selected label or placeholder
 */
export function MorphSelectValue({ placeholder: propPlaceholder, label: propLabel, style, textStyle }) {
  const ctx = useMorphContext('MorphSelectValue');
  const isDarkMode = db.isDarkMode ? db.isDarkMode() : false;

  useEffect(() => {
    if (propPlaceholder) ctx.setPlaceholder(propPlaceholder);
  }, [propPlaceholder, ctx.setPlaceholder]);

  const resolvedLabel = propLabel ?? ctx.labelFor(ctx.value);

  return (
    <Text
      numberOfLines={1}
      style={[
        {
          fontSize: 13.5,
          fontWeight: resolvedLabel ? '500' : '400',
          color: resolvedLabel
            ? isDarkMode ? '#f4f4f5' : '#18181b'
            : isDarkMode ? '#a1a1aa' : '#71717a',
        },
        textStyle,
        style,
      ]}
    >
      {resolvedLabel ?? propPlaceholder ?? ctx.placeholder ?? 'Sélectionner...'}
    </Text>
  );
}

/**
 * MorphSelectTrigger - Trigger button that measures layout and morphs into panel
 */
export function MorphSelectTrigger({ style, textStyle, children, disabled: propDisabled }) {
  const ctx = useMorphContext('MorphSelectTrigger');
  const isDarkMode = db.isDarkMode ? db.isDarkMode() : false;
  const disabled = propDisabled ?? ctx.disabled;

  return (
    <View ref={ctx.triggerRef} collapsable={false}>
      <TouchableOpacity
        activeOpacity={0.75}
        disabled={disabled}
        onPress={ctx.toggle}
        style={[
          styles.triggerButton,
          {
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            borderColor: ctx.open
              ? isDarkMode ? '#38bdf8' : '#002cf7'
              : isDarkMode ? '#27272a' : '#e4e4e7',
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        <View style={styles.triggerContent}>
          {children}
        </View>
        <View style={{ marginLeft: 6 }}>
          <ChevronDown
            size={15}
            color={ctx.open
              ? isDarkMode ? '#38bdf8' : '#002cf7'
              : isDarkMode ? '#a1a1aa' : '#71717a'
            }
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

/**
 * MorphSelectContent - Panel modal that expands from trigger position
 */
export function MorphSelectContent({ children, popoverWidth, header, style, itemCount = 4 }) {
  const ctx = useMorphContext('MorphSelectContent');
  const isDarkMode = db.isDarkMode ? db.isDarkMode() : false;

  const [visible, setVisible] = useState(ctx.open);
  const [isClosing, setIsClosing] = useState(false);

  // Animated values
  const morphAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const listOpacityAnim = useRef(new Animated.Value(0)).current;

  const windowDim = Dimensions.get('window');
  const windowW = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : windowDim.width;
  const windowH = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : windowDim.height;

  const triggerH = ctx.triggerLayout.height || 42;
  const targetW = Math.max(ctx.triggerLayout.width || 200, popoverWidth || 180);
  const boundedW = Math.min(targetW, windowW - 24);
  const left = Math.max(12, Math.min(ctx.triggerLayout.x || 12, windowW - boundedW - 12));

  const spaceBelow = windowH - ((ctx.triggerLayout.y || 0) + triggerH + 12);
  const spaceAbove = (ctx.triggerLayout.y || 0) - 12;
  const isUpwards = spaceBelow < 180 && spaceAbove > spaceBelow;

  // Compute target expanded height
  const headerH = Math.max(34, Math.min(triggerH, 44));
  const estimatedListH = Math.min(250, Math.max(40, (itemCount || 4) * 38 + 10));
  const totalExpandedH = headerH + 1 + (header ? 28 : 0) + estimatedListH;

  // Ultra-smooth, fast exit animation (180ms total duration, no hanging/freeze)
  const closeDropdown = useCallback(
    (onFinished) => {
      if (isClosing) return;
      setIsClosing(true);

      Animated.parallel([
        Animated.timing(listOpacityAnim, {
          toValue: 0,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(chevronAnim, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(morphAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsClosing(false);
        setVisible(false);
        ctx.setOpen(false);
        if (typeof onFinished === 'function') {
          onFinished();
        }
      });
    },
    [isClosing, listOpacityAnim, chevronAnim, morphAnim, ctx]
  );

  // Expose closeDropdown to context so items can trigger it directly
  useEffect(() => {
    ctx.closeDropdownRef.current = closeDropdown;
    return () => {
      ctx.closeDropdownRef.current = null;
    };
  }, [closeDropdown, ctx.closeDropdownRef]);

  // Handle open state transitions
  useEffect(() => {
    if (ctx.open) {
      setVisible(true);
      setIsClosing(false);
      morphAnim.setValue(0);
      chevronAnim.setValue(0);
      listOpacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(morphAnim, {
          toValue: 1,
          friction: 8,
          tension: 75,
          useNativeDriver: false,
        }),
        Animated.spring(chevronAnim, {
          toValue: 1,
          friction: 8,
          tension: 75,
          useNativeDriver: true,
        }),
        Animated.timing(listOpacityAnim, {
          toValue: 1,
          duration: 160,
          delay: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (visible && !isClosing) {
      closeDropdown();
    }
  }, [ctx.open]);

  if (!visible) return null;

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const animatedHeight = morphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [triggerH, totalExpandedH],
  });

  const animatedScale = morphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const animatedOpacity = morphAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 1],
  });

  const label = ctx.labelFor(ctx.value);

  const topPos = isUpwards ? undefined : ctx.triggerLayout.y || 0;
  const bottomPos = isUpwards ? windowH - ((ctx.triggerLayout.y || 0) + triggerH) : undefined;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={() => closeDropdown()}
    >
      {/* Backdrop to close on tap outside */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => closeDropdown()}
      />

      {/* Morphing panel container */}
      <Animated.View
        style={[
          styles.panelContainer,
          {
            left,
            width: boundedW,
            height: animatedHeight,
            opacity: animatedOpacity,
            transform: [{ scale: animatedScale }],
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            borderColor: isDarkMode ? '#27272a' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: '#000000',
            shadowOpacity: isDarkMode ? 0.45 : 0.12,
            maxHeight: Math.min(320, isUpwards ? spaceAbove : spaceBelow + triggerH),
            ...(isUpwards ? { bottom: bottomPos } : { top: topPos }),
          },
          style,
        ]}
      >
        {/* Mirrored Header: mirrors the trigger and collapses back when tapped */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => closeDropdown()}
          style={[
            styles.mirroredHeader,
            {
              height: headerH,
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13.5,
              fontWeight: label ? '500' : '400',
              color: label
                ? isDarkMode ? '#f4f4f5' : '#18181b'
                : isDarkMode ? '#a1a1aa' : '#71717a',
              flex: 1,
              marginRight: 6,
            }}
          >
            {label ?? ctx.placeholder ?? 'Sélectionner...'}
          </Text>

          <Animated.View style={{ transform: [{ rotate: chevronRotation }], marginLeft: 6 }}>
            <ChevronDown
              size={15}
              color={isDarkMode ? '#38bdf8' : '#002cf7'}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* 1px Divider between Header and Options */}
        <View
          style={[
            styles.divider,
            { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5' },
          ]}
        />

        {/* Optional Section Title / Header */}
        {header ? (
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionHeaderText,
                { color: isDarkMode ? '#a1a1aa' : '#71717a' },
              ]}
            >
              {header}
            </Text>
          </View>
        ) : null}

        {/* Option Items List */}
        <Animated.View style={{ opacity: listOpacityAnim, flexShrink: 1, overflow: 'hidden' }}>
          <ScrollView
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            style={{ maxHeight: 250 }}
            showsVerticalScrollIndicator={true}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * MorphSelectItem - Individual option item with checkmark on the RIGHT
 */
export function MorphSelectItem({ value, label: propLabel, children, disabled = false, index = 0 }) {
  const ctx = useMorphContext('MorphSelectItem');
  const isDarkMode = db.isDarkMode ? db.isDarkMode() : false;

  const displayLabel = propLabel ?? (typeof children === 'string' ? children : String(value));
  const isSelected = String(ctx.value) === String(value);

  useEffect(() => {
    ctx.register(value, displayLabel);
    return () => ctx.unregister(value);
  }, [ctx.register, ctx.unregister, value, displayLabel]);

  const handleSelect = () => {
    if (disabled) return;
    if (ctx.closeDropdownRef.current) {
      ctx.closeDropdownRef.current(() => {
        ctx.select(value);
      });
    } else {
      ctx.select(value);
    }
  };

  return (
    <StaggeredItem index={index}>
      <TouchableOpacity
        activeOpacity={0.65}
        disabled={disabled}
        onPress={handleSelect}
        style={[
          styles.itemRow,
          isSelected && {
            backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 44, 247, 0.08)',
          },
          disabled && { opacity: 0.4 },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.itemText,
            {
              color: isSelected
                ? isDarkMode ? '#38bdf8' : '#002cf7'
                : isDarkMode ? '#e4e4e7' : '#18181b',
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {children ?? displayLabel}
        </Text>

        {/* Checkmark aligned strictly on the RIGHT (beui.dev/components/motion/select spec) */}
        {isSelected ? (
          <Check
            size={15}
            strokeWidth={2.4}
            color={isDarkMode ? '#38bdf8' : '#002cf7'}
          />
        ) : (
          <View style={{ width: 15 }} />
        )}
      </TouchableOpacity>
    </StaggeredItem>
  );
}

/**
 * ============================================================================
 * UNIVERSAL CUSTOM SELECT COMPONENT
 *
 * Full backward-compatible wrapper that automatically renders the MorphSelect
 * architecture for all existing and new usages across the app.
 * ============================================================================
 */
export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Sélectionner...',
  header,
  disabled = false,
  style,
  buttonStyle,
  buttonTextStyle,
  popoverWidth,
  renderTrigger,
}) => {
  const isDarkMode = db.isDarkMode ? db.isDarkMode() : false;
  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find((o) => String(o.value) === String(value));
  const currentLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <MorphSelect
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      options={safeOptions}
    >
      <MorphSelectInternal
        options={safeOptions}
        placeholder={placeholder}
        header={header}
        style={style}
        buttonStyle={buttonStyle}
        buttonTextStyle={buttonTextStyle}
        popoverWidth={popoverWidth}
        renderTrigger={renderTrigger}
        selectedOption={selectedOption}
        currentLabel={currentLabel}
        isDarkMode={isDarkMode}
      />
    </MorphSelect>
  );
};

function MorphSelectInternal({
  options,
  placeholder,
  header,
  style,
  buttonStyle,
  buttonTextStyle,
  popoverWidth,
  renderTrigger,
  selectedOption,
  currentLabel,
  isDarkMode,
}) {
  const ctx = useMorphContext('CustomSelect');

  return (
    <>
      {renderTrigger ? (
        <View ref={ctx.triggerRef} collapsable={false}>
          {renderTrigger({
            isOpen: ctx.open,
            toggle: ctx.toggle,
            selectedOption,
            currentLabel,
            isDarkMode,
          })}
        </View>
      ) : (
        <View style={[styles.wrapper, style]}>
          <MorphSelectTrigger style={buttonStyle}>
            <MorphSelectValue
              label={selectedOption ? selectedOption.label : undefined}
              placeholder={placeholder}
              textStyle={buttonTextStyle}
            />
          </MorphSelectTrigger>
        </View>
      )}

      <MorphSelectContent
        popoverWidth={popoverWidth}
        header={header}
        itemCount={options.length}
      >
        {options.length > 0 ? (
          options.map((opt, idx) => (
            <MorphSelectItem
              key={String(opt.value ?? idx)}
              value={opt.value}
              label={opt.label}
              index={idx}
            >
              {opt.label}
            </MorphSelectItem>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                { color: isDarkMode ? '#a1a1aa' : '#71717a' },
              ]}
            >
              Aucun choix disponible
            </Text>
          </View>
        )}
      </MorphSelectContent>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  triggerButton: {
    width: '100%',
    height: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  triggerContent: {
    flex: 1,
    marginRight: 6,
  },
  panelContainer: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 14,
    zIndex: 999999,
  },
  mirroredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    width: '100%',
  },
  divider: {
    width: '100%',
    height: 1,
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listContent: {
    padding: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 1.5,
  },
  itemText: {
    fontSize: 13.5,
    flex: 1,
    marginRight: 10,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});

export default CustomSelect;
