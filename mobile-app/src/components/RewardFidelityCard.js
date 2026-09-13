import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { SmoothScrollView as ScrollView } from './SmoothScroll';
import { Award, Gift, Sparkles, Star, Crown, ChevronRight, X, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { Modal, ConfirmationModal } from './ui/modal';
import { getFidelityTier, getRewardCatalog, FIDELITY_TIERS, renderTierIcon, renderRewardIcon } from '../utils/fidelityUtils';
import { db } from '../services/db';

export default function RewardFidelityCard({
  client,
  isDarkMode = false,
  onUpdateClient,
  onShowSuccess
}) {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [activeTab, setActiveTab] = useState('redeem'); // 'redeem' | 'adjust'
  const [pointsDeltaInput, setPointsDeltaInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [pendingRewardToRedeem, setPendingRewardToRedeem] = useState(null);

  if (!client) return null;

  const pts = Number(client.points_fidelite || 0);
  const tier = getFidelityTier(pts);
  // Dynamic reward catalog from Supabase (via db.getCatalog())
  const rewardCatalog = getRewardCatalog(db.getCatalog());

  const handleOpenModal = (tab = 'redeem') => {
    setActiveTab(tab);
    setPointsDeltaInput('');
    setReasonInput('');
    setShowRewardModal(true);
  };

  const handleCloseModal = () => {
    setShowRewardModal(false);
    setPointsDeltaInput('');
    setReasonInput('');
  };

  const handleRedeem = (reward) => {
    if (pts < reward.cost) {
      Alert.alert("Points insuffisants", `Il vous manque ${reward.cost - pts} points pour débloquer cette récompense.`);
      return;
    }
    setPendingRewardToRedeem(reward);
  };

  const executeRedeem = async () => {
    const reward = pendingRewardToRedeem;
    setPendingRewardToRedeem(null);
    if (!reward) return;
    try {
      const updated = await db.redeemCustomerReward(client.id, reward.id, reward.title, reward.cost);
      if (updated) {
        if (onUpdateClient) onUpdateClient(updated);
        if (onShowSuccess) onShowSuccess(`Récompense '${reward.title}' débloquée !`);
        handleCloseModal();
      }
    } catch (err) {
      Alert.alert("Erreur", err.message || "Impossible d'effectuer l'échange.");
    }
  };

  const handleApplyAdjustment = async (customDelta = null) => {
    const deltaVal = customDelta !== null ? customDelta : Number(pointsDeltaInput);
    if (isNaN(deltaVal) || deltaVal === 0) {
      Alert.alert("Erreur", "Veuillez spécifier un nombre de points valide (positif ou négatif).");
      return;
    }

    try {
      const updated = await db.adjustCustomerPoints(client.id, deltaVal, reasonInput || 'Ajustement Caisse / Manager');
      if (updated) {
        if (onUpdateClient) onUpdateClient(updated);
        if (onShowSuccess) onShowSuccess(`Points mis à jour (${deltaVal >= 0 ? '+' : ''}${deltaVal} pts)`);
        handleCloseModal();
      }
    } catch (err) {
      Alert.alert("Erreur", err.message || "Échec de l'ajustement des points.");
    }
  };

  return (
    <>
      {/* CARTE NIVEAU & RECOMPENSES DYNAMIQUE */}
      <View style={[
        styles.cardContainer,
        {
          backgroundColor: isDarkMode ? 'rgba(18, 18, 18, 0.95)' : '#ffffff',
          borderColor: tier.border,
        }
      ]}>
        {/* EN-TÊTE STATUT */}
        <View style={styles.headerRow}>
          <View style={styles.badgeWrapper}>
            <View style={[styles.badgeCircle, { backgroundColor: tier.bgLight, borderColor: tier.border }]}>
              {renderTierIcon(tier.iconName, 20, tier.color)}
            </View>
            <View>
              <Text style={[styles.tierTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{tier.title}</Text>
              <Text style={[styles.tierSubtitle, { color: tier.color }]}>Statut Fidélité Actif</Text>
            </View>
          </View>

          <View style={[styles.pointsPill, { backgroundColor: tier.bgLight, borderColor: tier.border }]}>
            <Star size={14} color={tier.color} fill={tier.color} style={{ marginRight: 4 }} />
            <Text style={[styles.pointsText, { color: tier.color }]}>{pts} pts</Text>
          </View>
        </View>

        {/* JAUGE DE PROGRESSION VERS LE PROCHAIN NIVEAU */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressTextLeft, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
              {tier.ptsToNext > 0 ? `${tier.ptsToNext} pts restants vers ${tier.nextTierName}` : 'Niveau VIP Maximale Atteint'}
            </Text>
            <Text style={[styles.progressTextRight, { color: tier.color }]}>{tier.progressPct}%</Text>
          </View>
          <View style={[styles.trackBg, { backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0' }]}>
            <View style={[styles.trackFill, { width: `${tier.progressPct}%`, backgroundColor: tier.color }]} />
          </View>
        </View>

        {/* LISTE DES AVANTAGES DU NIVEAU */}
        <View style={styles.advantagesContainer}>
          <Text style={[styles.advantagesHeader, { color: isDarkMode ? '#cbd5e1' : '#475569' }]}>Avantages du statut {tier.name} :</Text>
          {tier.advantages.map((adv, idx) => (
            <View key={idx} style={styles.advRow}>
              <CheckCircle2 size={13} color={tier.color} style={{ marginRight: 6 }} />
              <Text style={[styles.advText, { color: isDarkMode ? '#e2e8f0' : '#334155' }]}>{adv}</Text>
            </View>
          ))}
        </View>

        {/* BOUTONS D'ACTION FIDÉLITÉ */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.redeemBtn, { backgroundColor: tier.color }]}
            activeOpacity={0.85}
            onPress={() => handleOpenModal('redeem')}
          >
            <Gift size={15} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.redeemBtnText}>Échanger des Points</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adjustBtn, { backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9', borderColor: isDarkMode ? '#27272a' : '#cbd5e1' }]}
            activeOpacity={0.8}
            onPress={() => handleOpenModal('adjust')}
          >
            <Zap size={14} color={isDarkMode ? '#38bdf8' : '#0284c7'} style={{ marginRight: 4 }} />
            <Text style={[styles.adjustBtnText, { color: isDarkMode ? '#38bdf8' : '#0284c7' }]}>Ajuster</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL GESTION RECOMPENSES & POINTS (HEROUI MODAL) */}
      <Modal
        isOpen={showRewardModal}
        onClose={handleCloseModal}
        size="md"
        isDarkMode={isDarkMode}
      >
        <Modal.Backdrop>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header layout="row">
                <Modal.Icon variant="primary">
                  <Award size={20} color="#002cf7" />
                </Modal.Icon>
                <View style={{ flex: 1 }}>
                  <Modal.Heading>Reward & Fidélité Client</Modal.Heading>
                  <Modal.Description>Gérer les points et récompenses</Modal.Description>
                </View>
              </Modal.Header>

              <Modal.Body scrollable={false}>
                {/* BALANCE HEADER */}
                <View style={[styles.balanceCard, { backgroundColor: tier.bgLight, borderColor: tier.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {renderTierIcon(tier.iconName, 22, tier.color)}
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#ffffff' : '#0f172a' }}>{client.prenom} {client.nom}</Text>
                      <Text style={{ fontSize: 11, color: tier.color, fontWeight: '600' }}>{tier.title}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: tier.color }}>{pts} pts</Text>
                    <Text style={{ fontSize: 10, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Solde disponible</Text>
                  </View>
                </View>

                {/* TABS NAVIGATION */}
                <View style={[styles.tabRow, { backgroundColor: isDarkMode ? '#18181b' : 'rgba(0,0,0,0.04)' }]}>
                  <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'redeem' && [styles.tabItemActive, isDarkMode && { backgroundColor: '#27272a' }]]}
                    onPress={() => setActiveTab('redeem')}
                  >
                    <Gift size={14} color={activeTab === 'redeem' ? (isDarkMode ? '#ffffff' : '#002cf7') : (isDarkMode ? '#a1a1aa' : '#64748b')} style={{ marginRight: 6 }} />
                    <Text style={[styles.tabText, activeTab === 'redeem' && [styles.tabTextActive, isDarkMode && { color: '#ffffff' }]]}>
                      Catalogue Récompenses
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'adjust' && [styles.tabItemActive, isDarkMode && { backgroundColor: '#27272a' }]]}
                    onPress={() => setActiveTab('adjust')}
                  >
                    <Zap size={14} color={activeTab === 'adjust' ? (isDarkMode ? '#ffffff' : '#002cf7') : (isDarkMode ? '#a1a1aa' : '#64748b')} style={{ marginRight: 6 }} />
                    <Text style={[styles.tabText, activeTab === 'adjust' && [styles.tabTextActive, isDarkMode && { color: '#ffffff' }]]}>
                      Ajuster Manuellement
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeTab === 'redeem' ? (
                  <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.tabDesc, { color: isDarkMode ? '#a1a1aa' : '#64748b' }]}>
                      Sélectionnez un avantage pour convertir les points de fidélité du client :
                    </Text>
                    <View style={{ gap: 10 }}>
                      {rewardCatalog.map((reward) => {
                        const canAfford = pts >= reward.cost;
                        return (
                          <View
                            key={reward.id}
                            style={[
                              styles.rewardCard,
                              {
                                backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                                borderColor: canAfford ? (isDarkMode ? '#3f3f46' : '#e2e8f0') : (isDarkMode ? '#27272a' : '#f1f5f9'),
                                opacity: canAfford ? 1 : 0.65
                              }
                            ]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                              <View style={[styles.rewardIconCircle, { backgroundColor: isDarkMode ? '#27272a' : '#f8fafc' }]}>
                                {renderRewardIcon(reward.icon, 20, canAfford ? '#002cf7' : (isDarkMode ? '#71717a' : '#94a3b8'))}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.rewardTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{reward.title}</Text>
                                <Text style={[styles.rewardDesc, { color: isDarkMode ? '#a1a1aa' : '#64748b' }]} numberOfLines={2}>{reward.description}</Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={[
                                styles.redeemActionBtn,
                                { backgroundColor: canAfford ? '#002cf7' : (isDarkMode ? '#27272a' : '#e2e8f0') }
                              ]}
                              disabled={!canAfford}
                              onPress={() => handleRedeem(reward)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.redeemActionBtnText, { color: canAfford ? '#ffffff' : (isDarkMode ? '#71717a' : '#94a3b8') }]}>
                                {reward.cost} pts
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                ) : (
                  <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.tabDesc, { color: isDarkMode ? '#a1a1aa' : '#64748b' }]}>
                      Créditer ou débiter manuellement des points de fidélité :
                    </Text>

                    {/* QUICK PILLS */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      {[+10, +25, +50, -20].map((delta) => (
                        <TouchableOpacity
                          key={delta}
                          style={[styles.quickDeltaPill, { backgroundColor: isDarkMode ? '#18181b' : '#f8fafc', borderColor: delta > 0 ? '#10b981' : '#ef4444' }]}
                          onPress={() => setPointsDeltaInput(String(delta))}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: delta > 0 ? '#10b981' : '#ef4444' }}>
                            {delta > 0 ? `+${delta}` : delta} pts
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.inputLabel, { color: isDarkMode ? '#d4d4d8' : '#334155' }]}>Points à ajuster (ex: +25 ou -15)</Text>
                    <TextInput
                      placeholder="Nombre de points..."
                      placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                      keyboardType="numeric"
                      value={pointsDeltaInput}
                      onChangeText={setPointsDeltaInput}
                      style={[styles.modalInput, { backgroundColor: isDarkMode ? '#09090b' : '#f1f5f9', borderColor: isDarkMode ? '#27272a' : '#e2e8f0', borderWidth: 1, color: isDarkMode ? '#ffffff' : '#0f172a' }]}
                    />

                    <Text style={[styles.inputLabel, { color: isDarkMode ? '#d4d4d8' : '#334155', marginTop: 10 }]}>Motif de l'ajustement (optionnel)</Text>
                    <TextInput
                      placeholder="Ex: Geste commercial, régularisation..."
                      placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                      value={reasonInput}
                      onChangeText={setReasonInput}
                      style={[styles.modalInput, { backgroundColor: isDarkMode ? '#09090b' : '#f1f5f9', borderColor: isDarkMode ? '#27272a' : '#e2e8f0', borderWidth: 1, color: isDarkMode ? '#ffffff' : '#0f172a' }]}
                    />

                    <TouchableOpacity
                      style={styles.submitAdjustBtn}
                      onPress={() => handleApplyAdjustment()}
                    >
                      <Zap size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.submitAdjustBtnText}>Valider l'ajustement</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* CONFIRMATION MODAL : ÉCHANGE DE POINTS */}
      <ConfirmationModal
        visible={!!pendingRewardToRedeem}
        onClose={() => setPendingRewardToRedeem(null)}
        onConfirm={executeRedeem}
        title="Confirmation d'échange"
        description={pendingRewardToRedeem ? `Voulez-vous échanger ${pendingRewardToRedeem.cost} points contre la récompense "${pendingRewardToRedeem.title}" pour ${client.prenom} ${client.nom} ?` : ''}
        variant="primary"
        confirmText="Échanger"
        cancelText="Annuler"
        isDarkMode={isDarkMode}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 22,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  tierSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTextLeft: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTextRight: {
    fontSize: 11,
    fontWeight: '800',
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  advantagesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  advantagesHeader: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  advRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  advText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  redeemBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    paddingVertical: 10,
  },
  redeemBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  adjustBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalBox: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 393 : '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
    height: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 9999,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 9999,
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#002cf7',
    fontWeight: '800',
  },
  catalogScroll: {
    maxHeight: 540,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  rewardIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rewardDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  rewardCostTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#002cf7',
    marginTop: 4,
  },
  claimBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  adjustTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  quickBonusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickBonusChip: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  quickBonusText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  submitAdjustBtn: {
    backgroundColor: '#002cf7',
    borderRadius: 9999,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  submitAdjustBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
