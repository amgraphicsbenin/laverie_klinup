import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { TrendingUp, RefreshCw, Layers, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { db } from '../services/db';

export default function DashboardScreen({ onNavigate, setSelectedOrder }) {
  const staff = db.getStaff();
  const orders = db.getOrders();
  const customers = db.getCustomers();
  const currentUser = db.getCurrentUser();
  const isRemote = db.isRemote();

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    onNavigate('gestion'); // Navigate to management tab to view order details
  };

  // Filter orders by active statuses
  const activeOrders = orders.filter(o => o.statut !== 'livre');
  const readyOrders = orders.filter(o => o.statut === 'pret');
  
  // Calculate revenue of the day
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.created_at.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Late orders (example helper)
  const lateOrders = orders.filter(o => o.est_en_retard || o.statut === 'retard');

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'pret': return { bg: '#e8f5e9', text: '#2e7d32', label: 'Prêt' };
      case 'lavage_cours': return { bg: '#e3f2fd', text: '#1565c0', label: 'Lavage' };
      case 'repassage_cours': return { bg: '#e0f7fa', text: '#00838f', label: 'Repassage' };
      case 'attente': return { bg: '#fff3e0', text: '#e65100', label: 'En attente' };
      default: return { bg: '#f4f4f5', text: '#71717a', label: 'Livré' };
    }
  };

  const formatPrice = (price) => {
    return (price || 0).toLocaleString('fr-FR') + ' FCFA';
  };

  const getCustomerName = (customerId) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? `${cust.prenom} ${cust.nom}` : 'Client Inconnu';
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bonjour,</Text>
          <Text style={styles.userName}>{currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'KLIN UP'}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isRemote ? '#22c55e' : '#f59e0b' }]} />
          <Text style={styles.statusText}>{isRemote ? 'En Ligne' : 'Hors-Ligne'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STATS SECTION */}
        {currentUser && currentUser.role !== 'agent_lavage_repassage' && (
          <View style={styles.statsRow}>
            {/* Revenue card */}
            <View style={[styles.statCard, { flex: 1.3 }]}>
              <View style={[styles.statIconWrap, { backgroundColor: '#eff6ff' }]}>
                <TrendingUp size={16} color="#3b82f6" />
              </View>
              <Text style={styles.statLabel}>CA du jour</Text>
              <Text style={styles.statValue} numberOfLines={1}>{formatPrice(todayRevenue)}</Text>
            </View>

            {/* Active count */}
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIconWrap, { backgroundColor: '#f5f3ff' }]}>
                <Layers size={16} color="#8b5cf6" />
              </View>
              <Text style={styles.statLabel}>En cours</Text>
              <Text style={styles.statValue}>{activeOrders.length}</Text>
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          {/* Ready count */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#f0fdf4' }]}>
              <CheckCircle2 size={16} color="#22c55e" />
            </View>
            <Text style={styles.statLabel}>Commandes Prêtes</Text>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{readyOrders.length}</Text>
          </View>

          {/* Late count */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#fef2f2' }]}>
              <AlertTriangle size={16} color="#ef4444" />
            </View>
            <Text style={styles.statLabel}>Retards / Urgences</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{lateOrders.length}</Text>
          </View>
        </View>

        {/* ACTIVE ORDERS FEED */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Commandes Actives</Text>
          <TouchableOpacity onPress={() => onNavigate('gestion')}>
            <Text style={styles.seeAllLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {activeOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune commande active</Text>
          </View>
        ) : (
          activeOrders.slice(0, 10).map((item) => {
            const status = getStatusColor(item.statut);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleOrderPress(item)}
                style={styles.orderCard}
              >
                <View style={styles.orderLeft}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderClientName}>{getCustomerName(item.customer_id)}</Text>
                    <Text style={styles.orderNumber}>Ticket #{item.ticket_numero || item.id.substring(0, 8)}</Text>
                  </View>
                </View>

                <View style={styles.orderRight}>
                  <View style={[styles.statusTag, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                  </View>
                  <Text style={styles.orderPrice}>{formatPrice(item.total)}</Text>
                  <ChevronRight size={14} color="#a1a1aa" style={styles.chevron} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  welcomeText: {
    fontSize: 12,
    color: '#71717a',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#52525b',
  },
  scrollContent: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#71717a',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
  },
  seeAllLink: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  emptyText: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  orderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderClientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
  },
  orderNumber: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#18181b',
  },
  chevron: {
    position: 'absolute',
    right: -10,
    top: 12,
  },
});
