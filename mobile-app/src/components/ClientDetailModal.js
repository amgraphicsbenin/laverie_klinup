import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { User, Phone, MapPin, Edit3, Trash2, ArrowLeft, Award, CreditCard, Calendar, CheckCircle2 } from 'lucide-react-native';
import SafeBlurView from './SafeBlurView';
const BlurView = SafeBlurView;
import { MotiView } from './SafeView';
import { db } from '../services/db';
import { useDbState } from '../hooks/useDbState';
import { CustomSelect } from './CustomSelect';
import { t } from '../services/i18n';

export default function ClientDetailModal({
  visible,
  client,
  onClose,
  onEditClient,
  onShowSuccess
}) {
  const { customers, orders, catalog, currentUser, isDarkMode } = useDbState();
  const [selectedCrmSubId, setSelectedCrmSubId] = useState('');
  const styles = getStyles(isDarkMode);

  if (!visible || !client) return null;

  const activeClient = (customers || []).find(c => c && c.id === client.id) || client;

  const getDisplayTicketId = (order) => {
    if (!order) return 'KLIN-0';
    if (order.identifiant_unique_marquage) return order.identifiant_unique_marquage;
    if (order.ticket_numero) return order.ticket_numero;
    if (order.id && String(order.id).startsWith('KLIN-')) return order.id;
    return order.id || 'KLIN-0';
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'restitue':
      case 'livre':
        return { label: 'Livré / Restitué', bg: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#ecfdf5', text: isDarkMode ? '#4ade80' : '#059669', border: isDarkMode ? '#059669' : '#a7f3d0' };
      case 'pret':
        return { label: 'Prêt', bg: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff', text: isDarkMode ? '#38bdf8' : '#0284c7', border: isDarkMode ? '#0284c7' : '#bae6fd' };
      case 'annule':
        return { label: 'Annulé', bg: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', text: isDarkMode ? '#f87171' : '#dc2626', border: isDarkMode ? '#dc2626' : '#fecaca' };
      default:
        return { label: 'En traitement', bg: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb', text: isDarkMode ? '#fbbf24' : '#d97706', border: isDarkMode ? '#d97706' : '#fde68a' };
    }
  };

  const formatPrice = (price) => {
    const num = Number(price || 0);
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  const handleSubscribeCrm = (clientId, subId) => {
    const subItem = catalog.find(c => c.id === subId);
    if (!subItem) {
      Alert.alert("Erreur", "Veuillez sélectionner un forfait valide.");
      return;
    }
    db.subscribeCustomer(clientId, subItem.article, subItem.prix, subItem.duree_jours || 30);
    setSelectedCrmSubId('');
    if (onShowSuccess) onShowSuccess("Abonnement activé pour ce client !");
  };

  const handleUnsubscribeCrm = (clientId) => {
    Alert.alert(
      "Résiliation",
      "Êtes-vous sûr de vouloir résilier l'abonnement actif de ce client ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Résilier",
          style: "destructive",
          onPress: () => {
            db.unsubscribeCustomer(clientId);
            if (onShowSuccess) onShowSuccess("Abonnement résilié avec succès.");
          }
        }
      ]
    );
  };

  const handleDeleteCustomer = (clientId) => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer ce client ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, Supprimer",
          style: "destructive",
          onPress: () => {
            db.deleteCustomer(clientId);
            if (onShowSuccess) onShowSuccess("Client supprimé avec succès.");
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible && !!client}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.fullPageContainer}>
        {/* EN-TÊTE PAGE ENTIÈRE AVEC BOUTON RETOUR */}
        <View style={styles.fullPageHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={isDarkMode ? '#ffffff' : '#0f172a'} />
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>

          <Text style={styles.fullPageTitle} numberOfLines={1}>Fiche Client</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={styles.fullPageScroll} showsVerticalScrollIndicator={false}>
          {/* PROFILE CARD */}
          <View style={styles.detailCard}>
            <View style={styles.profileHeaderRow}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {(activeClient.prenom?.[0] || "") + (activeClient.nom?.[0] || "")}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientProfileName}>{activeClient.prenom} {activeClient.nom}</Text>
                <View style={styles.iconInfoRow}>
                  <Phone size={13} color={isDarkMode ? '#38bdf8' : '#002cf7'} />
                  <Text style={styles.clientProfilePhone}>{activeClient.telephone}</Text>
                </View>
                {activeClient.adresse ? (
                  <View style={styles.iconInfoRow}>
                    <MapPin size={13} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                    <Text style={styles.clientProfileAddress}>{activeClient.adresse}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Préférence pliage</Text>
                <Text style={styles.metricValue}>
                  {activeClient.preferences_pliage === 'Cintre' ? 'Sur Cintre 👔' : (activeClient.preferences_pliage || 'Plié 📦')}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Points Fidélité</Text>
                <Text style={[styles.metricValue, { color: '#059669', fontWeight: '800' }]}>
                  ⭐ {activeClient.points_fidelite || 0} pts
                </Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Solde Dette Encours</Text>
                <Text style={[styles.metricValue, { color: (activeClient.solde_dette || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: '800' }]}>
                  {formatPrice(activeClient.solde_dette || 0)}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Membre depuis</Text>
                <Text style={styles.metricValue}>
                  {activeClient.created_at ? new Date(activeClient.created_at).toLocaleDateString('fr-FR') : 'Récemment'}
                </Text>
              </View>
            </View>

            <View style={styles.clientActionRow}>
              {onEditClient && (
                <TouchableOpacity
                  onPress={() => onEditClient(activeClient)}
                  style={styles.clientEditBtn}
                  activeOpacity={0.8}
                >
                  <Edit3 size={15} color={isDarkMode ? '#60a5fa' : '#2563eb'} />
                  <Text style={styles.clientEditBtnText}>Modifier le profil</Text>
                </TouchableOpacity>
              )}
              {currentUser && currentUser.role !== 'livreur' && (
                <TouchableOpacity
                  onPress={() => handleDeleteCustomer(activeClient.id)}
                  style={styles.clientDeleteBtn}
                  activeOpacity={0.8}
                >
                  <Trash2 size={15} color={isDarkMode ? '#f87171' : '#ef4444'} />
                  <Text style={styles.clientDeleteBtnText}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* SECTION ABONNEMENT CLIENT */}
          <Text style={styles.detailSectionTitle}>Forfait d'Abonnement</Text>
          <View style={styles.premiumSubscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="#002cf7" />
                <Text style={styles.subscriptionTitle}>Forfait d'Abonnement</Text>
              </View>
              {activeClient.active_subscription && (
                <View style={styles.subActiveBadge}>
                  <Text style={styles.subActiveBadgeText}>Actif</Text>
                </View>
              )}
            </View>

            {activeClient.active_subscription ? (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.subPlanName}>{activeClient.active_subscription.name}</Text>
                  <Text style={styles.subPlanBalance}>
                    Solde : {activeClient.active_subscription.remaining_clothes} / {activeClient.active_subscription.total_clothes} vêt.
                  </Text>
                </View>

                {/* Barre de progression */}
                {(() => {
                  const remaining = activeClient.active_subscription.remaining_clothes;
                  const total = activeClient.active_subscription.total_clothes;
                  const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                  return (
                    <View style={{ gap: 6 }}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${percentUsed}%` }]} />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.progressText}>Consommé : {percentUsed}%</Text>
                        <Text style={styles.progressText}>Restant : {remaining} vêtements</Text>
                      </View>
                    </View>
                  );
                })()}

                <View style={styles.subDatesRow}>
                  <Text style={styles.subDateText}>
                    Du : {new Date(activeClient.active_subscription.subscribed_at).toLocaleDateString('fr-FR')}
                  </Text>
                  <Text style={styles.subDateText}>
                    Au : {new Date(activeClient.active_subscription.expires_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>

                {currentUser && currentUser.role !== 'livreur' && (
                  <TouchableOpacity
                    onPress={() => handleUnsubscribeCrm(activeClient.id)}
                    style={styles.unsubscribeBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.unsubscribeBtnText}>Résilier l'abonnement</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              currentUser && currentUser.role !== 'livreur' ? (
                <View style={{ flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  <CustomSelect
                    value={selectedCrmSubId}
                    onChange={(val) => setSelectedCrmSubId(val)}
                    options={[
                      { label: "-- Choisir une formule d'abonnement --", value: "" },
                      ...(catalog || []).filter(item => item && item.service === 'abonnement').map(sub => ({
                        label: `${sub.article} (${(sub.prix || 0).toLocaleString('fr-FR')} F/m)`,
                        value: sub.id
                      }))
                    ]}
                    placeholder="Choisir une formule"
                  />
                  <TouchableOpacity
                    onPress={() => handleSubscribeCrm(activeClient.id, selectedCrmSubId)}
                    style={styles.subscribeBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.subscribeBtnText}>Souscrire cet abonnement</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                  Souscription réservée aux gérants et agents d'accueil
                </Text>
              )
            )}
          </View>

          {/* HISTORIQUE CLIENT */}
          <Text style={styles.detailSectionTitle}>Historique des Commandes ({((orders || []).filter(o => o && o.customer_id === activeClient.id)).length})</Text>
          {(() => {
            const clientOrders = (orders || []).filter(o => o && o.customer_id === activeClient.id);
            return clientOrders.length === 0 ? (
              <View style={styles.detailCard}>
                <Text style={styles.noResultsText}>Aucune commande enregistrée pour ce client</Text>
              </View>
            ) : (
              clientOrders.map(item => {
                const status = getStatusColor(item.statut);
                return (
                  <View key={item.id} style={styles.orderHistoryItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderHistoryNo}>Ticket #{getDisplayTicketId(item)}</Text>
                      <Text style={styles.orderHistoryDate}>Enregistrée le {item.created_at ? item.created_at.split('T')[0] : 'N/A'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[styles.statusTag, { backgroundColor: status.bg, borderColor: status.border, borderWidth: 1 }]}>
                        <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                      </View>
                      <Text style={styles.orderHistoryTotal}>{formatPrice(item.prix_total || item.total)}</Text>
                    </View>
                  </View>
                );
              })
            );
          })()}
        </ScrollView>
      </View>
    </Modal>
  );
}

function getStyles(isDarkMode) {
  return {
    fullPageContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
      paddingTop: Platform.OS === 'ios' ? 48 : 24,
    },
    fullPageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1f2937' : '#e2e8f0',
      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingRight: 10,
    },
    backBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    fullPageTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      textAlign: 'center',
      flex: 1,
    },
    fullPageScroll: {
      padding: 16,
      paddingBottom: 40,
    },
    detailCard: {
      backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
      borderRadius: 20,
      padding: 18,
      marginBottom: 20,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      borderWidth: 1,
    },
    profileHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    profileAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDarkMode ? '#1d4ed8' : '#002cf7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileAvatarText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#ffffff',
    },
    clientProfileName: {
      fontSize: 19,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#09090b',
      marginBottom: 4,
    },
    iconInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    clientProfilePhone: {
      fontSize: 14,
      color: isDarkMode ? '#38bdf8' : '#002cf7',
      fontWeight: '700',
    },
    clientProfileAddress: {
      fontSize: 13,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0',
      marginVertical: 14,
    },
    metricsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 10,
    },
    metricItem: {
      flex: 1,
      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    clientActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    clientEditBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.2)',
    },
    clientEditBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#60a5fa' : '#2563eb',
    },
    clientDeleteBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    },
    clientDeleteBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#f87171' : '#ef4444',
    },
    detailSectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
      marginBottom: 10,
      marginTop: 10,
    },
    premiumSubscriptionCard: {
      backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
      borderRadius: 20,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
    },
    subscriptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    subscriptionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    subActiveBadge: {
      backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#ecfdf5',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#059669' : '#a7f3d0',
    },
    subActiveBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#4ade80' : '#059669',
    },
    subPlanName: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#002cf7',
    },
    subPlanBalance: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#38bdf8' : '#0284c7',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#002cf7',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 11,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      fontWeight: '600',
    },
    subDatesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    subDateText: {
      fontSize: 12,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      fontWeight: '500',
    },
    unsubscribeBtn: {
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 6,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    },
    unsubscribeBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#f87171' : '#ef4444',
    },
    subscribeBtn: {
      backgroundColor: '#002cf7',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    subscribeBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
    },
    orderHistoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
      borderRadius: 16,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
    },
    orderHistoryNo: {
      fontSize: 14,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    orderHistoryDate: {
      fontSize: 12,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    orderHistoryTotal: {
      fontSize: 14,
      fontWeight: '800',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    statusTag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    statusTagText: {
      fontSize: 11,
      fontWeight: '700',
    },
    noResultsText: {
      fontSize: 13,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 10,
    },
  };
}
