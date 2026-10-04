/**
 * @file OrderCard.js
 * @description Composant mémoïsé de carte de commande dans la liste active.
 * Affiche l'en-tête client, le ticket, le badge animé, les articles, le GPS de livraison,
 * la jauge d'abonnement, les métadonnées et la barre d'action contextuelle.
 */

import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import {
  Shirt,
  MapPin,
  Calendar,
  CreditCard,
  Receipt,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react-native';
import { MotiView } from '../../../components/SafeView';
import { AnimatedBadge } from '../../../components/motion/animated-badge';
import OrderStatusAction from './OrderStatusAction';

function OrderCardComponent({
  item,
  client,
  isDarkMode = false,
  currentUser,
  animInfo,
  onSelectOrder,
  onSelectClient,
  onShowInvoice,
  onCancelOrder,
  onEditOrder,
  onValidateOrder,
  onAdvanceStatus,
  formatPrice,
  formatDate,
  getDisplayTicketId,
  getItemsSummary,
  getStatusColor,
}) {
  const isFinished = animInfo !== undefined;
  const finishedStatus = typeof animInfo === 'object' ? animInfo?.status : animInfo;
  const animPhase = typeof animInfo === 'object' ? animInfo?.phase : (isFinished ? 'exit' : 'idle');

  const status = getStatusColor(item.statut);
  const displayPrice = formatPrice(item.prix_total !== undefined ? item.prix_total : item.total);
  const displayTicket = getDisplayTicketId(item);
  const displayItems = getItemsSummary(item.items || item.articles);
  const dueDateText = formatDate(item.due_date || item.date_retrait_prevue);
  const paymentModeText = item.mode_reglement || item.mode_paiement || 'Espèces';

  const isDeliveryStep = [
    'pret',
    'prêt',
    'ready',
    'pret_a_livrer',
    'a_recuperer',
    'a_livrer',
    'livraison',
    'en_cours_livraison',
    'en_cours_de_livraison'
  ].includes(item.statut);

  const canCancel =
    item.statut !== 'annule' &&
    item.statut !== 'livre' &&
    item.statut !== 'restitue' &&
    currentUser &&
    currentUser.role !== 'livreur' &&
    currentUser.role !== 'agent_lavage_repassage';

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <MotiView
      animate={{
        opacity: animPhase === 'exit' ? 0 : 1,
        scale: animPhase === 'exit' ? 0.85 : 1,
        translateY: animPhase === 'exit' ? -12 : 0,
      }}
      transition={{
        type: 'timing',
        duration: animPhase === 'exit' ? 250 : 150,
      }}
      style={cardStyles.wrapper}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectOrder && onSelectOrder(item)}
        style={styles.card}
      >
        {/* EN-TÊTE DE LA CARTE : CLIENT & STATUT / TICKET & PRIX */}
        <View style={cardStyles.cardHeader}>
          <View style={cardStyles.cardClientCol}>
            <TouchableOpacity
              onPress={(e) => {
                if (e?.stopPropagation) e.stopPropagation();
                if (client && onSelectClient) onSelectClient(client);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cardClientName} numberOfLines={1}>
                {client ? `${client.prenom} ${client.nom}` : (item.client_nom || 'Client Inconnu')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.cardTicketNo}>
              Ticket {displayTicket}
            </Text>
          </View>

          <View style={cardStyles.cardRightCol}>
            <AnimatedBadge
              status={item.statut}
              statusColor={status}
              isDarkMode={isDarkMode}
              size="sm"
            >
              {status.label}
            </AnimatedBadge>
            <Text style={styles.cardPrice}>{displayPrice}</Text>
          </View>
        </View>

        {/* ARTICLES LIST */}
        <View style={cardStyles.cardExtraInfoRow}>
          <Shirt size={14} color={isDarkMode ? '#52525b' : '#94a3b8'} style={{ marginRight: 6 }} />
          <Text style={styles.cardExtraInfoText} numberOfLines={1}>
            {displayItems}
          </Text>
        </View>

        {/* ADRESSE DE LIVRAISON CLIENT (GPS) */}
        {isDeliveryStep && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => {
              if (e?.stopPropagation) e.stopPropagation();
              const addr = client?.adresse || item.adresse_livraison || item.adresse || '';
              if (!addr || addr.trim() === '') {
                Alert.alert('Adresse manquante', 'Aucune adresse de livraison renseignée pour ce client.');
                return;
              }
              const encoded = encodeURIComponent(addr.trim());
              Linking.openURL(`https://maps.google.com/?q=${encoded}`);
            }}
            style={[
              cardStyles.gpsBanner,
              {
                backgroundColor: isDarkMode ? 'rgba(3, 105, 161, 0.18)' : '#f0f9ff',
                borderColor: isDarkMode ? 'rgba(56, 189, 248, 0.35)' : '#bae6fd',
              }
            ]}
          >
            <View style={[
              cardStyles.gpsIconWrapper,
              { backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.25)' : '#e0f2fe' }
            ]}>
              <MapPin size={15} color={isDarkMode ? '#38bdf8' : '#0284c7'} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={cardStyles.gpsTitleRow}>
                <Text style={[cardStyles.gpsTitle, { color: isDarkMode ? '#38bdf8' : '#0284c7' }]}>
                  📍 Adresse de Livraison (GPS)
                </Text>
                <Text style={[cardStyles.gpsLink, { color: isDarkMode ? '#38bdf8' : '#0284c7' }]}>
                  Ouvrir Carte →
                </Text>
              </View>
              <Text style={[cardStyles.gpsAddress, { color: isDarkMode ? '#e2e8f0' : '#0f172a' }]} numberOfLines={2}>
                {client?.adresse || item.adresse_livraison || item.adresse || 'Adresse non spécifiée (Appuyer pour carte)'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* JAUGE D'ABONNEMENT */}
        {client?.active_subscription && (
          <View style={styles.cardSubscriptionGaugeContainer}>
            <View style={cardStyles.subHeaderRow}>
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

        {/* META ROW : Date + Mode de paiement */}
        <View style={cardStyles.cardMetaRow}>
          <View style={styles.metaBadge}>
            <Calendar size={10} color={isDarkMode ? '#52525b' : '#94a3b8'} style={{ marginRight: 4 }} />
            <Text style={styles.metaBadgeText}>Retrait : {dueDateText}</Text>
          </View>
          <View style={styles.metaBadge}>
            <CreditCard size={10} color={isDarkMode ? '#52525b' : '#94a3b8'} style={{ marginRight: 4 }} />
            <Text style={styles.metaBadgeText}>{paymentModeText}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* FOOTER AREA : BOUTONS FACTURE & ANNULER */}
        <View style={cardStyles.cardFooterArea}>
          <View style={cardStyles.cardFooterRow}>
            <TouchableOpacity
              onPress={(e) => {
                if (e?.stopPropagation) e.stopPropagation();
                if (onShowInvoice) onShowInvoice(item, e);
              }}
              style={styles.factureBtn}
              activeOpacity={0.7}
            >
              <Receipt size={13} color="#002cf7" style={{ marginRight: 4 }} />
              <Text style={styles.factureBtnText}>Facture</Text>
            </TouchableOpacity>

            {canCancel && (
              <TouchableOpacity
                onPress={(e) => {
                  if (e?.stopPropagation) e.stopPropagation();
                  if (onCancelOrder) onCancelOrder(item);
                }}
                style={[
                  styles.factureBtn,
                  {
                    marginLeft: 8,
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                    borderColor: isDarkMode ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                  }
                ]}
                activeOpacity={0.7}
              >
                <Ban size={13} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={[styles.factureBtnText, { color: '#ef4444' }]}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ACTION DE CHANGEMENT DE STATUT UNIFIÉE */}
          <OrderStatusAction
            order={item}
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            buttonHeight={42}
            keyPrefix="btn"
            onAdvanceStatus={onAdvanceStatus}
            onEditOrder={onEditOrder}
            onValidateOrder={onValidateOrder}
          />
        </View>

        {/* OVERLAY D'ANIMATION DE CLÔTURE (SORTIE FLUIDE) */}
        {isFinished && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: finishedStatus === 'annule' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999,
              }
            ]}
          >
            <MotiView
              from={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {finishedStatus === 'annule' ? (
                <XCircle size={44} color="#ffffff" strokeWidth={2.5} />
              ) : (
                <CheckCircle size={44} color="#ffffff" strokeWidth={2.5} />
              )}
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 120, delay: 50 }}
            >
              <Text style={cardStyles.finishedOverlayText}>
                {finishedStatus === 'annule' ? 'COMMANDE ANNULÉE' : 'COMMANDE TRAITÉE'}
              </Text>
            </MotiView>
          </View>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardClientCol: {
    flex: 1,
    marginRight: 10,
  },
  cardRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardExtraInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpsBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  gpsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gpsTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gpsLink: {
    fontSize: 10,
    fontWeight: '700',
  },
  gpsAddress: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  cardFooterArea: {
    marginTop: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  finishedOverlayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

const lightStyles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardClientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  cardTicketNo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardExtraInfoText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  cardSubscriptionGaugeContainer: {
    marginVertical: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  factureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 44, 247, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.2)',
  },
  factureBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#002cf7',
  },
});

const darkStyles = StyleSheet.create({
  card: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  cardClientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  cardTicketNo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardExtraInfoText: {
    fontSize: 12,
    color: '#a1a1aa',
    flex: 1,
  },
  cardSubscriptionGaugeContainer: {
    marginVertical: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
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
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#a1a1aa',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 8,
  },
  factureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 44, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.35)',
  },
  factureBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#38bdf8',
  },
});

export const OrderCard = memo(OrderCardComponent);
export default OrderCard;
