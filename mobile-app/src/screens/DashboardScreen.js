import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, Platform, Modal, BackHandler } from 'react-native';
import { TrendingUp, RefreshCw, Layers, CheckCircle2, AlertTriangle, ChevronRight, Plus, ArrowUpRight, X, Percent, ShoppingBag, Clock } from 'lucide-react-native';
import { db } from '../services/db';
import { MotiView } from 'moti';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useScrollPaddingBottom } from '../hooks/useTabBarHeight';

export default function DashboardScreen({ onNavigate, setSelectedOrder, setGestionFilter, onModalStateChange }) {
  const scrollPaddingBottom = useScrollPaddingBottom();
  const staff = db.getStaff();
  const orders = db.getOrders();
  const customers = db.getCustomers();
  const currentUser = db.getCurrentUser();
  const isRemote = db.isRemote();

  // State for active KPI details modal
  const [activeKpiDetail, setActiveKpiDetail] = useState(null);

  // Notify parent of modal visibility
  React.useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(activeKpiDetail !== null);
    }
  }, [activeKpiDetail]);

  // Handle Android back button/gesture to close KPI modal
  React.useEffect(() => {
    if (Platform.OS === 'web' || !activeKpiDetail) return;

    const backAction = () => {
      setActiveKpiDetail(null);
      return true; // prevent default behavior (exit/tab change)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeKpiDetail]);

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

  // Cash vs Mobile Money for today's orders
  const todayEspèces = todayOrders.filter(o => o.mode_reglement === 'Espèce' || o.mode_reglement === 'Espèces' || o.mode_reglement === 'Cash').reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
  const todayMobileMoney = todayOrders.filter(o => o.mode_reglement === 'Mobile Money' || o.mode_reglement === 'Mobile money' || o.mode_reglement === 'Momo').reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

  // Advanced KPIs
  // Monthly Revenue (current month)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthlyOrders = orders.filter(o => o.created_at && o.created_at.startsWith(currentMonthStr));
  const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

  // Average Basket
  const averageBasket = orders.length > 0 
    ? Math.round(orders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0) / orders.length)
    : 0;

  // Recovery Rate
  const totalVolume = orders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.avance_payee || o.avance || 0), 0);
  const recoveryRate = totalVolume > 0 ? Math.round((totalPaid / totalVolume) * 100) : 100;

  // Express Orders Ratio
  const expressOrdersCount = orders.filter(o => o.niveau_urgence === 'Express').length;
  const expressRate = orders.length > 0 ? Math.round((expressOrdersCount / orders.length) * 100) : 0;

  // Late orders (example helper)
  const lateOrders = orders.filter(o => o.est_en_retard || o.statut === 'retard' || (o.statut !== 'restitue' && o.statut !== 'livre' && o.due_date && new Date(o.due_date) < new Date()));

  // Last 7 days revenue for bar chart
  const getLast7DaysRevenue = () => {
    const revenueData = [];
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      
      const dayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(dateStr));
      const revenue = dayOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
      revenueData.push({ day: dayName, revenue, isToday: i === 0 });
    }
    return revenueData;
  };
  const last7DaysData = getLast7DaysRevenue();
  const maxRevenue = Math.max(...last7DaysData.map(d => d.revenue), 1000);

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

  const getDisplayTicketId = (order) => {
    if (order.ticket_numero && /^\d+$/.test(order.ticket_numero)) return order.ticket_numero;
    if (/^\d+$/.test(order.id)) return order.id;
    const allOrders = db.getOrders();
    const sortedOrders = [...allOrders].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    const index = sortedOrders.findIndex(o => o.id === order.id);
    return index !== -1 ? String(1001 + index) : '1001';
  };

  const kpiThemes = {
    ca_mensuel: { primary: '#4f46e5', bg: '#e0e7ff', text: '#1e1b4b', title: 'Chiffre d\'Affaires Mensuel' },
    panier_moyen: { primary: '#a855f7', bg: '#f3e8ff', text: '#3b0764', title: 'Panier Moyen' },
    recouvrement: { primary: '#10b981', bg: '#d1fae5', text: '#064e3b', title: 'Taux de Recouvrement' },
    part_express: { primary: '#ef4444', bg: '#fee2e2', text: '#7f1d1d', title: 'Part Express' },
    en_cours: { primary: '#0369a1', bg: '#e0f2fe', text: '#0c4a6e', title: 'Commandes En Cours' },
    pretes: { primary: '#15803d', bg: '#dcfce7', text: '#064e3b', title: 'Commandes Prêtes' },
    retards: { primary: '#be123c', bg: '#ffe4e6', text: '#4c0519', title: 'Retards & Urgences' },
    ca_jour: { primary: '#2563eb', bg: '#eff6ff', text: '#1e3a8a', title: 'CA Journalier' },
    volume_jour: { primary: '#475569', bg: '#f1f5f9', text: '#0f172a', title: 'Commandes du Jour' },
  };

  const renderKpiDetails = () => {
    if (!activeKpiDetail) return null;
    const theme = kpiThemes[activeKpiDetail];
    
    let heroValue = '';
    let heroLabel = '';
    let subStats = [];
    let listTitle = '';
    let listItems = [];
    
    switch (activeKpiDetail) {
      case 'ca_mensuel':
        heroValue = formatPrice(monthlyRevenue);
        heroLabel = "Chiffre d'affaires encaissé + reste à payer ce mois-ci";
        subStats = [
          { label: "Commandes", val: monthlyOrders.length },
          { label: "Panier Moyen", val: formatPrice(averageBasket) },
          { label: "Urgent (Express)", val: monthlyOrders.filter(o => o.niveau_urgence === 'Express').length },
          { label: "Normal", val: monthlyOrders.filter(o => o.niveau_urgence !== 'Express').length }
        ];
        listTitle = "Top 5 Commandes ce Mois";
        listItems = [...monthlyOrders].sort((a, b) => (b.prix_total || b.total || 0) - (a.prix_total || a.total || 0)).slice(0, 5);
        break;
        
      case 'panier_moyen':
        heroValue = formatPrice(averageBasket);
        heroLabel = "Valeur moyenne d'une commande";
        const highValueOrders = orders.filter(o => (o.prix_total || o.total || 0) > averageBasket * 1.5).length;
        const lowValueOrders = orders.filter(o => (o.prix_total || o.total || 0) < averageBasket * 0.5).length;
        subStats = [
          { label: "Paniers Élevés", val: highValueOrders },
          { label: "Paniers Bas", val: lowValueOrders },
          { label: "Commandes Totales", val: orders.length },
          { label: "Chiffre d'Affaires", val: formatPrice(totalVolume) }
        ];
        listTitle = "Commandes Proches de la Moyenne";
        listItems = [...orders].sort((a, b) => Math.abs((a.prix_total || a.total || 0) - averageBasket) - Math.abs((b.prix_total || b.total || 0) - averageBasket)).slice(0, 5);
        break;
        
      case 'recouvrement':
        heroValue = `${recoveryRate}%`;
        heroLabel = "Taux de recouvrement du chiffre d'affaires";
        const totalReste = orders.reduce((sum, o) => sum + (o.reste || 0), 0);
        subStats = [
          { label: "Encaissé (Avance)", val: formatPrice(totalPaid) },
          { label: "Reste à Recouvrer", val: formatPrice(totalReste) },
          { label: "Commandes Impayées", val: orders.filter(o => (o.reste || 0) > 0).length },
          { label: "Total Facturé", val: formatPrice(totalVolume) }
        ];
        listTitle = "Commandes avec Reste à Payer";
        listItems = orders.filter(o => (o.reste || 0) > 0).slice(0, 8);
        break;
        
      case 'part_express':
        heroValue = `${expressRate}%`;
        heroLabel = "Part des commandes urgentes";
        subStats = [
          { label: "Commandes Express", val: expressOrdersCount },
          { label: "Commandes Normales", val: orders.length - expressOrdersCount },
          { label: "CA Express", val: formatPrice(orders.filter(o => o.niveau_urgence === 'Express').reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0)) },
          { label: "Volume Total", val: orders.length }
        ];
        listTitle = "Commandes Express Actives";
        listItems = activeOrders.filter(o => o.niveau_urgence === 'Express').slice(0, 8);
        break;
        
      case 'en_cours':
        heroValue = String(activeOrders.length);
        heroLabel = "Commandes en cours de traitement";
        subStats = [
          { label: "En Attente", val: activeOrders.filter(o => o.statut === 'attente' || o.statut === 'en_attente').length },
          { label: "En Lavage", val: activeOrders.filter(o => o.statut === 'lavage_cours' || o.statut === 'en_cours_lavage').length },
          { label: "En Repassage", val: activeOrders.filter(o => o.statut === 'repassage_cours' || o.statut === 'en_cours_repassage').length },
          { label: "Prêtes", val: readyOrders.length }
        ];
        listTitle = "Suivi des Commandes Actives";
        listItems = activeOrders.slice(0, 8);
        break;
        
      case 'pretes':
        heroValue = String(readyOrders.length);
        heroLabel = "Commandes prêtes à être récupérées";
        const readyValue = readyOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
        subStats = [
          { label: "Valeur à récupérer", val: formatPrice(readyValue) },
          { label: "Restes à payer", val: formatPrice(readyOrders.reduce((sum, o) => sum + (o.reste || 0), 0)) },
          { label: "Commandes prêtes", val: readyOrders.length },
          { label: "Part des encours", val: activeOrders.length > 0 ? `${Math.round((readyOrders.length / activeOrders.length)*100)}%` : '0%' }
        ];
        listTitle = "Commandes Prêtes en Attente";
        listItems = readyOrders.slice(0, 8);
        break;
        
      case 'retards':
        heroValue = String(lateOrders.length);
        heroLabel = "Commandes en retard ou urgentes";
        subStats = [
          { label: "Retards", val: lateOrders.filter(o => (o.due_date && new Date(o.due_date) < new Date())).length },
          { label: "Urgences Actives", val: activeOrders.filter(o => o.niveau_urgence === 'Express').length },
          { label: "Total à traiter", val: activeOrders.length },
          { label: "Taux de retard", val: activeOrders.length > 0 ? `${Math.round((lateOrders.length / activeOrders.length)*100)}%` : '0%' }
        ];
        listTitle = "Commandes en Retard / Urgences";
        listItems = [...lateOrders, ...activeOrders.filter(o => o.niveau_urgence === 'Express' && !lateOrders.find(l => l.id === o.id))].slice(0, 8);
        break;
        
      case 'ca_jour':
        heroValue = formatPrice(todayRevenue);
        heroLabel = "Chiffre d'affaires encaissé aujourd'hui";
        subStats = [
          { label: "Espèces (Cash)", val: formatPrice(todayEspèces) },
          { label: "Mobile Money", val: formatPrice(todayMobileMoney) },
          { label: "Commandes", val: todayOrders.length },
          { label: "Panier Moyen", val: todayOrders.length > 0 ? formatPrice(Math.round(todayRevenue / todayOrders.length)) : '0 FCFA' }
        ];
        listTitle = "Ventes du Jour";
        listItems = todayOrders;
        break;
        
      case 'volume_jour':
        heroValue = String(todayOrders.length);
        heroLabel = "Nombre de commandes enregistrées aujourd'hui";
        subStats = [
          { label: "Urgent (Express)", val: todayOrders.filter(o => o.niveau_urgence === 'Express').length },
          { label: "Normal", val: todayOrders.filter(o => o.niveau_urgence !== 'Express').length },
          { label: "CA Estimé", val: formatPrice(todayRevenue) },
          { label: "Taux d'encaissement", val: todayRevenue > 0 ? `${Math.round((todayOrders.reduce((sum, o) => sum + (o.avance_payee || o.avance || 0), 0) / todayRevenue) * 100)}%` : '100%' }
        ];
        listTitle = "Liste des Commandes du Jour";
        listItems = todayOrders;
        break;
        
      default:
        return null;
    }

    return (
      <Modal visible={activeKpiDetail !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setActiveKpiDetail(null)}>
            <BlurView tint="dark" intensity={30} style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <View style={[styles.modalContent, { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.primary }]}>{theme.title}</Text>
              <TouchableOpacity onPress={() => setActiveKpiDetail(null)} style={styles.closeBtn}>
                <X size={18} color="#09090b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Hero Banner Section (styled according to theme background) */}
              <View style={[styles.kpiHeroCard, { backgroundColor: theme.bg }]}>
                <Text style={[styles.kpiHeroValue, { color: theme.primary }]}>{heroValue}</Text>
                <Text style={[styles.kpiHeroLabel, { color: theme.primary }]}>{heroLabel}</Text>
              </View>

              {/* Sub-statistics Grid */}
              <Text style={styles.modalSectionTitle}>Mesures Clés</Text>
              <View style={styles.kpiSubGrid}>
                {subStats.map((stat, idx) => (
                  <View key={idx} style={styles.kpiSubBox}>
                    <Text style={styles.kpiSubBoxLabel}>{stat.label}</Text>
                    <Text style={[styles.kpiSubBoxVal, { color: theme.primary }]}>{stat.val}</Text>
                  </View>
                ))}
              </View>

              {/* Related Detail List */}
              <Text style={styles.modalSectionTitle}>{listTitle}</Text>
              {listItems.length === 0 ? (
                <Text style={styles.emptyDetailsText}>Aucune donnée disponible</Text>
              ) : (
                listItems.map((o) => {
                  const status = getStatusColor(o.statut);
                  return (
                    <TouchableOpacity
                      key={o.id}
                      onPress={() => {
                        setActiveKpiDetail(null);
                        handleOrderPress(o);
                      }}
                      style={styles.detailsOrderRowClickable}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailsClientName}>{getCustomerName(o.customer_id)}</Text>
                        <Text style={styles.detailsTicketNo}>Ticket #{getDisplayTicketId(o)}</Text>
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
    );
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
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
        {/* ADVANCED KPI CAROUSEL */}
        {(!currentUser || currentUser.role !== 'agent_lavage_repassage') && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.kpiContainer}
          >
            {/* KPI 1: Chiffre d'Affaires Mensuel */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveKpiDetail('ca_mensuel')}>
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 250 }}
                style={[styles.kpiCard, { backgroundColor: '#e0e7ff' }]}
              >
                <View style={styles.kpiHeader}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(0, 44, 247, 0.05)' }]}>
                    <TrendingUp size={15} color="#002cf7" />
                  </View>
                  <Text style={styles.kpiGrowthText}>+12.4%</Text>
                </View>
                <Text style={styles.kpiLabel}>CA Mensuel</Text>
                <Text style={styles.kpiValue}>{formatPrice(monthlyRevenue)}</Text>
                <Text style={styles.kpiSub}>Mois en cours</Text>
              </MotiView>
            </TouchableOpacity>

            {/* KPI 2: Panier Moyen */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveKpiDetail('panier_moyen')}>
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 250, delay: 50 }}
                style={[styles.kpiCard, { backgroundColor: '#f3e8ff' }]}
              >
                <View style={styles.kpiHeader}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.05)' }]}>
                    <ShoppingBag size={15} color="#a855f7" />
                  </View>
                  <Text style={[styles.kpiGrowthText, { color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.05)' }]}>Panier</Text>
                </View>
                <Text style={styles.kpiLabel}>Panier Moyen</Text>
                <Text style={styles.kpiValue}>{formatPrice(averageBasket)}</Text>
                <Text style={styles.kpiSub}>Par commande</Text>
              </MotiView>
            </TouchableOpacity>

            {/* KPI 3: Taux d'Encaissement */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveKpiDetail('recouvrement')}>
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 250, delay: 100 }}
                style={[styles.kpiCard, { backgroundColor: '#d1fae5' }]}
              >
                <View style={styles.kpiHeader}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                    <Percent size={15} color="#10b981" />
                  </View>
                  <Text style={[styles.kpiGrowthText, { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>{recoveryRate}%</Text>
                </View>
                <Text style={styles.kpiLabel}>Recouvrement</Text>
                <Text style={styles.kpiValue}>{recoveryRate}% Encaissé</Text>
                <Text style={styles.kpiSub}>Sur volume total</Text>
              </MotiView>
            </TouchableOpacity>

            {/* KPI 4: Ratio Urgences */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveKpiDetail('part_express')}>
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 250, delay: 150 }}
                style={[styles.kpiCard, { backgroundColor: '#fee2e2' }]}
              >
                <View style={styles.kpiHeader}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                    <Clock size={15} color="#ef4444" />
                  </View>
                  <Text style={[styles.kpiGrowthText, { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>Express</Text>
                </View>
                <Text style={styles.kpiLabel}>Part Express</Text>
                <Text style={styles.kpiValue}>{expressRate}% Ratio</Text>
                <Text style={styles.kpiSub}>{expressOrdersCount} commandes</Text>
              </MotiView>
            </TouchableOpacity>
          </ScrollView>
        )}

        {(!currentUser || currentUser.role !== 'agent_lavage_repassage') && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setActiveKpiDetail('ca_jour')}
            style={{ width: '100%' }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
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

              {/* Premium Batonnet (Bar Chart) of Last 7 Days */}
              <View style={styles.barChartContainer}>
                {last7DaysData.map((d, index) => {
                  const barHeight = maxRevenue > 0 ? (d.revenue / maxRevenue) * 45 : 3;
                  const barWidth = 12;
                  
                  return (
                    <View key={index} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        <Svg height="55" width="20" style={{ alignSelf: 'center' }}>
                          {/* Background track bar */}
                          <Rect
                            x="4"
                            y="5"
                            width={barWidth}
                            height="45"
                            rx="6"
                            fill="rgba(9, 9, 11, 0.03)"
                          />
                          {/* Colored bar */}
                          <Rect
                            x="4"
                            y={50 - barHeight}
                            width={barWidth}
                            height={barHeight}
                            rx="6"
                            fill={d.isToday ? '#002cf7' : 'rgba(0, 44, 247, 0.35)'}
                          />
                        </Svg>
                      </View>
                      <Text style={[styles.barDayText, d.isToday && styles.barDayTextActive]}>
                        {d.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </MotiView>
          </TouchableOpacity>
        )}

        {/* 2X2 GRID STATS */}
        <View style={styles.gridRow}>
          {/* Card 1: En Cours (Pastel Blue) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveKpiDetail('en_cours')}
            style={{ flex: 1 }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: 40 }}
              style={[styles.gridCard, styles.gridCardPastelBlue]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(3, 105, 161, 0.06)' }]}>
                  <Layers size={14} color="#0369a1" />
                </View>
                <Text style={[styles.gridCardLabel, { color: '#0369a1' }]}>En cours</Text>
              </View>
              <Text style={[styles.gridCardValue, { color: '#0369a1' }]}>{activeOrders.length}</Text>
              <Text style={[styles.gridCardSub, { color: '#0284c7' }]}>Lavage & Repassage</Text>
            </MotiView>
          </TouchableOpacity>

          {/* Card 2: Prêtes (Pastel Green) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveKpiDetail('pretes')}
            style={{ flex: 1 }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: 80 }}
              style={[styles.gridCard, styles.gridCardPastelGreen]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(21, 128, 61, 0.06)' }]}>
                  <CheckCircle2 size={14} color="#15803d" />
                </View>
                <Text style={[styles.gridCardLabel, { color: '#15803d' }]}>Commandes Prêtes</Text>
              </View>
              <Text style={[styles.gridCardValue, { color: '#15803d' }]}>{readyOrders.length}</Text>
              <Text style={[styles.gridCardSub, { color: '#16a34a' }]}>À récupérer</Text>
            </MotiView>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          {/* Card 3: Retards/Urgences (Pastel Red) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveKpiDetail('retards')}
            style={{ flex: 1 }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: 120 }}
              style={[styles.gridCard, styles.gridCardPastelRed]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(190, 18, 60, 0.06)' }]}>
                  <AlertTriangle size={14} color="#be123c" />
                </View>
                <Text style={[styles.gridCardLabel, { color: '#be123c' }]}>Retards / Urgences</Text>
              </View>
              <Text style={[styles.gridCardValue, { color: '#be123c' }]}>{lateOrders.length}</Text>
              <Text style={[styles.gridCardSub, { color: '#e11d48' }]}>Livraison alerte</Text>
            </MotiView>
          </TouchableOpacity>

          {/* Card 4: Volume (Pastel Slate) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveKpiDetail('volume_jour')}
            style={{ flex: 1 }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: 160 }}
              style={[styles.gridCard, styles.gridCardPastelSlate]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(51, 65, 85, 0.06)' }]}>
                  <RefreshCw size={14} color="#334155" />
                </View>
                <Text style={[styles.gridCardLabel, { color: '#334155' }]}>Commandes du Jour</Text>
              </View>
              <Text style={[styles.gridCardValue, { color: '#334155' }]}>{todayOrders.length}</Text>
              <Text style={[styles.gridCardSub, { color: '#475569' }]}>Flux quotidien</Text>
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
                      <Text style={styles.orderNumber}>Ticket #{getDisplayTicketId(item)}</Text>
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

      {renderKpiDetails()}
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
    fontWeight: '700',
    color: '#09090b',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  subHeadline: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
    marginTop: 4,
  },
  boldText: {
    color: '#09090b',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
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
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.035,
    shadowRadius: 24,
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
    color: '#1e40af',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spendValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e3a8a',
    marginTop: 4,
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  spendTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 64, 175, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spendTrendText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  chartContainer: {
    marginTop: 10,
    position: 'relative',
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
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.025,
    shadowRadius: 16,
    elevation: 2,
  },
  gridCardPastelBlue: {
    backgroundColor: '#e0f2fe',
    borderColor: '#ffffff',
  },
  gridCardPastelGreen: {
    backgroundColor: '#dcfce7',
    borderColor: '#ffffff',
  },
  gridCardPastelRed: {
    backgroundColor: '#ffe4e6',
    borderColor: '#ffffff',
  },
  gridCardPastelSlate: {
    backgroundColor: '#f1f5f9',
    borderColor: '#ffffff',
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
    color: '#64748b',
    fontWeight: '600',
  },
  gridCardLabelBlue: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  gridCardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#09090b',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  gridCardValueBlue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  gridCardSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
  },
  gridCardSubBlue: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 4,
  },
  // Custom svg bar chart styles
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 55,
    justifyContent: 'flex-end',
  },
  barDayText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  barDayTextActive: {
    color: '#002cf7',
    fontWeight: '700',
  },
  // Advanced KPIs styling
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  seeAllLink: {
    fontSize: 12,
    color: '#002cf7',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
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
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.025,
    shadowRadius: 16,
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
    fontWeight: '500',
    color: '#09090b',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
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
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  orderPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#09090b',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  chevron: {
    position: 'absolute',
    right: -10,
    top: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
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
    fontWeight: '600',
    color: '#002cf7',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
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
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 12,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
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
    fontWeight: '500',
    color: '#09090b',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  detailsTicketNo: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  detailsPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#09090b',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  emptyDetailsText: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Advanced KPIs styling
  kpiContainer: {
    paddingLeft: 0,
    paddingRight: 8,
    paddingVertical: 10,
    gap: 12,
    marginBottom: 8,
  },
  kpiCard: {
    width: 145,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiGrowthText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#002cf7',
    backgroundColor: 'rgba(0, 44, 247, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kpiLabel: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#09090b',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 9,
    color: '#a1a1aa',
    fontWeight: '500',
    marginTop: 2,
  },
  // KPI Details Popup layout styles
  kpiHeroCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  kpiHeroValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  kpiHeroLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.85,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  kpiSubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiSubBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
  },
  kpiSubBoxLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kpiSubBoxVal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
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
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
});
