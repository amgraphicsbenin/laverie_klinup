/**
 * @file notificationService.js
 * @description Service de notifications KLIN UP.
 * Gère les canaux Android, les permissions, les Expo Push Tokens,
 * les notifications foreground (avec sonnerie système) et background (push distantes).
 */

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION FOREGROUND HANDLER
// Affiche alerte + son + badge même quand l'app est ouverte
// ─────────────────────────────────────────────────────────────────────────────
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
} catch (e) {
  console.warn('[Notifications] setNotificationHandler error:', e);
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUT DES COMMANDES → Textes lisibles
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_LABELS = {
  en_attente: 'En attente',
  attente: 'En attente',
  traitement: 'En cours de traitement',
  en_cours_lavage: 'Lavage en cours',
  lavage: 'Lavage en cours',
  en_cours_repassage: 'Repassage en cours',
  repassage: 'Repassage en cours',
  pret: 'Prête',
  a_livrer: 'Prête à livrer',
  a_recuperer: 'À récupérer',
  en_cours_livraison: 'En cours de livraison',
  restitue: 'Livrée / Restituée',
  livre: 'Livrée / Restituée',
  annule: 'Annulée',
};

/**
 * Retourne l'emoji et le texte lisible pour un statut de commande.
 */
export function getOrderStatusLabel(statut) {
  if (!statut) return 'Mise à jour';
  const cleanKey = String(statut).trim().toLowerCase().replace(/['']/g, '');
  if (STATUS_LABELS[cleanKey]) {
    return STATUS_LABELS[cleanKey];
  }
  const sanitized = String(statut)
    .replace(/['']/g, '')
    .replace(/_/g, ' ')
    .trim();
  return sanitized ? sanitized.charAt(0).toUpperCase() + sanitized.slice(1) : 'Mise à jour';
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISATION — Canaux Android + Permissions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise les canaux Android et demande les permissions de notification.
 * Doit être appelée au démarrage de l'app (dans App.js).
 */
export async function initSystemNotifications() {
  try {
    if (Platform.OS === 'android') {
      // Canal principal pour les commandes (priorité MAX = sonnerie + heads-up banner garantis sur Pixel)
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Commandes KLIN UP',
        description: 'Notifications de suivi des commandes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 150, 400],
        lightColor: '#002cf7',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.NOTIFICATION,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      });

      // Canal secondaire pour les alertes générales
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications générales',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 300],
        lightColor: '#002cf7',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // Demander les permissions (Android 13+ POST_NOTIFICATIONS et iOS)
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: false,
          },
          android: {},
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Notifications] Permissions non accordées. Les notifications peuvent ne pas fonctionner.');
      } else {
        console.log('[Notifications] ✅ Permissions accordées.');
      }
    }
  } catch (err) {
    console.warn('[Notifications] Erreur d\'initialisation:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPO PUSH TOKEN — Pour notifications hors-app
// ─────────────────────────────────────────────────────────────────────────────

let _cachedPushToken = null;

/**
 * Récupère le Push Token Expo de cet appareil.
 * Nécessite un projet Expo enregistré (EAS) pour fonctionner en production.
 * En dev/Expo Go, fonctionne sans configuration supplémentaire.
 * @returns {string|null} Le token Expo push ou null si non disponible.
 */
export async function getExpoPushToken() {
  if (_cachedPushToken) return _cachedPushToken;

  if (Platform.OS === 'web') {
    return null; // Pas de push token sur le web
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Notifications] Push token non disponible : permissions refusées.');
      return null;
    }

    // Récupérer le token Expo Push avec le projectId EAS
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 'd135428c-fc03-49fe-92c9-fb0a9a86d7a2';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    _cachedPushToken = tokenData.data;
    console.log('[Notifications] ✅ Push Token obtenu:', _cachedPushToken);
    return _cachedPushToken;
  } catch (err) {
    // En Expo Go sans configuration EAS, cette erreur est normale en dev
    console.warn('[Notifications] Push Token non disponible (normal en dev sans EAS):', err.message);
    return null;
  }
}

/**
 * Sauvegarde le push token de l'utilisateur dans Supabase.
 * Permet à l'Edge Function d'envoyer des push à cet appareil.
 * @param {string} userId - L'ID de l'utilisateur staff.
 */
export async function savePushTokenToSupabase(userId) {
  if (!userId || !supabase) return;

  try {
    const token = await getExpoPushToken();
    if (!token) return;

    const { error } = await supabase
      .from('staff')
      .update({ push_token: token, push_token_updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      // La colonne push_token peut ne pas exister — ignoré silencieusement
      console.warn('[Notifications] push_token non sauvegardé (colonne peut-être absente):', error.message);
    } else {
      console.log('[Notifications] ✅ push_token sauvegardé pour l\'utilisateur', userId);
    }
  } catch (err) {
    console.warn('[Notifications] Erreur lors de la sauvegarde du push token:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION LOCALE IMMÉDIATE (Foreground + Background quand app ouverte)
// ─────────────────────────────────────────────────────────────────────────────

const recentNotifications = new Map();

/**
 * Déclenche une notification locale immédiate avec sonnerie système.
 * Fonctionne en foreground ET quand l'app est en arrière-plan.
 *
 * @param {string} title - Titre de la notification.
 * @param {string} body - Corps du message.
 * @param {object} data - Données supplémentaires (pour navigation au tap).
 */
export async function sendSystemNotification(title, body, data = {}) {
  // Dédupliquer les notifications identiques envoyées à moins de 5 secondes d'intervalle
  const notifKey = `${title}_${body}_${data.orderId || ''}`;
  const now = Date.now();
  const lastSent = recentNotifications.get(notifKey);
  if (lastSent && (now - lastSent) < 5000) {
    console.log('[Notifications] ⏭ Notification dédupliquée (déjà envoyée):', title);
    return;
  }
  recentNotifications.set(notifKey, now);

  if (recentNotifications.size > 50) {
    recentNotifications.clear();
  }

  try {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'KLIN UP',
          body: body || 'Nouvelle notification',
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { ...data, _source: 'local' },
          ...(Platform.OS === 'android' && {
            channelId: 'orders',
            vibrate: [0, 300, 150, 400],
          }),
        },
        trigger: null, // Immédiat
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      // Web fallback
      if (window.Notification.permission === 'granted') {
        new window.Notification(title || 'KLIN UP', {
          body: body || 'Nouvelle notification',
          icon: '/assets/notification_icon.png',
        });
      } else if (window.Notification.permission === 'default') {
        const perm = await window.Notification.requestPermission();
        if (perm === 'granted') {
          new window.Notification(title || 'KLIN UP', { body: body || 'Nouvelle notification', icon: '/assets/notification_icon.png' });
        }
      }
    }
  } catch (err) {
    console.warn('[Notifications] Erreur lors du déclenchement de la notification locale:', err);
  }
}

/**
 * Notification spécifique pour un événement de commande.
 * Construit automatiquement le titre et le corps à partir du statut.
 *
 * @param {string} eventType - 'INSERT' | 'UPDATE'
 * @param {object} order - La commande concernée.
 * @param {string|null} oldStatus - L'ancien statut (pour UPDATE).
 */
export async function sendOrderNotification(eventType, order, oldStatus = null) {
  if (!order) return;

  const ref = order.identifiant_unique_marquage || order.id || 'N/A';
  const newStatus = order.statut || order.status || '';
  const newStatusLabel = getOrderStatusLabel(newStatus);
  const oldStatusLabel = oldStatus ? getOrderStatusLabel(oldStatus) : null;

  let title = '';
  let body = '';

  if (eventType === 'INSERT') {
    title = '🧺 Nouvelle commande enregistrée';
    body = `La commande ${ref} a été enregistrée (${newStatusLabel}).`;
  } else if (eventType === 'UPDATE') {
    if (oldStatus && oldStatus !== newStatus) {
      if (newStatus === 'pret' || newStatus === 'a_livrer' || newStatus === 'a_recuperer') {
        title = '✅ Commande prête !';
        body = `La commande ${ref} est prête (${newStatusLabel}).`;
      } else if (newStatus === 'en_cours_livraison') {
        title = '🛵 Livraison en cours';
        body = `La commande ${ref} est en cours de livraison.`;
      } else if (newStatus === 'restitue' || newStatus === 'livre') {
        title = '🎉 Commande livrée';
        body = `La commande ${ref} a été restituée au client.`;
      } else if (newStatus === 'annule') {
        title = '⚠️ Commande annulée';
        body = `La commande ${ref} a été annulée.`;
      } else {
        title = '📦 Statut mis à jour';
        body = `Commande ${ref} : ${oldStatusLabel} → ${newStatusLabel}`;
      }
    } else {
      // Pas de changement de statut réel, on ignore
      return;
    }
  } else {
    return;
  }

  // 1. Notification locale / foreground immédiate
  await sendSystemNotification(title, body, {
    orderId: order.id,
    statut: newStatus,
    ref,
    screen: 'gestion',
  });

  // 2. Notification push distante via Edge Function Supabase pour les appareils fermés/en arrière-plan
  if (supabase && typeof supabase.functions?.invoke === 'function') {
    supabase.functions.invoke('send-push-notification', {
      body: {
        type: eventType,
        record: order,
        old_record: oldStatus ? { statut: oldStatus } : null
      }
    }).catch(err => {
      console.warn('[Push Notification] Info Edge Function:', err?.message || err);
    });
  }
}
