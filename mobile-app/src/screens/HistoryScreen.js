import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Search, Calendar, ChevronRight, X, Clock } from 'lucide-react-native';
import { db } from '../services/db';

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, delivered, late
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orders = db.getOrders();
  const customers = db.getCustomers();

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'pret': return { bg: '#e8f5e9', text: '#2e7d32', label: 'Prêt' };
      case 'lavage_cours': return { bg: '#e3f2fd', text: '#1565c0', label: 'Lavage' };
      case 'repassage_cours': return { bg: '#e0f7fa', text: '#00838f', label: 'Repassage' };
      case 'attente': return { bg: '#fff3e0', text: '#e65100', label: 'En attente' };
      default: return { bg: '#f4f4f5', text: '#71717a', label: 'Livré' };
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
    const query = searchQuery.toLowerCase();
    const matchesQuery = clientName.includes(query) || ticketNo.includes(query);

    if (!matchesQuery) return false;

    if (filterType === 'delivered') return o.statut === 'livre';
    if (filterType === 'late') return o.est_en_retard || o.statut === 'retard';
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
              Livrés ({orders.filter(o => o.statut === 'livre').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFilterType('late')}
            style={[styles.chip, filterType === 'late' && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterType === 'late' && styles.chipTextActive]}>
              Retards ({orders.filter(o => o.est_en_retard || o.statut === 'retard').length})
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
                  <View style={[styles.statusTag, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.dateBlock}>
                    <Calendar size={12} color="#71717a" style={{ marginRight: 4 }} />
                    <Text style={styles.dateText}>{item.created_at.split('T')[0]}</Text>
                  </View>
                  <Text style={styles.totalAmount}>{formatPrice(item.total)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Detailed Order Modal */}
      <Modal
        animationType="slide"
        visible={selectedOrder !== null}
        onRequestClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <View style={styles.modalView}>
            <View style={styles.modalHeaderClose}>
              <Text style={styles.modalTitleLarge}>Commande #{selectedOrder.ticket_numero || selectedOrder.id.substring(0, 8)}</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <X size={22} color="#18181b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.detailCard}>
                <Text style={styles.detailClientName}>{getCustomerName(selectedOrder.customer_id)}</Text>
                <Text style={styles.detailDate}>Enregistrée le : {selectedOrder.created_at.replace('T', ' ').substring(0, 16)}</Text>
                <Text style={styles.detailDate}>Retrait prévu le : {selectedOrder.date_retrait_prevue}</Text>
                
                <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedOrder.statut).bg, alignSelf: 'flex-start', marginTop: 10 }]}>
                  <Text style={[styles.statusTagText, { color: getStatusColor(selectedOrder.statut).text }]}>
                    {getStatusColor(selectedOrder.statut).label}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Articles</Text>
              <View style={styles.detailCard}>
                {selectedOrder.articles && selectedOrder.articles.map((art, idx) => (
                  <View key={idx} style={styles.articleRow}>
                    <Text style={styles.articleText}>{art.article} ({art.service.replace(/_/g, ' ')}) x{art.quantite}</Text>
                    <Text style={styles.articlePrice}>{formatPrice(art.prix * art.quantite)}</Text>
                  </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.articleRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatPrice(selectedOrder.total)}</Text>
                </View>
                <View style={styles.articleRow}>
                  <Text style={styles.subLabel}>Avance payée</Text>
                  <Text style={styles.subValue}>{formatPrice(selectedOrder.avance)}</Text>
                </View>
                <View style={styles.articleRow}>
                  <Text style={styles.subLabel}>Reste à payer</Text>
                  <Text style={styles.subValue}>{formatPrice(selectedOrder.reste)}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Paiement & Mode</Text>
              <View style={styles.detailCard}>
                <Text style={styles.logisticsText}>Mode de règlement : {selectedOrder.mode_paiement || 'Non spécifié'}</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafc',
  },
  filterHeader: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181b',
    height: '100%',
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#3b82f6',
  },
  chipText: {
    fontSize: 11,
    color: '#52525b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  noResultsText: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 30,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
  },
  ticketNo: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingTop: 8,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#71717a',
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181b',
  },
  modalView: {
    flex: 1,
    backgroundColor: '#f9fafc',
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
    color: '#18181b',
  },
  modalScroll: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  detailClientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
  },
  detailDate: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    marginBottom: 8,
    marginLeft: 4,
  },
  articleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  articleText: {
    fontSize: 12,
    color: '#52525b',
  },
  articlePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f4f4f5',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181b',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
  },
  subLabel: {
    fontSize: 11,
    color: '#71717a',
  },
  subValue: {
    fontSize: 11,
    color: '#18181b',
  },
  logisticsText: {
    fontSize: 12,
    color: '#52525b',
  },
});
