import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  ShoppingBag,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  User,
  Award,
  BellOff,
  Clock,
  Check,
} from 'lucide-react-native';
import { ConfirmationModal } from './ui/modal';
import { SmoothScrollView as ScrollView } from './SmoothScroll';
import { db } from '../services/db';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch (e) {
    return '';
  }
}

function getActionConfig(action, isDarkMode) {
  switch (action) {
    case 'CREATION_COMMANDE':
    case 'COMMANDE_ABONNEMENT':
      return {
        category: 'orders',
        title: 'Nouvelle Commande',
        icon: ShoppingBag,
        color: '#002cf7',
        bg: isDarkMode ? 'rgba(0, 44, 247, 0.22)' : 'rgba(0, 44, 247, 0.1)',
      };
    case 'MISE_A_JOUR_STATUT':
      return {
        category: 'orders',
        title: 'Statut Commande',
        icon: RefreshCw,
        color: '#8b5cf6',
        bg: isDarkMode ? 'rgba(139, 92, 246, 0.22)' : 'rgba(139, 92, 246, 0.1)',
      };
    case 'PAIEMENT_FINAL':
    case 'MAJ_SOLDE_FINANCIER':
      return {
        category: 'payments',
        title: 'Règlement / Paiement',
        icon: CreditCard,
        color: '#10b981',
        bg: isDarkMode ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.1)',
      };
    case 'ANNULATION_COMMANDE':
      return {
        category: 'orders',
        title: 'Commande Annulée',
        icon: AlertTriangle,
        color: '#ef4444',
        bg: isDarkMode ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.1)',
      };
    case 'CREATION_CLIENT':
    case 'MODIFICATION_CLIENT':
    case 'SUPPRESSION_CLIENT':
      return {
        category: 'clients',
        title: 'Gestion Client',
        icon: User,
        color: '#06b6d4',
        bg: isDarkMode ? 'rgba(6, 182, 212, 0.22)' : 'rgba(6, 182, 212, 0.1)',
      };
    case 'SOUSCRIPTION_ABONNEMENT':
    case 'DESABONNEMENT':
      return {
        category: 'clients',
        title: 'Abonnement',
        icon: Award,
        color: '#f59e0b',
        bg: isDarkMode ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.1)',
      };
    default:
      return {
        category: 'all',
        title: 'Notification Système',
        icon: Bell,
        color: '#002cf7',
        bg: isDarkMode ? 'rgba(0, 44, 247, 0.2)' : '#eff6ff',
      };
  }
}

/**
 * Modern Bottom Sheet Notification Center (Native iOS & Android)
 */
export function NotificationPopover({
  notifications = [],
  isDarkMode = false,
  isOpen: controlledIsOpen,
  visible,
  onClose: controlledOnClose,
  triggerStyle,
  children,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined || visible !== undefined;
  const isOpen = isControlled ? (controlledIsOpen ?? visible) : internalIsOpen;
  const [activeFilter, setActiveFilter] = useState('all');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  useEffect(() => {
    if (isControlled) {
      if (isOpen) {
        openSheetAnim();
      } else {
        closeSheetAnim();
      }
    }
  }, [isOpen, isControlled]);

  // Animated values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const validNotifications = (notifications || []).filter(
    (n) => n.action !== 'CONNEXION' && n.action !== 'DECONNEXION'
  );
  const unreadCount = validNotifications.filter((n) => !n.read).length;

  const filteredNotifications = validNotifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'orders') {
      return ['CREATION_COMMANDE', 'COMMANDE_ABONNEMENT', 'MISE_A_JOUR_STATUT', 'ANNULATION_COMMANDE'].includes(n.action);
    }
    if (activeFilter === 'payments') {
      return ['PAIEMENT_FINAL', 'MAJ_SOLDE_FINANCIER'].includes(n.action);
    }
    if (activeFilter === 'clients') {
      return ['CREATION_CLIENT', 'MODIFICATION_CLIENT', 'SUPPRESSION_CLIENT', 'SOUSCRIPTION_ABONNEMENT', 'DESABONNEMENT'].includes(n.action);
    }
    return true;
  });

  const ordersCount = validNotifications.filter((n) =>
    ['CREATION_COMMANDE', 'COMMANDE_ABONNEMENT', 'MISE_A_JOUR_STATUT', 'ANNULATION_COMMANDE'].includes(n.action)
  ).length;

  const paymentsCount = validNotifications.filter((n) =>
    ['PAIEMENT_FINAL', 'MAJ_SOLDE_FINANCIER'].includes(n.action)
  ).length;

  const clientsCount = validNotifications.filter((n) =>
    ['CREATION_CLIENT', 'MODIFICATION_CLIENT', 'SUPPRESSION_CLIENT', 'SOUSCRIPTION_ABONNEMENT', 'DESABONNEMENT'].includes(n.action)
  ).length;

  const openSheetAnim = () => {
    setInternalIsOpen(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        damping: 24,
        stiffness: 280,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheetAnim = (onComplete) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalIsOpen(false);
      controlledOnClose?.();
      onComplete?.();
    });
  };

  const openSheet = openSheetAnim;
  const closeSheet = closeSheetAnim;

  const handleMarkAllRead = () => {
    if (typeof db.markAllNotificationsRead === 'function') {
      db.markAllNotificationsRead();
    }
  };

  const handleClearAll = () => {
    setShowClearConfirmModal(true);
  };

  const handleConfirmClearAll = () => {
    setShowClearConfirmModal(false);
    if (typeof db.clearAllNotifications === 'function') {
      db.clearAllNotifications();
    }
  };

  const handleItemPress = (item) => {
    if (!item.read && typeof db.markNotificationRead === 'function') {
      db.markNotificationRead(item.id);
    }
  };

  const handleDeleteItem = (id) => {
    if (typeof db.deleteNotification === 'function') {
      db.deleteNotification(id);
    }
  };

  const sheetBg = isDarkMode ? '#111116' : '#ffffff';
  const cardBg = isDarkMode ? '#18181f' : '#f8fafc';
  const cardBorder = isDarkMode ? '#272732' : '#e2e8f0';

  return (
    <>
      {/* TRIGGER BUTTON (Header Bell Button) */}
      {children ? (
        <Pressable onPress={openSheet}>{children}</Pressable>
      ) : (
        <TouchableOpacity
          style={[
            styles.triggerBtn,
            {
              backgroundColor: isDarkMode ? '#121216' : '#ffffff',
              borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
            },
            triggerStyle,
          ]}
          onPress={openSheet}
          activeOpacity={0.8}
        >
          <Bell size={20} color={isDarkMode ? '#ffffff' : '#09090b'} />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* MODERN BOTTOM SHEET MODAL */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeSheet()}
        statusBarTranslucent={true}
      >
        <View style={styles.modalRoot}>
          {/* Backdrop Overlay */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSheet()} />
          </Animated.View>

          {/* Sliding Sheet Panel */}
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: sheetBg,
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            {/* Drag Handle Bar */}
            <Pressable onPress={() => closeSheet()} style={styles.handleWrapper}>
              <View
                style={[
                  styles.dragHandle,
                  { backgroundColor: isDarkMode ? '#3f3f46' : '#cbd5e1' },
                ]}
              />
            </Pressable>

            {/* Header */}
            <View
              style={[
                styles.sheetHeader,
                { borderBottomColor: isDarkMode ? '#22222a' : '#f1f5f9' },
              ]}
            >
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.bellBadge,
                    { backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.2)' : '#eff6ff' },
                  ]}
                >
                  <Bell size={20} color="#002cf7" />
                </View>
                <View>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { color: isDarkMode ? '#ffffff' : '#09090b' },
                    ]}
                  >
                    Notifications
                  </Text>
                  <View style={styles.unreadTagRow}>
                    <View
                      style={[
                        styles.unreadTagPill,
                        {
                          backgroundColor: unreadCount > 0
                            ? isDarkMode ? 'rgba(0, 44, 247, 0.25)' : '#eff6ff'
                            : isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
                        },
                      ]}
                    >
                      {unreadCount > 0 ? (
                        <>
                          <View style={styles.unreadDot} />
                          <Text style={[styles.unreadTagText, { color: '#002cf7' }]}>
                            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Check size={11} color="#10b981" strokeWidth={3} />
                          <Text style={[styles.unreadTagText, { color: '#10b981' }]}>
                            À jour
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => closeSheet()}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDarkMode ? '#22222a' : '#f1f5f9' },
                ]}
                activeOpacity={0.7}
              >
                <X size={17} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* Category Filter Chips (Pills) */}
            <View
              style={[
                styles.filterRow,
                { borderBottomColor: isDarkMode ? '#22222a' : '#f1f5f9' },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                {[
                  { id: 'all', label: 'Toutes', count: validNotifications.length },
                  { id: 'unread', label: 'Non lues', count: unreadCount },
                  { id: 'orders', label: 'Commandes', count: ordersCount },
                  { id: 'payments', label: 'Paiements', count: paymentsCount },
                  { id: 'clients', label: 'Clients', count: clientsCount },
                ].map((tab) => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setActiveFilter(tab.id)}
                      style={[
                        styles.filterChip,
                        {
                          borderColor: isActive
                            ? '#002cf7'
                            : isDarkMode ? '#272732' : '#e2e8f0',
                          backgroundColor: isActive
                            ? '#002cf7'
                            : isDarkMode ? '#18181f' : '#ffffff',
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isActive
                              ? '#ffffff'
                              : isDarkMode ? '#a1a1aa' : '#64748b',
                          },
                        ]}
                      >
                        {tab.label}
                      </Text>
                      <View
                        style={[
                          styles.filterCountBadge,
                          {
                            backgroundColor: isActive
                              ? 'rgba(255, 255, 255, 0.25)'
                              : isDarkMode ? '#272732' : '#f1f5f9',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterCountText,
                            { color: isActive ? '#ffffff' : isDarkMode ? '#94a3b8' : '#64748b' },
                          ]}
                        >
                          {tab.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Action Bar (Pill Buttons) */}
            {validNotifications.length > 0 && (
              <View
                style={[
                  styles.actionBar,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    borderBottomColor: isDarkMode ? '#22222a' : '#f1f5f9',
                  },
                ]}
              >
                {unreadCount > 0 ? (
                  <TouchableOpacity
                    onPress={handleMarkAllRead}
                    style={[
                      styles.actionPillBtn,
                      {
                        backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#eff6ff',
                        borderColor: isDarkMode ? 'rgba(0, 44, 247, 0.3)' : 'rgba(0, 44, 247, 0.2)',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <CheckCheck size={14} color="#002cf7" />
                    <Text style={[styles.actionPillText, { color: '#002cf7' }]}>
                      Tout marquer lu
                    </Text>
                  </TouchableOpacity>
                ) : <View />}

                <TouchableOpacity
                  onPress={handleClearAll}
                  style={[
                    styles.actionPillBtn,
                    {
                      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                      marginLeft: 'auto',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Trash2 size={13} color="#ef4444" />
                  <Text style={[styles.actionPillText, { color: '#ef4444' }]}>
                    Tout effacer
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Notification Cards List */}
            <ScrollView
              style={styles.cardScrollView}
              contentContainerStyle={styles.cardScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredNotifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View
                    style={[
                      styles.emptyIconCircle,
                      { backgroundColor: isDarkMode ? '#18181f' : '#f1f5f9' },
                    ]}
                  >
                    <BellOff size={28} color={isDarkMode ? '#71717a' : '#94a3b8'} />
                  </View>
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: isDarkMode ? '#ffffff' : '#09090b' },
                    ]}
                  >
                    Aucune notification
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: isDarkMode ? '#a1a1aa' : '#64748b' },
                    ]}
                  >
                    {activeFilter === 'all'
                      ? 'Tout est calme et synchronisé dans votre atelier.'
                      : 'Aucune notification trouvée pour ce filtre.'}
                  </Text>
                </View>
              ) : (
                filteredNotifications.map((item) => {
                  const config = getActionConfig(item.action, isDarkMode);
                  const IconComp = config.icon;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item)}
                      style={[
                        styles.notifCard,
                        {
                          borderColor: item.read
                            ? cardBorder
                            : isDarkMode ? '#002cf7' : '#bfdbfe',
                          backgroundColor: item.read
                            ? cardBg
                            : isDarkMode ? 'rgba(0, 44, 247, 0.12)' : '#ffffff',
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      {/* Glowing Unread Dot */}
                      {!item.read && <View style={styles.cardUnreadDot} />}

                      {/* Icon Squircle */}
                      <View
                        style={[
                          styles.cardIconBox,
                          { backgroundColor: config.bg },
                        ]}
                      >
                        <IconComp size={18} color={config.color} />
                      </View>

                      {/* Text Content */}
                      <View style={styles.cardTextContainer}>
                        <View style={styles.cardTitleRow}>
                          <Text
                            style={[
                              styles.cardTitle,
                              { color: isDarkMode ? '#ffffff' : '#09090b' },
                            ]}
                            numberOfLines={1}
                          >
                            {config.title}
                          </Text>

                          <View style={styles.cardTimePill}>
                            <Clock size={10} color={isDarkMode ? '#a1a1aa' : '#94a3b8'} />
                            <Text
                              style={[
                                styles.cardTimeText,
                                { color: isDarkMode ? '#a1a1aa' : '#94a3b8' },
                              ]}
                            >
                              {formatRelativeTime(item.timestamp)}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.cardDetails,
                            { color: isDarkMode ? '#d4d4d8' : '#475569' },
                          ]}
                          numberOfLines={2}
                        >
                          {item.details}
                        </Text>
                      </View>

                      {/* Individual Delete Action */}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleDeleteItem(item.id);
                        }}
                        style={styles.cardDeleteBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={14} color={isDarkMode ? '#71717a' : '#94a3b8'} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Bottom Dismiss Action */}
            <View
              style={[
                styles.bottomBar,
                {
                  borderTopColor: isDarkMode ? '#22222a' : '#f1f5f9',
                  backgroundColor: sheetBg,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => closeSheet()}
                style={[
                  styles.dismissBtn,
                  {
                    backgroundColor: isDarkMode ? '#18181f' : '#f8fafc',
                    borderColor: isDarkMode ? '#272732' : '#e2e8f0',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dismissBtnText,
                    { color: isDarkMode ? '#ffffff' : '#09090b' },
                  ]}
                >
                  Fermer
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Clear All Confirmation Modal */}
        <ConfirmationModal
          visible={showClearConfirmModal}
          onClose={() => setShowClearConfirmModal(false)}
          onConfirm={handleConfirmClearAll}
          title="Effacer les notifications"
          message="Voulez-vous supprimer définitivement toutes les notifications de votre historique ?"
          confirmText="Tout effacer"
          cancelText="Annuler"
          isDanger={true}
          isDarkMode={isDarkMode}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 9999,
    backgroundColor: '#002cf7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '84%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 24,
  },
  handleWrapper: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 9999,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unreadTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  unreadTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  unreadDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#002cf7',
  },
  unreadTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.48,
  },
  cardScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 240,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    position: 'relative',
  },
  cardUnreadDot: {
    position: 'absolute',
    top: 14,
    left: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#002cf7',
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  cardTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
  },
  cardTimeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardDetails: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  cardDeleteBtn: {
    padding: 4,
    borderRadius: 9999,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 9999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default NotificationPopover;
