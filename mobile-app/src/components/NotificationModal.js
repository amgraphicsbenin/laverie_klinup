import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
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
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react-native';
import SafeBlurView from './SafeBlurView';
import SafeView from './SafeView';
import { db } from '../services/db';

export function NotificationModal({ visible, onClose, notifications = [], isDarkMode = false }) {
  if (!visible) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatRelativeTime = (timestamp) => {
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
  };

  const getActionConfig = (action) => {
    switch (action) {
      case 'CREATION_COMMANDE':
      case 'COMMANDE_ABONNEMENT':
        return {
          title: 'Nouvelle Commande',
          icon: ShoppingBag,
          color: '#2563eb',
          bg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff'
        };
      case 'MISE_A_JOUR_STATUT':
        return {
          title: 'Statut de Commande',
          icon: RefreshCw,
          color: '#7c3aed',
          bg: isDarkMode ? 'rgba(124, 58, 237, 0.2)' : '#f5f3ff'
        };
      case 'PAIEMENT_FINAL':
      case 'MAJ_SOLDE_FINANCIER':
        return {
          title: 'Règlement / Paiement',
          icon: CreditCard,
          color: '#059669',
          bg: isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5'
        };
      case 'ANNULATION_COMMANDE':
        return {
          title: 'Commande Annulée',
          icon: AlertTriangle,
          color: '#ef4444',
          bg: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2'
        };
      case 'CREATION_CLIENT':
      case 'MODIFICATION_CLIENT':
      case 'SUPPRESSION_CLIENT':
        return {
          title: 'Gestion Clients',
          icon: User,
          color: '#0891b2',
          bg: isDarkMode ? 'rgba(8, 145, 178, 0.2)' : '#ecfeff'
        };
      case 'SOUSCRIPTION_ABONNEMENT':
      case 'DESABONNEMENT':
        return {
          title: 'Abonnements',
          icon: Award,
          color: '#d97706',
          bg: isDarkMode ? 'rgba(217, 119, 6, 0.2)' : '#fffbeb'
        };
      default:
        return {
          title: 'Activité Système',
          icon: Bell,
          color: '#2563eb',
          bg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff'
        };
    }
  };

  const handleMarkAllRead = () => {
    if (typeof db.markAllNotificationsRead === 'function') {
      db.markAllNotificationsRead();
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Effacer les notifications",
      "Voulez-vous supprimer toutes les notifications ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer tout",
          style: "destructive",
          onPress: () => {
            if (typeof db.clearAllNotifications === 'function') {
              db.clearAllNotifications();
            }
          }
        }
      ]
    );
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

  return (
    <SafeView
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 99999, justifyContent: 'center', alignItems: 'center' }
      ]}
    >
      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
        <SafeBlurView intensity={85} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.bellCircle, { backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff' }]}>
              <Bell size={20} color="#2563eb" />
            </View>
            <View>
              <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Notifications</Text>
              <Text style={[styles.subtitle, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={isDarkMode ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>

        {/* Action bar */}
        {notifications.length > 0 && (
          <View style={[styles.actionBar, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionBtn}>
                <CheckCheck size={14} color="#2563eb" />
                <Text style={styles.actionBtnText}>Tout marquer comme lu</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClearAll} style={[styles.actionBtn, { marginLeft: 'auto' }]}>
              <Trash2 size={14} color="#ef4444" />
              <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Tout effacer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <ScrollView
          style={{ flexShrink: 1, width: '100%' }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
                <BellOff size={32} color={isDarkMode ? '#475569' : '#94a3b8'} />
              </View>
              <Text style={[styles.emptyTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Aucune notification</Text>
              <Text style={[styles.emptySub, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                Les notifications d'activité de vos commandes et clients apparaîtront ici.
              </Text>
            </View>
          ) : (
            notifications.map((item) => {
              const config = getActionConfig(item.action);
              const IconComp = config.icon;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => handleItemPress(item)}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: item.read 
                        ? (isDarkMode ? '#0f172a' : '#f8fafc') 
                        : (isDarkMode ? 'rgba(37, 99, 235, 0.08)' : '#ffffff'),
                      borderColor: item.read 
                        ? (isDarkMode ? '#1e293b' : '#f1f5f9') 
                        : (isDarkMode ? '#3b82f6' : '#bfdbfe'),
                    }
                  ]}
                >
                  {!item.read && <View style={styles.unreadDot} />}
                  <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                    <IconComp size={18} color={config.color} />
                  </View>
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{config.title}</Text>
                      <Text style={[styles.itemTime, { color: isDarkMode ? '#94a3b8' : '#94a3b8' }]}>{formatRelativeTime(item.timestamp)}</Text>
                    </View>
                    <Text style={[styles.itemDetails, { color: isDarkMode ? '#cbd5e1' : '#475569' }]} numberOfLines={2}>
                      {item.details}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id)}
                    style={styles.deleteSingleBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={14} color={isDarkMode ? '#64748b' : '#94a3b8'} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '75%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  scrollContent: {
    paddingVertical: 12,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    gap: 10,
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  itemDetails: {
    fontSize: 12,
    lineHeight: 16,
  },
  deleteSingleBtn: {
    padding: 4,
  },
});

export default NotificationModal;
