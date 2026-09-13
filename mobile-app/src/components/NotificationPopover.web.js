"use client";
/**
 * Modern Bottom Sheet Notification Center (Web)
 * Transforms the old top-right dropdown into a tactile, thumb-friendly iOS/Material bottom sheet drawer.
 * Includes interactive category filter pills, smooth slide-up physics, refined typography matching the app.
 */

import React, { useState, useEffect } from 'react';
import {
  Platform,
} from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';
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
import { db } from '../services/db';

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const DRAWER_SPRING = {
  type: 'spring',
  damping: 28,
  stiffness: 280,
  mass: 0.8,
};

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

  const setIsOpen = (val) => {
    const nextVal = typeof val === 'function' ? val(isOpen) : val;
    if (!nextVal) {
      controlledOnClose?.();
    }
    setInternalIsOpen(nextVal);
  };
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'orders' | 'payments' | 'clients'

  const validNotifications = notifications.filter(
    (n) => n.action !== 'CONNEXION' && n.action !== 'DECONNEXION'
  );
  const unreadCount = validNotifications.filter((n) => !n.read).length;

  // Filtered list according to selected filter tab
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

  const handleMarkAllRead = () => {
    if (typeof db.markAllNotificationsRead === 'function') {
      db.markAllNotificationsRead();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Voulez-vous supprimer toutes les notifications ?')) {
      if (typeof db.clearAllNotifications === 'function') {
        db.clearAllNotifications();
      }
    }
  };

  const handleItemPress = (item) => {
    if (!item.read && typeof db.markNotificationRead === 'function') {
      db.markNotificationRead(item.id);
    }
  };

  const handleDeleteItem = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (typeof db.deleteNotification === 'function') {
      db.deleteNotification(id);
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sheetBg = isDarkMode ? '#111116' : '#ffffff';
  const cardBg = isDarkMode ? '#18181f' : '#f8fafc';
  const cardBorder = isDarkMode ? '#272732' : '#e2e8f0';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', fontFamily: FONT_FAMILY }}>
      {/* TRIGGER BUTTON (Header Bell Button) */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setIsOpen(true)}
        style={{
          width: 42,
          height: 42,
          borderRadius: 9999,
          border: `1.5px solid ${isOpen ? '#002cf7' : isDarkMode ? '#27272a' : '#e2e8f0'}`,
          backgroundColor: isOpen
            ? isDarkMode
              ? 'rgba(0, 44, 247, 0.2)'
              : '#eff6ff'
            : isDarkMode
            ? '#121216'
            : '#ffffff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          cursor: 'pointer',
          outline: 'none',
          padding: 0,
          fontFamily: FONT_FAMILY,
          ...triggerStyle,
        }}
        aria-expanded={isOpen}
        aria-label="Centre de notifications"
      >
        <Bell
          size={20}
          color={isOpen ? '#002cf7' : isDarkMode ? '#ffffff' : '#09090b'}
        />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: 19,
              height: 19,
              borderRadius: 9999,
              backgroundColor: '#002cf7',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 800,
              fontFamily: FONT_FAMILY,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: `2px solid ${isDarkMode ? '#000000' : '#ffffff'}`,
              boxShadow: '0 2px 8px rgba(0, 44, 247, 0.4)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* MODERN BOTTOM SHEET NOTIFICATION DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 99998,
                cursor: 'pointer',
              }}
            />

            {/* Sliding Bottom Sheet Container */}
            <motion.div
              key="bottom-sheet"
              role="dialog"
              aria-modal="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={DRAWER_SPRING}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                margin: '0 auto',
                width: '100%',
                maxWidth: 440,
                maxHeight: '84vh',
                backgroundColor: sheetBg,
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                boxShadow: '0 -20px 50px rgba(0, 0, 0, 0.45)',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: FONT_FAMILY,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              {/* Drag Handle Pill */}
              <div
                onClick={() => setIsOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px 0 6px',
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 5,
                    borderRadius: 9999,
                    backgroundColor: isDarkMode ? '#3f3f46' : '#cbd5e1',
                  }}
                />
              </div>

              {/* SHEET HEADER */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 20px 14px',
                  borderBottom: `1px solid ${isDarkMode ? '#22222a' : '#f1f5f9'}`,
                  fontFamily: FONT_FAMILY,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.2)' : '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(0, 44, 247, 0.15)',
                      flexShrink: 0,
                    }}
                  >
                    <Bell size={20} color="#002cf7" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: isDarkMode ? '#ffffff' : '#09090b',
                        letterSpacing: -0.3,
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      Notifications
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          fontFamily: FONT_FAMILY,
                          backgroundColor: unreadCount > 0
                            ? isDarkMode ? 'rgba(0, 44, 247, 0.25)' : '#eff6ff'
                            : isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
                          color: unreadCount > 0 ? '#002cf7' : '#10b981',
                        }}
                      >
                        {unreadCount > 0 ? (
                          <>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#002cf7' }} />
                            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                          </>
                        ) : (
                          <>
                            <Check size={11} strokeWidth={3} />
                            À jour
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Round Close Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9999,
                    border: 'none',
                    backgroundColor: isDarkMode ? '#22222a' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: FONT_FAMILY,
                  }}
                  aria-label="Fermer"
                >
                  <X size={17} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
                </motion.button>
              </div>

              {/* HORIZONTAL CATEGORY FILTER PILLS */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px 10px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  borderBottom: `1px solid ${isDarkMode ? '#22222a' : '#f1f5f9'}`,
                  fontFamily: FONT_FAMILY,
                }}
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
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: FONT_FAMILY,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        border: isActive
                          ? '1px solid #002cf7'
                          : `1px solid ${isDarkMode ? '#272732' : '#e2e8f0'}`,
                        backgroundColor: isActive
                          ? '#002cf7'
                          : isDarkMode
                          ? '#18181f'
                          : '#ffffff',
                        color: isActive
                          ? '#ffffff'
                          : isDarkMode
                          ? '#a1a1aa'
                          : '#64748b',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontFamily: FONT_FAMILY }}>{tab.label}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          fontFamily: FONT_FAMILY,
                          padding: '1px 6px',
                          borderRadius: 9999,
                          backgroundColor: isActive
                            ? 'rgba(255, 255, 255, 0.25)'
                            : isDarkMode
                            ? '#272732'
                            : '#f1f5f9',
                          color: isActive ? '#ffffff' : isDarkMode ? '#94a3b8' : '#64748b',
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ACTION TOOLBAR (Pill Buttons) */}
              {validNotifications.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 20px',
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    borderBottom: `1px solid ${isDarkMode ? '#22222a' : '#f1f5f9'}`,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#eff6ff',
                        border: `1px solid ${isDarkMode ? 'rgba(0, 44, 247, 0.3)' : 'rgba(0, 44, 247, 0.2)'}`,
                        color: '#002cf7',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: FONT_FAMILY,
                        cursor: 'pointer',
                        padding: '5px 12px',
                        borderRadius: 9999,
                      }}
                    >
                      <CheckCheck size={14} color="#002cf7" />
                      Tout marquer lu
                    </button>
                  ) : <span />}

                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                      border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                      color: '#ef4444',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: FONT_FAMILY,
                      cursor: 'pointer',
                      padding: '5px 12px',
                      borderRadius: 9999,
                      marginLeft: 'auto',
                    }}
                  >
                    <Trash2 size={13} color="#ef4444" />
                    Tout effacer
                  </button>
                </div>
              )}

              {/* NOTIFICATION CARDS LIST */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontFamily: FONT_FAMILY,
                }}
              >
                {filteredNotifications.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '48px 20px',
                      textAlign: 'center',
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 9999,
                        backgroundColor: isDarkMode ? '#18181f' : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 14,
                      }}
                    >
                      <BellOff size={28} color={isDarkMode ? '#71717a' : '#94a3b8'} />
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        fontFamily: FONT_FAMILY,
                        color: isDarkMode ? '#ffffff' : '#09090b',
                        marginBottom: 6,
                      }}
                    >
                      Aucune notification
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: FONT_FAMILY,
                        color: isDarkMode ? '#a1a1aa' : '#64748b',
                        lineHeight: '18px',
                        maxWidth: 240,
                      }}
                    >
                      {activeFilter === 'all'
                        ? 'Tout est calme et synchronisé dans votre atelier.'
                        : 'Aucune notification trouvée pour ce filtre.'}
                    </div>
                  </div>
                ) : (
                  filteredNotifications.map((item, index) => {
                    const config = getActionConfig(item.action, isDarkMode);
                    const IconComp = config.icon;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        onClick={() => handleItemPress(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '12px 14px',
                          borderRadius: 18,
                          border: `1px solid ${
                            item.read
                              ? cardBorder
                              : isDarkMode
                              ? '#002cf7'
                              : '#bfdbfe'
                          }`,
                          backgroundColor: item.read
                            ? cardBg
                            : isDarkMode
                            ? 'rgba(0, 44, 247, 0.12)'
                            : '#ffffff',
                          boxShadow: !item.read
                            ? '0 4px 16px rgba(0, 44, 247, 0.08)'
                            : 'none',
                          gap: 12,
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {/* Unread Glowing Dot */}
                        {!item.read && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 14,
                              left: 6,
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: '#002cf7',
                              boxShadow: '0 0 8px #002cf7',
                            }}
                          />
                        )}

                        {/* Category Icon Badge */}
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: config.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          <IconComp size={18} color={config.color} />
                        </div>

                        {/* Content Body */}
                        <div style={{ flex: 1, minWidth: 0, fontFamily: FONT_FAMILY }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 4,
                              fontFamily: FONT_FAMILY,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                fontFamily: FONT_FAMILY,
                                color: isDarkMode ? '#ffffff' : '#09090b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {config.title}
                            </span>

                            {/* Relative Timestamp Tag */}
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                fontSize: 10,
                                fontWeight: 600,
                                fontFamily: FONT_FAMILY,
                                color: isDarkMode ? '#a1a1aa' : '#94a3b8',
                                marginLeft: 8,
                                flexShrink: 0,
                              }}
                            >
                              <Clock size={10} />
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              fontFamily: FONT_FAMILY,
                              color: isDarkMode ? '#d4d4d8' : '#475569',
                              lineHeight: '17px',
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.details}
                          </div>
                        </div>

                        {/* Single Delete Action */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 4,
                            cursor: 'pointer',
                            color: isDarkMode ? '#71717a' : '#94a3b8',
                            borderRadius: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontFamily: FONT_FAMILY,
                          }}
                          aria-label="Supprimer"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* SHEET BOTTOM ACTION BUTTON */}
              <div
                style={{
                  padding: '12px 20px 24px',
                  borderTop: `1px solid ${isDarkMode ? '#22222a' : '#f1f5f9'}`,
                  backgroundColor: sheetBg,
                  fontFamily: FONT_FAMILY,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: '100%',
                    padding: '13px 0',
                    borderRadius: 9999,
                    border: `1.5px solid ${isDarkMode ? '#272732' : '#e2e8f0'}`,
                    backgroundColor: isDarkMode ? '#18181f' : '#f8fafc',
                    color: isDarkMode ? '#ffffff' : '#09090b',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: FONT_FAMILY,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationPopover;
