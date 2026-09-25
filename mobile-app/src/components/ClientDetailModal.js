import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal as RNModal, Platform, TextInput, ActivityIndicator } from 'react-native';
import { SmoothScrollView as ScrollView } from './SmoothScroll';
import { User, Phone, MapPin, Edit3, Trash2, ArrowLeft, Award, CreditCard, Calendar, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react-native';
import SafeBlurView from './SafeBlurView';
const BlurView = SafeBlurView;
import { MotiView } from './SafeView';
import { db } from '../services/db';
import { useDbState } from '../hooks/useDbState';
import { CustomSelect } from './CustomSelect';
import { t } from '../services/i18n';
import RewardFidelityCard from './RewardFidelityCard';
import AnimatedBadge from './AnimatedBadge';
import { ConfirmationModal, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalIcon, ModalHeading, ModalDescription, ModalBody, ModalFooter, ModalButton, ModalCloseTrigger } from './ui/modal';

export default function ClientDetailModal({
  visible,
  client,
  onClose,
  onEditClient,
  onShowSuccess
}) {
  const { customers, orders, catalog, currentUser, isDarkMode } = useDbState();
  const [selectedCrmSubId, setSelectedCrmSubId] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteReasonError, setDeleteReasonError] = useState('');
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [unsubscribeModalVisible, setUnsubscribeModalVisible] = useState(false);
  const styles = getStyles(isDarkMode);

  const reasonPresets = [
    "Demande expresse du client",
    "Compte client en doublon",
    "Client inactif / Parti",
    "Erreur de saisie"
  ];

  if (!visible || !client) return null;

  const activeClient = (customers || []).find(c => c && c.id === client.id) || client;
  const clientActiveOrders = (orders || []).filter(
    o => o && o.customer_id === activeClient?.id && !['livre', 'restitue', 'annule'].includes(o.statut)
  );
  const hasActiveOrders = clientActiveOrders.length > 0;
  const hasDebt = (Number(activeClient?.solde_dette) || 0) > 0;

  const getDisplayTicketId = (order) => {
    if (!order) return 'PRO-0';
    if (order.identifiant_unique_marquage) return order.identifiant_unique_marquage;
    if (order.ticket_numero) return order.ticket_numero;
    if (order.id && (String(order.id).startsWith('KLIN-') || String(order.id).startsWith('PRO-'))) return order.id;
    return order.id || 'PRO-0';
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'en_attente_validation':
      case 'attente_validation':
        return { label: 'Validation Caisse', bg: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff', text: isDarkMode ? '#a78bfa' : '#7c3aed', border: isDarkMode ? '#7c3aed' : '#ddd6fe' };
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

  const handleUnsubscribeCrm = () => {
    setUnsubscribeModalVisible(true);
  };

  const handleConfirmUnsubscribe = () => {
    setUnsubscribeModalVisible(false);
    db.unsubscribeCustomer(activeClient.id);
    if (onShowSuccess) onShowSuccess("Abonnement résilié avec succès.");
  };

  const handleDeleteCustomer = () => {
    setDeleteReason('');
    setDeleteReasonError('');
    setDeleteModalVisible(true);
  };

  const handleConfirmDeleteCustomer = async () => {
    const trimmedReason = (deleteReason || '').trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      setDeleteReasonError("Veuillez indiquer un motif d'au moins 3 caractères pour la suppression.");
      return;
    }

    if (hasActiveOrders) {
      setDeleteReasonError(`Impossible de supprimer : ce client a ${clientActiveOrders.length} commande(s) en cours.`);
      return;
    }

    setIsDeletingCustomer(true);
    setDeleteReasonError('');
    try {
      const success = await db.deleteCustomer(activeClient.id, trimmedReason);
      if (success) {
        setDeleteModalVisible(false);
        if (onShowSuccess) onShowSuccess("Profil client supprimé avec succès.");
        onClose();
      } else {
        setDeleteReasonError("Erreur lors de la suppression du client.");
      }
    } catch (err) {
      setDeleteReasonError(err.message || "Erreur lors de la suppression.");
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  return (
    <RNModal
      visible={visible && !!client}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.fullPageContainer}>
        <View style={styles.fullPageInnerWrapper}>
          {/* EN-TÊTE PAGE ENTIÈRE AVEC BOUTON RETOUR */}
          <View style={styles.fullPageHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>

            <Text style={styles.fullPageTitle} numberOfLines={1}>Fiche Client</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.fullPageScroll} showsVerticalScrollIndicator={false}>
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

            <View style={{ marginTop: 12 }}>
              <RewardFidelityCard
                client={activeClient}
                isDarkMode={isDarkMode}
                onShowSuccess={onShowSuccess}
              />
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
                      ...((catalog || []).filter(item => item && (item.service === 'abonnement' || item.categorie === 'abonnement' || item.categorie === 'abonnements')).length > 0
                        ? (catalog || []).filter(item => item && (item.service === 'abonnement' || item.categorie === 'abonnement' || item.categorie === 'abonnements')).map(sub => ({
                            label: `${sub.article || sub.name} (${(sub.prix || sub.price || 0).toLocaleString('fr-FR')} F/mois)`,
                            value: sub.id
                          }))
                        : [
                            { label: "Offre Active (20 000 F/mois)", value: "sub1" },
                            { label: "Abonnement Premium (35 000 F/mois)", value: "sub2" },
                            { label: "Abonnement Prestige (60 000 F/mois)", value: "sub3" },
                            { label: "Abonnement VIP (100 000 F/mois)", value: "sub4" }
                          ]
                      )
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
                      <AnimatedBadge
                        status={item.statut}
                        statusColor={status}
                        isDarkMode={isDarkMode}
                        size="sm"
                      >
                        {status.label}
                      </AnimatedBadge>
                      <Text style={styles.orderHistoryTotal}>{formatPrice(item.prix_total || item.total)}</Text>
                    </View>
                  </View>
                );
              })
            );
          })()}
          </ScrollView>

          {/* MODAL SUPPRESSION DU PROFIL CLIENT AVEC MOTIF OBLIGATOIRE */}
          <Modal
            isOpen={deleteModalVisible}
            onClose={() => {
              if (!isDeletingCustomer) {
                setDeleteModalVisible(false);
                setDeleteReasonError('');
              }
            }}
            size="md"
            isDarkMode={isDarkMode}
          >
            <ModalBackdrop>
              <ModalContainer size="md">
                <ModalDialog>
                  <ModalCloseTrigger
                    onPress={() => {
                      if (!isDeletingCustomer) {
                        setDeleteModalVisible(false);
                        setDeleteReasonError('');
                      }
                    }}
                  />
                  <ModalHeader layout="row" style={{ alignItems: 'center', gap: 10 }}>
                    <ModalIcon variant="danger">
                      <Trash2 size={20} color="#ef4444" />
                    </ModalIcon>
                    <View style={{ flex: 1 }}>
                      <ModalHeading style={{ fontSize: 16 }}>Supprimer le client</ModalHeading>
                      <ModalDescription style={{ fontSize: 12 }}>
                        Confirmation et motif obligatoire
                      </ModalDescription>
                    </View>
                  </ModalHeader>

                  <ModalBody style={{ marginTop: 12 }}>
                    {/* Carte récapitulative du client */}
                    <View style={styles.deleteClientCard}>
                      <View style={styles.deleteClientAvatar}>
                        <Text style={styles.deleteClientAvatarText}>
                          {(activeClient.prenom?.[0] || "") + (activeClient.nom?.[0] || "")}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deleteClientName}>
                          {activeClient.prenom} {activeClient.nom}
                        </Text>
                        <Text style={styles.deleteClientPhone}>
                          +{activeClient.indicatif || '229'} {activeClient.telephone}
                        </Text>
                      </View>
                    </View>

                    {/* Blocage commandes actives en cours */}
                    {hasActiveOrders && (
                      <View style={styles.deleteWarningBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <AlertTriangle size={15} color="#dc2626" />
                          <Text style={styles.deleteWarningTitle}>Suppression impossible</Text>
                        </View>
                        <Text style={styles.deleteWarningText}>
                          Ce client possède <Text style={{ fontWeight: '800' }}>{clientActiveOrders.length} commande(s) en cours de traitement</Text>. Vous devez d'abord finaliser ou annuler ces commandes avant de pouvoir supprimer ce compte.
                        </Text>
                      </View>
                    )}

                    {/* Avertissement solde débiteur */}
                    {!hasActiveOrders && hasDebt && (
                      <View style={styles.deleteDebtBox}>
                        <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                        <Text style={styles.deleteDebtText}>
                          Attention : ce client a une dette restante de <Text style={{ fontWeight: '800' }}>{formatPrice(activeClient.solde_dette)}</Text>.
                        </Text>
                      </View>
                    )}

                    {/* Saisie obligatoire du motif */}
                    {!hasActiveOrders && (
                      <View style={{ marginTop: 2 }}>
                        <Text style={styles.deleteReasonLabel}>
                          Motif de la suppression <Text style={{ color: '#ef4444' }}>*</Text>
                        </Text>

                        {/* Presets rapides */}
                        <View style={styles.presetsRow}>
                          {reasonPresets.map((preset, idx) => {
                            const isSelected = deleteReason === preset;
                            return (
                              <TouchableOpacity
                                key={idx}
                                style={[
                                  styles.presetChip,
                                  isSelected && styles.presetChipActive
                                ]}
                                onPress={() => {
                                  setDeleteReason(preset);
                                  if (deleteReasonError) setDeleteReasonError('');
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={[
                                  styles.presetChipText,
                                  isSelected && styles.presetChipTextActive
                                ]}>
                                  {preset}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        <TextInput
                          style={[
                            styles.deleteReasonInput,
                            !!deleteReasonError && styles.deleteReasonInputError
                          ]}
                          placeholder="Précisez le motif (ex: demande client, doublon)..."
                          placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
                          value={deleteReason}
                          onChangeText={(text) => {
                            setDeleteReason(text);
                            if (deleteReasonError) setDeleteReasonError('');
                          }}
                          multiline
                          numberOfLines={3}
                          editable={!isDeletingCustomer}
                        />

                        {!!deleteReasonError && (
                          <Text style={styles.deleteErrorText}>
                            {deleteReasonError}
                          </Text>
                        )}
                      </View>
                    )}
                  </ModalBody>

                  <ModalFooter style={{ marginTop: 14, gap: 10, flexDirection: 'row' }}>
                    <ModalButton
                      variant="secondary"
                      disabled={isDeletingCustomer}
                      onPress={() => {
                        setDeleteModalVisible(false);
                        setDeleteReasonError('');
                      }}
                      style={{ flex: 1 }}
                    >
                      {hasActiveOrders ? 'Compris, fermer' : 'Annuler'}
                    </ModalButton>

                    {!hasActiveOrders && (
                      <ModalButton
                        variant="danger"
                        disabled={isDeletingCustomer}
                        onPress={handleConfirmDeleteCustomer}
                        style={{ flex: 1.2 }}
                      >
                        {isDeletingCustomer ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Suppression...</Text>
                          </View>
                        ) : (
                          'Supprimer'
                        )}
                      </ModalButton>
                    )}
                  </ModalFooter>
                </ModalDialog>
              </ModalContainer>
            </ModalBackdrop>
          </Modal>

          {/* CONFIRMATION MODAL : RÉSILIATION ABONNEMENT */}
          <ConfirmationModal
            visible={unsubscribeModalVisible}
            onClose={() => setUnsubscribeModalVisible(false)}
            onConfirm={handleConfirmUnsubscribe}
            title="Résilier l'abonnement"
            description="Êtes-vous sûr de vouloir résilier l'abonnement actif de ce client ?"
            variant="warning"
            confirmText="Résilier"
            cancelText="Annuler"
            isDarkMode={isDarkMode}
          />
        </View>
      </View>
    </RNModal>
  );
}

function getStyles(isDarkMode) {
  return {
    fullPageContainer: {
      flex: 1,
      width: '100%',
      height: Platform.OS === 'web' ? '100vh' : '100%',
      backgroundColor: Platform.OS === 'web' ? '#0c0c10' : (isDarkMode ? '#000000' : '#ffffff'),
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    fullPageInnerWrapper: {
      ...(Platform.OS === 'web' ? {} : { flex: 1 }),
      width: Platform.OS === 'web' ? 393 : '100%',
      height: Platform.OS === 'web' ? 852 : '100%',
      maxWidth: '100vw',
      maxHeight: '100vh',
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
      paddingTop: Platform.OS === 'ios' ? 48 : 24,
      overflow: 'hidden',
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
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
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
      borderRadius: 9999,
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
      borderRadius: 9999,
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
      borderRadius: 9999,
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
      borderRadius: 9999,
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
      borderRadius: 9999,
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
      borderRadius: 9999,
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
    deleteClientCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: isDarkMode ? '#1e1e24' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2e2e38' : '#e2e8f0',
      marginBottom: 12,
    },
    deleteClientAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteClientAvatarText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },
    deleteClientName: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    deleteClientPhone: {
      fontSize: 12,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    deleteWarningBox: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
      marginBottom: 12,
    },
    deleteWarningTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#dc2626',
    },
    deleteWarningText: {
      fontSize: 12,
      color: isDarkMode ? '#fca5a5' : '#b91c1c',
      lineHeight: 17,
    },
    deleteDebtBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
      marginBottom: 12,
    },
    deleteDebtText: {
      flex: 1,
      fontSize: 12,
      color: isDarkMode ? '#fcd34d' : '#b45309',
      lineHeight: 16,
    },
    deleteReasonLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: isDarkMode ? '#e2e8f0' : '#334155',
      marginBottom: 8,
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 10,
    },
    presetChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#cbd5e1',
      backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
    },
    presetChipActive: {
      borderColor: '#002cf7',
      backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.25)' : '#eff6ff',
    },
    presetChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDarkMode ? '#94a3b8' : '#475569',
    },
    presetChipTextActive: {
      color: isDarkMode ? '#60a5fa' : '#002cf7',
      fontWeight: '700',
    },
    deleteReasonInput: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#cbd5e1',
      borderRadius: 12,
      padding: 10,
      fontSize: 13,
      color: isDarkMode ? '#ffffff' : '#0f172a',
      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
      minHeight: 70,
      textAlignVertical: 'top',
    },
    deleteReasonInputError: {
      borderColor: '#ef4444',
    },
    deleteErrorText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: '#ef4444',
      marginTop: 4,
    },
  };
}
