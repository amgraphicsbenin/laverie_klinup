import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Search, Calendar, ChevronRight, X, Clock } from 'lucide-react-native';
import { db } from '../services/db';
import { BlurView } from 'expo-blur';

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, delivered, late
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orders = db.getOrders();
  const customers = db.getCustomers();

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'pret':
      case 'a_recuperer':
      case 'a_livrer':
        return { bg: 'rgba(5, 150, 105, 0.06)', text: '#059669', border: 'rgba(5, 150, 105, 0.12)', label: 'Prêt' };
      case 'lavage_cours':
      case 'en_cours_lavage':
        return { bg: 'rgba(37, 99, 235, 0.06)', text: '#2563eb', border: 'rgba(37, 99, 235, 0.12)', label: 'Lavage' };
      case 'repassage_cours':
      case 'en_cours_repassage':
        return { bg: 'rgba(13, 148, 136, 0.06)', text: '#0d9488', border: 'rgba(13, 148, 136, 0.12)', label: 'Repassage' };
      case 'attente':
      case 'en_attente':
        return { bg: 'rgba(217, 119, 6, 0.06)', text: '#d97706', border: 'rgba(217, 119, 6, 0.12)', label: 'En attente' };
      case 'en_cours_livraison':
        return { bg: 'rgba(79, 70, 229, 0.06)', text: '#4f46e5', border: 'rgba(79, 70, 229, 0.12)', label: 'En livraison' };
      case 'restitue':
      case 'livre':
      default:
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', label: 'Livré' };
    }
  };

  const getCustomerName = (customerId) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? `${cust.prenom} ${cust.nom}` : 'Client Inconnu';
  };

  const formatPrice = (price) => {
    return (price || 0).toLocaleString('fr-FR') + ' FCFA';
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <Text style={styles.noResultsText}>Aucune archive correspondante</Text>
        ) : (
          filteredOrders.map((item) => {
            const status = getStatusColor(item.statut);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => setSelectedOrder(item)}
                style={styles.historyCard}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.clientName}>{getCustomerName(item.customer_id)}</Text>
                    <Text style={styles.ticketNo}>Ticket #{item.ticket_numero || item.id.substring(0, 8)}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: status.bg, borderColor: status.border, borderWidth: 1 }]}>
                    <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.dateBlock}>
                    <Calendar size={12} color="#71717a" style={{ marginRight: 4 }} />
                    <Text style={styles.dateText}>{item.created_at.split('T')[0]}</Text>
                  </View>
                  <Text style={styles.totalAmount}>{formatPrice(item.prix_total || item.total)}</Text>
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
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.compactModalView, { maxHeight: '90%' }]}>
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Commande #{selectedOrder.ticket_numero || selectedOrder.id.substring(0, 8)}</Text>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.compactModalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailClientName}>{getCustomerName(selectedOrder.customer_id)}</Text>
                  <Text style={styles.detailDate}>Enregistrée le : {selectedOrder.created_at.replace('T', ' ').substring(0, 16)}</Text>
                  <Text style={styles.detailDate}>
                    Retrait prévu le : {selectedOrder.due_date ? new Date(selectedOrder.due_date).toLocaleDateString('fr-FR') : selectedOrder.date_retrait_prevue}
                  </Text>
                  
                  <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedOrder.statut).bg, borderColor: getStatusColor(selectedOrder.statut).border, alignSelf: 'flex-start', marginTop: 10, borderWidth: 1 }]}>
                    <Text style={[styles.statusTagText, { color: getStatusColor(selectedOrder.statut).text }]}>
                      {getStatusColor(selectedOrder.statut).label}
                    </Text>
                  </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    fontWeight: '700',
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '800',
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
    fontWeight: '700',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '800',
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  compactModalView: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  compactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  compactModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  compactModalScroll: {
    paddingBottom: 30,
  },
});
