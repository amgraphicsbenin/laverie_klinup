import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { Award, Gift, Sparkles, Star, Crown, ChevronRight, X, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { getFidelityTier, REWARD_CATALOG, FIDELITY_TIERS, renderTierIcon, renderRewardIcon } from '../utils/fidelityUtils';
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

  if (!client) return null;

  const pts = Number(client.points_fidelite || 0);
  const tier = getFidelityTier(pts);

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

  const handleRedeem = async (reward) => {
    if (pts < reward.cost) {
      Alert.alert("Points insuffisants", `Il vous manque ${reward.cost - pts} points pour débloquer cette récompense.`);
      return;
    }

    Alert.alert(
      "Confirmation d'échange",
      `Voulez-vous échanger ${reward.cost} points contre la récompense "${reward.title}" pour ${client.prenom} ${client.nom} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Échanger",
          style: "default",
          onPress: async () => {
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
          }
        }
      ]
    );
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
            style={[styles.adjustBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderColor: isDarkMode ? '#334155' : '#cbd5e1' }]}
            activeOpacity={0.8}
            onPress={() => handleOpenModal('adjust')}
          >
            <Zap size={14} color={isDarkMode ? '#38bdf8' : '#0284c7'} style={{ marginRight: 4 }} />
            <Text style={[styles.adjustBtnText, { color: isDarkMode ? '#38bdf8' : '#0284c7' }]}>Ajuster</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL GESTION RECOMPENSES & POINTS */}
      <Modal
        visible={showRewardModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }]}>
            
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Award size={20} color="#002cf7" />
                <Text style={[styles.modalTitleText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                  Reward & Fidélité Client
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                <X size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

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
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'redeem' && styles.tabItemActive]}
                onPress={() => setActiveTab('redeem')}
              >
                <Gift size={14} color={activeTab === 'redeem' ? '#002cf7' : '#64748b'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, activeTab === 'redeem' && styles.tabTextActive]}>Récompenses ({REWARD_CATALOG.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'adjust' && styles.tabItemActive]}
                onPress={() => setActiveTab('adjust')}
              >
                <Zap size={14} color={activeTab === 'adjust' ? '#002cf7' : '#64748b'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, activeTab === 'adjust' && styles.tabTextActive]}>Ajuster Points</Text>
              </TouchableOpacity>
            </View>

            {/* TAB CONTENT 1: REDEEM CATALOG */}
            {activeTab === 'redeem' ? (
              <ScrollView style={styles.catalogScroll} showsVerticalScrollIndicator={false}>
                {REWARD_CATALOG.map((reward) => {
                  const canAfford = pts >= reward.cost;
                  return (
                    <View
                      key={reward.id}
                      style={[
                        styles.rewardCard,
                        {
                          backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                          borderColor: canAfford ? '#3b82f6' : (isDarkMode ? '#334155' : '#e2e8f0'),
                          opacity: canAfford ? 1 : 0.75
                        }
                      ]}
                    >
                      <View style={[styles.rewardIconWrapper, { backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 44, 247, 0.08)' }]}>
                        {renderRewardIcon(reward.iconName, 20, isDarkMode ? '#38bdf8' : '#002cf7')}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rewardTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{reward.title}</Text>
                        <Text style={[styles.rewardDesc, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>{reward.description}</Text>
                        <Text style={styles.rewardCostTag}>Coût : {reward.cost} points</Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.claimBtn,
                          { backgroundColor: canAfford ? '#002cf7' : '#94a3b8' }
                        ]}
                        disabled={!canAfford}
                        onPress={() => handleRedeem(reward)}
                      >
                        <Text style={styles.claimBtnText}>
                          {canAfford ? 'Échanger' : `-${reward.cost - pts} pts`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              /* TAB CONTENT 2: ADJUST POINTS */
              <ScrollView style={styles.catalogScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.adjustTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Bonus Rapides :</Text>
                <View style={styles.quickBonusRow}>
                  {[10, 25, 50, 100].map((bonus) => (
                    <TouchableOpacity
                      key={bonus}
                      style={styles.quickBonusChip}
                      onPress={() => handleApplyAdjustment(bonus)}
                    >
                      <Text style={styles.quickBonusText}>+{bonus} pts</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.quickBonusChip, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
                    onPress={() => handleApplyAdjustment(-20)}
                  >
                    <Text style={[styles.quickBonusText, { color: '#dc2626' }]}>-20 pts</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dividerLine} />

                <Text style={[styles.adjustTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Ajustement Personnalisé :</Text>
                <Text style={[styles.fieldLabel, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>Nombre de points (positif ou négatif) :</Text>
                <TextInput
                  placeholder="Ex: 15 ou -10"
                  placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                  keyboardType="numeric"
                  value={pointsDeltaInput}
                  onChangeText={setPointsDeltaInput}
                  style={[styles.modalInput, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', color: isDarkMode ? '#ffffff' : '#0f172a' }]}
                />

                <Text style={[styles.fieldLabel, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>Motif de l'opération :</Text>
                <TextInput
                  placeholder="Ex: Geste commercial, Bonus parrainage..."
                  placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                  value={reasonInput}
                  onChangeText={setReasonInput}
                  style={[styles.modalInput, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', color: isDarkMode ? '#ffffff' : '#0f172a' }]}
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

          </View>
        </View>
      </Modal>
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
    borderRadius: 12,
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
    borderRadius: 12,
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
  },
  modalBox: {
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
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 14,
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
