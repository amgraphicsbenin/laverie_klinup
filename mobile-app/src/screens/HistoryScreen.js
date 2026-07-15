import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal, Platform, BackHandler, Alert } from 'react-native';
import { Search, Calendar, ChevronRight, X, Clock, Receipt, Printer, Download, Award, Edit3, Trash2, User } from 'lucide-react-native';
import { db } from '../services/db';
import { BlurView } from 'expo-blur';
import { useScrollPaddingBottom } from '../hooks/useTabBarHeight';
import { CustomSelect } from '../components/CustomSelect';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MotiView } from 'moti';

export default function HistoryScreen({ onModalStateChange, closeAllModalsTrigger }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, delivered, late
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const scrollPaddingBottom = useScrollPaddingBottom();

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCrmSubId, setSelectedCrmSubId] = useState('');

  // Close details modal when trigger increments
  useEffect(() => {
    if (closeAllModalsTrigger > 0) {
      setSelectedOrder(null);
      setShowInvoiceModal(false);
      setInvoiceOrder(null);
      setSelectedClient(null);
    }
  }, [closeAllModalsTrigger]);

  // Notify parent of modal visibility
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(selectedOrder !== null || showInvoiceModal || selectedClient !== null);
    }
  }, [selectedOrder, showInvoiceModal, selectedClient]);

  // Handle Android back button/gesture to close history details modal
  useEffect(() => {
    if (Platform.OS === 'web' || !selectedOrder) return;

    const backAction = () => {
      setSelectedOrder(null);
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectedOrder]);

  const orders = db.getOrders();
  const customers = db.getCustomers();

  const getDisplayTicketId = (order) => {
    if (order.ticket_numero && /^\d+$/.test(order.ticket_numero)) return order.ticket_numero;
    if (/^\d+$/.test(order.id)) return order.id;
    const allOrders = db.getOrders();
    const sortedOrders = [...allOrders].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    const index = sortedOrders.findIndex(o => o.id === order.id);
    return index !== -1 ? String(1001 + index) : '1001';
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'pret':
        return { bg: 'rgba(5, 150, 105, 0.06)', text: '#059669', border: 'rgba(5, 150, 105, 0.12)', label: 'Prêt' };
      case 'a_recuperer':
        return { bg: 'rgba(217, 119, 6, 0.06)', text: '#d97706', border: 'rgba(217, 119, 6, 0.12)', label: 'À récupérer' };
      case 'a_livrer':
        return { bg: 'rgba(79, 70, 229, 0.06)', text: '#4f46e5', border: 'rgba(79, 70, 229, 0.12)', label: 'À livrer' };
      case 'en_cours_livraison':
        return { bg: 'rgba(79, 70, 229, 0.06)', text: '#4f46e5', border: 'rgba(79, 70, 229, 0.12)', label: 'En livraison' };
      case 'restitue':
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', label: 'Récupéré' };
      case 'livre':
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', label: 'Livré' };
      case 'lavage_cours':
      case 'en_cours_lavage':
        return { bg: 'rgba(37, 99, 235, 0.06)', text: '#2563eb', border: 'rgba(37, 99, 235, 0.12)', label: 'Lavage' };
      case 'repassage_cours':
      case 'en_cours_repassage':
        return { bg: 'rgba(13, 148, 136, 0.06)', text: '#0d9488', border: 'rgba(13, 148, 136, 0.12)', label: 'Repassage' };
      case 'traitement':
        return { bg: 'rgba(124, 58, 237, 0.06)', text: '#7c3aed', border: 'rgba(124, 58, 237, 0.12)', label: 'Traitement' };
      case 'attente':
      case 'en_attente':
      default:
        return { bg: 'rgba(217, 119, 6, 0.06)', text: '#d97706', border: 'rgba(217, 119, 6, 0.12)', label: 'En attente' };
    }
  };

  const catalog = db.getCatalog();

  const handleSubscribeCrm = (customerId, planId) => {
    if (!planId) {
      Alert.alert("Erreur", "Veuillez sélectionner un forfait d'abonnement.");
      return;
    }
    const updatedCust = db.subscribeCustomer(customerId, planId);
    if (updatedCust) {
      Alert.alert("Succès", `Abonnement souscrit avec succès pour ${updatedCust.prenom} ${updatedCust.nom} !`);
      setSelectedCrmSubId('');
      setSelectedClient({ ...updatedCust });
    }
  };

  const handleUnsubscribeCrm = (customerId) => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir résilier cet abonnement ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Résilier", 
          style: "destructive",
          onPress: () => {
            const updatedCust = db.unsubscribeCustomer(customerId);
            if (updatedCust) {
              Alert.alert("Succès", "Abonnement résilié avec succès !");
              setSelectedClient({ ...updatedCust });
            }
          }
        }
      ]
    );
  };

  const getItemsSummary = (items) => {
    if (!items || items.length === 0) return 'Aucun article';
    return items.map(a => `${a.article} x${a.quantite || a.quantity}`).join(', ');
  };

  const getCustomerName = (customerId) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? `${cust.prenom} ${cust.nom}` : 'Client Inconnu';
  };

  const formatPrice = (price) => {
    return (price || 0).toLocaleString('fr-FR') + ' FCFA';
  };

  const generateInvoiceHtml = (order) => {
    const client = customers.find(c => c.id === order.customer_id) || { prenom: 'Client', nom: 'Inconnu' };
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const displayTicketId = getDisplayTicketId(order);
    
    const articlesHtml = (order.items || order.articles || []).map(art => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
        <div style="flex: 1.8; text-align: left;">
          <div style="font-weight: bold; color: #000;">${art.article}</div>
          <div style="font-size: 11px; color: #666; text-transform: uppercase;">${art.service.replace(/_/g, ' ')}</div>
        </div>
        <div style="width: 40px; text-align: center;">x${art.quantite || art.quantity}</div>
        <div style="width: 100px; text-align: right; font-weight: bold;">${formatPrice((art.prix || art.price) * (art.quantite || art.quantity))}</div>
      </div>
    `).join('');

    const remiseHtml = order.remise_pourcentage > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
        <div style="font-weight: bold;">REMISE (${order.remise_pourcentage}%)</div>
        <div style="color: #ff3b30; font-weight: bold;">-${formatPrice(order.remise_montant || 0)}</div>
      </div>
    ` : '';

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Courier New', Courier, monospace, sans-serif;
              color: #000000;
              margin: 0;
              padding: 24px;
              background-color: #ffffff;
            }
            .container {
              max-width: 380px;
              margin: 0 auto;
              padding: 10px;
            }
            .brand {
              font-size: 24px;
              font-weight: 900;
              text-align: center;
              margin-bottom: 2px;
              letter-spacing: 2px;
            }
            .brand-sub {
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 8px;
              color: #333;
            }
            .text-muted {
              font-size: 11px;
              text-align: center;
              color: #555;
              margin: 2px 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 12px 0;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              margin-bottom: 4px;
            }
            .meta-label {
              font-weight: bold;
              color: #333;
            }
            .meta-value {
              text-align: right;
            }
            .section-title {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 10px;
              text-align: center;
              letter-spacing: 1px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              font-size: 14px;
            }
            .total-bold {
              font-weight: 900;
              font-size: 15px;
            }
            .footer-msg {
              font-size: 12px;
              font-weight: bold;
              text-align: center;
              margin-top: 20px;
              margin-bottom: 12px;
            }
            .barcode {
              border: 1px dashed #000;
              padding: 8px;
              text-align: center;
              font-size: 15px;
              font-weight: bold;
              margin: 10px 0;
              letter-spacing: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">KLIN UP</div>
            <div class="brand-sub">LAVERIE & PRESSING PREMIUM</div>
            <div class="text-muted">Tél: +229 XX XX XX XX</div>
            <div class="text-muted">Cotonou, Bénin</div>
            
            <div class="divider"></div>
            
            <div class="meta-row">
              <div class="meta-label">Ticket N° :</div>
              <div class="meta-value">#${displayTicketId}</div>
            </div>
            <div class="meta-row">
              <div class="meta-label">Code :</div>
              <div class="meta-value">${order.identifiant_unique_marquage || order.id}</div>
            </div>
            <div class="meta-row">
              <div class="meta-label">Date :</div>
              <div class="meta-value">${dateStr}</div>
            </div>
            <div class="meta-row">
              <div class="meta-label">Client :</div>
              <div class="meta-value">${client.prenom} ${client.nom}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="section-title">ARTICLES & SERVICES</div>
            ${articlesHtml}
            
            <div class="divider"></div>
            
            <div class="total-row">
              <div>TOTAL BRUT</div>
              <div>${formatPrice(order.prix_total || order.total)}</div>
            </div>
            ${remiseHtml}
            <div class="total-row total-bold">
              <div>NET A PAYER</div>
              <div>${formatPrice(order.total || order.prix_total)}</div>
            </div>
            <div class="total-row">
              <div>AVANCE PAYEE</div>
              <div>${formatPrice(order.avance_payee || order.avance || 0)}</div>
            </div>
            <div class="total-row total-bold" style="color: ${(order.reste || 0) > 0 ? '#ff3b30' : '#34c759'};">
              <div>RESTE A PAYER</div>
              <div>${formatPrice(order.reste || 0)}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer-msg">MERCI DE VOTRE CONFIANCE !</div>
            
            <div class="barcode">* ${order.identifiant_unique_marquage || order.id} *</div>
            
            <div class="text-muted" style="text-align: center;">Rejoignez KLIN UP pour un service premium</div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintInvoice = async (order) => {
    try {
      const html = generateInvoiceHtml(order);
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'imprimer la facture.");
      console.error(error);
    }
  };

  const handleDownloadInvoice = async (order) => {
    try {
      const html = generateInvoiceHtml(order);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture_${order.identifiant_unique_marquage || order.id || displayTicketId}.pdf`;
        link.click();
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Télécharger la facture',
          UTI: 'com.adobe.pdf'
        });
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de télécharger la facture.");
      console.error(error);
    }
  };

  const handleShowInvoice = (item, e) => {
    e.stopPropagation();
    setInvoiceOrder(item);
    setShowInvoiceModal(true);
  };

  // Filtering orders
  const filteredOrders = orders.filter(o => {
    const clientName = getCustomerName(o.customer_id).toLowerCase();
    const ticketNo = (o.ticket_numero || '').toLowerCase();
    const orderId = (o.id || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = clientName.includes(query) || ticketNo.includes(query) || orderId.includes(query);

    if (!matchesQuery) return false;

    if (filterType === 'delivered') return o.statut === 'livre' || o.statut === 'restitue';
    if (filterType === 'late') return o.est_en_retard || o.statut === 'retard' || (o.statut !== 'restitue' && o.statut !== 'livre' && o.due_date && new Date(o.due_date) < new Date());
    return true;
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.filterHeader}>
        <View style={styles.searchContainer}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            placeholder="Rechercher par ticket ou client..."
            placeholderTextColor="#a1a1aa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Horizontal filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity 
            onPress={() => setFilterType('all')}
            style={[styles.chip, filterType === 'all' && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterType === 'all' && styles.chipTextActive]}>Tous ({orders.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFilterType('delivered')}
            style={[styles.chip, filterType === 'delivered' && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterType === 'delivered' && styles.chipTextActive]}>
              Livrés ({orders.filter(o => o.statut === 'livre' || o.statut === 'restitue').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFilterType('late')}
            style={[styles.chip, filterType === 'late' && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterType === 'late' && styles.chipTextActive]}>
              Retards ({orders.filter(o => o.est_en_retard || o.statut === 'retard' || (o.statut !== 'restitue' && o.statut !== 'livre' && o.due_date && new Date(o.due_date) < new Date())).length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* History List */}
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <Text style={styles.noResultsText}>Aucune archive correspondante</Text>
        ) : (
          filteredOrders.map((item) => {
            const status = getStatusColor(item.statut);
            const clientObj = customers.find(c => c.id === item.customer_id);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => setSelectedOrder(item)}
                style={styles.historyCard}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (clientObj) setSelectedClient(clientObj);
                      }}
                      activeOpacity={0.8}
                      style={styles.clientPillBtn}
                    >
                      <User size={13} color="#002cf7" style={{ marginRight: 4 }} />
                      <Text style={styles.clientPillBtnText}>
                        {getCustomerName(item.customer_id)}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.ticketNo, { marginTop: 6 }]}>Ticket #{getDisplayTicketId(item)}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: status.bg, borderColor: status.border, borderWidth: 1 }]}>
                    <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>

                {clientObj && clientObj.active_subscription && (
                  <View style={styles.cardSubscriptionGaugeContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={styles.cardSubText}>Abonnement : {clientObj.active_subscription.name}</Text>
                      <Text style={styles.cardSubTextBold}>
                        {clientObj.active_subscription.remaining_clothes} / {clientObj.active_subscription.total_clothes} vêt.
                      </Text>
                    </View>
                    {(() => {
                      const remaining = clientObj.active_subscription.remaining_clothes;
                      const total = clientObj.active_subscription.total_clothes;
                      const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                      return (
                        <View style={styles.cardProgressBarBg}>
                          <View style={[styles.cardProgressBarFill, { width: `${percentUsed}%` }]} />
                        </View>
                      );
                    })()}
                  </View>
                )}

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                  <View style={styles.dateBlock}>
                    <Calendar size={12} color="#71717a" style={{ marginRight: 4 }} />
                    <Text style={styles.dateText}>{item.created_at.split('T')[0]}</Text>
                  </View>
                  <Text style={styles.totalAmount}>{formatPrice(item.prix_total || item.total)}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardFooterArea}>
                  <TouchableOpacity
                    onPress={(e) => handleShowInvoice(item, e)}
                    style={styles.factureBtn}
                    activeOpacity={0.7}
                  >
                    <Receipt size={13} color="#002cf7" style={{ marginRight: 4 }} />
                    <Text style={styles.factureBtnText}>Facture</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Detailed Order Modal (BOTTOM SHEET) */}
      <Modal
        animationType="slide"
        visible={selectedOrder !== null}
        onRequestClose={() => setSelectedOrder(null)}
        transparent={true}
      >
        {selectedOrder && (
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectedOrder(null)}>
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <View style={[styles.compactModalView, { maxHeight: '90%' }]}>
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Commande #{getDisplayTicketId(selectedOrder)}</Text>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={{ flexGrow: 0 }}
                contentContainerStyle={styles.compactModalScroll} 
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailCard}>
                  <TouchableOpacity
                    onPress={() => {
                      const client = customers.find(c => c.id === selectedOrder.customer_id);
                      if (client) {
                        setSelectedOrder(null);
                        setSelectedClient(client);
                      }
                    }}
                    activeOpacity={0.8}
                    style={[styles.clientPillBtn, { marginBottom: 8 }]}
                  >
                    <User size={13} color="#002cf7" style={{ marginRight: 4 }} />
                    <Text style={styles.clientPillBtnText}>
                      {getCustomerName(selectedOrder.customer_id)}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.detailDate}>Enregistrée le : {selectedOrder.created_at.replace('T', ' ').substring(0, 16)}</Text>
                  <Text style={styles.detailDate}>
                    Retrait prévu le : {selectedOrder.due_date ? new Date(selectedOrder.due_date).toLocaleDateString('fr-FR') : selectedOrder.date_retrait_prevue}
                  </Text>
                  
                  <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedOrder.statut).bg, borderColor: getStatusColor(selectedOrder.statut).border, alignSelf: 'flex-start', marginTop: 10, borderWidth: 1 }]}>
                    <Text style={[styles.statusTagText, { color: getStatusColor(selectedOrder.statut).text }]}>
                      {getStatusColor(selectedOrder.statut).label}
                    </Text>
                  </View>

                  {(() => {
                    const client = customers.find(c => c.id === selectedOrder.customer_id);
                    if (client && client.active_subscription) {
                      const remaining = client.active_subscription.remaining_clothes;
                      const total = client.active_subscription.total_clothes;
                      const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                      return (
                        <View style={[styles.cardSubscriptionGaugeContainer, { marginTop: 12 }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={styles.cardSubText}>Abonnement : {client.active_subscription.name}</Text>
                            <Text style={styles.cardSubTextBold}>{remaining} / {total} vêt.</Text>
                          </View>
                          <View style={styles.cardProgressBarBg}>
                            <View style={[styles.cardProgressBarFill, { width: `${percentUsed}%` }]} />
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}
                </View>

                <Text style={styles.sectionTitle}>Articles</Text>
                <View style={styles.detailCard}>
                  {(selectedOrder.items || selectedOrder.articles || []).map((art, idx) => (
                    <View key={idx} style={styles.articleRow}>
                      <Text style={styles.articleText}>{art.article} ({art.service.replace(/_/g, ' ')}) x{art.quantite}</Text>
                      <Text style={styles.articlePrice}>{formatPrice(art.prix * art.quantite)}</Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  {selectedOrder.remise_pourcentage > 0 && (
                    <>
                      <View style={styles.articleRow}>
                        <Text style={styles.subLabel}>Sous-total</Text>
                        <Text style={styles.subValue}>
                          {formatPrice((selectedOrder.items || selectedOrder.articles || []).reduce((sum, art) => sum + (art.prix * art.quantite), 0))}
                        </Text>
                      </View>
                      <View style={styles.articleRow}>
                        <Text style={[styles.subLabel, { color: '#ef4444' }]}>Réduction ({selectedOrder.remise_pourcentage}%)</Text>
                        <Text style={[styles.subValue, { color: '#ef4444', fontWeight: '600' }]}>
                          -{formatPrice(
                            (selectedOrder.items || selectedOrder.articles || []).reduce((sum, art) => sum + (art.prix * art.quantite), 0) - 
                            (selectedOrder.prix_total || selectedOrder.total)
                          )}
                        </Text>
                      </View>
                    </>
                  )}
                  <View style={styles.articleRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatPrice(selectedOrder.prix_total || selectedOrder.total)}</Text>
                  </View>
                  <View style={styles.articleRow}>
                    <Text style={styles.subLabel}>Avance payée</Text>
                    <Text style={styles.subValue}>{formatPrice(selectedOrder.avance_payee !== undefined ? selectedOrder.avance_payee : selectedOrder.avance)}</Text>
                  </View>
                  <View style={styles.articleRow}>
                    <Text style={styles.subLabel}>Reste à payer</Text>
                    <Text style={styles.subValue}>
                      {formatPrice((selectedOrder.prix_total || selectedOrder.total) - (selectedOrder.avance_payee !== undefined ? selectedOrder.avance_payee : (selectedOrder.avance || 0)))}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Paiement & Mode</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.logisticsText}>Mode de règlement : {selectedOrder.mode_reglement || selectedOrder.mode_paiement || 'Non spécifié'}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* MODAL : INVOICE / FACTURE (CENTERED POPUP DIALOG) */}
      {showInvoiceModal && invoiceOrder && (
        <View style={styles.absoluteModalContainer}>
          <View style={styles.popupModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => { setShowInvoiceModal(false); setInvoiceOrder(null); }}>
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <View style={styles.popupModalView}>
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Facture Client</Text>
                <TouchableOpacity onPress={() => { setShowInvoiceModal(false); setInvoiceOrder(null); }}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.tpeScroll} showsVerticalScrollIndicator={false}>
                {/* TPE Thermal Receipt Wrapper */}
                <View style={styles.tpeReceiptContainer}>
                  {/* Receipt Header */}
                  <Text style={styles.tpeBrand}>KLIN UP</Text>
                  <Text style={styles.tpeBrandSub}>LAVERIE & PRESSING PREMIUM</Text>
                  <Text style={styles.tpeTextMuted}>Tél: +229 XX XX XX XX</Text>
                  <Text style={styles.tpeTextMuted}>Cotonou, Bénin</Text>
                  
                  <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                  {/* Receipt Metadata */}
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Ticket N° :</Text>
                    <Text style={styles.tpeMetaVal}>#{getDisplayTicketId(invoiceOrder)}</Text>
                  </View>
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Code :</Text>
                    <Text style={styles.tpeMetaVal}>{invoiceOrder.identifiant_unique_marquage || invoiceOrder.id}</Text>
                  </View>
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Date :</Text>
                    <Text style={styles.tpeMetaVal}>
                      {invoiceOrder.created_at ? new Date(invoiceOrder.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <View style={styles.tpeMetaRow}>
                    <Text style={styles.tpeMetaLabel}>Client :</Text>
                    <Text style={styles.tpeMetaVal}>
                      {getCustomerName(invoiceOrder.customer_id)}
                    </Text>
                  </View>

                  <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                  {/* Items list */}
                  <Text style={styles.tpeSectionTitle}>ARTICLES & SERVICES</Text>
                  {(invoiceOrder.items || invoiceOrder.articles || []).map((art, idx) => (
                    <View key={idx} style={styles.tpeItemRow}>
                      <View style={{ flex: 1.8 }}>
                        <Text style={styles.tpeItemName}>{art.article}</Text>
                        <Text style={styles.tpeItemService}>{art.service.replace(/_/g, ' ')}</Text>
                      </View>
                      <Text style={styles.tpeItemQty}>x{art.quantite || art.quantity}</Text>
                      <Text style={styles.tpeItemPrice}>{formatPrice((art.prix || art.price) * (art.quantite || art.quantity))}</Text>
                    </View>
                  ))}

                  <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                  {/* Billing Details */}
                  <View style={styles.tpeTotalRow}>
                    <Text style={styles.tpeTotalLabel}>TOTAL BRUT</Text>
                    <Text style={styles.tpeTotalVal}>{formatPrice(invoiceOrder.prix_total || invoiceOrder.total)}</Text>
                  </View>
                  
                  {invoiceOrder.remise_pourcentage > 0 && (
                    <View style={styles.tpeTotalRow}>
                      <Text style={styles.tpeTotalLabel}>REMISE ({invoiceOrder.remise_pourcentage}%)</Text>
                      <Text style={[styles.tpeTotalVal, { color: '#ef4444' }]}>-{formatPrice(invoiceOrder.remise_montant || 0)}</Text>
                    </View>
                  )}

                  <View style={styles.tpeTotalRow}>
                    <Text style={styles.tpeTotalLabelBold}>NET A PAYER</Text>
                    <Text style={styles.tpeTotalValBold}>{formatPrice(invoiceOrder.total || invoiceOrder.prix_total)}</Text>
                  </View>

                  <View style={styles.tpeTotalRow}>
                    <Text style={styles.tpeTotalLabel}>AVANCE PAYEE</Text>
                    <Text style={styles.tpeTotalVal}>{formatPrice(invoiceOrder.avance_payee || invoiceOrder.avance || 0)}</Text>
                  </View>

                  <View style={styles.tpeTotalRow}>
                    <Text style={styles.tpeTotalLabelBold}>RESTE A PAYER</Text>
                    <Text style={[styles.tpeTotalValBold, { color: (invoiceOrder.reste || 0) > 0 ? '#ef4444' : '#10b981' }]}>
                      {formatPrice(invoiceOrder.reste || 0)}
                    </Text>
                  </View>

                  <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                  {/* Footer & Barcode placeholder */}
                  <Text style={styles.tpeFooterMessage}>MERCI DE VOTRE CONFIANCE !</Text>
                  
                  <View style={styles.barcodeContainer}>
                    <Text style={styles.barcodeText}>* {invoiceOrder.identifiant_unique_marquage || invoiceOrder.id} *</Text>
                  </View>

                  <Text style={styles.tpeTextMutedCentred}>Rejoignez KLIN UP pour un service premium</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <TouchableOpacity
                    onPress={() => handleDownloadInvoice(invoiceOrder)}
                    style={styles.invoiceDownloadBtn}
                    activeOpacity={0.8}
                  >
                    <Download size={14} color="#002cf7" style={{ marginRight: 6 }} />
                    <Text style={styles.invoiceDownloadBtnText}>Télécharger</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handlePrintInvoice(invoiceOrder)}
                    style={styles.invoicePrintBtn}
                    activeOpacity={0.8}
                  >
                    <Printer size={14} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.invoicePrintBtnText}>Imprimer</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => { setShowInvoiceModal(false); setInvoiceOrder(null); }}
                  style={[styles.invoiceCloseBtn, { marginTop: 12 }]}
                >
                  <Text style={styles.invoiceCloseBtnText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      )}
      {/* MODAL : DETAIL CLIENT (BOTTOM SHEET) */}
      {selectedClient !== null && selectedClient && (
        <View style={styles.absoluteModalContainer}>
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectedClient(null)}>
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <MotiView
              from={{ opacity: 0, scale: 0.88, translateY: 48 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 16, mass: 0.8 }}
              style={[styles.compactModalView, { maxHeight: '90%' }]}
            >
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Détails Client</Text>
                <TouchableOpacity onPress={() => setSelectedClient(null)}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.compactModalScroll} showsVerticalScrollIndicator={false}>
                {(() => {
                  const activeClient = customers.find(c => c.id === selectedClient.id) || selectedClient;
                  return (
                    <>
                      <View style={styles.detailCard}>
                        <Text style={styles.clientProfileName}>{activeClient.prenom} {activeClient.nom}</Text>
                        <Text style={styles.clientProfilePhone}>{activeClient.telephone}</Text>
                        <Text style={styles.clientProfileAddress}>{activeClient.adresse || 'Aucune adresse renseignée'}</Text>
                        <Text style={styles.clientProfilePreferences}>Préférence : {activeClient.preferences_pliage || 'Plié'}</Text>
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

                            <TouchableOpacity
                              onPress={() => handleUnsubscribeCrm(activeClient.id)}
                              style={styles.unsubscribeBtn}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.unsubscribeBtnText}>Résilier l'abonnement</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                            <View style={{ flex: 1 }}>
                              <CustomSelect
                                value={selectedCrmSubId}
                                onChange={(val) => setSelectedCrmSubId(val)}
                                options={[
                                  { label: "-- Choisir une formule --", value: "" },
                                  ...catalog.filter(item => item.service === 'abonnement').map(sub => ({
                                    label: `${sub.article} (${sub.prix.toLocaleString('fr-FR')} F/m)`,
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
                        )}
                      </View>
                    </>
                  );
                })()}

                {/* Historique Client */}
                <Text style={styles.detailSectionTitle}>Historique des Commandes</Text>
                {(() => {
                  const clientOrders = orders.filter(o => o.customer_id === selectedClient.id);
                  if (clientOrders.length === 0) {
                    return <Text style={styles.emptyDetailsText}>Aucune commande pour ce client</Text>;
                  }
                  return clientOrders.map((o) => {
                    const oStatus = getStatusColor(o.statut);
                    return (
                      <View key={o.id} style={[styles.detailCard, { marginBottom: 8 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>Ticket #{getDisplayTicketId(o)}</Text>
                          <View style={[styles.statusTag, { backgroundColor: oStatus.bg, borderColor: oStatus.border, borderWidth: 1, paddingVertical: 2, paddingHorizontal: 6 }]}>
                            <Text style={{ fontSize: 9, color: oStatus.text, fontWeight: '700' }}>{oStatus.label}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                          Articles : {getItemsSummary ? getItemsSummary(o.items || o.articles) : (o.items || o.articles || []).map(a => `${a.article} x${a.quantite}`).join(', ')}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                          <Text style={{ fontSize: 11, color: '#64748b' }}>
                            {o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : ''}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#002cf7' }}>
                            {formatPrice(o.prix_total || o.total)}
                          </Text>
                        </View>
                      </View>
                    );
                  });
                })()}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setSelectedClient(null)}
                style={[styles.invoiceCloseBtn, { marginTop: 16 }]}
              >
                <Text style={styles.invoiceCloseBtnText}>Fermer</Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#09090b',
    letterSpacing: -0.5,
  },
  filterHeader: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    height: '100%',
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  noResultsText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  ticketNo: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalView: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 40,
  },
  modalHeaderClose: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    backgroundColor: '#ffffff',
  },
  modalTitleLarge: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalScroll: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
  },
  detailClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  articleText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  articlePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  subLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  subValue: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  logisticsText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  compactModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 16,
  },
  compactModalView: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  compactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  compactModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  compactModalScroll: {
    paddingBottom: 24,
  },
  absoluteModalContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginVertical: 10,
  },
  cardFooterArea: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
  },
  factureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  factureBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#002cf7',
  },
  popupModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.4)',
    padding: 16,
  },
  popupModalView: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    shadowColor: '#09090b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  tpeScroll: {
    paddingBottom: 16,
  },
  tpeReceiptContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tpeBrand: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    color: '#0f172a',
    letterSpacing: 1,
  },
  tpeBrandSub: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    color: '#475569',
    marginTop: 2,
    marginBottom: 8,
  },
  tpeTextMuted: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '500',
  },
  tpeTextMutedCentred: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  tpeDashedDivider: {
    fontSize: 10,
    color: '#cbd5e1',
    textAlign: 'center',
    marginVertical: 8,
    letterSpacing: 2,
  },
  tpeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  tpeMetaLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  tpeMetaVal: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '600',
  },
  tpeSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tpeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  tpeItemName: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  tpeItemService: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 1,
    fontWeight: '500',
  },
  tpeItemQty: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '600',
    width: 30,
    textAlign: 'center',
  },
  tpeItemPrice: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '700',
    width: 90,
    textAlign: 'right',
  },
  tpeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  tpeTotalLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  tpeTotalVal: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '600',
  },
  tpeTotalLabelBold: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  tpeTotalValBold: {
    fontSize: 12,
    color: '#002cf7',
    fontWeight: '700',
  },
  tpeFooterMessage: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginVertical: 12,
  },
  barcodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#94a3b8',
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  barcodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: 2,
  },
  invoiceCloseBtn: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  invoiceDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 12,
  },
  invoiceDownloadBtnText: {
    color: '#002cf7',
    fontSize: 13,
    fontWeight: '600',
  },
  invoicePrintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002cf7',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  invoicePrintBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  cardSubscriptionGaugeContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 44, 247, 0.03)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.08)',
  },
  cardSubText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  cardSubTextBold: {
    fontSize: 10,
    color: '#002cf7',
    fontWeight: '700',
  },
  cardProgressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    backgroundColor: '#002cf7',
    borderRadius: 3,
  },
  clientProfileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  clientProfilePhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#002cf7',
    marginBottom: 4,
  },
  clientProfileAddress: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  clientProfilePreferences: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  premiumSubscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 16,
    zIndex: 10,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  subscriptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  subActiveBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subActiveBadgeText: {
    fontSize: 9,
    color: '#15803d',
    fontWeight: '700',
  },
  subPlanName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002cf7',
  },
  subPlanBalance: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#002cf7',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  subDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4,
  },
  subDateText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  unsubscribeBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  unsubscribeBtnText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  subscribeBtn: {
    backgroundColor: '#002cf7',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  clientPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  clientPillBtnText: {
    color: '#002cf7',
    fontSize: 12,
    fontWeight: '600',
  },
});
