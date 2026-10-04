/**
 * @file OrderDetailModal.js
 * @description Vue modale plein écran d'inspection détaillée d'une commande.
 * Inclut la fiche client, la ventilation complète des articles et services,
 * la tarification détaillée (remise, majoration, fidélité, solde), les infos logistiques
 * et le bouton d'action de statut unifié.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import { SmoothScrollView as ScrollView } from '../../../components/SmoothScroll';
import {
  ArrowLeft,
  User,
  Ban,
  Receipt,
  Calendar,
  CreditCard,
  Phone,
  Tag,
  Zap,
  Award,
  Truck
} from 'lucide-react-native';
import { MotiView } from '../../../components/SafeView';
import { AnimatedBadge } from '../../../components/motion/animated-badge';
import OrderStatusAction from './OrderStatusAction';

export default function OrderDetailModal({
  visible,
  order,
  client,
  isDarkMode = false,
  currentUser,
  catalog = [],
  onClose,
  onSelectClient,
  onCancelOrder,
  onEditOrder,
  onValidateOrder,
  onAdvanceStatus,
  formatPrice,
  formatDate,
  getDisplayTicketId,
  getStatusColor,
}) {
  if (!visible || !order) return null;

  const status = getStatusColor(order.statut);
  const displayTicket = getDisplayTicketId(order);
  const clientName = client ? `${client.prenom} ${client.nom}` : (order.client_nom || 'Client inconnu');

  // Calculs financiers
  const isExpress = order.niveau_urgence === 'Express';
  const expressMarkupItem = (catalog || []).find(c => c.id === 'setting_express_markup');
  const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;

  const itemsList = order.items || order.articles || [];
  let itemsSum = itemsList.reduce((sum, art) => {
    const q = Number(art.quantite || art.quantity || 1);
    let p = Number(art.prix !== undefined ? art.prix : (art.price || 0));
    if (p === 0 && catalog) {
      const cat = catalog.find(c => c.article === art.article && (c.service === art.service || c.service === 'lavage_simple'));
      if (cat) p = Number(cat.prix || 0);
    }
    return sum + (p * q);
  }, 0);

  const netPrice = Number(order.prix_total !== undefined ? order.prix_total : (order.total || 0));
  const fraisLivraison = Number(order.frais_livraison || order.frais_transport || order.delivery_fee || 0);
  const fraisRecuperation = Number(order.frais_recuperation || order.pickup_fee || 0);

  const calculatedBrut = isExpress ? Math.round(itemsSum * (1 + expressMarkup / 100)) : itemsSum;
  const displayBrut = Number(order.prix_base_avant_remise) || (calculatedBrut > 0 ? calculatedBrut : Math.max(0, netPrice - fraisLivraison - fraisRecuperation));

  const discountPercent = Number(order.remise_pourcentage || order.remise || order.discount || 0);
  let discountAmount = Number(order.remise_montant || 0);
  if (!discountAmount && discountPercent > 0) {
    discountAmount = Math.round(displayBrut * (discountPercent / 100));
  }
  if (!discountAmount && displayBrut > (netPrice - fraisLivraison - fraisRecuperation)) {
    discountAmount = Math.max(0, displayBrut - (netPrice - fraisLivraison - fraisRecuperation));
  }
  const hasDiscount = discountAmount > 0;

  const rewardDiscount = Number(order.applied_reward_discount || order.reward_discount || 0);
  const rewardTitle = order.applied_reward_title;
  const hasReward = rewardDiscount > 0 || !!rewardTitle;

  const avance = Number(order.avance_payee !== undefined ? order.avance_payee : (order.avance || 0));
  const reste = Math.max(0, netPrice - avance);

  const canCancel =
    order.statut !== 'annule' &&
    order.statut !== 'livre' &&
    order.statut !== 'restitue' &&
    currentUser &&
    currentUser.role !== 'livreur' &&
    currentUser.role !== 'agent_lavage_repassage';

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <MotiView
      pointerEvents={visible ? 'auto' : 'none'}
      animate={{
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.96,
        translateY: visible ? 0 : 30,
      }}
      transition={{ type: 'spring', damping: 22, stiffness: 180, mass: 0.8 }}
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 9000, backgroundColor: isDarkMode ? '#000000' : '#ffffff' }
      ]}
    >
      <View style={styles.fullPageContainer}>
        <View style={styles.fullPageInnerWrapper}>
          {/* HEADER BACK BUTTON */}
          <View style={styles.fullPageHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>

            <Text style={styles.fullPageTitle} numberOfLines={1}>
              Commande {displayTicket}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.fullPageScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* SECTION 1 : CLIENT & STATUT */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Client & Statut</Text>
              <View style={styles.detailCard}>
                <TouchableOpacity
                  onPress={() => {
                    if (client && onSelectClient) {
                      onClose();
                      onSelectClient(client);
                    }
                  }}
                  activeOpacity={0.8}
                  style={styles.clientPillBtn}
                >
                  <User size={13} color="#002cf7" style={{ marginRight: 6 }} />
                  <Text style={styles.clientPillBtnText} numberOfLines={1}>
                    {clientName}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.detailTextMuted}>
                  Téléphone : {client?.telephone || 'Non renseigné'}
                </Text>

                <AnimatedBadge
                  status={order.statut}
                  statusColor={status}
                  isDarkMode={isDarkMode}
                  size="md"
                  style={{ alignSelf: 'flex-start', marginTop: 10 }}
                >
                  {status.label}
                </AnimatedBadge>

                {client?.active_subscription && (
                  <View style={styles.cardSubscriptionGaugeContainer}>
                    <View style={styles.subHeaderRow}>
                      <Text style={styles.cardSubText}>Abonnement : {client.active_subscription.name}</Text>
                      <Text style={styles.cardSubTextBold}>
                        {client.active_subscription.remaining_clothes} / {client.active_subscription.total_clothes} vêt.
                      </Text>
                    </View>
                    {(() => {
                      const remaining = client.active_subscription.remaining_clothes || 0;
                      const total = client.active_subscription.total_clothes || 1;
                      const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                      return (
                        <View style={styles.cardProgressBarBg}>
                          <View style={[styles.cardProgressBarFill, { width: `${percentUsed}%` }]} />
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>
            </View>

            {/* SECTION 2 : ARTICLES */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Détail des Articles</Text>
              <View style={styles.detailCard}>
                {itemsList.map((art, idx) => {
                  const q = Number(art.quantite || art.quantity || art.qty || 1);
                  let p = Number(art.prix !== undefined ? art.prix : (art.price || 0));
                  if (p === 0 && catalog) {
                    const cat = catalog.find(c => c.article === art.article && (c.service === art.service || c.service === 'lavage_simple'));
                    if (cat) p = Number(cat.prix || 0);
                  }
                  const totalArtPrice = p * q;
                  return (
                    <View key={idx} style={styles.detailArticleRow}>
                      <Text style={styles.detailArticleText} numberOfLines={1}>
                        {art.article} ({(art.service || '').replace(/_/g, ' ')}) x{q}
                      </Text>
                      <Text style={styles.detailArticlePrice}>
                        {formatPrice(totalArtPrice)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* SECTION 3 : FACTURATION DÉTAILLÉE */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Détail de la Facturation</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailArticleRow}>
                  <Text style={styles.detailArticleText}>Sous-total brut</Text>
                  <Text style={styles.detailArticlePrice}>{formatPrice(displayBrut)}</Text>
                </View>

                {isExpress && (
                  <View style={styles.detailArticleRow}>
                    <Text style={[styles.detailArticleText, { color: '#d97706', fontWeight: '700' }]}>
                      ⚡ Majoration Express (+{expressMarkup}%)
                    </Text>
                    <Text style={[styles.detailArticlePrice, { color: '#d97706', fontWeight: '700' }]}>
                      Inclus
                    </Text>
                  </View>
                )}

                {hasDiscount && (
                  <View style={styles.detailArticleRow}>
                    <Text style={[styles.detailArticleText, { color: '#ef4444', fontWeight: '700' }]}>
                      🏷️ Remise{discountPercent > 0 ? ` (${discountPercent}%)` : ''}
                    </Text>
                    <Text style={[styles.detailArticlePrice, { color: '#ef4444', fontWeight: '700' }]}>
                      -{formatPrice(discountAmount)}
                    </Text>
                  </View>
                )}

                {hasReward && (
                  <View style={styles.detailArticleRow}>
                    <Text style={[styles.detailArticleText, { color: '#10b981', fontWeight: '700' }]}>
                      🎁 Récompense ({rewardTitle || 'Fidélité'})
                    </Text>
                    <Text style={[styles.detailArticlePrice, { color: '#10b981', fontWeight: '700' }]}>
                      -{formatPrice(rewardDiscount)}
                    </Text>
                  </View>
                )}

                {fraisLivraison > 0 && (
                  <View style={styles.detailArticleRow}>
                    <Text style={[styles.detailArticleText, { color: '#3b82f6', fontWeight: '600' }]}>
                      🚚 Frais de livraison{order.distance_km ? ` (${order.distance_km} km)` : ''}
                    </Text>
                    <Text style={[styles.detailArticlePrice, { color: '#3b82f6', fontWeight: '700' }]}>
                      +{formatPrice(fraisLivraison)}
                    </Text>
                  </View>
                )}

                {fraisRecuperation > 0 && (
                  <View style={styles.detailArticleRow}>
                    <Text style={[styles.detailArticleText, { color: '#3b82f6', fontWeight: '600' }]}>
                      📦 Frais de récupération
                    </Text>
                    <Text style={[styles.detailArticlePrice, { color: '#3b82f6', fontWeight: '700' }]}>
                      +{formatPrice(fraisRecuperation)}
                    </Text>
                  </View>
                )}

                <View style={[styles.detailArticleRow, styles.totalRowBorder]}>
                  <Text style={styles.detailTotalLabel}>Net à payer</Text>
                  <Text style={styles.detailTotalValue}>{formatPrice(netPrice)}</Text>
                </View>

                <View style={styles.detailArticleRow}>
                  <Text style={styles.detailArticleText}>Avance payée</Text>
                  <Text style={[styles.detailArticlePrice, { color: '#10b981', fontWeight: '700' }]}>
                    {formatPrice(avance)}
                  </Text>
                </View>

                <View style={styles.detailArticleRow}>
                  <Text style={styles.detailTotalLabel}>Reste à payer</Text>
                  <Text style={[styles.detailTotalValue, { color: reste > 0 ? '#ef4444' : '#10b981' }]}>
                    {formatPrice(reste)}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION 4 : INFORMATIONS RETRAIT & PAIEMENT */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Informations de Retrait & Paiement</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailMetaRow}>
                  <Calendar size={14} color={isDarkMode ? '#a1a1aa' : '#64748b'} style={{ marginRight: 8 }} />
                  <Text style={styles.detailMetaLabel}>Date de retrait :</Text>
                  <Text style={styles.detailMetaValue}>
                    {formatDate(order.due_date || order.date_retrait_prevue)}
                  </Text>
                </View>

                <View style={styles.detailMetaRow}>
                  <CreditCard size={14} color={isDarkMode ? '#a1a1aa' : '#64748b'} style={{ marginRight: 8 }} />
                  <Text style={styles.detailMetaLabel}>Mode de règlement :</Text>
                  <Text style={styles.detailMetaValue}>
                    {order.mode_reglement || order.mode_paiement || 'Espèces'}
                  </Text>
                </View>

                {order.operateur_momo ? (
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Opérateur MoMo :</Text>
                    <Text style={[styles.detailMetaValue, { fontWeight: '700', color: '#002cf7' }]}>
                      {order.operateur_momo}
                    </Text>
                  </View>
                ) : null}

                {(order.reference_momo || order.reference_paiement) ? (
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>N° Réf. MoMo :</Text>
                    <Text style={[styles.detailMetaValue, { fontWeight: '700' }]}>
                      {order.reference_momo || order.reference_paiement}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* BOUTON D'ANNULATION (SI AUTORISÉ) */}
            {canCancel && (
              <TouchableOpacity
                onPress={() => onCancelOrder && onCancelOrder(order)}
                style={styles.cancelFullBtn}
                activeOpacity={0.8}
              >
                <Ban size={16} color="#ef4444" style={{ marginRight: 8 }} />
                <Text style={styles.cancelFullBtnText}>Annuler cette commande</Text>
              </TouchableOpacity>
            )}

            {/* ACTION DE STATUT UNIFIÉE */}
            <View style={{ marginVertical: 14 }}>
              <OrderStatusAction
                order={order}
                currentUser={currentUser}
                isDarkMode={isDarkMode}
                buttonHeight={46}
                keyPrefix="detail-btn"
                onAdvanceStatus={(ord, target) => onAdvanceStatus && onAdvanceStatus(ord, target, true)}
                onEditOrder={onEditOrder}
                onValidateOrder={onValidateOrder}
              />
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </MotiView>
  );
}

const lightStyles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  fullPageInnerWrapper: {
    flex: 1,
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  fullPageScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clientPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 44, 247, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 6,
  },
  clientPillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002cf7',
  },
  detailTextMuted: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardSubscriptionGaugeContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  cardSubTextBold: {
    fontSize: 11,
    fontWeight: '700',
    color: '#002cf7',
  },
  cardProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#002cf7',
  },
  detailArticleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailArticleText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  detailArticlePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 6,
    paddingTop: 8,
  },
  detailTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002cf7',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailMetaLabel: {
    fontSize: 12.5,
    color: '#64748b',
    marginRight: 6,
  },
  detailMetaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  cancelFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  cancelFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
});

const darkStyles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  fullPageInnerWrapper: {
    flex: 1,
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 14,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  fullPageScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  detailCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  clientPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 44, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 6,
  },
  clientPillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
  detailTextMuted: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  cardSubscriptionGaugeContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  cardSubTextBold: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  cardProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#27272a',
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  detailArticleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailArticleText: {
    fontSize: 13,
    color: '#d4d4d8',
    flex: 1,
  },
  detailArticlePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  totalRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    marginTop: 6,
    paddingTop: 8,
  },
  detailTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailMetaLabel: {
    fontSize: 12.5,
    color: '#a1a1aa',
    marginRight: 6,
  },
  detailMetaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  cancelFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
});
