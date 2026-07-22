import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal, Platform, BackHandler, Alert, RefreshControl, FlatList } from 'react-native';
import { Search, Calendar, X, Receipt, Trash2, User, Ban, ChevronRight, Tag } from 'lucide-react-native';
import { db } from '../../../services/db';
import { BlurView } from 'expo-blur';
import { useScrollPaddingBottom } from '../../../hooks/useTabBarHeight';
const MotiView = View;
import { useDbState } from '../../../hooks/useDbState';
import ClientDetailModal from '../../../components/ClientDetailModal';

export default function HistoryScreen({ onModalStateChange, closeAllModalsTrigger, onSelectClient, onShowSuccess }) {
  const { orders, customers, currentUser, isDarkMode } = useDbState();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await db.refreshData();
    } catch (e) {
      console.warn("Refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const styles = getStyles(isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, delivered, late
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const scrollPaddingBottom = useScrollPaddingBottom();

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

  let cancelBorderColor = isDarkMode ? '#334155' : '#e2e8f0';
  if (cancelReasonError) {
    cancelBorderColor = '#ef4444';
  }

  const validateCancelReason = (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return "Le motif de l'annulation est obligatoire.";
    }
    const hasLetter = /[a-zA-Z\u00C0-\u00FF]/.test(trimmed);
    if (!hasLetter) {
      return "Le motif doit contenir des lettres explicatives (pas seulement des chiffres ou symboles).";
    }
    return null;
  };

  const handleConfirmCancelOrder = () => {
    const error = validateCancelReason(cancelReason);
    if (error) {
      setCancelReasonError(error);
      return;
    }

    const order = orderToCancel;
    if (!order) return;

    setCancelModalVisible(false);
    
    try {
      db.cancelOrder(order.id, cancelReason.trim());
      setSelectedOrder(null);
      if (onShowSuccess) onShowSuccess("Commande annulée avec succès.");
    } catch (e) {
      console.error("Error cancelling order:", e);
      Alert.alert("Erreur", "Impossible d'annuler cette commande.");
    }
  };

  // Close details modal when trigger increments
  useEffect(() => {
    if (closeAllModalsTrigger > 0) {
      setSelectedOrder(null);
      setShowInvoiceModal(false);
      setInvoiceOrder(null);
    }
  }, [closeAllModalsTrigger]);

  // Notify parent of modal visibility
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(selectedOrder !== null || showInvoiceModal);
    }
  }, [selectedOrder, showInvoiceModal]);

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



  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setCancelReasonError('');
    setCancelModalVisible(true);
  };

  const handleDeleteOrder = (order) => {
    Alert.alert(
      "Supprimer la commande",
      `Voulez-vous vraiment supprimer d\u00e9finitivement la commande #${getDisplayTicketId(order)} ? Cette action est irr\u00e9versible.`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            try {
              db.deleteOrder(order.id);
              setSelectedOrder(null);
              if (onShowSuccess) onShowSuccess("Commande supprimée avec succès.");
            } catch (e) {
              console.error("Error deleting order:", e);
              Alert.alert("Erreur", "Impossible de supprimer cette commande.");
            }
          }
        }
      ]
    );
  };

  const getDisplayTicketId = (order) => {
    if (!order) return '1001';
    if (order.ticket_numero && /^\d+$/.test(String(order.ticket_numero))) return String(order.ticket_numero);
    if (order.id != null && /^\d+$/.test(String(order.id))) return String(order.id);
    const allOrders = db.getOrders().filter(Boolean);
    const sortedOrders = [...allOrders].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    const index = sortedOrders.findIndex(o => o.id === order.id);
    return index !== -1 ? String(1001 + index) : '1001';
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'pret':
        return { 
          bg: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#d1fae5', 
          text: isDarkMode ? '#34d399' : '#047857', 
          border: isDarkMode ? 'rgba(16, 185, 129, 0.4)' : '#6ee7b7', 
          label: 'Prêt à retirer', 
          accent: '#10b981' 
        };
      case 'a_recuperer':
        return { 
          bg: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7', 
          text: isDarkMode ? '#fbbf24' : '#b45309', 
          border: isDarkMode ? 'rgba(245, 158, 11, 0.4)' : '#fde68a', 
          label: 'À récupérer', 
          accent: '#f59e0b' 
        };
      case 'a_livrer':
        return { 
          bg: isDarkMode ? 'rgba(99, 102, 241, 0.18)' : '#e0e7ff', 
          text: isDarkMode ? '#818cf8' : '#4338ca', 
          border: isDarkMode ? 'rgba(99, 102, 241, 0.4)' : '#c7d2fe', 
          label: 'À livrer', 
          accent: '#6366f1' 
        };
      case 'en_cours_livraison':
        return { 
          bg: isDarkMode ? 'rgba(99, 102, 241, 0.18)' : '#e0e7ff', 
          text: isDarkMode ? '#818cf8' : '#4338ca', 
          border: isDarkMode ? 'rgba(99, 102, 241, 0.4)' : '#c7d2fe', 
          label: 'En livraison', 
          accent: '#6366f1' 
        };
      case 'restitue':
        return { 
          bg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#e6f4ea', 
          text: isDarkMode ? '#34d399' : '#137333', 
          border: isDarkMode ? 'rgba(16, 185, 129, 0.35)' : '#a8dab5', 
          label: 'Récupéré', 
          accent: '#10b981' 
        };
      case 'livre':
        return { 
          bg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#e6f4ea', 
          text: isDarkMode ? '#34d399' : '#137333', 
          border: isDarkMode ? 'rgba(16, 185, 129, 0.35)' : '#a8dab5', 
          label: 'Livré', 
          accent: '#10b981' 
        };
      case 'lavage_cours':
      case 'en_cours_lavage':
        return { 
          bg: isDarkMode ? 'rgba(59, 130, 246, 0.18)' : '#dbeafe', 
          text: isDarkMode ? '#60a5fa' : '#1d4ed8', 
          border: isDarkMode ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe', 
          label: 'Lavage', 
          accent: '#2563eb' 
        };
      case 'repassage_cours':
      case 'en_cours_repassage':
        return { 
          bg: isDarkMode ? 'rgba(13, 148, 136, 0.18)' : '#ccfbf1', 
          text: isDarkMode ? '#2dd4bf' : '#0f766e', 
          border: isDarkMode ? 'rgba(13, 148, 136, 0.4)' : '#99f6e4', 
          label: 'Repassage', 
          accent: '#0d9488' 
        };
      case 'traitement':
        return { 
          bg: isDarkMode ? 'rgba(124, 58, 237, 0.18)' : '#f3e8ff', 
          text: isDarkMode ? '#c084fc' : '#6b21a8', 
          border: isDarkMode ? 'rgba(124, 58, 237, 0.4)' : '#e9d5ff', 
          label: 'Traitement', 
          accent: '#7c3aed' 
        };
      case 'attente':
      case 'en_attente':
        return { 
          bg: isDarkMode ? 'rgba(217, 119, 6, 0.18)' : '#fff7ed', 
          text: isDarkMode ? '#fbbf24' : '#c2410c', 
          border: isDarkMode ? 'rgba(217, 119, 6, 0.4)' : '#ffedd5', 
          label: 'En attente', 
          accent: '#d97706' 
        };
      case 'annule':
        return { 
          bg: isDarkMode ? 'rgba(220, 38, 38, 0.18)' : '#ffe4e6', 
          text: isDarkMode ? '#f87171' : '#be123c', 
          border: isDarkMode ? 'rgba(220, 38, 38, 0.4)' : '#fecdd3', 
          label: 'Annulée', 
          accent: '#dc2626' 
        };
      default:
        return { 
          bg: isDarkMode ? 'rgba(217, 119, 6, 0.18)' : '#fff7ed', 
          text: isDarkMode ? '#fbbf24' : '#c2410c', 
          border: isDarkMode ? 'rgba(217, 119, 6, 0.4)' : '#ffedd5', 
          label: 'En attente', 
          accent: '#d97706' 
        };
    }
  };

  const getCustomerName = (customerId) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? `${cust.prenom} ${cust.nom}` : 'Client Inconnu';
  };

  const formatPrice = (price) => {
    return (price || 0).toLocaleString('fr-FR') + ' FCFA';
  };

  const handleShowInvoice = (item, e) => {
    e.stopPropagation();
    setInvoiceOrder(item);
    setShowInvoiceModal(true);
  };

  const historyOrders = orders.filter(Boolean);

  const filteredOrders = historyOrders
    .filter(o => {
      const clientName = getCustomerName(o.customer_id).toLowerCase();
      const ticketNo = (o.ticket_numero || '').toLowerCase();
      const orderId = (o.id || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesQuery = clientName.includes(query) || ticketNo.includes(query) || orderId.includes(query);

      if (!matchesQuery) return false;

      if (filterType === 'delivered') return o.statut === 'livre' || o.statut === 'restitue';
      if (filterType === 'late') return o.est_en_retard || o.statut === 'retard' || (o.statut !== 'restitue' && o.statut !== 'livre' && o.due_date && new Date(o.due_date) < new Date());
      if (filterType === 'cancelled') return o.statut === 'annule';
      return true;
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

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
        <ScrollView 
          horizontal 
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false} 
          style={styles.chipRow}
          onTouchStart={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
          onMouseDown={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
        >
          <TouchableOpacity 
            onPress={() => setFilterType('all')}
            style={[styles.chip, filterType === 'all' && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterType === 'all' && styles.chipTextActive]}>Tous ({historyOrders.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFilterType('delivered')}
            style={[styles.chip, filterType === 'delivered' && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterType === 'delivered' && styles.chipTextActive]}>
              Livrés ({historyOrders.filter(o => o.statut === 'livre' || o.statut === 'restitue').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFilterType('late')}
            style={[styles.chip, filterType === 'late' && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterType === 'late' && styles.chipTextActive]}>
              Retards ({historyOrders.filter(o => o.est_en_retard || o.statut === 'retard' || (o.statut !== 'restitue' && o.statut !== 'livre' && o.due_date && new Date(o.due_date) < new Date())).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFilterType('cancelled')}
            style={[styles.chip, filterType === 'cancelled' && { backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)', borderWidth: 1 }]}
          >
            <Text style={[styles.chipText, filterType === 'cancelled' && { color: '#dc2626', fontWeight: '600' }]}>
              Annulées ({historyOrders.filter(o => o.statut === 'annule').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* History List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#002cf7']}
            tintColor={isDarkMode ? '#ffffff' : '#002cf7'}
          />
        }
        ListEmptyComponent={
          <Text style={styles.noResultsText}>Aucune archive correspondante</Text>
        }
        renderItem={({ item }) => {
          const status = getStatusColor(item.statut);
          const clientObj = customers.find(c => c.id === item.customer_id);
          const hasSub = clientObj?.active_subscription;
          const subRemaining = hasSub ? hasSub.remaining_clothes : 0;
          const subTotal = hasSub ? hasSub.total_clothes : 0;
          const subPercentUsed = subTotal > 0 ? Math.max(0, Math.min(100, Math.round(((subTotal - subRemaining) / subTotal) * 100))) : 0;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => setSelectedOrder(item)}
              style={styles.historyCard}
            >
              {/* Card Header: Client Pill & Status Badge */}
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  onPress={(e) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    if (clientObj) setSelectedClient(clientObj);
                  }}
                  activeOpacity={0.8}
                  style={styles.clientPillBtn}
                >
                  <User size={13} color={isDarkMode ? '#38bdf8' : '#002cf7'} style={{ marginRight: 5 }} />
                  <Text style={styles.clientPillBtnText}>
                    {getCustomerName(item.customer_id)}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.statusTag, { backgroundColor: status.bg, borderColor: status.border }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.accent }]} />
                  <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                </View>
              </View>

              {/* Ticket & Article summary */}
              <View style={styles.ticketSummaryRow}>
                <View style={styles.ticketBadge}>
                  <Tag size={11} color={isDarkMode ? '#38bdf8' : '#002cf7'} style={{ marginRight: 4 }} />
                  <Text style={styles.ticketNoText}>Ticket #{getDisplayTicketId(item)}</Text>
                </View>
                {item.type_article ? (
                  <Text style={styles.articleSummaryText} numberOfLines={1}>
                    {item.type_article} {item.type_service ? `• ${String(item.type_service).replace(/_/g, ' ')}` : ''}
                  </Text>
                ) : null}
              </View>

              {hasSub && (
                <View style={styles.cardSubscriptionGaugeContainer}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.cardSubText}>Abonnement : {hasSub.name}</Text>
                    <Text style={styles.cardSubTextBold}>
                      {subRemaining} / {subTotal} vêt.
                    </Text>
                  </View>
                  <View style={styles.cardProgressBarBg}>
                    <View style={[styles.cardProgressBarFill, { width: `${subPercentUsed}%` }]} />
                  </View>
                </View>
              )}

              <View style={styles.cardDivider} />

              {/* Date & Price Row */}
              <View style={styles.cardFooter}>
                <View style={styles.dateBlock}>
                  <Calendar size={12} color={isDarkMode ? '#94a3b8' : '#64748b'} style={{ marginRight: 5 }} />
                  <Text style={styles.dateText}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </Text>
                </View>
                <Text style={styles.totalAmount}>{formatPrice(item.prix_total || item.total)}</Text>
              </View>

              <View style={styles.cardDivider} />

              {/* Action Bar */}
              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  onPress={(e) => handleShowInvoice(item, e)}
                  style={styles.factureBtn}
                  activeOpacity={0.7}
                >
                  <Receipt size={13} color={isDarkMode ? '#38bdf8' : '#002cf7'} style={{ marginRight: 5 }} />
                  <Text style={styles.factureBtnText}>Facture</Text>
                </TouchableOpacity>

                <View style={styles.detailsLinkBtn}>
                  <Text style={styles.detailsLinkText}>Détails</Text>
                  <ChevronRight size={14} color={isDarkMode ? '#38bdf8' : '#002cf7'} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Detailed Order Modal (BOTTOM SHEET) */}
      <MotiView
        pointerEvents={selectedOrder !== null ? 'auto' : 'none'}
        animate={{
          opacity: selectedOrder !== null ? 1 : 0
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
        {selectedOrder && (
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectedOrder(null)}>
              <BlurView intensity={85} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
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
                    if (client?.active_subscription) {
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
                  {(selectedOrder.items || selectedOrder.articles || []).map((art) => (
                    <View key={`${art.article}-${art.service}`} style={styles.articleRow}>
                      <Text style={styles.articleText}>{art.article} ({(art.service || '').replace(/_/g, ' ')}) x{art.quantite}</Text>
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

                {selectedOrder.statut === 'annule' && selectedOrder.motif_annulation && (
                  <>
                    <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Motif d'annulation</Text>
                    <View style={[styles.detailCard, { borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.03)' }]}>
                      <Text style={[styles.logisticsText, { color: '#ef4444', fontWeight: '600' }]}>
                        {selectedOrder.motif_annulation}
                      </Text>
                    </View>
                  </>
                )}

                {/* Cancel & Delete Buttons */}
                {selectedOrder.statut !== 'annule' && selectedOrder.statut !== 'livre' && selectedOrder.statut !== 'restitue' && 
                 currentUser && currentUser.role !== 'livreur' && currentUser.role !== 'agent_lavage_repassage' && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleCancelOrder(selectedOrder)}
                      activeOpacity={0.8}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#f59e0b', borderRadius: 10, paddingVertical: 10 }}
                    >
                      <Ban size={14} color="#f59e0b" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '600' }}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteOrder(selectedOrder)}
                      activeOpacity={0.8}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef44441a', borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 10, paddingVertical: 10 }}
                    >
                      <Trash2 size={14} color="#ef4444" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </MotiView>

      {/* MODAL : INVOICE / FACTURE (CENTERED POPUP DIALOG) */}
      <MotiView
        pointerEvents={(showInvoiceModal && invoiceOrder) ? 'auto' : 'none'}
        animate={{
          opacity: (showInvoiceModal && invoiceOrder) ? 1 : 0
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
        {invoiceOrder && (() => {
          const itemsList = invoiceOrder.items || invoiceOrder.articles || [];
          let itemsSum = itemsList.reduce((sum, art) => sum + (Number(art.prix || art.price || 0) * Number(art.quantite || art.quantity || 1)), 0);
          if (itemsSum === 0 && itemsList.length === 0) {
            const catalogItem = db.getCatalog ? db.getCatalog().find(c => c.article === invoiceOrder.type_article && c.service === invoiceOrder.type_service) : null;
            itemsSum = catalogItem ? catalogItem.prix : 1500;
          }
          const isExpress = invoiceOrder.niveau_urgence === 'Express';
          const expressMarkupItem = db.getCatalog().find(c => c.id === 'setting_express_markup');
          const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;
          const calculatedBrut = isExpress ? Math.round(itemsSum * (1 + expressMarkup / 100)) : itemsSum;
          const netPrice = invoiceOrder.prix_total || invoiceOrder.total || 0;
          
          const displayBrut = invoiceOrder.prix_base_avant_remise || Math.max(calculatedBrut, netPrice);
          const displayRemiseMontant = invoiceOrder.remise_montant || Math.max(0, displayBrut - netPrice);
          const displayRemisePourcent = invoiceOrder.remise_pourcentage || (displayBrut > 0 ? Math.round((displayRemiseMontant / displayBrut) * 100) : 0);
          const hasDiscount = displayRemiseMontant > 0;

          return (
            <View style={styles.absoluteModalContainer}>
              <View style={styles.popupModalOverlay}>
                <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => { setShowInvoiceModal(false); setInvoiceOrder(null); }}>
                  <BlurView intensity={85} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
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

                      {/* Articles list */}
                      <View style={{ marginVertical: 4 }}>
                        {(invoiceOrder.items || invoiceOrder.articles || []).map((art) => (
                          <View key={`${art.article}-${art.service}`} style={styles.tpeItemRow}>
                            <Text style={styles.tpeItemName}>
                              {art.article} x{art.quantite || art.quantity}
                            </Text>
                            <Text style={styles.tpeItemPrice}>
                              {formatPrice((art.prix || 0) * (art.quantite || art.quantity || 0))}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                      {/* Financial stats */}
                      <View style={styles.tpeTotalRow}>
                        <Text style={styles.tpeTotalLabel}>Total Brut</Text>
                        <Text style={styles.tpeTotalVal}>
                          {formatPrice(displayBrut)}
                        </Text>
                      </View>

                      {hasDiscount && (
                        <View style={styles.tpeTotalRow}>
                          <Text style={[styles.tpeTotalLabel, { color: '#ef4444' }]}>
                            REMISE ({displayRemisePourcent}%)
                          </Text>
                          <Text style={[styles.tpeTotalVal, { color: '#ef4444' }]}>-{formatPrice(displayRemiseMontant)}</Text>
                        </View>
                      )}

                      <View style={styles.tpeTotalRow}>
                        <Text style={styles.tpeTotalLabelBold}>Net à payer</Text>
                        <Text style={styles.tpeTotalValBold}>{formatPrice(invoiceOrder.prix_total || invoiceOrder.total)}</Text>
                      </View>

                      <View style={styles.tpeTotalRow}>
                        <Text style={styles.tpeTotalLabel}>Avance réglée</Text>
                        <Text style={styles.tpeTotalVal}>{formatPrice(invoiceOrder.avance_payee || invoiceOrder.avance || 0)}</Text>
                      </View>

                      <View style={styles.tpeTotalRow}>
                        <Text style={styles.tpeTotalLabelBold}>Solde dû</Text>
                        <Text style={[styles.tpeTotalValBold, { color: (invoiceOrder.reste || 0) > 0 ? '#ef4444' : '#16a34a' }]}>
                          {formatPrice(invoiceOrder.reste || 0)}
                        </Text>
                      </View>

                      <Text style={styles.tpeDashedDivider}>- - - - - - - - - - - - - - - -</Text>

                      {/* Footer & Barcode placeholder */}
                      <Text style={styles.tpeFooterMessage}>MERCI DE VOTRE CONFIANCE !</Text>
                      
                      <View style={{ height: 16 }} />
                    </View>

                    {/* Print/Download controls */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                      <TouchableOpacity
                        onPress={() => handleSharePdf(invoiceOrder)}
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
          );
        })()}
      </MotiView>

      {/* MODAL : MOTIF D'ANNULATION (POPUP INTERACTIF) */}
      <MotiView
        pointerEvents={cancelModalVisible ? 'auto' : 'none'}
        animate={{
          opacity: cancelModalVisible ? 1 : 0
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
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setCancelModalVisible(false)}>
              <BlurView intensity={85} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            
            <MotiView
              from={{ opacity: 0, scale: 0.97, translateY: 10 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 100 }}
              style={[styles.popupModalView, { width: '92%', maxWidth: 350, padding: 20 }]}
            >
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Annuler la commande</Text>
                <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Ban size={22} color="#ef4444" />
                </View>
                <Text style={{ fontSize: 13, color: isDarkMode ? '#cbd5e1' : '#64748b', textAlign: 'center', paddingHorizontal: 10 }}>
                  Veuillez spécifier le motif d'annulation de la commande #{orderToCancel ? (orderToCancel.ticket_numero || orderToCancel.id) : ''}.
                </Text>
              </View>

              <View style={{ marginVertical: 10 }}>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      height: 80,
                      textAlignVertical: 'top',
                      padding: 12,
                      borderColor: cancelReasonError ? '#ef4444' : (isDarkMode ? '#334155' : '#e2e8f0'),
                      borderRadius: 12,
                      borderWidth: 1,
                      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                      color: isDarkMode ? '#ffffff' : '#09090b',
                    }
                  ]}
                  placeholder="Ex: Erreur de saisie, client absent..."
                  placeholderTextColor={isDarkMode ? '#64748b' : '#a1a1aa'}
                  multiline={true}
                  numberOfLines={3}
                  value={cancelReason}
                  onChangeText={(text) => {
                    setCancelReason(text);
                    if (cancelReasonError) setCancelReasonError('');
                  }}
                />
                {cancelReasonError ? (
                  <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 6, fontWeight: '600' }}>
                    {cancelReasonError}
                  </Text>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                <TouchableOpacity
                  onPress={() => setCancelModalVisible(false)}
                  style={{
                    flex: 1,
                    backgroundColor: isDarkMode ? '#334155' : '#f4f4f5',
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: isDarkMode ? '#e2e8f0' : '#27272a', fontWeight: '700', fontSize: 13 }}>
                    Retour
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmCancelOrder}
                  style={{
                    flex: 1,
                    backgroundColor: '#ef4444',
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                    Confirmer
                  </Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </View>
        </View>
      </MotiView>
      {/* MODAL FICHE CLIENT (POPUP SUR PAGE HISTORIQUE) */}
      <ClientDetailModal
        visible={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onShowSuccess={onShowSuccess}
      />
    </View>
  );
}

const FONT_FAMILY = Platform.select({ ios: 'System', android: 'sans-serif' });

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#09090b',
    letterSpacing: -0.5,
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  ticketNo: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  ticketSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ticketNoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    fontFamily: FONT_FAMILY,
  },
  articleSummaryText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    maxWidth: '55%',
    fontFamily: FONT_FAMILY,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002cf7',
    letterSpacing: -0.3,
    fontFamily: FONT_FAMILY,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  factureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 44, 247, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.15)',
  },
  factureBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002cf7',
    fontFamily: FONT_FAMILY,
  },
  detailsLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailsLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002cf7',
    marginRight: 2,
    fontFamily: FONT_FAMILY,
  },
  modalView: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    fontFamily: FONT_FAMILY,
  },
  modalScroll: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  detailClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  detailDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
  },
  articlePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    fontFamily: FONT_FAMILY,
  },
  subLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  subValue: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  logisticsText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
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
  compactModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.55)',
    padding: 16,
  },
  popupModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.55)',
    padding: 16,
  },
  absoluteModalContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

function getStyles(isDarkMode) {
  if (!isDarkMode) return baseStyles;
  
  const overrides = {
    compactModalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    popupModalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    container: { backgroundColor: '#0f172a' },
    header: { backgroundColor: '#0f172a' },
    headerTitle: { color: '#ffffff' },
    filterHeader: { backgroundColor: '#1e293b', borderBottomColor: '#334155' },
    searchContainer: { backgroundColor: '#1e293b', borderColor: '#334155' },
    searchInput: { color: '#ffffff' },
    chip: { backgroundColor: '#334155' },
    chipActive: { backgroundColor: '#002cf7' },
    chipText: { color: '#cbd5e1' },
    chipTextActive: { color: '#ffffff' },
    historyCard: { backgroundColor: '#1e293b', borderColor: '#334155', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 5 },
    clientName: { color: '#ffffff' },
    ticketNo: { color: '#cbd5e1' },
    cardFooter: { borderTopColor: '#334155' },
    dateText: { color: '#94a3b8' },
    totalAmount: { color: '#38bdf8' },
    ticketBadge: { backgroundColor: '#0f172a' },
    ticketNoText: { color: '#cbd5e1' },
    articleSummaryText: { color: '#94a3b8' },
    cardActionRow: { borderTopColor: 'rgba(255, 255, 255, 0.08)' },
    factureBtn: { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' },
    factureBtnText: { color: '#38bdf8' },
    detailsLinkText: { color: '#38bdf8' },
    modalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    modalContent: { backgroundColor: '#1e293b', borderColor: '#334155' },
    modalTitle: { color: '#ffffff' },
    modalLabel: { color: '#e2e8f0' },
    modalInput: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' },
    invoiceSectionTitle: { color: '#ffffff', borderBottomColor: '#334155' },
    invoiceItemRow: { borderBottomColor: '#334155' },
    invoiceItemName: { color: '#ffffff' },
    invoiceItemQty: { color: '#cbd5e1' },
    invoiceItemTotal: { color: '#ffffff' },
    invoiceSummaryRow: { borderTopColor: '#334155' },
    invoiceTotalValue: { color: '#ffffff' },
    clientPillBtn: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' },
    clientPillBtnText: { color: '#38bdf8' },
  };

  const merged = {};
  Object.keys(baseStyles).forEach(key => {
    if (overrides[key]) {
      merged[key] = { ...StyleSheet.flatten(baseStyles[key]), ...overrides[key] };
    } else {
      merged[key] = baseStyles[key];
    }
  });
  return merged;
};
