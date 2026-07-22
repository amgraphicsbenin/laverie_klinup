/**
 * @file InvoiceModal.js
 * @description Composant modal d'affichage de la facture au format reçu thermique TPE.
 * Permet de visualiser le récapitulatif détaillé, d'imprimer la facture ou de la télécharger au format PDF.
 */

import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { X, Download, Printer } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

/**
 * Composant de modal de facture client (Format reçu TPE).
 * 
 * @param {Object} props - Propriétés du composant.
 * @param {Boolean} props.visible - Contrôle la visibilité de la modale.
 * @param {Function} props.onClose - Rappel de fermeture de la modale.
 * @param {Object} props.order - Commande associée à la facture.
 * @param {Boolean} props.isDarkMode - Thème sombre actif.
 * @param {Array} props.customers - Liste de tous les clients (pour retrouver les détails du client).
 * @param {Function} props.formatPrice - Utilitaires de formatage de devise.
 * @param {Function} props.getDisplayTicketId - Récupère l'ID d'affichage du ticket.
 * @param {Function} props.onDownload - Action de téléchargement/partage PDF de la facture.
 * @param {Function} props.onPrint - Action d'impression directe de la facture.
 * @param {Object} props.styles - Styles hérités du parent.
 */
export default function InvoiceModal({
  visible,
  onClose,
  order,
  isDarkMode,
  customers,
  formatPrice,
  getDisplayTicketId,
  onDownload,
  onPrint,
  styles
}) {
  if (!order) return null;

  const netPrice = order.prix_total || order.total || 0;
  const displayBrut = order.prix_base_avant_remise || netPrice;
  const displayRemiseMontant = order.remise_montant || Math.max(0, displayBrut - netPrice);
  const displayRemisePourcent = order.remise_pourcentage || (displayBrut > 0 ? Math.round((displayRemiseMontant / displayBrut) * 100) : 0);
  const hasDiscount = displayRemiseMontant > 0;

  // Récupération des informations du client associé
  const associatedClient = customers.find(c => c.id === order.customer_id);
  const clientFullName = associatedClient ? `${associatedClient.prenom} ${associatedClient.nom}` : 'Client Inconnu';

  return (
    <MotiView
      pointerEvents={visible ? 'auto' : 'none'}
      animate={{
        opacity: visible ? 1 : 0
      }}
      transition={{ type: 'timing', duration: 120 }}
      style={[
        StyleSheet.absoluteFill,
        { 
          zIndex: 9999,
          bottom: 0
        }
      ]}
    >
      <View style={styles.absoluteModalContainer}>
        <View style={styles.popupModalOverlay}>
          <TouchableOpacity 
            activeOpacity={1} 
            style={StyleSheet.absoluteFill} 
            onPress={onClose}
          >
            <BlurView intensity={85} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          
          <View style={styles.popupModalView}>
            <View style={styles.compactModalHeader}>
              <Text style={styles.compactModalTitle}>Facture Client</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.tpeScroll} showsVerticalScrollIndicator={false}>
              {/* Conteneur du reçu ticket thermique TPE */}
              <View style={styles.tpeReceiptContainer}>
                <Text style={styles.tpeBrand}>KLIN UP</Text>
                <Text style={styles.tpeBrandSub}>LAVERIE & PRESSING PREMIUM</Text>
                <Text style={styles.tpeTextMuted}>Tél: +229 XX XX XX XX</Text>
                <Text style={styles.tpeTextMuted}>Cotonou, Bénin</Text>
                
                <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                {/* Métadonnées de facture */}
                <View style={styles.tpeMetaRow}>
                  <Text style={styles.tpeMetaLabel}>Ticket N° :</Text>
                  <Text style={styles.tpeMetaVal}>#{getDisplayTicketId(order)}</Text>
                </View>
                <View style={styles.tpeMetaRow}>
                  <Text style={styles.tpeMetaLabel}>Code :</Text>
                  <Text style={styles.tpeMetaVal}>{order.identifiant_unique_marquage || order.id}</Text>
                </View>
                <View style={styles.tpeMetaRow}>
                  <Text style={styles.tpeMetaLabel}>Date :</Text>
                  <Text style={styles.tpeMetaVal}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.tpeMetaRow}>
                  <Text style={styles.tpeMetaLabel}>Client :</Text>
                  <Text style={styles.tpeMetaVal}>{clientFullName}</Text>
                </View>

                <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                {/* Articles et Services de la commande */}
                <Text style={styles.tpeSectionTitle}>ARTICLES & SERVICES</Text>
                {(order.items || order.articles || []).map((art) => (
                  <View key={`${art.article}-${art.service}`} style={styles.tpeItemRow}>
                    <View style={{ flex: 1.8 }}>
                      <Text style={styles.tpeItemName}>{art.article}</Text>
                      <Text style={styles.tpeItemService}>{(art.service || '').replace(/_/g, ' ')}</Text>
                    </View>
                    <Text style={styles.tpeItemQty}>x{art.quantite || art.quantity}</Text>
                    <Text style={styles.tpeItemPrice}>
                      {formatPrice((art.prix || art.price) * (art.quantite || art.quantity))}
                    </Text>
                  </View>
                ))}

                <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                {/* Détails financiers */}
                <View style={styles.tpeTotalRow}>
                  <Text style={styles.tpeTotalLabel}>TOTAL BRUT</Text>
                  <Text style={styles.tpeTotalVal}>{formatPrice(displayBrut)}</Text>
                </View>
                
                {hasDiscount && (
                  <View style={styles.tpeTotalRow}>
                    <Text style={[styles.tpeTotalLabel, { color: '#ef4444' }]}>
                      REMISE ({displayRemisePourcent}%)
                    </Text>
                    <Text style={[styles.tpeTotalVal, { color: '#ef4444' }]}>
                      -{formatPrice(displayRemiseMontant)}
                    </Text>
                  </View>
                )}

                <View style={styles.tpeTotalRow}>
                  <Text style={styles.tpeTotalLabelBold}>NET A PAYER</Text>
                  <Text style={styles.tpeTotalValBold}>{formatPrice(netPrice)}</Text>
                </View>

                <View style={styles.tpeTotalRow}>
                  <Text style={styles.tpeTotalLabel}>AVANCE PAYEE</Text>
                  <Text style={styles.tpeTotalVal}>{formatPrice(order.avance_payee || order.avance || 0)}</Text>
                </View>

                <View style={styles.tpeTotalRow}>
                  <Text style={styles.tpeTotalLabelBold}>RESTE A PAYER</Text>
                  <Text style={[styles.tpeTotalValBold, { color: (order.reste || 0) > 0 ? '#ef4444' : '#10b981' }]}>
                    {formatPrice(order.reste || 0)}
                  </Text>
                </View>

                <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                <Text style={styles.tpeFooterMessage}>MERCI DE VOTRE CONFIANCE !</Text>
                
                <View style={{ height: 16 }} />
              </View>

              {/* Contrôles de téléchargement et d'impression */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => onDownload(order)}
                  style={styles.invoiceDownloadBtn}
                  activeOpacity={0.8}
                >
                  <Download size={14} color="#002cf7" style={{ marginRight: 6 }} />
                  <Text style={styles.invoiceDownloadBtnText}>Télécharger</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onPrint(order)}
                  style={styles.invoicePrintBtn}
                  activeOpacity={0.8}
                >
                  <Printer size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.invoicePrintBtnText}>Imprimer</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.invoiceCloseBtn, { marginTop: 12 }]}
              >
                <Text style={styles.invoiceCloseBtnText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>
    </MotiView>
  );
}
