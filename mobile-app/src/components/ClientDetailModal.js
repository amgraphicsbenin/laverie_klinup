import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { User, Phone, MapPin, Edit3, Trash2, X, Award } from 'lucide-react-native';
import SafeBlurView from './SafeBlurView';
const BlurView = SafeBlurView;
import { MotiView } from './SafeView';
import { db } from '../services/db';
import { useDbState } from '../hooks/useDbState';
import { CustomSelect } from './CustomSelect';

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
    if (!order) return '1001';
    if (order.ticket_numero && /^\d+$/.test(order.ticket_numero)) return order.ticket_numero;
    if (order.id && /^\d+$/.test(order.id)) return order.id;
    const allOrders = db.getOrders();
    const sortedOrders = [...allOrders].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    const index = sortedOrders.findIndex(o => o.id === order.id);
    return index !== -1 ? String(1001 + index) : '1001';
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
    <View style={styles.absoluteModalContainer}>
      <View style={styles.compactModalOverlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={85} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        <MotiView
          from={{ opacity: 0, scale: 0.88, translateY: 48 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, mass: 0.8 }}
          style={[styles.compactModalView, { maxHeight: '90%' }]}
        >
          <View style={styles.compactModalHeader}>
            <Text style={styles.compactModalTitle}>Fiche Client</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.compactModalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.detailCard}>
              <Text style={styles.clientProfileName}>{activeClient.prenom} {activeClient.nom}</Text>
              <Text style={styles.clientProfilePhone}>{activeClient.telephone}</Text>
              <Text style={styles.clientProfileAddress}>{activeClient.adresse || 'Aucune adresse renseignée'}</Text>
              <Text style={styles.clientProfilePreferences}>Préférence : {activeClient.preferences_pliage || 'Plié'}</Text>
              
              <View style={styles.clientActionRow}>
                {onEditClient && (
                  <TouchableOpacity
                    onPress={() => onEditClient(activeClient)}
                    style={styles.clientEditBtn}
                  >
                    <Edit3 size={14} color="#2563eb" />
                    <Text style={styles.clientEditBtnText}>Modifier</Text>
                  </TouchableOpacity>
                )}
                {currentUser && currentUser.role !== 'livreur' && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCustomer(activeClient.id)}
                    style={styles.clientDeleteBtn}
                  >
                    <Trash2 size={14} color="#ef4444" />
                    <Text style={styles.clientDeleteBtnText}>Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* SECTION ABONNEMENT CLIENT */}
            <Text style={styles.detailSectionTitle}>Forfait d'Abonnement</Text>
            <View style={styles.premiumSubscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Award size={16} color="#002cf7" />
                  <Text style={styles.subscriptionTitle}>Forfait d'Abonnement</Text>
                </View>
                {activeClient.active_subscription && (
                  <View style={styles.subActiveBadge}>
                    <Text style={styles.subActiveBadgeText}>Actif</Text>
                  </View>
                )}
              </View>

              {activeClient.active_subscription ? (
                <View style={{ gap: 10 }}>
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
                      <View style={{ gap: 4 }}>
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
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <View style={{ flex: 1 }}>
                      <CustomSelect
                        value={selectedCrmSubId}
                        onChange={(val) => setSelectedCrmSubId(val)}
                        options={[
                          { label: "-- Choisir une formule --", value: "" },
                          ...(catalog || []).filter(item => item && item.service === 'abonnement').map(sub => ({
                            label: `${sub.article} (${(sub.prix || 0).toLocaleString('fr-FR')} F/m)`,
                            value: sub.id
                          }))
                        ]}
                        placeholder="Choisir une formule"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleSubscribeCrm(activeClient.id, selectedCrmSubId)}
                      style={styles.subscribeBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.subscribeBtnText}>Souscrire</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                    Souscription réservée aux gérants et agents d'accueil
                  </Text>
                )
              )}
            </View>

            {/* Historique Client */}
            <Text style={styles.detailSectionTitle}>Historique des Commandes</Text>
            {(() => {
              const clientOrders = (orders || []).filter(o => o && o.customer_id === activeClient.id);
              return clientOrders.length === 0 ? (
                <Text style={styles.noResultsText}>Aucune commande pour ce client</Text>
              ) : (
                clientOrders.map(item => {
                  const status = getStatusColor(item.statut);
                  return (
                    <View key={item.id} style={styles.orderHistoryItem}>
                      <View>
                        <Text style={styles.orderHistoryNo}>Ticket #{getDisplayTicketId(item)}</Text>
                        <Text style={styles.orderHistoryDate}>{item.created_at ? item.created_at.split('T')[0] : 'N/A'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <View style={[styles.statusTag, { backgroundColor: status.bg, borderColor: status.border, marginBottom: 4, borderWidth: 1 }]}>
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
        </MotiView>
      </View>
    </View>
  );
}

function getStyles(isDarkMode) {
  const base = {
    absoluteModalContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
    },
    compactModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.55)',
      padding: 16,
    },
    compactModalView: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderRadius: 24,
      padding: 20,
      width: '100%',
      maxWidth: 380,
      borderColor: isDarkMode ? '#334155' : 'transparent',
      borderWidth: isDarkMode ? 1 : 0,
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    compactModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    compactModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    compactModalScroll: {
      paddingBottom: 10,
    },
    detailCard: {
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      borderWidth: 1,
    },
    clientProfileName: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      marginBottom: 4,
    },
    clientProfilePhone: {
      fontSize: 14,
      color: isDarkMode ? '#38bdf8' : '#002cf7',
      fontWeight: '600',
      marginBottom: 4,
    },
    clientProfileAddress: {
      fontSize: 13,
      color: isDarkMode ? '#cbd5e1' : '#64748b',
      marginBottom: 4,
    },
    clientProfilePreferences: {
      fontSize: 12,
      color: isDarkMode ? '#94a3b8' : '#475569',
      fontWeight: '500',
      marginBottom: 12,
    },
    clientActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    clientEditBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.2)',
    },
    clientEditBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#60a5fa' : '#2563eb',
    },
    clientDeleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    },
    clientDeleteBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#f87171' : '#ef4444',
    },
    detailSectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#cbd5e1' : '#334155',
      marginBottom: 8,
      marginTop: 6,
    },
    premiumSubscriptionCard: {
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      borderWidth: 1,
    },
    subscriptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    subscriptionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    subActiveBadge: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    subActiveBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#16a34a',
    },
    subPlanName: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    subPlanBalance: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#cbd5e1' : '#475569',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
      borderRadius: 99,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#002cf7',
      borderRadius: 99,
    },
    progressText: {
      fontSize: 11,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    subDatesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    subDateText: {
      fontSize: 11,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    unsubscribeBtn: {
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 6,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    },
    unsubscribeBtnText: {
      color: isDarkMode ? '#f87171' : '#dc2626',
      fontSize: 12,
      fontWeight: '600',
    },
    subscribeBtn: {
      backgroundColor: '#002cf7',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subscribeBtnText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    },
    orderHistoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      borderWidth: 1,
    },
    orderHistoryNo: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    orderHistoryDate: {
      fontSize: 11,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    orderHistoryTotal: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    statusTag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 99,
    },
    statusTagText: {
      fontSize: 10,
      fontWeight: '700',
    },
    noResultsText: {
      textAlign: 'center',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      fontSize: 13,
      marginVertical: 12,
    },
  };

  return StyleSheet.create(base);
}
