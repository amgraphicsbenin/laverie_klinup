import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  BackHandler,
  RefreshControl,
  Animated,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SmoothFlatList as FlatList } from '../../../components/SmoothScroll';
import {
  Search,
  X,
  Package,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react-native';
import { db } from '../../../services/db';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useScrollPaddingBottom } from '../../../hooks/useTabBarHeight';
import ClientsScreen from '../../clients/screens/ClientsScreen';
import { useDbState } from '../../../hooks/useDbState';
import ClientDetailModal from '../../../components/ClientDetailModal';
import { OrderFormModal } from '../../../components/OrderFormModal';
import { sendOrderCreatedWhatsAppNotification } from '../../../utils/phoneUtils';

// Composants modulaires d'ordres
import OrderCard from '../components/OrderCard';
import OrderDetailModal from '../components/OrderDetailModal';
import CancelModal from '../components/CancelModal';
import PaymentModal from '../components/PaymentModal';
import InvoiceModal from '../components/InvoiceModal';
import CustomerCreateEditModal from '../components/CustomerCreateEditModal';

export default function GestionScreen({
  selectedOrder,
  setSelectedOrder,
  gestionFilter,
  setGestionFilter,
  openOrderFormOnMount,
  onCloseOrderFormOnMount,
  orderFormVisible,
  setOrderFormVisible,
  onOpenOrderForm,
  onModalStateChange,
  closeAllModalsTrigger,
  initialSelectedClient,
  onClearInitialSelectedClient,
  onShowSuccess,
  isActive,
  onDisableSwipeChange
}) {
  const { orders, customers, catalog, currentUser, isDarkMode } = useDbState();
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  // Onglets Gestion (Commandes ⇄ Clients)
  const [subTab, setSubTab] = useState('orders');
  const [tabBarWidth, setTabBarWidth] = useState(() => Dimensions.get('window').width - 40);
  const [pagerWidth, setPagerWidth] = useState(() => Dimensions.get('window').width);
  const [hasMountedClients, setHasMountedClients] = useState(subTab === 'clients');

  // Animation de glissement latéral coordonné (0 = Commandes, 1 = Clients)
  const slideAnim = useRef(new Animated.Value(subTab === 'orders' ? 0 : 1)).current;

  useEffect(() => {
    if (subTab === 'clients') {
      setHasMountedClients(true);
    }
    Animated.spring(slideAnim, {
      toValue: subTab === 'orders' ? 0 : 1,
      damping: 24,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [subTab]);

  // Désactiver le swipe parent sur l'onglet Clients
  useEffect(() => {
    if (onDisableSwipeChange) {
      onDisableSwipeChange(subTab === 'clients');
    }
    return () => {
      if (onDisableSwipeChange) {
        onDisableSwipeChange(false);
      }
    };
  }, [subTab, onDisableSwipeChange]);

  // Pull to refresh
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

  // Filtres et Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('actives'); // actives, urgentes, retard

  // Animations d'actions de statut
  const [animatingOrderIds, setAnimatingOrderIds] = useState({});

  const triggerFinalStatusAnimation = async (orderId, nextStatus, callback) => {
    if (typeof callback === 'function') {
      await callback();
    }
    setAnimatingOrderIds(prev => ({ ...prev, [orderId]: { status: nextStatus, phase: 'exit' } }));
    setTimeout(() => {
      setAnimatingOrderIds(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, 300);
  };

  // Modales d'ordre
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentNextStatus, setPaymentNextStatus] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);

  // Modale client
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [wasEditingFromFiche, setWasEditingFromFiche] = useState(null);

  // Synchronisation avec selectedOrder parent
  useEffect(() => {
    setShowOrderDetails(!!selectedOrder);
  }, [selectedOrder]);

  // Synchronisation avec initialSelectedClient
  useEffect(() => {
    if (initialSelectedClient) {
      setSelectedClient(initialSelectedClient);
      if (onClearInitialSelectedClient) {
        onClearInitialSelectedClient();
      }
    }
  }, [initialSelectedClient]);

  // Prise en compte des filtres Dashboard
  useEffect(() => {
    if (gestionFilter === 'clients') {
      setSubTab('clients');
    } else if (gestionFilter) {
      setSubTab('orders');
    }
  }, [gestionFilter]);

  // Fermeture centralisée de toutes les modales
  useEffect(() => {
    if (closeAllModalsTrigger > 0) {
      setShowCustomerModal(false);
      setSelectedClient(null);
      setShowInvoiceModal(false);
      setShowOrderDetails(false);
      setCancelModalVisible(false);
      setPaymentModalVisible(false);
      setEditingOrder(null);
      if (setSelectedOrder) setSelectedOrder(null);
    }
  }, [closeAllModalsTrigger]);

  // Notification de visibilité des modales au parent
  useEffect(() => {
    if (onModalStateChange) {
      const isAnyModalOpen =
        showInvoiceModal ||
        showCustomerModal ||
        selectedClient !== null ||
        showOrderDetails ||
        paymentModalVisible ||
        cancelModalVisible ||
        editingOrder !== null;
      onModalStateChange(isAnyModalOpen);
    }
  }, [
    showInvoiceModal,
    showCustomerModal,
    selectedClient,
    showOrderDetails,
    paymentModalVisible,
    cancelModalVisible,
    editingOrder,
    onModalStateChange
  ]);

  // Gestion de la touche retour Android
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const backAction = () => {
      if (editingOrder !== null) {
        setEditingOrder(null);
        return true;
      }
      if (showInvoiceModal) {
        setShowInvoiceModal(false);
        setInvoiceOrder(null);
        return true;
      }
      if (cancelModalVisible) {
        setCancelModalVisible(false);
        return true;
      }
      if (paymentModalVisible) {
        setPaymentModalVisible(false);
        return true;
      }
      if (showCustomerModal) {
        setShowCustomerModal(false);
        setEditingCustomer(null);
        return true;
      }
      if (selectedClient !== null) {
        setSelectedClient(null);
        return true;
      }
      if (showOrderDetails) {
        setShowOrderDetails(false);
        if (setSelectedOrder) setSelectedOrder(null);
        return true;
      }
      if (subTab === 'clients') {
        setSubTab('orders');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [
    subTab,
    showInvoiceModal,
    showCustomerModal,
    showOrderDetails,
    selectedClient,
    setSelectedOrder,
    paymentModalVisible,
    cancelModalVisible,
    editingOrder
  ]);

  // Dictionnaire de clients pour recherche instantanée O(1)
  const customerMap = useMemo(() => {
    const map = new Map();
    (customers || []).forEach(c => map.set(c.id, c));
    return map;
  }, [customers]);

  // Utilitaires de formatage
  const getDisplayTicketId = useCallback((order) => {
    if (!order) return '-';
    return String(order.id || order.identifiant_unique_marquage || order.ticket_numero || '-');
  }, []);

  const getItemsSummary = useCallback((items) => {
    if (!items || items.length === 0) return 'Aucun article';
    return items.map(a => `${a.article} x${a.quantite || a.quantity}`).join(', ');
  }, []);

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  }, []);

  const formatPrice = useCallback((price) => {
    return (price || 0).toLocaleString('fr-FR') + ' FCFA';
  }, []);

  const getStatusColor = useCallback((statut) => {
    switch (statut) {
      case 'en_attente_validation':
      case 'attente_validation':
        return { bg: '#f5f3ff', text: '#7c3aed', label: 'Validation Caisse' };
      case 'pret':
        return { bg: '#e8f5e9', text: '#2e7d32', label: 'Prêt' };
      case 'a_recuperer':
        return { bg: '#fef3c7', text: '#d97706', label: 'À récupérer' };
      case 'a_livrer':
        return { bg: '#eef2ff', text: '#4f46e5', label: 'À livrer' };
      case 'en_cours_livraison':
        return { bg: '#fffde7', text: '#b45309', label: 'Livraison en cours' };
      case 'restitue':
        return { bg: '#f4f4f5', text: '#71717a', label: 'Commande récupérée' };
      case 'livre':
        return { bg: '#f4f4f5', text: '#71717a', label: 'Commande livrée' };
      case 'lavage_cours':
      case 'en_cours_lavage':
        return { bg: '#e3f2fd', text: '#1565c0', label: 'Lavage' };
      case 'repassage_cours':
      case 'en_cours_repassage':
        return { bg: '#e0f7fa', text: '#00838f', label: 'Repassage' };
      case 'traitement':
        return { bg: '#f3e5f5', text: '#7b1fa2', label: 'Traitement' };
      case 'attente':
      case 'en_attente':
        return { bg: '#fff3e0', text: '#e65100', label: 'En attente' };
      case 'annule':
        return { bg: '#fef2f2', text: '#dc2626', label: 'Annulée' };
      default:
        return { bg: '#fff3e0', text: '#e65100', label: 'En attente' };
    }
  }, []);

  // Compteurs des filtres mémoïsés
  const counts = useMemo(() => {
    let actives = 0;
    let urgentes = 0;
    let retards = 0;
    const now = new Date();

    (orders || []).forEach(o => {
      const isActive = o.statut !== 'livre' && o.statut !== 'restitue' && o.statut !== 'annule';
      if (!isActive) return;
      actives++;
      if (o.niveau_urgence === 'Express') urgentes++;
      if (o.est_en_retard || o.statut === 'retard' || (o.due_date && new Date(o.due_date) < now)) {
        retards++;
      }
    });

    return { actives, urgentes, retards };
  }, [orders]);

  // Liste filtrée des commandes mémoïsée
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    return (orders || []).filter(o => {
      const client = customerMap.get(o.customer_id);
      const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
      const ticketNo = (o.ticket_numero || '').toLowerCase();
      const orderId = (o.id || '').toLowerCase();

      if (query && !clientName.includes(query) && !ticketNo.includes(query) && !orderId.includes(query)) {
        return false;
      }

      const isActive = o.statut !== 'livre' && o.statut !== 'restitue' && o.statut !== 'annule';

      // Filtre contextuel depuis le Dashboard
      if (gestionFilter === 'en_cours') return isActive;
      if (gestionFilter === 'pretes') {
        return isActive && (o.statut === 'pret' || o.statut === 'a_recuperer' || o.statut === 'a_livrer');
      }
      if (gestionFilter === 'retards') {
        return isActive && (o.est_en_retard || o.statut === 'retard' || (o.due_date && new Date(o.due_date) < now));
      }

      // Filtre local par puces
      if (statusFilter === 'actives') return isActive;
      if (statusFilter === 'urgentes') return isActive && o.niveau_urgence === 'Express';
      if (statusFilter === 'retard') {
        return isActive && (o.est_en_retard || o.statut === 'retard' || (o.due_date && new Date(o.due_date) < now));
      }

      return isActive;
    });
  }, [orders, customerMap, searchQuery, gestionFilter, statusFilter]);

  // Moteur de transition de statut
  const handleNextStatus = async (order, targetStatus, updateSelected = false) => {
    if (!order) return;
    const nextStatus = targetStatus;
    const isFinal = nextStatus === 'livre' || nextStatus === 'restitue';

    const total = Number(order.prix_total !== undefined ? order.prix_total : (order.total || 0));
    const avance = Number(order.avance_payee !== undefined ? order.avance_payee : (order.avance || 0));
    const remainingToPay = Math.max(0, total - avance);
    const isSubscriptionOrder = !!order.is_subscription_order || order.mode_reglement === 'abonnement' || order.pay_with_subscription;

    // Verrou financier avant le lavage ou statut ultérieur
    const requiresLavageOrBeyond = [
      'en_cours_lavage',
      'en_cours_repassage',
      'pret',
      'a_livrer',
      'a_recuperer',
      'en_cours_livraison',
      'livre',
      'restitue'
    ].includes(nextStatus);

    if (requiresLavageOrBeyond && remainingToPay > 0 && !isSubscriptionOrder) {
      setPaymentOrder(order);
      setPaymentNextStatus(nextStatus);
      setPaymentModalVisible(true);
      return false;
    }

    const performUpdate = async () => {
      try {
        await db.updateOrderStatus(order.id, nextStatus);
        if (updateSelected) {
          const updated = (db.getOrders ? db.getOrders() : []).find(o => o.id === order.id);
          if (updated && setSelectedOrder) setSelectedOrder(updated);
        }
      } catch (e) {
        Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
        throw e;
      }
    };

    if (isFinal) {
      if (showOrderDetails) {
        setShowOrderDetails(false);
        if (setSelectedOrder) setSelectedOrder(null);
      }
      await new Promise(resolve => setTimeout(resolve, 800));
      await triggerFinalStatusAnimation(order.id, nextStatus, performUpdate);
    } else {
      await performUpdate();
    }
  };

  // Validation d'une commande saisie par un livreur
  const handleValidateOrder = async (order) => {
    if (!order) return;
    try {
      let validatedOrder;
      if (typeof db.validateOrderByCashier === 'function') {
        validatedOrder = await db.validateOrderByCashier(order.id);
      } else {
        await db.updateOrderStatus(order.id, 'en_attente');
      }

      const freshOrder = (db.getOrders ? db.getOrders() : []).find(o => o.id === order.id) || validatedOrder || order;
      const targetCustomer = (db.getCustomers ? db.getCustomers() : []).find(c => c.id === freshOrder.customer_id);
      if (targetCustomer) {
        sendOrderCreatedWhatsAppNotification(freshOrder, targetCustomer);
      }

      if (selectedOrder && selectedOrder.id === order.id && setSelectedOrder) {
        const updated = (db.getOrders ? db.getOrders() : []).find(o => o.id === order.id);
        if (updated) setSelectedOrder(updated);
      }
      if (onShowSuccess) {
        onShowSuccess("Commande validée avec succès par la caisse !");
      }
    } catch (e) {
      console.error("Error validating order by cashier:", e);
      Alert.alert("Erreur", e.message || "Impossible de valider la commande.");
    }
  };

  // Confirmation de paiement du solde
  const handleConfirmPayment = async (order, paymentMethod, momoRef, momoOp) => {
    const total = Number(order.prix_total !== undefined ? order.prix_total : (order.total || 0));
    const avance = Number(order.avance_payee !== undefined ? order.avance_payee : (order.avance || 0));
    const soldeRestant = Math.max(0, total - avance);
    const targetStatus = paymentNextStatus || 'en_cours_lavage';
    const isFinal = targetStatus === 'livre' || targetStatus === 'restitue';

    const performUpdate = async () => {
      try {
        await db.deliverOrderWithPayment(
          order.id,
          soldeRestant,
          paymentMethod,
          targetStatus,
          paymentMethod === 'Mobile Money' ? momoRef : null,
          paymentMethod === 'Mobile Money' ? momoOp : null
        );
        if (onShowSuccess) {
          onShowSuccess(
            targetStatus === 'en_cours_lavage'
              ? "Solde réglé. Commande transmise au lavage !"
              : "Paiement enregistré et commande mise à jour."
          );
        }
      } catch (e) {
        console.error("Error validating payment:", e);
        Alert.alert("Erreur", e.message || "Impossible de valider le règlement.");
      }
    };

    setPaymentModalVisible(false);
    if (showOrderDetails) {
      setShowOrderDetails(false);
      if (setSelectedOrder) setSelectedOrder(null);
    }

    if (isFinal) {
      await triggerFinalStatusAnimation(order.id, targetStatus, performUpdate);
    } else {
      await performUpdate();
    }
  };

  // Annulation de commande
  const handleConfirmCancelOrder = (order, reason) => {
    setCancelModalVisible(false);

    const performCancel = async () => {
      try {
        await db.cancelOrder(order.id, reason);
        if (onShowSuccess) {
          onShowSuccess("Commande annulée avec succès.");
        }
        if (showOrderDetails) {
          setShowOrderDetails(false);
          if (setSelectedOrder) setSelectedOrder(null);
        }
      } catch (e) {
        Alert.alert("Erreur", "Impossible d'annuler cette commande.");
      }
    };

    triggerFinalStatusAnimation(order.id, 'annule', performCancel);
  };

  // Génération du code HTML du ticket thermique
  const generateInvoiceHtml = (order) => {
    const client = customerMap.get(order.customer_id) || { prenom: 'Client', nom: 'Inconnu' };
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const displayTicketId = getDisplayTicketId(order);

    const articlesHtml = (order.items || order.articles || []).map(art => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
        <div style="flex: 1.8; text-align: left;">
          <div style="font-weight: bold; color: #000;">${art.article}</div>
          <div style="font-size: 11px; color: #666; text-transform: uppercase;">${(art.service || '').replace(/_/g, ' ')}</div>
        </div>
        <div style="width: 40px; text-align: center;">x${art.quantite || art.quantity}</div>
        <div style="width: 100px; text-align: right; font-weight: bold;">${formatPrice((art.prix || art.price || 0) * (art.quantite || art.quantity || 1))}</div>
      </div>
    `).join('');

    const isExpress = order.niveau_urgence === 'Express';
    const expressMarkupItem = (catalog || []).find(c => c.id === 'setting_express_markup');
    const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;

    const itemsList = order.items || order.articles || [];
    let itemsSum = itemsList.reduce((sum, art) => sum + (Number(art.prix || art.price || 0) * Number(art.quantite || art.quantity || 1)), 0);

    const netPrice = Number(order.prix_total !== undefined ? order.prix_total : (order.total || 0));
    const fraisLivraison = Number(order.frais_livraison || order.frais_transport || order.delivery_fee || 0);
    const fraisRecuperation = Number(order.frais_recuperation || order.pickup_fee || 0);

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

    const avance = Number(order.avance_payee !== undefined ? order.avance_payee : (order.avance || 0));
    const reste = Math.max(0, netPrice - avance);

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            @media print {
              body { padding: 12px !important; margin: 0 !important; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Courier New', monospace; color: #000; margin: 0; padding: 24px; }
            .container { max-width: 380px; margin: 0 auto; }
            .brand { font-size: 24px; font-weight: 900; text-align: center; letter-spacing: 2px; }
            .brand-sub { font-size: 10px; font-weight: bold; text-align: center; margin-bottom: 8px; }
            .text-muted { font-size: 11px; text-align: center; color: #555; margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 12px 0; }
            .meta-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
            .total-bold { font-weight: 900; font-size: 15px; }
            .footer-msg { font-size: 12px; font-weight: bold; text-align: center; margin-top: 20px; }
            .barcode { border: 1px dashed #000; padding: 8px; text-align: center; font-size: 15px; font-weight: bold; margin: 10px 0; letter-spacing: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">Pressing Pro</div>
            <div class="brand-sub">LAVERIE & PRESSING PREMIUM</div>
            <div class="text-muted">Tél: +229 XX XX XX XX</div>
            <div class="text-muted">Cotonou, Bénin</div>
            <div class="divider"></div>
            <div class="meta-row"><div>Ticket N° :</div><div>${displayTicketId}</div></div>
            <div class="meta-row"><div>Code :</div><div>${order.identifiant_unique_marquage || order.id}</div></div>
            <div class="meta-row"><div>Date :</div><div>${dateStr}</div></div>
            <div class="meta-row"><div>Client :</div><div>${client.prenom} ${client.nom}</div></div>
            <div class="meta-row"><div>Règlement :</div><div>${order.mode_reglement || order.mode_paiement || 'Espèces'}</div></div>
            <div class="divider"></div>
            <div style="font-size: 12px; font-weight: bold; text-align: center; margin-bottom: 10px;">ARTICLES & SERVICES</div>
            ${articlesHtml}
            <div class="divider"></div>
            <div class="total-row"><div>TOTAL BRUT</div><div>${formatPrice(displayBrut)}</div></div>
            ${discountAmount > 0 ? `<div class="total-row" style="color: #ff3b30;"><div>REMISE</div><div>-${formatPrice(discountAmount)}</div></div>` : ''}
            ${fraisLivraison > 0 ? `<div class="total-row" style="color: #3b82f6;"><div>LIVRAISON</div><div>+${formatPrice(fraisLivraison)}</div></div>` : ''}
            ${fraisRecuperation > 0 ? `<div class="total-row" style="color: #3b82f6;"><div>RECUPERATION</div><div>+${formatPrice(fraisRecuperation)}</div></div>` : ''}
            <div class="total-row total-bold"><div>NET A PAYER</div><div>${formatPrice(netPrice)}</div></div>
            <div class="total-row"><div>AVANCE PAYEE</div><div>${formatPrice(avance)}</div></div>
            <div class="total-row total-bold" style="color: ${reste > 0 ? '#ff3b30' : '#34c759'};"><div>RESTE A PAYER</div><div>${formatPrice(reste)}</div></div>
            <div class="divider"></div>
            <div class="footer-msg">MERCI DE VOTRE CONFIANCE !</div>
            <div class="barcode">* ${order.identifiant_unique_marquage || order.id} *</div>
          </div>
        </body>
      </html>
    `;
  };

  // Impression
  const handlePrintInvoice = async (order) => {
    if (!order) return;
    try {
      const html = generateInvoiceHtml(order);
      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1500);
        }, 250);
        return;
      }
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'imprimer la facture.");
      console.error(error);
    }
  };

  // Téléchargement / Partage PDF
  const handleDownloadInvoice = async (order) => {
    if (!order) return;
    try {
      const html = generateInvoiceHtml(order);

      if (Platform.OS === 'web') {
        const ticketFileName = `facture_${order.identifiant_unique_marquage || order.id || getDisplayTicketId(order)}.pdf`;
        if (typeof window !== 'undefined' && window.html2pdf) {
          const container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.left = '-9999px';
          container.style.top = '0';
          container.style.width = '380px';
          container.innerHTML = html;
          document.body.appendChild(container);

          const opt = {
            margin: [4, 4, 4, 4],
            filename: ticketFileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: [80, 220], orientation: 'portrait' }
          };

          try {
            await window.html2pdf().set(opt).from(container).save();
          } finally {
            document.body.removeChild(container);
          }
          return;
        }
        await handlePrintInvoice(order);
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Télécharger la facture',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de télécharger la facture.");
      console.error(error);
    }
  };

  // Enregistrement client rapide
  const handleSaveCustomer = async (custData) => {
    try {
      let customerId;
      if (editingCustomer) {
        await db.updateCustomer(editingCustomer.id, custData);
        customerId = editingCustomer.id;
        if (onShowSuccess) onShowSuccess("Client mis à jour avec succès !");
      } else {
        const newCust = await db.addCustomer(custData);
        customerId = newCust ? newCust.id : null;
        if (onShowSuccess) onShowSuccess("Client créé avec succès !");
      }

      if (custData.subscription_plan_id && customerId && typeof db.subscribeCustomer === 'function') {
        try {
          await db.subscribeCustomer(customerId, custData.subscription_plan_id);
        } catch (subErr) {
          console.warn("Auto-subscription error:", subErr);
        }
      }

      setShowCustomerModal(false);
      setEditingCustomer(null);

      if (wasEditingFromFiche) {
        const origClient = (db.getCustomers ? db.getCustomers() : []).find(c => c.id === wasEditingFromFiche);
        if (origClient) {
          setSelectedClient(origClient);
        }
        setWasEditingFromFiche(null);
      }
    } catch (e) {
      console.error("Error saving customer:", e);
      Alert.alert("Erreur", "Impossible d'enregistrer le client.");
    }
  };

  const scrollPaddingBottom = useScrollPaddingBottom();

  // Rendu mémoïsé d'une carte de commande dans FlatList
  const renderOrderCard = useCallback(({ item }) => {
    const client = customerMap.get(item.customer_id);
    const animInfo = animatingOrderIds[item.id];

    return (
      <OrderCard
        key={item.id}
        item={item}
        client={client}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        animInfo={animInfo}
        onSelectOrder={(ord) => {
          if (setSelectedOrder) setSelectedOrder(ord);
          setShowOrderDetails(true);
        }}
        onSelectClient={(cli) => setSelectedClient(cli)}
        onShowInvoice={(ord) => {
          setInvoiceOrder(ord);
          setShowInvoiceModal(true);
        }}
        onCancelOrder={(ord) => {
          setOrderToCancel(ord);
          setCancelModalVisible(true);
        }}
        onEditOrder={(ord) => setEditingOrder(ord)}
        onValidateOrder={handleValidateOrder}
        onAdvanceStatus={(ord, target) => handleNextStatus(ord, target, false)}
        formatPrice={formatPrice}
        formatDate={formatDate}
        getDisplayTicketId={getDisplayTicketId}
        getItemsSummary={getItemsSummary}
        getStatusColor={getStatusColor}
      />
    );
  }, [
    customerMap,
    animatingOrderIds,
    isDarkMode,
    currentUser,
    setSelectedOrder,
    formatPrice,
    formatDate,
    getDisplayTicketId,
    getItemsSummary,
    getStatusColor
  ]);

  // Composant d'état vide
  const renderEmptyState = () => {
    let title = "Aucune commande active";
    let subtitle = "Toutes les commandes courantes ont été traitées ou livrées.";
    let icon = <Package size={40} color={isDarkMode ? '#3f3f46' : '#cbd5e1'} />;

    if (searchQuery.trim().length > 0) {
      title = "Aucun résultat trouvé";
      subtitle = `Aucune commande ne correspond à « ${searchQuery} ».`;
      icon = <Search size={40} color={isDarkMode ? '#3f3f46' : '#cbd5e1'} />;
    } else if (statusFilter === 'urgentes') {
      title = "Aucune commande urgente";
      subtitle = "Il n'y a actuellement aucune commande express en attente.";
      icon = <Sparkles size={40} color={isDarkMode ? '#3f3f46' : '#cbd5e1'} />;
    } else if (statusFilter === 'retard') {
      title = "Aucun retard constaté";
      subtitle = "Toutes les commandes respectent les délais de retrait.";
      icon = <Clock size={40} color={isDarkMode ? '#3f3f46' : '#cbd5e1'} />;
    }

    const hasFilterActive = searchQuery.trim().length > 0 || statusFilter !== 'actives' || !!gestionFilter;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          {icon}
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        {hasFilterActive && (
          <TouchableOpacity
            style={styles.emptyResetBtn}
            activeOpacity={0.8}
            onPress={() => {
              setSearchQuery('');
              setStatusFilter('actives');
              if (setGestionFilter) setGestionFilter(null);
            }}
          >
            <RotateCcw size={14} color="#002cf7" style={{ marginRight: 6 }} />
            <Text style={styles.emptyResetBtnText}>Réinitialiser les filtres</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER DE GESTION */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion</Text>
      </View>

      {/* SÉLECTEUR D'ONGLETS (Commandes ⇄ Clients) AVEC GLISSEMENT FLUIDE */}
      <View style={styles.tabSelectorContainer}>
        <View
          style={styles.tabSelector}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - tabBarWidth) > 1) {
              setTabBarWidth(w);
            }
          }}
        >
          {tabBarWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slidingTabPill,
                {
                  width: (tabBarWidth - 6) / 2,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (tabBarWidth - 6) / 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}

          <TouchableOpacity
            onPress={() => {
              setSubTab('orders');
              if (setGestionFilter) setGestionFilter(null);
            }}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, subTab === 'orders' && styles.tabButtonTextActive]}>
              Commandes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSubTab('clients');
              if (setGestionFilter) setGestionFilter(null);
            }}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, subTab === 'clients' && styles.tabButtonTextActive]}>
              Clients
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PAGER HORIZONTAL (VOLET 1 : COMMANDES | VOLET 2 : CLIENTS) */}
      <View
        style={styles.slidingContentOuter}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - pagerWidth) > 1) {
            setPagerWidth(w);
          }
        }}
      >
        <Animated.View
          style={[
            styles.slidingContentTrack,
            {
              width: pagerWidth * 2,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -pagerWidth],
                  }),
                },
              ],
            },
          ]}
        >
          {/* VOLET 1 : COMMANDES */}
          <View style={[styles.slidingPane, { width: pagerWidth }]}>
            {/* BARRE DE RECHERCHE */}
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Search size={16} color={isDarkMode ? '#71717a' : '#94a3b8'} style={styles.searchIcon} />
                <TextInput
                  placeholder="Rechercher un ticket ou un client..."
                  placeholderTextColor={isDarkMode ? '#71717a' : '#a1a1aa'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7} style={{ padding: 4 }}>
                    <X size={14} color={isDarkMode ? '#71717a' : '#94a3b8'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* FILTRES PAR PUCES */}
            <View style={styles.statusFilterRow}>
              <TouchableOpacity
                onPress={() => {
                  setStatusFilter('actives');
                  if (setGestionFilter) setGestionFilter(null);
                }}
                style={[
                  styles.chip,
                  statusFilter === 'actives' && !gestionFilter && styles.chipActive
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.chipText,
                  statusFilter === 'actives' && !gestionFilter && styles.chipTextActive
                ]}>
                  Actives ({counts.actives})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStatusFilter('urgentes');
                  if (setGestionFilter) setGestionFilter(null);
                }}
                style={[
                  styles.chip,
                  statusFilter === 'urgentes' && !gestionFilter && styles.chipActiveUrgent
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.chipText,
                  statusFilter === 'urgentes' && !gestionFilter && styles.chipTextActiveUrgent
                ]}>
                  Urgentes ({counts.urgentes})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStatusFilter('retard');
                  if (setGestionFilter) setGestionFilter(null);
                }}
                style={[
                  styles.chip,
                  statusFilter === 'retard' && !gestionFilter && styles.chipActiveLate
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.chipText,
                  statusFilter === 'retard' && !gestionFilter && styles.chipTextActiveLate
                ]}>
                  En retard ({counts.retards})
                </Text>
              </TouchableOpacity>
            </View>

            {/* BADGE DE FILTRE CONTEXTUEL DU DASHBOARD */}
            {gestionFilter && gestionFilter !== 'clients' && (
              <View style={styles.filterPillSection}>
                <View style={styles.filterPill}>
                  <Text style={styles.filterPillText}>
                    Filtre : {
                      gestionFilter === 'en_cours' ? 'En Cours' :
                        gestionFilter === 'pretes' ? 'Prêtes' :
                          gestionFilter === 'retards' ? 'Retards / Urgences' : gestionFilter
                    }
                  </Text>
                  <TouchableOpacity onPress={() => setGestionFilter(null)} style={styles.clearFilterBtn}>
                    <Text style={styles.clearFilterText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* LISTE VIRTUALISÉE DES COMMANDES */}
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderOrderCard}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={Platform.OS !== 'web'}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#002cf7']}
                  tintColor={isDarkMode ? '#ffffff' : '#002cf7'}
                />
              }
            />
          </View>

          {/* VOLET 2 : CLIENTS */}
          <View style={[styles.slidingPane, { width: pagerWidth }]}>
            {hasMountedClients && (
              <ClientsScreen
                embedded={true}
                onShowSuccess={onShowSuccess}
                isActive={isActive && subTab === 'clients'}
              />
            )}
          </View>
        </Animated.View>
      </View>

      {/* MODALE DE DÉTAIL COMMANDE PLEIN ÉCRAN */}
      <OrderDetailModal
        visible={showOrderDetails && selectedOrder !== null}
        order={selectedOrder}
        client={selectedOrder ? customerMap.get(selectedOrder.customer_id) : null}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        catalog={catalog}
        onClose={() => {
          setShowOrderDetails(false);
          if (setSelectedOrder) setSelectedOrder(null);
        }}
        onSelectClient={(client) => setSelectedClient(client)}
        onCancelOrder={(ord) => {
          setOrderToCancel(ord);
          setCancelModalVisible(true);
        }}
        onEditOrder={(ord) => setEditingOrder(ord)}
        onValidateOrder={handleValidateOrder}
        onAdvanceStatus={(ord, target) => handleNextStatus(ord, target, true)}
        formatPrice={formatPrice}
        formatDate={formatDate}
        getDisplayTicketId={getDisplayTicketId}
        getStatusColor={getStatusColor}
      />

      {/* MODALE D'ANNULATION */}
      <CancelModal
        isOpen={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        order={orderToCancel}
        client={orderToCancel ? customerMap.get(orderToCancel.customer_id) : null}
        isDarkMode={isDarkMode}
        formatPrice={formatPrice}
        getDisplayTicketId={getDisplayTicketId}
        onConfirmCancel={handleConfirmCancelOrder}
      />

      {/* MODALE DE PAIEMENT / RÈGLEMENT DU SOLDE */}
      <PaymentModal
        isOpen={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        order={paymentOrder}
        isDarkMode={isDarkMode}
        formatPrice={formatPrice}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* MODALE DE FACTURE / REÇU THERMIQUE */}
      <InvoiceModal
        visible={showInvoiceModal && !!invoiceOrder}
        onClose={() => {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
        }}
        order={invoiceOrder}
        isDarkMode={isDarkMode}
        customers={customers}
        catalog={catalog}
        formatPrice={formatPrice}
        getDisplayTicketId={getDisplayTicketId}
        onDownload={handleDownloadInvoice}
        onPrint={handlePrintInvoice}
      />

      {/* MODALE CRÉATION / ÉDITION CLIENT RAPIDE */}
      <CustomerCreateEditModal
        visible={showCustomerModal}
        editingCustomer={editingCustomer}
        catalog={catalog}
        isDarkMode={isDarkMode}
        onClose={() => {
          setShowCustomerModal(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
      />

      {/* FICHE CLIENT DÉTAILLÉE */}
      <ClientDetailModal
        visible={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEditClient={(client) => {
          setWasEditingFromFiche(client.id);
          setEditingCustomer(client);
          setShowCustomerModal(true);
        }}
        onShowSuccess={onShowSuccess}
      />

      {/* MODAL MODIFICATION DE COMMANDE AVANT VALIDATION */}
      {editingOrder && (
        <OrderFormModal
          key={`edit-order-${editingOrder.id}`}
          visible={!!editingOrder}
          orderToEdit={editingOrder}
          onClose={() => setEditingOrder(null)}
          onShowSuccess={(msg) => {
            if (onShowSuccess) onShowSuccess(msg);
            if (selectedOrder && selectedOrder.id === editingOrder.id) {
              const fresh = (db.getOrders ? db.getOrders() : []).find(o => o.id === editingOrder.id);
              if (fresh && setSelectedOrder) setSelectedOrder(fresh);
            }
            setEditingOrder(null);
          }}
        />
      )}
    </View>
  );
}

const getStyles = (isDarkMode) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 44 : 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      letterSpacing: -0.5,
    },
    tabSelectorContainer: {
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    tabSelector: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
      borderRadius: 14,
      padding: 3,
      position: 'relative',
    },
    slidingTabPill: {
      position: 'absolute',
      top: 3,
      left: 3,
      bottom: 3,
      backgroundColor: isDarkMode ? '#27272a' : '#ffffff',
      borderRadius: 11,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    tabButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#a1a1aa' : '#64748b',
    },
    tabButtonTextActive: {
      color: isDarkMode ? '#ffffff' : '#002cf7',
      fontWeight: '700',
    },
    slidingContentOuter: {
      flex: 1,
      overflow: 'hidden',
    },
    slidingContentTrack: {
      flex: 1,
      flexDirection: 'row',
    },
    slidingPane: {
      flex: 1,
    },
    searchSection: {
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      borderRadius: 14,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      color: isDarkMode ? '#ffffff' : '#0f172a',
      paddingVertical: 0,
      ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    statusFilterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 10,
    },
    chip: {
      flex: 1,
      paddingVertical: 7,
      paddingHorizontal: 6,
      borderRadius: 9999,
      backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: {
      backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 44, 247, 0.08)',
      borderColor: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    chipActiveUrgent: {
      backgroundColor: isDarkMode ? 'rgba(244, 63, 94, 0.15)' : 'rgba(225, 29, 72, 0.08)',
      borderColor: isDarkMode ? '#f43f5e' : '#e11d48',
    },
    chipActiveLate: {
      backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(217, 119, 6, 0.08)',
      borderColor: isDarkMode ? '#fbbf24' : '#d97706',
    },
    chipText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDarkMode ? '#a1a1aa' : '#64748b',
    },
    chipTextActive: {
      color: isDarkMode ? '#38bdf8' : '#002cf7',
      fontWeight: '700',
    },
    chipTextActiveUrgent: {
      color: isDarkMode ? '#f87171' : '#e11d48',
      fontWeight: '700',
    },
    chipTextActiveLate: {
      color: isDarkMode ? '#fbbf24' : '#d97706',
      fontWeight: '700',
    },
    filterPillSection: {
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.2)' : '#e0e7ff',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: isDarkMode ? '#002cf7' : '#c7d2fe',
    },
    filterPillText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
      marginRight: 8,
    },
    clearFilterBtn: {
      padding: 2,
    },
    clearFilterText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: isDarkMode ? '#a1a1aa' : '#64748b',
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 280,
    },
    emptyResetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 18,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 9999,
      backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#eff6ff',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(0, 44, 247, 0.35)' : '#bfdbfe',
    },
    emptyResetBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
    },
  });
};
