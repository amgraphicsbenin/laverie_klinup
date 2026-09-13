import React from 'react';
import { StyleSheet, Text, View, Modal, Platform } from 'react-native';
import { MotiView } from './SafeView';
import { Check } from 'lucide-react-native';
import { HeroUIProgressCircle } from './HeroUIProgressCircle';

/**
 * ActionTransitionOverlay
 * 
 * Global transition modal displaying:
 * 1. HeroUI Indeterminate ProgressCircle during processing/loading
 * 2. Seamless animated success confirmation badge and label in the exact same modal when closing an order
 */
export const ActionTransitionOverlay = ({
  visible,
  phase = 'loading', // 'loading' | 'success'
  message,
  isDarkMode = false,
}) => {
  if (!visible) return null;

  const isSuccess = phase === 'success';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {}}
    >
      <View
        pointerEvents="auto"
        style={[
          styles.backdrop,
          { backgroundColor: 'rgba(0, 0, 0, 0.65)' }
        ]}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{
            opacity: 1,
            scale: isSuccess ? 1.02 : 1,
          }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              borderColor: isSuccess 
                ? (isDarkMode ? '#059669' : '#10b981')
                : (isDarkMode ? '#27272a' : '#e4e4e7'),
            }
          ]}
        >
          {isSuccess ? (
            <MotiView
              key="success-badge"
              from={{ scale: 0.3, opacity: 0, rotate: '-20deg' }}
              animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
              transition={{ type: 'spring', damping: 12, stiffness: 220 }}
              style={styles.successIconWrapper}
            >
              <View style={[styles.successCircle, { backgroundColor: '#10b981' }]}>
                <Check size={20} color="#ffffff" strokeWidth={3} />
              </View>
            </MotiView>
          ) : (
            <HeroUIProgressCircle
              size={32}
              strokeWidth={3}
              color={isDarkMode ? '#38bdf8' : '#002cf7'}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Action / Confirmation Label */}
          {!!message && (
            <MotiView
              key={isSuccess ? 'success-msg' : 'loading-msg'}
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 160 }}
            >
              <Text
                style={[
                  styles.messageText,
                  {
                    color: isSuccess
                      ? (isDarkMode ? '#34d399' : '#059669')
                      : (isDarkMode ? '#f4f4f5' : '#18181b'),
                    fontWeight: isSuccess ? '700' : '600',
                  }
                ]}
                numberOfLines={2}
              >
                {message}
              </Text>
            </MotiView>
          )}
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999999,
    elevation: 9999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 140,
    maxWidth: 250,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  successIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  successCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  messageText: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.2,
  },
});

export default ActionTransitionOverlay;

