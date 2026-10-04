/**
 * @file InvoiceModal.js
 * @description Modale moderne HeroUI d'affichage du ticket thermique de caisse (TPE)
 * avec prévisualisation fidèle et actions d'impression et de partage PDF.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SmoothScrollView as ScrollView } from '../../../components/SmoothScroll';
import { Receipt, Download, Printer } from 'lucide-react-native';
import { Modal } from '../../../components/ui/modal';

export default function InvoiceModal({
  visible,
  onClose,
  order,
  isDarkMode = false,
  customers = [],
  catalog = [],
  formatPrice,
  getDisplayTicketId,
  onDownload,
  onPrint
}) {
  if (!visible || !order) return null;

  const displayTicket = getDisplayTicketId ? getDisplayTicketId(order) : (order.ticket_numero || order.id || '-');
  const associatedClient = (customers || []).find(c => c.id === order.customer_id);
  const clientFullName = associatedClient ? `${associatedClient.prenom} ${associatedClient.nom}` : (order.client_nom || 'Client Inconnu');

  const netPrice = Number(order.prix_total !== undefined ? order.prix_total : (order.total || 0));
  const fraisLivraison = Number(order.frais_livraison || order.frais_transport || order.delivery_fee || 0);
  const fraisRecuperation = Number(order.frais_recuperation || order.pickup_fee || 0);

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

  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');

  const fmt = (val) => formatPrice ? formatPrice(val) : `${val} FCFA`;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="md"
      isDarkMode={isDarkMode}
    >
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger onPress={onClose} />
            <Modal.Header layout="row" className="no-print" dataSet={{ print: 'no' }}>
              <Modal.Icon variant="primary">
                <Receipt size={20} color="#002cf7" />
              </Modal.Icon>
              <View style={{ flex: 1 }}>
                <Modal.Heading>Facture Client</Modal.Heading>
                <Modal.Description>
                  Ticket {displayTicket}
                </Modal.Description>
              </View>
            </Modal.Header>

            <Modal.Body scrollable={false} style={{ flexShrink: 1, paddingVertical: 4 }}>
              <ScrollView contentContainerStyle={styles.tpeScroll} showsVerticalScrollIndicator={false}>
                {/* TPE Thermal Receipt Paper Container */}
                <View style={styles.tpeReceiptContainer}>
                  <Text style={styles.tpeBrand}>Pressing Pro</Text>
                  <Text style={styles.tpeBrandSub}>LAVERIE & PRESSING PREMIUM</Text>
                  <Text style={styles.tpeTextMuted}>Tél: +229 XX XX XX XX</Text>
                  <Text style={styles.tpeTextMuted}>Cotonou, Bénin</Text>

                  <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                  {/* Metadata */}
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Ticket N° :</Text>
                    <Text style={styles.tpeMetaVal}>{displayTicket}</Text>
                  </View>
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Code :</Text>
                    <Text style={styles.tpeMetaVal}>{order.identifiant_unique_marquage || order.id}</Text>
                  </View>
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Date :</Text>
                    <Text style={styles.tpeMetaVal}>{orderDate}</Text>
                  </View>
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Client :</Text>
                    <Text style={styles.tpeMetaVal}>{clientFullName}</Text>
                  </View>
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Règlement :</Text>
                    <Text style={styles.tpeMetaVal}>{order.mode_reglement || order.mode_paiement || 'Espèces'}</Text>
                  </View>
                  {order.operateur_momo ? (
                    <View style={styles.tpeMetaRow}>
                      <Text style={styles.tpeMetaLabel}>Opérateur MoMo :</Text>
                      <Text style={[styles.tpeMetaVal, { fontWeight: '700', color: '#002cf7' }]}>{order.operateur_momo}</Text>
                    </View>
                  ) : null}
                  {(order.reference_momo || order.reference_paiement) ? (
                    <View style={styles.tpeMetaRow}>
                      <Text style={styles.tpeMetaLabel}>N° Réf. MoMo :</Text>
                      <Text style={[styles.tpeMetaVal, { fontWeight: '700' }]}>{order.reference_momo || order.reference_paiement}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                  {/* Items list */}
                  <Text style={styles.tpeSectionTitle}>ARTICLES & SERVICES</Text>
                  {itemsList.map((art, idx) => (
                    <View key={idx} style={styles.tpeItemRow}>
                      <View style={{ flex: 1.8 }}>
                        <Text style={styles.tpeItemName}>{art.article}</Text>
                        <Text style={styles.tpeItemService}>{(art.service || '').replace(/_/g, ' ')}</Text>
                      </View>
                      <Text style={styles.tpeItemQty}>x{art.quantite || art.quantity}</Text>
                      <Text style={styles.tpeItemPrice}>{fmt((art.prix || art.price || 0) * (art.quantite || art.quantity || 1))}</Text>
                    </View>
                  ))}

                  <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                  {/* Billing Details */}
                  <View style={styles.tpeTotalRow}>
                    <Text style={styles.tpeTotalLabel}>TOTAL BRUT</Text>
                    <Text style={styles.tpeTotalVal}>{fmt(displayBrut)}</Text>
                  </View>

                  {isExpress && (
                    <View style={styles.tpeTotalRow}>
                      <Text style={[styles.tpeTotalLabel, { color: '#d97706' }]}>
                        MAJORATION EXPRESS (+{expressMarkup}%)
                      </Text>
                      <Text style={[styles.tpeTotalVal, { color: '#d97706' }]}>Inclus</Text>
                    </View>
                  )}

                  {hasDiscount && (
                    <View style={styles.tpeTotalRow}>
                      <Text style={[styles.tpeTotalLabel, { color: '#ef4444' }]}>
                        REMISE EN FCFA
                      </Text>
                      <Text style={[styles.tpeTotalVal, { color: '#ef4444' }]}>-{fmt(discountAmount)}</Text>
                    </View>
                  )}

                  {hasReward && (
                    <View style={styles.tpeTotalRow}>
                      <Text style={[styles.tpeTotalLabel, { color: '#10b981' }]}>
                        RECOMPENSE ({rewardTitle || 'Fidélité'})
                      </Text>
                      <Text style={[styles.tpeTotalVal, { color: '#10b981' }]}>-{fmt(rewardDiscount)}</Text>
                    </View>
                  )}

                  {fraisLivraison > 0 && (
                    <View style={styles.tpeTotalRow}>
                      <Text style={[styles.tpeTotalLabel, { color: '#3b82f6' }]}>
                        LIVRAISON{order.distance_km ? ` (${order.distance_km} km)` : ''}
                      </Text>
                      <Text style={[styles.tpeTotalVal, { color: '#3b82f6' }]}>+{fmt(fraisLivraison)}</Text>
                    </View>
                  )}

                  {fraisRecuperation > 0 && (
                    <View style={styles.tpeTotalRow}>
                      <Text style={[styles.tpeTotalLabel, { color: '#3b82f6' }]}>
                        RECUPERATION
                      </Text>
                      <Text style={[styles.tpeTotalVal, { color: '#3b82f6' }]}>+{fmt(fraisRecuperation)}</Text>
                    </View>
                  )}

                  <View style={styles.tpeTotalRow}>
                    <Text style={styles.tpeTotalLabelBold}>NET A PAYER</Text>
                    <Text style={styles.tpeTotalValBold}>{fmt(netPrice)}</Text>
                  </View>

                  <View style={styles.tpeTotalRow}>
                    <Text style={styles.tpeTotalLabel}>AVANCE PAYEE</Text>
                    <Text style={styles.tpeTotalVal}>{fmt(avance)}</Text>
                  </View>

                  <View style={styles.tpeTotalRow}>
                    <Text style={styles.tpeTotalLabelBold}>RESTE A PAYER</Text>
                    <Text style={[styles.tpeTotalValBold, { color: reste > 0 ? '#ef4444' : '#10b981' }]}>
                      {fmt(reste)}
                    </Text>
                  </View>

                  <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                  <Text style={styles.tpeFooterMessage}>MERCI DE VOTRE CONFIANCE !</Text>
                  <View style={{ height: 16 }} />
                </View>

                {/* Print/Download Controls */}
                <View className="no-print" dataSet={{ print: 'no' }} style={styles.actionRow}>
                  <TouchableOpacity
                    className="no-print"
                    dataSet={{ print: 'no' }}
                    accessibilityRole="button"
                    onPress={() => onDownload && onDownload(order)}
                    style={styles.downloadBtn}
                    activeOpacity={0.8}
                  >
                    <Download size={14} color="#002cf7" style={{ marginRight: 6 }} />
                    <Text style={styles.downloadBtnText}>Télécharger</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="no-print"
                    dataSet={{ print: 'no' }}
                    accessibilityRole="button"
                    onPress={() => onPrint && onPrint(order)}
                    style={styles.printBtn}
                    activeOpacity={0.8}
                  >
                    <Printer size={14} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.printBtnText}>Imprimer</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="no-print"
                  dataSet={{ print: 'no' }}
                  accessibilityRole="button"
                  onPress={onClose}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tpeScroll: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  tpeReceiptContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tpeBrand: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    color: '#000000',
    letterSpacing: 2,
  },
  tpeBrandSub: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    color: '#475569',
    marginTop: 2,
    marginBottom: 4,
  },
  tpeTextMuted: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  tpeDashedDivider: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginVertical: 8,
  },
  tpeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  tpeMetaLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  tpeMetaVal: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#0f172a',
    textAlign: 'right',
  },
  tpeSectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000000',
    letterSpacing: 1,
    marginVertical: 4,
  },
  tpeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
  },
  tpeItemName: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  tpeItemService: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tpeItemQty: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#475569',
    width: 32,
    textAlign: 'center',
  },
  tpeItemPrice: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    width: 80,
    textAlign: 'right',
  },
  tpeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  tpeTotalLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  tpeTotalVal: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#0f172a',
  },
  tpeTotalLabelBold: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
  },
  tpeTotalValBold: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
  },
  tpeFooterMessage: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    color: '#334155',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 12,
  },
  downloadBtnText: {
    color: '#002cf7',
    fontSize: 13,
    fontWeight: '700',
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002cf7',
    borderRadius: 12,
    paddingVertical: 12,
  },
  printBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
});
