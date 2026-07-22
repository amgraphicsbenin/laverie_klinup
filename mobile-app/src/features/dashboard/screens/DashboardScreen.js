import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, BackHandler, RefreshControl } from 'react-native';
import { TrendingUp, TrendingDown, RefreshCw, Layers, CheckCircle2, AlertTriangle, ChevronRight, X, Percent, ShoppingBag, Clock, User, Bell, Calendar, Check } from 'lucide-react-native';
import { db } from '../../../services/db';
import { MotiView } from '../../../components/SafeView';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import SafeBlurView from '../../../components/SafeBlurView';
const BlurView = SafeBlurView;
import { useScrollPaddingBottom, useTabBarHeight } from '../../../hooks/useTabBarHeight';
import { useDbState } from '../../../hooks/useDbState';
import ClientDetailModal from '../../../components/ClientDetailModal';
import NotificationModal from '../../../components/NotificationModal';

export default function DashboardScreen({ onNavigate, setSelectedOrder, setGestionFilter, onModalStateChange, closeAllModalsTrigger, onSelectClient, onShowSuccess }) {
  const { orders, customers, notifications, currentUser, isDarkMode } = useDbState();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState('today'); // 'today' | 'week' | 'month' | 'year'
  const [periodPickerVisible, setPeriodPickerVisible] = useState(false);

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

  const scrollPaddingBottom = useScrollPaddingBottom();
  const tabBarHeight = useTabBarHeight();
  const styles = getStyles(isDarkMode);

  // State for active KPI details modal
  const [activeKpiDetail, setActiveKpiDetail] = useState(null);
  const [localKpiDetail, setLocalKpiDetail] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Close KPI details when trigger increments
  React.useEffect(() => {
    if (closeAllModalsTrigger > 0) {
      setActiveKpiDetail(null);
    }
  }, [closeAllModalsTrigger]);

  React.useEffect(() => {
    if (activeKpiDetail) {
      setLocalKpiDetail(activeKpiDetail);
    }
  }, [activeKpiDetail]);

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
  const activeOrders = orders.filter(o => o.statut !== 'livre' && o.statut !== 'restitue' && o.statut !== 'annule');
  const readyOrders = orders.filter(o => o.statut === 'pret' || o.statut === 'a_recuperer' || o.statut === 'a_livrer');
  
  // Calculate revenue of the day
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.created_at?.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

  // Cash vs Mobile Money for today's orders
  const todayEspèces = todayOrders.filter(o => o.mode_reglement === 'Espèce' || o.mode_reglement === 'Espèces' || o.mode_reglement === 'Cash').reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
  const todayMobileMoney = todayOrders.filter(o => o.mode_reglement === 'Mobile Money' || o.mode_reglement === 'Mobile money' || o.mode_reglement === 'Momo').reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

  // Advanced KPIs
  // Monthly Revenue (current month)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthlyOrders = orders.filter(o => o.created_at?.startsWith(currentMonthStr));
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

  // Late orders (active orders only)
  const lateOrders = orders.filter(o => o.statut !== 'restitue' && o.statut !== 'livre' && o.statut !== 'annule' && (o.est_en_retard || o.statut === 'retard' || (o.due_date && new Date(o.due_date) < new Date())));

  // Dynamic Revenue calculation based on selected period
  const getRevenuePeriodData = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const todayOrders = orders.filter(o => o.created_at?.startsWith(todayStr));
    const todayRev = todayOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

    if (revenuePeriod === 'today') {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const chart = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayOrders = orders.filter(o => o.created_at?.startsWith(dStr));
        const rev = dayOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
        chart.push({ label: days[d.getDay()], revenue: rev, isActive: i === 0 });
      }

      const yDate = new Date();
      yDate.setDate(yDate.getDate() - 1);
      const yStr = yDate.toISOString().split('T')[0];
      const yOrders = orders.filter(o => o.created_at?.startsWith(yStr));
      const yRev = yOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

      const growth = yRev > 0 ? Math.round(((todayRev - yRev) / yRev) * 100) : (todayRev > 0 ? 100 : 0);

      return {
        label: "Aujourd'hui",
        totalRevenue: todayRev,
        growthText: `${growth >= 0 ? '+' : ''}${growth}% (évolution jour)`,
        isPositive: growth >= 0,
        chartData: chart,
      };
    }

    if (revenuePeriod === 'week') {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const chart = [];
      let total = 0;
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayOrders = orders.filter(o => o.created_at?.startsWith(dStr));
        const rev = dayOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
        total += rev;
        chart.push({ label: days[d.getDay()], revenue: rev, isActive: i === 0 });
      }

      let prevTotal = 0;
      for (let i = 13; i >= 7; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayOrders = orders.filter(o => o.created_at?.startsWith(dStr));
        prevTotal += dayOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
      }
      const growth = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : (total > 0 ? 100 : 0);

      return {
        label: "Cette Semaine",
        totalRevenue: total,
        growthText: `${growth >= 0 ? '+' : ''}${growth}% (vs sem. passée)`,
        isPositive: growth >= 0,
        chartData: chart,
      };
    }

    if (revenuePeriod === 'month') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const monthOrders = orders.filter(o => {
        if (!o.created_at) return false;
        const d = new Date(o.created_at);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
      const total = monthOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

      const chart = [
        { label: 'Sem 1', revenue: 0, isActive: false },
        { label: 'Sem 2', revenue: 0, isActive: false },
        { label: 'Sem 3', revenue: 0, isActive: false },
        { label: 'Sem 4', revenue: 0, isActive: false },
      ];

      monthOrders.forEach(o => {
        const dateNum = new Date(o.created_at).getDate();
        const amt = o.prix_total || o.total || 0;
        if (dateNum <= 7) chart[0].revenue += amt;
        else if (dateNum <= 14) chart[1].revenue += amt;
        else if (dateNum <= 21) chart[2].revenue += amt;
        else chart[3].revenue += amt;
      });

      const currentDay = today.getDate();
      if (currentDay <= 7) chart[0].isActive = true;
      else if (currentDay <= 14) chart[1].isActive = true;
      else if (currentDay <= 21) chart[2].isActive = true;
      else chart[3].isActive = true;

      const prevMonthOrders = orders.filter(o => {
        if (!o.created_at) return false;
        const d = new Date(o.created_at);
        const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
        return d.getFullYear() === prevY && d.getMonth() === prevM;
      });
      const prevTotal = prevMonthOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
      const growth = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : (total > 0 ? 100 : 0);

      return {
        label: "Ce Mois",
        totalRevenue: total,
        growthText: `${growth >= 0 ? '+' : ''}${growth}% (vs mois passé)`,
        isPositive: growth >= 0,
        chartData: chart,
      };
    }

    if (revenuePeriod === 'year') {
      const currentYear = today.getFullYear();
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const chart = months.map((m, idx) => ({ label: m, revenue: 0, isActive: idx === today.getMonth() }));

      let total = 0;
      orders.forEach(o => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        if (d.getFullYear() === currentYear) {
          const amt = o.prix_total || o.total || 0;
          chart[d.getMonth()].revenue += amt;
          total += amt;
        }
      });

      let prevTotal = 0;
      orders.forEach(o => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        if (d.getFullYear() === currentYear - 1) {
          prevTotal += (o.prix_total || o.total || 0);
        }
      });
      const growth = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : (total > 0 ? 100 : 0);

      return {
        label: "Cette Année",
        totalRevenue: total,
        growthText: `${growth >= 0 ? '+' : ''}${growth}% (vs an passé)`,
        isPositive: growth >= 0,
        chartData: chart,
      };
    }

    return { label: "Aujourd'hui", totalRevenue: 0, growthText: "0%", isPositive: true, chartData: [] };
  };

  const revenuePeriodData = getRevenuePeriodData();

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

  const formatPrice = (price) => {
    if (currentUser && (currentUser.role === 'livreur' || currentUser.role === 'agent_lavage_repassage')) {
      return '******';
    }
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
    ca_mensuel: { primary: '#6366f1', bg: isDarkMode ? '#1e1b4b' : '#e0e7ff', text: isDarkMode ? '#e0e7ff' : '#1e1b4b', title: 'Chiffre d\'Affaires Mensuel' },
    panier_moyen: { primary: '#c084fc', bg: isDarkMode ? '#3b0764' : '#f3e8ff', text: isDarkMode ? '#f3e8ff' : '#3b0764', title: 'Panier Moyen' },
    recouvrement: { primary: '#34d399', bg: isDarkMode ? '#064e3b' : '#d1fae5', text: isDarkMode ? '#d1fae5' : '#064e3b', title: 'Taux de Recouvrement' },
    part_express: { primary: '#f87171', bg: isDarkMode ? '#7f1d1d' : '#fee2e2', text: isDarkMode ? '#fee2e2' : '#7f1d1d', title: 'Part Express' },
    en_cours: { primary: '#38bdf8', bg: isDarkMode ? '#0c4a6e' : '#e0f2fe', text: isDarkMode ? '#e0f2fe' : '#0c4a6e', title: 'Commandes En Cours' },
    pretes: { primary: '#4ade80', bg: isDarkMode ? '#064e3b' : '#dcfce7', text: isDarkMode ? '#dcfce7' : '#064e3b', title: 'Commandes Prêtes' },
    retards: { primary: '#fb7185', bg: isDarkMode ? '#4c0519' : '#ffe4e6', text: isDarkMode ? '#ffe4e6' : '#4c0519', title: 'Retards & Urgences' },
    ca_jour: { primary: '#60a5fa', bg: isDarkMode ? '#1e3a8a' : '#eff6ff', text: isDarkMode ? '#eff6ff' : '#1e3a8a', title: 'CA Journalier' },
    volume_jour: { primary: '#94a3b8', bg: isDarkMode ? '#1e293b' : '#f1f5f9', text: isDarkMode ? '#f8fafc' : '#0f172a', title: 'Commandes du Jour' },
  };

  const renderKpiDetails = () => {
    const kpiToRender = activeKpiDetail || localKpiDetail;
    if (!kpiToRender) return null;
    const theme = kpiThemes[kpiToRender];
    const isVisible = activeKpiDetail !== null;
    
    let heroValue = '';
    let heroLabel = '';
    let subStats = [];
    let listTitle = '';
    let listItems = [];
    
    switch (kpiToRender) {
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
        
      case 'panier_moyen': {
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
      }
        
      case 'recouvrement': {
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
      }
        
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
        
      case 'pretes': {
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
      }
        
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
        listItems = [...lateOrders, ...activeOrders.filter(o => o.niveau_urgence === 'Express' && !lateOrders.some(l => l.id === o.id))].slice(0, 8);
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
      <MotiView
        pointerEvents={isVisible ? 'auto' : 'none'}
        animate={{
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: 'timing', duration: 250 }}
        style={[
          StyleSheet.absoluteFill,
          { 
            zIndex: 9999,
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
          }
        ]}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={StyleSheet.absoluteFill} 
          onPress={() => setActiveKpiDetail(null)}
        >
          <BlurView tint={isDarkMode ? "dark" : "light"} intensity={85} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        <MotiView
          animate={{
            opacity: isVisible ? 1 : 0,
            scale: isVisible ? 1 : 0.9,
            translateY: isVisible ? 0 : 50
          }}
          transition={{ type: 'spring', damping: 18, mass: 0.8 }}
          style={styles.premiumModalContent}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <View style={[styles.themeDot, { backgroundColor: theme.primary }]} />
              <Text style={styles.premiumModalTitle}>{theme.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveKpiDetail(null)} style={styles.premiumCloseBtn}>
              <X size={16} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ flexShrink: 1, width: '100%' }}
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Hero Banner Section with glass texture */}
            <View style={[styles.premiumKpiHeroCard, { backgroundColor: theme.bg, borderColor: 'rgba(255, 255, 255, 0.9)' }]}>
              <Text style={[styles.premiumKpiHeroValue, { color: theme.primary }]}>{heroValue}</Text>
              <Text style={styles.premiumKpiHeroLabel}>{heroLabel}</Text>
            </View>

            {/* Sub-statistics Grid */}
            <Text style={styles.premiumModalSectionTitle}>Mesures Clés</Text>
            <View style={styles.kpiSubGrid}>
              {subStats.map((stat) => (
                <View key={stat.label} style={styles.premiumKpiSubBox}>
                  <Text style={styles.kpiSubBoxLabel}>{stat.label}</Text>
                  <Text style={[styles.premiumKpiSubBoxVal, { color: theme.primary }]}>{stat.val}</Text>
                </View>
              ))}
            </View>

            {/* Related Detail List */}
            <Text style={styles.premiumModalSectionTitle}>{listTitle}</Text>
            <View style={styles.detailsListContainer}>
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
                      style={styles.premiumDetailsOrderRowClickable}
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
            </View>
          </ScrollView>
        </MotiView>
      </MotiView>
    );
  };


  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {currentUser ? `Salut ${currentUser.prenom}` : 'Salut'}
          </Text>
        </View>

        {/* NOTIFICATION BUTTON */}
        <TouchableOpacity
          onPress={() => setNotificationModalVisible(true)}
          style={[styles.notificationBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}
          activeOpacity={0.8}
        >
          <Bell size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
          {(notifications || []).filter(n => !n.read).length > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {(notifications || []).filter(n => !n.read).length > 9 ? '9+' : (notifications || []).filter(n => !n.read).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
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
      >
        {/* ADVANCED KPI CAROUSEL */}
        <ScrollView 
            horizontal 
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false} 
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={styles.kpiContainer}
            onTouchStart={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
            onMouseDown={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
          >
            {/* KPI 1: CA Mensuel (Inspiré Card 1 & 8) */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => setActiveKpiDetail('ca_mensuel')} style={{ borderRadius: 24, overflow: 'hidden' }}>
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 150 }}
                style={styles.newKpiCard}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.newCardTitle}>CA Mensuel</Text>
                  <View style={styles.purpleBadge}>
                    <Text style={styles.purpleBadgeText}>Mois</Text>
                  </View>
                </View>
                <Text style={styles.newCardSub}>Mois en cours</Text>
                
                <Text style={styles.newCardBigValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{formatPrice(monthlyRevenue)}</Text>
                
                <View style={styles.greenPillBadge}>
                  <TrendingUp size={12} color="#10b981" style={{ marginRight: 3 }} />
                  <Text style={styles.greenPillText}>+12.4% ce mois</Text>
                </View>
              </MotiView>
            </TouchableOpacity>

            {/* KPI 2: Panier Moyen (Inspiré Card 5 avec mini bâtonnets) */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => setActiveKpiDetail('panier_moyen')} style={{ borderRadius: 24, overflow: 'hidden' }}>
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 150, delay: 30 }}
                style={styles.newKpiCard}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.newCardTitle}>Panier Moyen</Text>
                </View>
                <Text style={styles.newCardBigValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{formatPrice(averageBasket)}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 26, marginVertical: 4 }}>
                  <View style={{ flex: 1, height: '40%', backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 44, 247, 0.18)', borderRadius: 4 }} />
                  <View style={{ flex: 1, height: '65%', backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 44, 247, 0.18)', borderRadius: 4 }} />
                  <View style={{ flex: 1, height: '45%', backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 44, 247, 0.18)', borderRadius: 4 }} />
                  <View style={{ flex: 1, height: '90%', backgroundColor: '#002cf7', borderRadius: 4 }} />
                </View>

                <Text style={styles.newCardSub}>Par commande</Text>
              </MotiView>
            </TouchableOpacity>

            {/* KPI 3: Recouvrement (Inspiré Card 3 anneau de progression) */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => setActiveKpiDetail('recouvrement')} style={{ borderRadius: 24, overflow: 'hidden' }}>
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 150, delay: 60 }}
                style={styles.newKpiCard}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.newCardBigValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{recoveryRate || 0}%</Text>
                    <Text style={styles.newCardSub}>Recouvrement</Text>
                  </View>

                  <Svg height="44" width="44" viewBox="0 0 36 36">
                    <Circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke={isDarkMode ? '#334155' : '#f1f5f9'}
                      strokeWidth="3.8"
                    />
                    <Circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="#002cf7"
                      strokeWidth="3.8"
                      strokeDasharray={`${Math.min(100, Math.max(0, recoveryRate || 0))} 100`}
                      strokeDashoffset="25"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>

                <Text style={[styles.newCardSub, { marginTop: 6 }]}>Volume total encaissé</Text>
              </MotiView>
            </TouchableOpacity>

            {/* KPI 4: Part Express (Inspiré Card 7 jauges de progression) */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => setActiveKpiDetail('part_express')} style={{ borderRadius: 24, overflow: 'hidden' }}>
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 150, delay: 90 }}
                style={styles.newKpiCard}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.newCardTitle}>Part Express</Text>
                </View>
                <Text style={styles.newCardSub}>{expressOrdersCount} commandes urgentes</Text>

                <View style={{ marginVertical: 6, gap: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569' }}>Express</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#002cf7' }}>{expressRate}%</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(100, expressRate)}%`, height: '100%', backgroundColor: '#002cf7', borderRadius: 3 }} />
                  </View>
                </View>
              </MotiView>
            </TouchableOpacity>
          </ScrollView>

          {/* CARTE CHIFFRE D'AFFAIRES DYNAMIQUE AVEC FILTRE */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setActiveKpiDetail('ca_jour')}
            style={{ width: '100%', borderRadius: 24, overflow: 'hidden' }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 150 }}
              style={styles.newMainCard}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.newCardTitle}>Chiffre d'Affaires</Text>
                <TouchableOpacity
                  onPress={(e) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    setPeriodPickerVisible(true);
                  }}
                  activeOpacity={0.8}
                  style={styles.filterPill}
                >
                  <Text style={styles.filterPillText}>{revenuePeriodData.label} ▾</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.newMainBigValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatPrice(revenuePeriodData.totalRevenue)}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={[styles.greenPillBadge, !revenuePeriodData.isPositive && { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  {revenuePeriodData.isPositive ? (
                    <TrendingUp size={12} color="#10b981" style={{ marginRight: 3 }} />
                  ) : (
                    <TrendingDown size={12} color="#ef4444" style={{ marginRight: 3 }} />
                  )}
                  <Text style={[styles.greenPillText, !revenuePeriodData.isPositive && { color: '#ef4444' }]}>
                    {revenuePeriodData.growthText}
                  </Text>
                </View>
              </View>

              {/* Dynamic Bar Chart matching selected period */}
              <View style={styles.barChartContainer}>
                {revenuePeriodData.chartData.map((d, index) => {
                  const maxVal = Math.max(...revenuePeriodData.chartData.map(c => c.revenue), 1000);
                  const barHeight = maxVal > 0 ? (d.revenue / maxVal) * 45 : 3;
                  const barWidth = revenuePeriodData.chartData.length > 7 ? 10 : 12;

                  return (
                    <View key={`${d.label}-${index}`} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        <Svg height="55" width={barWidth + 8} style={{ alignSelf: 'center' }}>
                          <Rect
                            x="4"
                            y="5"
                            width={barWidth}
                            height="45"
                            rx="5"
                            fill={isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(9, 9, 11, 0.04)'}
                          />
                          <Rect
                            x="4"
                            y={50 - barHeight}
                            width={barWidth}
                            height={barHeight}
                            rx="5"
                            fill={d.isActive ? '#002cf7' : (isDarkMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(0, 44, 247, 0.35)')}
                          />
                        </Svg>
                      </View>
                      <Text style={[styles.barDayText, d.isActive && styles.barDayTextActive]} numberOfLines={1}>
                        {d.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </MotiView>
          </TouchableOpacity>

        {/* 2X2 GRID STATS (DESIGN FIRST MODEL WITH ICON-MATCHED BACKGROUNDS) */}
        <View style={styles.gridRow}>
          {/* Card 1: En Cours (Fond Bleu) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveKpiDetail('en_cours')}
            style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 150, delay: 15 }}
              style={[
                styles.newGridCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#f0f9ff',
                  borderColor: isDarkMode ? 'rgba(2, 132, 199, 0.3)' : '#e0f2fe',
                }
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.newGridIconWrap, { backgroundColor: isDarkMode ? 'rgba(2, 132, 199, 0.3)' : '#ffffff' }]}>
                  <Layers size={15} color="#0284c7" />
                </View>
                <Text style={[styles.newCardTitle, { color: isDarkMode ? '#7dd3fc' : '#0369a1' }]}>En cours</Text>
              </View>
              <Text style={[styles.newCardBigValue, { color: isDarkMode ? '#ffffff' : '#0369a1' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{activeOrders.length}</Text>
              <Text style={[styles.newCardSub, { color: isDarkMode ? '#38bdf8' : '#0284c7' }]}>Lavage & Repassage</Text>
            </MotiView>
          </TouchableOpacity>

          {/* Card 2: Commandes Prêtes (Fond Vert) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveKpiDetail('pretes')}
            style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 150, delay: 30 }}
              style={[
                styles.newGridCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5',
                  borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#d1fae5',
                }
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.newGridIconWrap, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#ffffff' }]}>
                  <CheckCircle2 size={15} color="#10b981" />
                </View>
                <Text style={[styles.newCardTitle, { color: isDarkMode ? '#6ee7b7' : '#047857' }]}>Prêtes</Text>
              </View>
              <Text style={[styles.newCardBigValue, { color: isDarkMode ? '#ffffff' : '#047857' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{readyOrders.length}</Text>
              <Text style={[styles.newCardSub, { color: isDarkMode ? '#34d399' : '#10b981' }]}>À récupérer</Text>
            </MotiView>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          {/* Card 3: Retards / Urgences (Fond Rouge) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveKpiDetail('retards')}
            style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 150, delay: 45 }}
              style={[
                styles.newGridCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.16)' : '#fef2f2',
                  borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#ffe4e6',
                }
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.newGridIconWrap, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#ffffff' }]}>
                  <AlertTriangle size={15} color="#ef4444" />
                </View>
                <Text style={[styles.newCardTitle, { color: isDarkMode ? '#fca5a5' : '#b91c1c' }]}>Retards</Text>
              </View>
              <Text style={[styles.newCardBigValue, { color: isDarkMode ? '#f87171' : '#dc2626' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {lateOrders.length}
              </Text>
              <Text style={[styles.newCardSub, { color: isDarkMode ? '#fca5a5' : '#ef4444' }]}>Livraison alerte</Text>
            </MotiView>
          </TouchableOpacity>

          {/* Card 4: Commandes du Jour (Fond Indigo/Violet) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveKpiDetail('volume_jour')}
            style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 150, delay: 60 }}
              style={[
                styles.newGridCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.16)' : '#eef2ff',
                  borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#e0e7ff',
                }
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.newGridIconWrap, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#ffffff' }]}>
                  <RefreshCw size={15} color="#6366f1" />
                </View>
                <Text style={[styles.newCardTitle, { color: isDarkMode ? '#a5b4fc' : '#4338ca' }]}>Du jour</Text>
              </View>
              <Text style={[styles.newCardBigValue, { color: isDarkMode ? '#ffffff' : '#4338ca' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{todayOrders.length}</Text>
              <Text style={[styles.newCardSub, { color: isDarkMode ? '#818cf8' : '#6366f1' }]}>Flux quotidien</Text>
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
            const clientObj = customers.find(c => c.id === item.customer_id);
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
                      <TouchableOpacity
                        onPress={(e) => {
                          if (e && e.stopPropagation) e.stopPropagation();
                          if (clientObj) setSelectedClient(clientObj);
                        }}
                        activeOpacity={0.8}
                        style={styles.clientPillBtn}
                      >
                        <User size={12} color={isDarkMode ? '#38bdf8' : '#002cf7'} style={{ marginRight: 4 }} />
                        <Text style={styles.clientPillBtnText}>{getCustomerName(item.customer_id)}</Text>
                      </TouchableOpacity>
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
      <ClientDetailModal
        visible={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onShowSuccess={onShowSuccess}
      />
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        notifications={notifications}
        isDarkMode={isDarkMode}
      />
      {periodPickerVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 99999, justifyContent: 'center', alignItems: 'center' }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => setPeriodPickerVisible(false)}
          >
            <SafeBlurView intensity={80} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          </TouchableOpacity>

          <MotiView
            from={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 150 }}
            style={[
              styles.periodPickerCard,
              { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }
            ]}
          >
            <View style={[styles.periodPickerHeader, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="#002cf7" />
                <Text style={[styles.periodPickerTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                  Période du Chiffre d'Affaires
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPeriodPickerVisible(false)}>
                <X size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 8 }}>
              {[
                { key: 'today', label: "Aujourd'hui", sub: "Journée en cours" },
                { key: 'week', label: "Cette Semaine", sub: "7 derniers jours glissants" },
                { key: 'month', label: "Ce Mois", sub: "Mois civil en cours" },
                { key: 'year', label: "Cette Année", sub: "12 mois de l'année en cours" },
              ].map(opt => {
                const isSelected = revenuePeriod === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.7}
                    onPress={() => {
                      setRevenuePeriod(opt.key);
                      setPeriodPickerVisible(false);
                    }}
                    style={[
                      styles.periodOptionRow,
                      {
                        backgroundColor: isSelected
                          ? (isDarkMode ? 'rgba(0, 44, 247, 0.2)' : '#eff6ff')
                          : 'transparent',
                        borderColor: isSelected ? '#002cf7' : 'transparent',
                      }
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.periodOptionLabel,
                        { color: isSelected ? '#002cf7' : (isDarkMode ? '#ffffff' : '#0f172a') }
                      ]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.periodOptionSub, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                        {opt.sub}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color="#002cf7" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </MotiView>
        </View>
      )}
    </View>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#09090b',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
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
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
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
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spendValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#09090b',
    marginTop: 4,
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  spendTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spendTrendText: {
    fontSize: 10,
    color: '#475569',
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
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
  gridCardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#09090b',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  gridCardSub: {
    fontSize: 10,
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
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
  clientPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.08)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  clientPillBtnText: {
    color: '#002cf7',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caTotalSection: {
    backgroundColor: '#f1f5f9',
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
    borderBottomColor: '#f1f5f9',
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
    borderBottomColor: '#f1f5f9',
  },
  detailsOrderRowClickable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
    marginBottom: 8,
  },
  newKpiCard: {
    width: 175,
    height: 138,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  newMainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  newGridCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 2,
    justifyContent: 'space-between',
    height: 118,
    overflow: 'hidden',
  },
  newGridIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  newCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  newCardSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
  },
  newCardBigValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
  },
  newMainBigValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
  },
  purpleBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  purpleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5',
  },
  greenPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  greenPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  filterPill: {
    backgroundColor: 'rgba(0, 44, 247, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.18)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002cf7',
  },
  periodPickerCard: {
    width: '85%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  periodPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  periodPickerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  periodOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 3,
  },
  periodOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodOptionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  kpiCard: {
    width: 145,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
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
  premiumModalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    padding: 24,
    width: '92%',
    maxWidth: 385,
    maxHeight: '82%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  premiumModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  premiumCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumKpiHeroCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  premiumKpiHeroValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  premiumKpiHeroLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    color: '#64748b',
  },
  premiumModalSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  premiumKpiSubBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 12,
  },
  premiumKpiSubBoxVal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  detailsListContainer: {
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  premiumDetailsOrderRowClickable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
});

function getStyles(isDarkMode) {
  if (!isDarkMode) return baseStyles;
  
  const overrides = {
    container: { backgroundColor: '#0f172a' },
    header: { backgroundColor: '#0f172a' },
    headerTitle: { color: '#ffffff' },
    subHeadline: { color: '#94a3b8' },
    boldText: { color: '#ffffff' },
    circleButtonBlack: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 },
    kpiCard: { borderColor: '#334155', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 5 },
    newKpiCard: { backgroundColor: '#1e293b', borderColor: '#334155', shadowOpacity: 0.2 },
    newMainCard: { backgroundColor: '#1e293b', borderColor: '#334155', shadowOpacity: 0.2 },
    newGridCard: { backgroundColor: '#1e293b', borderColor: '#334155', shadowOpacity: 0.2 },
    newCardTitle: { color: '#cbd5e1' },
    newCardSub: { color: '#64748b' },
    newCardBigValue: { color: '#ffffff' },
    newMainBigValue: { color: '#ffffff' },
    purpleBadge: { backgroundColor: 'rgba(99, 102, 241, 0.2)' },
    purpleBadgeText: { color: '#818cf8' },
    greenPillBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
    filterPill: { backgroundColor: '#334155' },
    filterPillText: { color: '#cbd5e1' },
    kpiLabel: { color: '#cbd5e1' },
    kpiValue: { color: '#ffffff' },
    kpiSub: { color: '#94a3b8' },
    mainSpendCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    spendLabel: { color: '#94a3b8' },
    spendValue: { color: '#ffffff' },
    chartLabel: { color: '#94a3b8' },
    barInactive: { backgroundColor: '#334155' },
    kpiSubCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    kpiSubVal: { color: '#ffffff' },
    kpiSubLbl: { color: '#94a3b8' },
    sectionTitle: { color: '#94a3b8' },
    viewAllText: { color: '#38bdf8' },
    orderCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    clientPillBtn: { backgroundColor: 'rgba(0, 44, 247, 0.15)', borderColor: '#002cf7' },
    clientPillBtnText: { color: '#38bdf8' },
    orderClientName: { color: '#ffffff' },
    orderNumber: { color: '#cbd5e1' },
    orderPrice: { color: '#ffffff' },
    divider: { backgroundColor: '#334155' },
    tabTitle: { color: '#94a3b8' },
    tabTitleActive: { color: '#ffffff' },
    searchContainer: { backgroundColor: '#1e293b', borderColor: '#334155' },
    searchInput: { color: '#ffffff' },
    modalContent: { backgroundColor: '#1e293b', borderColor: '#334155' },
    modalTitle: { color: '#ffffff' },
    modalSubtitle: { color: '#94a3b8' },
    modalLabel: { color: '#e2e8f0' },
    modalInput: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' },
    infoRow: { borderBottomColor: '#334155' },
    infoLabel: { color: '#94a3b8' },
    infoValue: { color: '#ffffff' },
    detailsListContainer: { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: '#334155' },
    premiumDetailsOrderRowClickable: { backgroundColor: '#1e293b', borderColor: '#334155' },
    premiumKpiHeroCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    premiumKpiHeroLabel: { color: '#cbd5e1' },
    premiumKpiSubBox: { backgroundColor: '#0f172a', borderColor: '#334155' },
    premiumKpiSubBoxLbl: { color: '#94a3b8' },
    premiumModalTitle: { color: '#ffffff' },
    emptyStateContainer: { backgroundColor: '#1e293b', borderColor: '#334155' },
    emptyStateText: { color: '#94a3b8' },
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
