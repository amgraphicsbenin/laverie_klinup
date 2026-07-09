import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, Platform, Modal } from 'react-native';
import { TrendingUp, RefreshCw, Layers, CheckCircle2, AlertTriangle, ChevronRight, Plus, ArrowUpRight, X } from 'lucide-react-native';
import { db } from '../services/db';
import { MotiView } from 'moti';
import Svg, { Path, Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';

export default function DashboardScreen({ onNavigate, setSelectedOrder, setGestionFilter }) {
  const staff = db.getStaff();
  const orders = db.getOrders();
  const customers = db.getCustomers();
  const currentUser = db.getCurrentUser();
  const isRemote = db.isRemote();

  // Modals visibility for advanced stats details
  const [showCaDetails, setShowCaDetails] = useState(false);
  const [showTodayOrdersDetails, setShowTodayOrdersDetails] = useState(false);

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    onNavigate('gestion'); // Navigate to management tab to view order details
  };

  // Filter orders by active statuses
  const activeOrders = orders.filter(o => o.statut !== 'livre' && o.statut !== 'restitue');
  const readyOrders = orders.filter(o => o.statut === 'pret' || o.statut === 'a_recuperer' || o.statut === 'a_livrer');
  
  // Calculate revenue of the day
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

  // Late orders (example helper)
  const lateOrders = orders.filter(o => o.est_en_retard || o.statut === 'retard' || (o.statut !== 'restitue' && o.statut !== 'livre' && o.due_date && new Date(o.due_date) < new Date()));

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
          <Text style={styles.headerTitle}>Activité</Text>
          <Text style={styles.subHeadline}>
            Vous suivez au mieux <Text style={styles.boldText}>votre Laverie</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => { setSelectedOrder(null); onNavigate('gestion'); }}
            style={styles.circleButtonBlack}
          >
            <Plus size={16} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onNavigate('historique')}
            style={styles.circleButtonWhite}
          >
            <ArrowUpRight size={16} color="#09090b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STATS SECTION */}
        {(!currentUser || currentUser.role !== 'agent_lavage_repassage') && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setShowCaDetails(true)}
            style={{ width: '100%' }}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 100 }}
              style={styles.mainSpendCard}
            >
              <View style={styles.spendHeader}>
                <View>
                  <Text style={styles.spendLabel}>Chiffre d'affaires</Text>
                  <Text style={styles.spendValue}>{formatPrice(todayRevenue)}</Text>
                </View>
                <View style={styles.spendTrend}>
                  <TrendingUp size={14} color="#002cf7" />
                  <Text style={styles.spendTrendText}>CA du Jour</Text>
                </View>
              </View>

              {/* SVG Line Graph */}
              <View style={styles.chartContainer}>
                <Svg height="60" width="100%">
                  {/* Grid lines */}
                  <Path d="M0,15 L350,15" stroke="rgba(9, 9, 11, 0.02)" strokeWidth="1" strokeDasharray="3 3" />
                  <Path d="M0,35 L350,35" stroke="rgba(9, 9, 11, 0.02)" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Line graph */}
                  <Path
                    d="M10,48 Q50,22 100,38 T200,24 T300,42 T370,18"
                    fill="none"
                    stroke="#002cf7"
                    strokeWidth="2.5"
                  />
                  {/* highlighted dot at cx=200, cy=24 */}
                  <Circle cx="200" cy="24" r="4.5" fill="#002cf7" />
                </Svg>
                {/* highlighted dot label floating */}
                <View style={[styles.chartBadge, { left: 170, top: -6 }]}>
                  <Text style={styles.chartBadgeText}>Aujourd'hui</Text>
                </View>
              </View>
            </MotiView>
          </TouchableOpacity>
        )}

        {/* 2X2 GRID STATS */}
        <View style={styles.gridRow}>
          {/* Card 1: En Cours (Solid Blue) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setGestionFilter('en_cours'); onNavigate('gestion'); }}
            style={{ flex: 1 }}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 50 }}
              style={[styles.gridCard, styles.gridCardBlue]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Layers size={14} color="#ffffff" />
                </View>
                <Text style={styles.gridCardLabelBlue}>En cours</Text>
              </View>
              <Text style={styles.gridCardValueBlue}>{activeOrders.length}</Text>
              <Text style={styles.gridCardSubBlue}>Lavage & Repassage</Text>
            </MotiView>
          </TouchableOpacity>

          {/* Card 2: Prêtes (White) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setGestionFilter('pretes'); onNavigate('gestion'); }}
            style={{ flex: 1 }}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 100 }}
              style={styles.gridCard}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(5, 150, 105, 0.05)' }]}>
                  <CheckCircle2 size={14} color="#059669" />
                </View>
                <Text style={styles.gridCardLabel}>Commandes Prêtes</Text>
              </View>
              <Text style={[styles.gridCardValue, { color: '#059669' }]}>{readyOrders.length}</Text>
              <Text style={styles.gridCardSub}>À récupérer</Text>
            </MotiView>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          {/* Card 3: Retards/Urgences (White) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setGestionFilter('retards'); onNavigate('gestion'); }}
            style={{ flex: 1 }}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 150 }}
              style={styles.gridCard}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(225, 29, 72, 0.05)' }]}>
                  <AlertTriangle size={14} color="#e11d48" />
                </View>
                <Text style={styles.gridCardLabel}>Retards / Urgences</Text>
              </View>
              <Text style={[styles.gridCardValue, { color: '#e11d48' }]}>{lateOrders.length}</Text>
              <Text style={styles.gridCardSub}>Livraison alerte</Text>
            </MotiView>
          </TouchableOpacity>

          {/* Card 4: Volume (White) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowTodayOrdersDetails(true)}
            style={{ flex: 1 }}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 200 }}
              style={styles.gridCard}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(9, 9, 11, 0.05)' }]}>
                  <RefreshCw size={14} color="#09090b" />
                </View>
                <Text style={styles.gridCardLabel}>Commandes du Jour</Text>
              </View>
              <Text style={styles.gridCardValue}>{todayOrders.length}</Text>
              <Text style={styles.gridCardSub}>Flux quotidien</Text>
            </MotiView>
          </TouchableOpacity>
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
          activeOrders.slice(0, 10).map((item, index) => {
            const status = getStatusColor(item.statut);
            return (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'spring',
                  damping: 15,
                  stiffness: 120,
                  delay: index * 60,
                }}
              >
                <TouchableOpacity
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
                    <View style={[styles.statusTag, { backgroundColor: status.bg, borderColor: status.border }]}>
                      <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                    </View>
                    <Text style={styles.orderPrice}>{formatPrice(item.prix_total || item.total)}</Text>
                    <ChevronRight size={14} color="#64748b" style={styles.chevron} />
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })
        )}
      </ScrollView>

      {/* CA DETAILS MODAL */}
      <Modal visible={showCaDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView tint="dark" intensity={30} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails Chiffre d'Affaires</Text>
              <TouchableOpacity onPress={() => setShowCaDetails(false)} style={styles.closeBtn}>
                <X size={18} color="#09090b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.caTotalSection}>
              <Text style={styles.caTotalLabel}>Revenu Total (Aujourd'hui)</Text>
              <Text style={styles.caTotalVal}>{formatPrice(todayRevenue)}</Text>
            </View>

            <View style={styles.caBreakdown}>
              <View style={styles.caRow}>
                <Text style={styles.caRowLabel}>Espèces (Cash)</Text>
                <Text style={styles.caRowVal}>{formatPrice(todayRevenue)}</Text>
              </View>
              <View style={styles.caRow}>
                <Text style={styles.caRowLabel}>Wave / Orange Money</Text>
                <Text style={styles.caRowVal}>{formatPrice(0)}</Text>
              </View>
              <View style={styles.caRow}>
                <Text style={styles.caRowLabel}>Transactions du jour</Text>
                <Text style={styles.caRowVal}>{todayOrders.length}</Text>
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>Détail des ventes</Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {todayOrders.length === 0 ? (
                <Text style={styles.emptyDetailsText}>Aucune commande aujourd'hui</Text>
              ) : (
                todayOrders.map((o) => (
                  <View key={o.id} style={styles.detailsOrderRow}>
                    <View>
                      <Text style={styles.detailsClientName}>
                        {customers.find(c => c.id === o.customer_id)?.prenom} {customers.find(c => c.id === o.customer_id)?.nom}
                      </Text>
                      <Text style={styles.detailsTicketNo}>Ticket #{o.ticket_numero || o.id.substring(0, 8)}</Text>
                    </View>
                    <Text style={styles.detailsPrice}>{formatPrice(o.prix_total || o.total)}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* TODAY ORDERS DETAILS MODAL */}
      <Modal visible={showTodayOrdersDetails} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView tint="dark" intensity={30} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Commandes du Jour ({todayOrders.length})</Text>
              <TouchableOpacity onPress={() => setShowTodayOrdersDetails(false)} style={styles.closeBtn}>
                <X size={18} color="#09090b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {todayOrders.length === 0 ? (
                <Text style={styles.emptyDetailsText}>Aucune commande enregistrée aujourd'hui.</Text>
              ) : (
                todayOrders.map((o) => {
                  const status = getStatusColor(o.statut);
                  return (
                    <TouchableOpacity 
                      key={o.id}
                      onPress={() => {
                        setShowTodayOrdersDetails(false);
                        setSelectedOrder(o);
                        onNavigate('gestion');
                      }}
                      style={styles.detailsOrderRowClickable}
                    >
                      <View>
                        <Text style={styles.detailsClientName}>
                          {customers.find(c => c.id === o.customer_id)?.prenom} {customers.find(c => c.id === o.customer_id)?.nom}
                        </Text>
                        <Text style={styles.detailsTicketNo}>Ticket #{o.ticket_numero || o.id.substring(0, 8)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.detailsPrice}>{formatPrice(o.prix_total || o.total)}</Text>
                        <View style={[styles.miniStatusTag, { backgroundColor: status.bg, borderColor: status.border }]}>
                          <Text style={[styles.miniStatusText, { color: status.text }]}>{status.label}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#f4f5f7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#09090b',
    letterSpacing: -0.5,
  },
  subHeadline: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
    marginTop: 4,
  },
  boldText: {
    color: '#09090b',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleButtonBlack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  circleButtonWhite: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },
  mainSpendCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 20,
  },
  spendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spendLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spendValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#09090b',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  spendTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 44, 247, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spendTrendText: {
    fontSize: 10,
    color: '#002cf7',
    fontWeight: '700',
  },
  chartContainer: {
    marginTop: 10,
    position: 'relative',
  },
  chartBadge: {
    position: 'absolute',
    backgroundColor: '#002cf7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  chartBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  gridCardBlue: {
    backgroundColor: '#002cf7',
    borderColor: '#002cf7',
    shadowColor: '#002cf7',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  gridCardLabelBlue: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  gridCardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#09090b',
  },
  gridCardValueBlue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  gridCardSub: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: '500',
    marginTop: 4,
  },
  gridCardSubBlue: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#09090b',
  },
  seeAllLink: {
    fontSize: 12,
    color: '#002cf7',
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
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
    fontWeight: '700',
    color: '#09090b',
  },
  orderNumber: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 3,
    fontWeight: '500',
  },
  orderRight: {
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  orderPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#09090b',
  },
  chevron: {
    position: 'absolute',
    right: -10,
    top: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(9, 9, 11, 0.4)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#09090b',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f5f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caTotalSection: {
    backgroundColor: '#f4f5f7',
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  caTotalLabel: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '600',
    marginBottom: 4,
  },
  caTotalVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#002cf7',
  },
  caBreakdown: {
    marginBottom: 20,
    gap: 12,
  },
  caRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f5f7',
    paddingBottom: 8,
  },
  caRowLabel: {
    fontSize: 13,
    color: '#71717a',
    fontWeight: '500',
  },
  caRowVal: {
    fontSize: 13,
    color: '#09090b',
    fontWeight: '700',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#09090b',
    marginBottom: 12,
  },
  detailsOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f5f7',
  },
  detailsOrderRowClickable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f5f7',
  },
  detailsClientName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#09090b',
  },
  detailsTicketNo: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  detailsPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#09090b',
  },
  emptyDetailsText: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
    paddingVertical: 20,
  },
  miniStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 4,
  },
  miniStatusText: {
    fontSize: 8,
    fontWeight: '700',
  },
});
