import React, { createContext, useContext, useEffect, useRef, useMemo } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { X, AlertTriangle, Check, Trash2, Ban } from 'lucide-react-native';
import { useDbState } from '../../hooks/useDbState';

// ── Context ──────────────────────────────────────────────────────────────────
const ModalContext = createContext({
  isOpen: false,
  onClose: () => {},
  size: 'sm',
  isDarkMode: false,
});

export const useModalContext = () => useContext(ModalContext);

// ── Root Modal ───────────────────────────────────────────────────────────────
export function Modal({
  isOpen,
  visible,
  onOpenChange,
  onClose,
  size = 'sm',
  isDarkMode: explicitDarkMode,
  closeOnBackdropPress = true,
  children,
}) {
  const dbState = useDbState();
  const isDarkMode = explicitDarkMode !== undefined ? explicitDarkMode : dbState?.isDarkMode || false;
  const isControlledOpen = isOpen !== undefined ? isOpen : visible !== undefined ? visible : false;

  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  const contextValue = useMemo(
    () => ({
      isOpen: isControlledOpen,
      onClose: handleClose,
      size,
      isDarkMode,
      closeOnBackdropPress,
    }),
    [isControlledOpen, handleClose, size, isDarkMode, closeOnBackdropPress]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      <RNModal
        visible={isControlledOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        {children}
      </RNModal>
    </ModalContext.Provider>
  );
}

// ── Modal.Backdrop ───────────────────────────────────────────────────────────
export function ModalBackdrop({ children, style, closeOnPress }) {
  const { onClose, closeOnBackdropPress, isDarkMode, isOpen } = useModalContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isOpen, fadeAnim]);

  const canDismiss = closeOnPress !== undefined ? closeOnPress : closeOnBackdropPress;

  return (
    <Animated.View
      style={[
        styles.backdrop,
        {
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.78)' : 'rgba(0, 0, 0, 0.65)',
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      {canDismiss && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Fermer la boîte de dialogue"
        />
      )}
      {children}
    </Animated.View>
  );
}

// ── Modal.Container ──────────────────────────────────────────────────────────
export function ModalContainer({ size: propSize, children, style }) {
  const { size: contextSize } = useModalContext();
  const activeSize = propSize || contextSize || 'sm';

  const containerStyle = useMemo(() => {
    switch (activeSize) {
      case 'alert':
      case 'xs':
        return { width: '80%', maxWidth: 310, minWidth: 280 };
      case 'sm':
        return { width: '86%', maxWidth: 350 };
      case 'md':
        return { width: '92%', maxWidth: 440 };
      case 'lg':
        return { width: '96%', maxWidth: 580 };
      case 'cover':
        return {
          width: '100%',
          maxWidth: Platform.OS === 'web' ? '92%' : '95%',
          marginHorizontal: Platform.OS === 'web' ? 40 : 16,
        };
      case 'full':
        return {
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          margin: 0,
          borderRadius: 0,
        };
      default:
        return { width: '88%', maxWidth: 360 };
    }
  }, [activeSize]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      pointerEvents="box-none"
      style={[
        styles.containerWrapper,
        activeSize === 'full' && { padding: 0, justifyContent: 'flex-start' },
      ]}
    >
      <View pointerEvents="auto" style={[styles.containerInner, containerStyle, style]}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Modal.Dialog ─────────────────────────────────────────────────────────────
export function ModalDialog({ children, style }) {
  const { isDarkMode, size, isOpen } = useModalContext();
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateYAnim = useRef(new Animated.Value(12)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 18,
          stiffness: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.95);
      translateYAnim.setValue(12);
      opacityAnim.setValue(0);
    }
  }, [isOpen, scaleAnim, translateYAnim, opacityAnim]);

  const isFull = size === 'full';

  return (
    <Animated.View
      style={[
        styles.dialog,
        {
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
          borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
          borderRadius: isFull ? 0 : 24,
          padding: isFull ? 18 : 22,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        },
        isFull && { flex: 1, maxHeight: '100%' },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ── Modal.CloseTrigger ───────────────────────────────────────────────────────
export function ModalCloseTrigger({ onPress, style }) {
  const { onClose, isDarkMode } = useModalContext();
  const handlePress = onPress || onClose;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[
        styles.closeTrigger,
        {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        },
        style,
      ]}
      accessibilityLabel="Fermer"
    >
      <X size={17} color={isDarkMode ? '#a1a1aa' : '#71717a'} strokeWidth={2.4} />
    </TouchableOpacity>
  );
}

// ── Modal.Header ─────────────────────────────────────────────────────────────
export function ModalHeader({ children, style, layout = 'row' }) {
  return (
    <View
      style={[
        styles.header,
        layout === 'column' ? styles.headerColumn : styles.headerRow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── Modal.Icon ───────────────────────────────────────────────────────────────
export function ModalIcon({
  children,
  variant = 'default',
  color: customColor,
  bgColor: customBgColor,
  style,
}) {
  const { isDarkMode } = useModalContext();

  const { bg, fg } = useMemo(() => {
    if (customBgColor && customColor) {
      return { bg: customBgColor, fg: customColor };
    }
    switch (variant) {
      case 'danger':
        return {
          bg: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
          fg: '#ef4444',
        };
      case 'warning':
        return {
          bg: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)',
          fg: '#f59e0b',
        };
      case 'success':
        return {
          bg: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
          fg: '#10b981',
        };
      case 'primary':
        return {
          bg: isDarkMode ? 'rgba(0, 44, 247, 0.2)' : 'rgba(0, 44, 247, 0.12)',
          fg: '#002cf7',
        };
      case 'default':
      default:
        return {
          bg: isDarkMode ? '#27272a' : '#f4f4f5',
          fg: isDarkMode ? '#f4f4f5' : '#18181b',
        };
    }
  }, [variant, customBgColor, customColor, isDarkMode]);

  const clonedChild = React.isValidElement(children)
    ? React.cloneElement(children, {
        color: children.props.color || fg,
        size: children.props.size || 20,
        strokeWidth: children.props.strokeWidth || 2.4,
      })
    : children;

  return (
    <View style={[styles.iconBadge, { backgroundColor: bg }, style]}>
      {clonedChild}
    </View>
  );
}

// ── Modal.Heading ────────────────────────────────────────────────────────────
export function ModalHeading({ children, style }) {
  const { isDarkMode } = useModalContext();
  return (
    <Text
      style={[
        styles.heading,
        { color: isDarkMode ? '#ffffff' : '#09090b' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ── Modal.Description ────────────────────────────────────────────────────────
export function ModalDescription({ children, style }) {
  const { isDarkMode } = useModalContext();
  return (
    <Text
      style={[
        styles.description,
        { color: isDarkMode ? '#a1a1aa' : '#64748b' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ── Modal.Body ───────────────────────────────────────────────────────────────
export function ModalBody({ children, style, scrollable = false }) {
  if (scrollable) {
    return (
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, style]}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.body, style]}>{children}</View>;
}

// ── Modal.Footer ─────────────────────────────────────────────────────────────
export function ModalFooter({ children, style }) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

// ── Modal.Button (HeroUI Style) ──────────────────────────────────────────────
export function ModalButton({
  children,
  variant = 'primary',
  slot,
  onPress,
  disabled = false,
  style,
  textStyle,
  icon,
}) {
  const { onClose, isDarkMode } = useModalContext();

  const handlePress = () => {
    if (disabled) return;
    onPress?.();
    if (slot === 'close') {
      onClose?.();
    }
  };

  const buttonStyle = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5',
          borderWidth: 1,
          borderColor: isDarkMode ? '#3f3f46' : '#e4e4e7',
          textColor: isDarkMode ? '#e4e4e7' : '#3f3f46',
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          borderWidth: 0,
          borderColor: 'transparent',
          textColor: '#ffffff',
        };
      case 'success':
        return {
          backgroundColor: '#10b981',
          borderWidth: 0,
          borderColor: 'transparent',
          textColor: '#ffffff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: isDarkMode ? '#3f3f46' : '#d4d4d8',
          textColor: isDarkMode ? '#e4e4e7' : '#27272a',
        };
      case 'primary':
      default:
        return {
          backgroundColor: '#002cf7',
          borderWidth: 0,
          borderColor: 'transparent',
          textColor: '#ffffff',
        };
    }
  }, [variant, isDarkMode]);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: buttonStyle.backgroundColor,
          borderWidth: buttonStyle.borderWidth,
          borderColor: buttonStyle.borderColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {icon && <View style={styles.buttonIcon}>{icon}</View>}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.buttonText,
          { color: buttonStyle.textColor },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

// ── Compound Components Attachment ───────────────────────────────────────────
Modal.Backdrop = ModalBackdrop;
Modal.Container = ModalContainer;
Modal.Dialog = ModalDialog;
Modal.CloseTrigger = ModalCloseTrigger;
Modal.Header = ModalHeader;
Modal.Icon = ModalIcon;
Modal.Heading = ModalHeading;
Modal.Description = ModalDescription;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Button = ModalButton;

export const Button = ModalButton;

// ── High-Level Ready-To-Use Confirmation Modal ───────────────────────────────
export function ConfirmationModal({
  visible,
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  description,
  message,
  icon,
  variant = 'danger',
  cancelText = 'Annuler',
  confirmText = 'Confirmer',
  confirmVariant,
  confirmIcon,
  size = 'alert',
  isDarkMode,
  showCloseButton = false,
  children,
}) {
  const activeOpen = isOpen !== undefined ? isOpen : visible;
  const activeDescription = description || message;
  const activeConfirmVariant = confirmVariant || (variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary');

  return (
    <Modal isOpen={activeOpen} onClose={onClose} size={size} isDarkMode={isDarkMode}>
      <Modal.Backdrop>
        <Modal.Container size={size}>
          <Modal.Dialog style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
            {showCloseButton && <Modal.CloseTrigger />}
            <Modal.Header layout="column" style={{ alignItems: 'center', marginBottom: 0, width: '100%', gap: 6 }}>
              {icon ? (
                <Modal.Icon variant={variant} style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 6 }}>{icon}</Modal.Icon>
              ) : variant === 'danger' ? (
                <Modal.Icon variant="danger" style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 6 }}><Ban size={22} color="#ef4444" strokeWidth={2.4} /></Modal.Icon>
              ) : (
                <Modal.Icon variant="warning" style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 6 }}><AlertTriangle size={22} color="#f59e0b" strokeWidth={2.4} /></Modal.Icon>
              )}
              <Modal.Heading style={{ textAlign: 'center', fontSize: 17, fontWeight: '700', paddingHorizontal: 6 }}>{title}</Modal.Heading>
              {activeDescription && (
                <Modal.Description style={{ textAlign: 'center', marginTop: 4, lineHeight: 19, fontSize: 13, paddingHorizontal: 4 }}>
                  {activeDescription}
                </Modal.Description>
              )}
            </Modal.Header>

            {children && <Modal.Body style={{ width: '100%', marginTop: 8 }}>{children}</Modal.Body>}

            <Modal.Footer
              style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                marginTop: 18,
              }}
            >
              <Modal.Button slot="close" variant="secondary" style={{ flex: 1 }}>
                {cancelText}
              </Modal.Button>
              <Modal.Button
                variant={activeConfirmVariant}
                onPress={onConfirm}
                icon={confirmIcon}
                style={{ flex: 1 }}
              >
                {confirmText}
              </Modal.Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ── High-Level Ready-To-Use Action Modal ─────────────────────────────────────
export function ActionModal({
  visible,
  isOpen,
  onClose,
  title,
  icon,
  variant = 'primary',
  size = 'md',
  isDarkMode,
  children,
  footer,
}) {
  const activeOpen = isOpen !== undefined ? isOpen : visible;

  return (
    <Modal isOpen={activeOpen} onClose={onClose} size={size} isDarkMode={isDarkMode}>
      <Modal.Backdrop>
        <Modal.Container size={size}>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header layout="row">
              {icon && <Modal.Icon variant={variant}>{icon}</Modal.Icon>}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Modal.Heading>{title}</Modal.Heading>
              </View>
            </Modal.Header>

            <Modal.Body>{children}</Modal.Body>

            {footer && <Modal.Footer>{footer}</Modal.Footer>}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ── High-Level Ready-To-Use Alert Modal ──────────────────────────────────────
export function AlertModal({
  visible,
  isOpen,
  onClose,
  title = 'Information',
  message,
  description,
  variant = 'primary',
  buttons = [],
  onButtonPress,
  isDarkMode,
  size = 'alert',
  showCloseButton = false,
  children,
}) {
  const activeOpen = isOpen !== undefined ? isOpen : visible;
  const activeMessage = description || message;
  const hasMultipleButtons = buttons && buttons.length > 2;
  const canDismissOnBackdrop = !buttons || buttons.length <= 1;

  const handlePress = (btn) => {
    onClose?.();
    if (onButtonPress) {
      onButtonPress(btn);
    } else if (btn.onPress) {
      btn.onPress();
    }
  };

  return (
    <Modal
      isOpen={activeOpen}
      onClose={onClose}
      size={size}
      isDarkMode={isDarkMode}
      closeOnBackdropPress={canDismissOnBackdrop}
    >
      <Modal.Backdrop closeOnPress={canDismissOnBackdrop}>
        <Modal.Container size={size}>
          <Modal.Dialog style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
            {showCloseButton && <Modal.CloseTrigger onPress={onClose} />}
            <Modal.Header layout="column" style={{ alignItems: 'center', marginBottom: 0, width: '100%', gap: 6 }}>
              <Modal.Icon variant={variant} style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 6 }}>
                {variant === 'danger' ? (
                  <Ban size={22} color="#ef4444" strokeWidth={2.4} />
                ) : variant === 'warning' ? (
                  <AlertTriangle size={22} color="#f59e0b" strokeWidth={2.4} />
                ) : variant === 'success' ? (
                  <Check size={22} color="#10b981" strokeWidth={2.4} />
                ) : (
                  <AlertTriangle size={22} color="#002cf7" strokeWidth={2.4} />
                )}
              </Modal.Icon>
              <Modal.Heading style={{ textAlign: 'center', fontSize: 17, fontWeight: '700', paddingHorizontal: 6 }}>{title}</Modal.Heading>
              {activeMessage && (
                <Modal.Description style={{ textAlign: 'center', marginTop: 4, lineHeight: 19, fontSize: 13, paddingHorizontal: 4 }}>
                  {activeMessage}
                </Modal.Description>
              )}
            </Modal.Header>

            {children && <Modal.Body style={{ width: '100%', marginTop: 8 }}>{children}</Modal.Body>}

            <Modal.Footer
              style={{
                width: '100%',
                flexDirection: hasMultipleButtons ? 'column' : 'row',
                justifyContent: 'center',
                gap: 10,
                marginTop: 18,
              }}
            >
              {buttons && buttons.length > 0 ? (
                buttons.map((btn, idx) => {
                  const isDestructive =
                    btn.style === 'destructive' ||
                    (btn.text || '').toLowerCase() === 'supprimer' ||
                    (btn.text || '').toLowerCase() === 'résilier' ||
                    (btn.text || '').toLowerCase() === 'déconnexion';
                  const isCancel =
                    btn.style === 'cancel' ||
                    (btn.text || '').toLowerCase() === 'annuler' ||
                    (btn.text || '').toLowerCase() === 'non';
                  const btnVariant = isDestructive ? 'danger' : isCancel ? 'outline' : 'primary';

                  return (
                    <Modal.Button
                      key={btn.text || idx}
                      variant={btnVariant}
                      onPress={() => handlePress(btn)}
                      style={{
                        flex: hasMultipleButtons ? 0 : 1,
                        width: hasMultipleButtons ? '100%' : undefined,
                      }}
                    >
                      {btn.text}
                    </Modal.Button>
                  );
                })
              ) : (
                <Modal.Button slot="close" variant="primary" style={{ width: '100%' }}>
                  OK
                </Modal.Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

Modal.ConfirmationModal = ConfirmationModal;
Modal.ActionModal = ActionModal;
Modal.AlertModal = AlertModal;

export default Modal;

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
        }
      : {}),
  },
  containerWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    zIndex: 1,
    ...StyleSheet.absoluteFillObject,
  },
  containerInner: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  dialog: {
    width: '100%',
    maxHeight: Platform.OS === 'web' ? '90vh' : '90%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeTrigger: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 32, // space for close button
  },
  headerColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  body: {
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 9999,
    minHeight: 44,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
