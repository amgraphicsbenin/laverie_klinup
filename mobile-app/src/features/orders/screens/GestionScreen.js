import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, FlatList, KeyboardAvoidingView, Platform, BackHandler, RefreshControl } from 'react-native';
import { Plus, Search, User, Phone, MapPin, Settings, FolderHeart, Calendar, CreditCard, ShoppingBag, Receipt, Printer, Trash2, Edit3, X, Check, ChevronRight, Clock, Sparkles, Shirt, Wind, Truck, CheckCircle, Download, Award, Ban } from 'lucide-react-native';
import { db } from '../../../services/db';
import { CustomSelect } from '../../../components/CustomSelect';
import { BlurView } from 'expo-blur';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
const MotiView = View;
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollPaddingBottom } from '../../../hooks/useTabBarHeight';
import ClientsScreen from '../../clients/screens/ClientsScreen';
import { useDbState } from '../../../hooks/useDbState';
import ClientDetailModal from '../../../components/ClientDetailModal';

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
  onShowSuccess
}) {
  const { isDarkMode } = useDbState();
  const styles = getStyles(isDarkMode);
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
  const activeFilterStyles = {
    actives: {
      backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 44, 247, 0.08)',
      borderColor: isDarkMode ? '#38bdf8' : '#002cf7',
      textColor: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    urgentes: {
      backgroundColor: isDarkMode ? 'rgba(244, 63, 94, 0.15)' : 'rgba(225, 29, 72, 0.08)',
      borderColor: isDarkMode ? '#f43f5e' : '#e11d48',
      textColor: isDarkMode ? '#f87171' : '#e11d48',
    },
    retard: {
      backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(217, 119, 6, 0.08)',
      borderColor: isDarkMode ? '#fbbf24' : '#d97706',
      textColor: isDarkMode ? '#fbbf24' : '#d97706',
    }
  };
  const cancelBtnStyle = {
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
    borderColor: isDarkMode ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
  };
  const [animatingOrderIds, setAnimatingOrderIds] = useState({});

  const triggerFinalStatusAnimation = (orderId, nextStatus, callback) => {
    setAnimatingOrderIds(prev => ({ ...prev, [orderId]: nextStatus }));
    setTimeout(async () => {
      await callback();
      setAnimatingOrderIds(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, 850);
  };

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

  // Payment confirmation modal states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentNextStatus, setPaymentNextStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [momoRefNumber, setMomoRefNumber] = useState('');
  const [momoRefError, setMomoRefError] = useState('');

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
    
    const performCancel = async () => {
      try {
        db.cancelOrder(order.id, cancelReason.trim());
        if (onShowSuccess) {
          onShowSuccess("Commande annulée avec succès.");
        }
        if (showOrderDetails) {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }
      } catch (e) {
        Alert.alert("Erreur", "Impossible d'annuler cette commande.");
      }
    };
    
    triggerFinalStatusAnimation(order.id, 'annule', performCancel);
  };
  const [subTab, setSubTab] = useState('orders'); // orders, clients, catalog
  const [showClientsPage, setShowClientsPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('actives'); // actives, urgentes, retard
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Close all local modals when trigger increments
  useEffect(() => {
    if (closeAllModalsTrigger > 0) {
      setShowCustomerModal(false);
      setSelectedClient(null);
      setShowInvoiceModal(false);
      setShowOrderDetails(false);
      if (setSelectedOrder) setSelectedOrder(null);
    }
  }, [closeAllModalsTrigger]);
  const scrollPaddingBottom = useScrollPaddingBottom();

  const setShowOrderForm = setOrderFormVisible;

  const handleShowInvoice = (order, e) => {
    e.stopPropagation();
    setInvoiceOrder(order);
    setShowInvoiceModal(true);
  };

  const getDisplayTicketId = (order) => {
    if (!order) return '1001';
    if (order.ticket_numero && /^\d+$/.test(order.ticket_numero)) return order.ticket_numero;
    if (order.id && /^\d+$/.test(order.id)) return order.id;
    const allOrders = db.getOrders();
    const sortedOrders = [...allOrders].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    const index = sortedOrders.findIndex(o => o.id === order.id);
    return index !== -1 ? String(1001 + index) : '1001';
  };

  const getItemsSummary = (items) => {
    if (!items || items.length === 0) return 'Aucun article';
    return items.map(a => `${a.article} x${a.quantite || a.quantity}`).join(', ');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch(e) {
      return dateStr;
    }
  };



  // Switch to orders tab if a dashboard filter is applied
  useEffect(() => {
    if (gestionFilter) {
      setSubTab('orders');
    }
  }, [gestionFilter]);
  
  // Database states
  const currentUser = db.getCurrentUser();
  const orders = db.getOrders();
  const customers = db.getCustomers();
  const catalog = db.getCatalog();

  const isTransitionAllowed = (status, targetStatus) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'super_admin' || role === 'manager') return true;
    
    if (role === 'agent_lavage_repassage') {
      const allowed = ['en_attente', 'attente', 'traitement', 'en_cours_lavage', 'lavage_cours', 'en_cours_repassage', 'repassage_cours'];
      return allowed.includes(status) && (
        targetStatus === 'traitement' || 
        targetStatus === 'en_cours_lavage' || 
        targetStatus === 'en_cours_repassage' || 
        targetStatus === 'pret'
      );
    }
    
    if (role === 'agent_accueil') {
      return (
        (status === 'pret' && (targetStatus === 'a_livrer' || targetStatus === 'a_recuperer')) ||
        (status === 'a_recuperer' && (targetStatus === 'restitue' || targetStatus === 'livre'))
      );
    }
    
    if (role === 'livreur') {
      return (
        (status === 'a_livrer' && targetStatus === 'en_cours_livraison') ||
        (status === 'en_cours_livraison' && (targetStatus === 'restitue' || targetStatus === 'livre'))
      );
    }
    
    return false;
  };

  // Modals visibility
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const getNextStatusStyle = (currentStatus) => {
    switch (currentStatus) {
      case 'attente':
      case 'en_attente':
        return { bg: '#7c3aed', text: '#ffffff', label: 'Passer au traitement' };
      case 'traitement':
        return { bg: '#002cf7', text: '#ffffff', label: 'Lancer le lavage' };
      case 'lavage_cours':
      case 'en_cours_lavage':
        return { bg: '#0d9488', text: '#ffffff', label: 'Passer au repassage' };
      case 'repassage_cours':
      case 'en_cours_repassage':
        return { bg: '#059669', text: '#ffffff', label: 'Prêt' };
      case 'a_livrer':
        return { bg: '#4f46e5', text: '#ffffff', label: 'Démarrer la livraison' };
      case 'en_cours_livraison':
        return { bg: '#09090b', text: '#ffffff', label: 'Terminer la livraison' };
      case 'a_recuperer':
        return { bg: '#d97706', text: '#ffffff', label: 'Marquer comme récupéré' };
      default:
        return null;
    }
  };
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Customer Form state
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [custNom, setCustNom] = useState('');
  const [custPrenom, setCustPrenom] = useState('');
  const [custTelephone, setCustTelephone] = useState('');
  const [custAdresse, setCustAdresse] = useState('');
  const [custPreferences, setCustPreferences] = useState('Plié');



  // Client Details View
  const [selectedClient, setSelectedClient] = useState(null);
  const [wasEditingFromFiche, setWasEditingFromFiche] = useState(null);

  const handleCloseCustomerModal = () => {
    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustNom('');
    setCustPrenom('');
    setCustTelephone('');
    setCustAdresse('');
    setCustPreferences('Plié');
    if (wasEditingFromFiche) {
      const origClient = db.getCustomers().find(c => c.id === wasEditingFromFiche);
      if (origClient) {
        setSelectedClient(origClient);
      }
      setWasEditingFromFiche(null);
    }
  };

  useEffect(() => {
    if (selectedOrder) {
      setShowOrderDetails(true);
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (initialSelectedClient) {
      setSelectedClient(initialSelectedClient);
      if (onClearInitialSelectedClient) {
        onClearInitialSelectedClient();
      }
    }
  }, [initialSelectedClient]);

  // Handle Android back button/gesture to close modals and forms inside GestionScreen
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const backAction = () => {
      if (showClientsPage) {
        setShowClientsPage(false);
        return true;
      }
      if (showInvoiceModal) {
        setShowInvoiceModal(false);
        setInvoiceOrder(null);
        return true;
      }
      if (showCustomerModal) {
        handleCloseCustomerModal();
        return true;
      }
      if (showOrderDetails) {
        setShowOrderDetails(false);
        if (setSelectedOrder) setSelectedOrder(null);
        return true;
      }
      if (selectedClient) {
        setSelectedClient(null);
        return true;
      }
      return false; // let it propagate to parent back handler (which changes tab to accueil)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [
    showClientsPage,
    showInvoiceModal,
    showCustomerModal,
    showOrderDetails,
    selectedClient,
    setSelectedOrder,
    wasEditingFromFiche
  ]);

  // Notify parent of modal visibility
  useEffect(() => {
    if (onModalStateChange) {
      const isAnyModalOpen = showInvoiceModal || showCustomerModal || selectedClient !== null || showOrderDetails || paymentModalVisible || cancelModalVisible;
      onModalStateChange(isAnyModalOpen);
    }
  }, [showInvoiceModal, showCustomerModal, selectedClient, showOrderDetails, paymentModalVisible, cancelModalVisible, onModalStateChange]);

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  // Status transitions
  const handleNextStatus = async (order, updateSelected = false) => {
    let nextStatus = 'en_attente';
    const status = order.statut;
    if (status === 'attente' || status === 'en_attente') nextStatus = 'traitement';
    else if (status === 'traitement') nextStatus = 'en_cours_lavage';
    else if (status === 'lavage_cours' || status === 'en_cours_lavage') nextStatus = 'en_cours_repassage';
    else if (status === 'repassage_cours' || status === 'en_cours_repassage') nextStatus = 'pret';
    else if (status === 'a_livrer') nextStatus = 'en_cours_livraison';
    else if (status === 'en_cours_livraison') nextStatus = 'livre';
    else if (status === 'a_recuperer') nextStatus = 'restitue';
    else return;

    const isFinal = nextStatus === 'livre' || nextStatus === 'restitue';

    if (isFinal && !order.is_subscription_order) {
      setPaymentOrder(order);
      setPaymentNextStatus(nextStatus);
      setPaymentMethod('Espèces');
      setMomoRefNumber('');
      setMomoRefError('');
      setPaymentModalVisible(true);
      return;
    }

    const performUpdate = async () => {
      try {
        await db.updateOrderStatus(order.id, nextStatus);
        if (updateSelected) {
          const updated = db.getOrders().find(o => o.id === order.id);
          if (updated) setSelectedOrder(updated);
        }
      } catch (e) {
        Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
      }
    };

    if (isFinal) {
      if (showOrderDetails) {
        setShowOrderDetails(false);
        setSelectedOrder(null);
      }
      triggerFinalStatusAnimation(order.id, nextStatus, performUpdate);
    } else {
      await performUpdate();
    }
  };

  const handleConfirmPaymentAndComplete = async () => {
    if (!paymentOrder) return;
    if (paymentMethod === 'Mobile Money' && !momoRefNumber.trim()) {
      setMomoRefError("Le numéro de référence est obligatoire.");
      return;
    }

    const total = Number(paymentOrder.prix_total || paymentOrder.total || 0);
    const avance = Number(paymentOrder.avance_payee || paymentOrder.avance || 0);
    const soldeRestant = Math.max(0, total - avance);
    const targetStatus = paymentNextStatus || 'restitue';

    const performUpdate = async () => {
      try {
        await db.deliverOrderWithPayment(
          paymentOrder.id,
          soldeRestant,
          paymentMethod,
          targetStatus,
          paymentMethod === 'Mobile Money' ? momoRefNumber.trim() : null
        );
        if (onShowSuccess) {
          onShowSuccess("Paiement enregistré et commande finalisée.");
        }
      } catch (e) {
        console.error("Error validating payment:", e);
        Alert.alert("Erreur", "Impossible de valider le règlement.");
      }
    };

    setPaymentModalVisible(false);
    if (showOrderDetails) {
      setShowOrderDetails(false);
      setSelectedOrder(null);
    }
    
    triggerFinalStatusAnimation(paymentOrder.id, targetStatus, performUpdate);
  };

  const handleUpdateStatusDirect = async (order, nextStatus) => {
    try {
      await db.updateOrderStatus(order.id, nextStatus);
      const updated = db.getOrders().find(o => o.id === order.id);
      if (updated) setSelectedOrder(updated);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    }
  };

  const handleNextStatusDirectList = async (order, nextStatus) => {
    try {
      await db.updateOrderStatus(order.id, nextStatus);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    }
  };

  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setCancelReasonError('');
    setCancelModalVisible(true);
  };

  const handleDeleteOrder = (order) => {
    Alert.alert(
      "Supprimer la commande",
      `Voulez-vous vraiment supprimer définitivement la commande #${getDisplayTicketId(order)} ? Cette action est irréversible.`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            try {
              db.deleteOrder(order.id);
              if (onShowSuccess) {
                onShowSuccess("Commande supprimée avec succès.");
              }
              if (showOrderDetails) {
                setShowOrderDetails(false);
                setSelectedOrder(null);
              }
            } catch (e) {
              Alert.alert("Erreur", "Impossible de supprimer cette commande.");
            }
          }
        }
      ]
    );
  };

  // Customer Management
  const handleSaveCustomer = async () => {
    if (!custNom || !custTelephone) {
      Alert.alert("Erreur", "Le nom et le téléphone sont obligatoires.");
      return;
    }

    try {
      const isEditing = !!editingCustomer;
      if (editingCustomer) {
        await db.updateCustomer(editingCustomer.id, {
          nom: custNom,
          prenom: custPrenom,
          telephone: custTelephone,
          adresse: custAdresse,
          preferences_pliage: custPreferences
        });

        if (wasEditingFromFiche === editingCustomer.id) {
          const updatedClient = db.getCustomers().find(c => c.id === editingCustomer.id);
          if (updatedClient) {
            setSelectedClient(updatedClient);
          }
        }
      } else {
        await db.addCustomer({
          nom: custNom,
          prenom: custPrenom,
          telephone: custTelephone,
          adresse: custAdresse,
          preferences_pliage: custPreferences
        });
      }

      setCustNom('');
      setCustPrenom('');
      setCustTelephone('');
      setCustAdresse('');
      setCustPreferences('Plié');
      setEditingCustomer(null);
      setWasEditingFromFiche(null);
      setShowCustomerModal(false);
      if (onShowSuccess) {
        onShowSuccess(isEditing ? "Profil client modifié avec succès !" : "Nouveau client créé avec succès !");
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer le profil client.");
    }
  };

  const handleEditCustomer = (client) => {
    if (selectedClient && selectedClient.id === client.id) {
      setWasEditingFromFiche(client.id);
      setSelectedClient(null);
    } else {
      setWasEditingFromFiche(null);
    }
    setEditingCustomer(client);
    setCustNom(client.nom);
    setCustPrenom(client.prenom);
    setCustTelephone(client.telephone);
    setCustAdresse(client.adresse || '');
    setCustPreferences(client.preferences_pliage || 'Plié');
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = (id) => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer ce client ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
          try {
            await db.deleteCustomer(id);
            setSelectedClient(null);
            if (onShowSuccess) {
              onShowSuccess("Profil client supprimé avec succès.");
            }
          } catch (e) {
            Alert.alert("Erreur", "Impossible de supprimer ce client.");
          }
        }}
      ]
    );
  };

  const [selectedCrmSubId, setSelectedCrmSubId] = useState('');

  const handleSubscribeCrm = (customerId, planId) => {
    if (!planId) {
      Alert.alert("Erreur", "Veuillez sélectionner un forfait d'abonnement.");
      return;
    }
    const updatedCust = db.subscribeCustomer(customerId, planId);
    if (updatedCust) {
      if (onShowSuccess) {
        onShowSuccess(`Abonnement souscrit pour ${updatedCust.prenom} ${updatedCust.nom} !`);
      } else {
        Alert.alert("Succès", `Abonnement souscrit avec succès pour ${updatedCust.prenom} ${updatedCust.nom} !`);
      }
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
              if (onShowSuccess) {
                onShowSuccess("Abonnement résilié avec succès !");
              } else {
                Alert.alert("Succès", "Abonnement résilié avec succès !");
              }
              setSelectedClient({ ...updatedCust });
            }
          }
        }
      ]
    );
  };

  // Order Submission


  const getStatusColor = (statut) => {
    switch (statut) {
      case 'pret':
        return { bg: '#e8f5e9', text: '#2e7d32', label: 'Prêt' };
      case 'a_recuperer':
        return { bg: '#fef3c7', text: '#d97706', label: 'À récupérer' };
      case 'a_livrer':
        return { bg: '#eef2ff', text: '#4f46e5', label: 'À livrer' };
      case 'en_cours_livraison':
        return { bg: '#fffde7', text: '#b45309', label: 'En livraison' };
      case 'restitue':
        return { bg: '#f4f4f5', text: '#71717a', label: 'Récupéré' };
      case 'livre':
        return { bg: '#f4f4f5', text: '#71717a', label: 'Livré' };
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

  // Filters
  const filteredOrders = orders.filter(o => {
    const client = customers.find(c => c.id === o.customer_id);
    const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
    const ticketNo = (o.ticket_numero || '').toLowerCase();
    const orderId = (o.id || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = clientName.includes(query) || ticketNo.includes(query) || orderId.includes(query);
    if (!matchesQuery) return false;

    // Helper: only active orders belong in the Management screen workflow
    const isActive = o.statut !== 'livre' && o.statut !== 'restitue' && o.statut !== 'annule';

    // Filter by dashboard selected card (gestionFilter overrides local statusFilter)
    if (gestionFilter === 'en_cours') {
      return isActive;
    }
    if (gestionFilter === 'pretes') {
      return isActive && (o.statut === 'pret' || o.statut === 'a_recuperer' || o.statut === 'a_livrer');
    }
    if (gestionFilter === 'retards') {
      return isActive && (o.est_en_retard || o.statut === 'retard' || (o.due_date && new Date(o.due_date) < new Date()));
    }

    // Apply 3-button local status filter
    if (statusFilter === 'actives') {
      return isActive;
    }
    if (statusFilter === 'urgentes') {
      return isActive && o.niveau_urgence === 'Express';
    }
    if (statusFilter === 'retard') {
      return isActive && (o.est_en_retard || o.statut === 'retard' || (o.due_date && new Date(o.due_date) < new Date()));
    }

    return isActive;
  });

  const filteredClients = customers.filter(c => {
    const fullname = `${c.prenom} ${c.nom}`.toLowerCase();
    const phone = (c.telephone || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullname.includes(query) || phone.includes(query);
  });

  const filteredCatalog = catalog.filter(c => 
    c.categorie !== 'system_setting' && c.service !== 'system' &&
    c.article.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showClientsPage) {
    return (
      <MotiView
        from={{ opacity: 0, translateX: 40 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 120 }}
        style={{ flex: 1 }}
      >
        <ClientsScreen
          onBack={() => setShowClientsPage(false)}
          onSelectClient={(client) => {
            setShowClientsPage(false);
            setSelectedClient(client);
          }}
          onShowSuccess={onShowSuccess}
        />
      </MotiView>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion</Text>
      </View>

      {/* TABS SELECTOR */}
      <View style={styles.tabHeader}>
        {/* BOUTONS SUPÉRIEURS D'ACTION */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity 
            onPress={() => { if (onOpenOrderForm) onOpenOrderForm(); else setShowOrderForm(true); }}
            style={styles.topActionBtnBlue}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.topActionBtnTextBlue}>Ajouter une commande</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowClientsPage(true)}
            style={styles.topActionBtnWhite}
            activeOpacity={0.8}
          >
            <User size={14} color="#002cf7" style={{ marginRight: 6 }} />
            <Text style={styles.topActionBtnTextWhite}>Clients</Text>
          </TouchableOpacity>
        </View>

        {/* FILTRE DE 3 BOUTONS AVEC COULEURS SÉMANTIQUES */}
        {subTab === 'orders' && (
          <View style={styles.statusFilterRow}>
            <TouchableOpacity
              onPress={() => { setStatusFilter('actives'); setGestionFilter(null); }}
              style={[
                styles.statusFilterBtn, 
                statusFilter === 'actives' && !gestionFilter ? { 
                  backgroundColor: activeFilterStyles.actives.backgroundColor, 
                  borderColor: activeFilterStyles.actives.borderColor 
                } : null
              ]}
            >
              <Text style={[
                styles.statusFilterText, 
                statusFilter === 'actives' && !gestionFilter ? { color: activeFilterStyles.actives.textColor } : null
              ]}>
                Actives
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setStatusFilter('urgentes'); setGestionFilter(null); }}
              style={[
                styles.statusFilterBtn, 
                statusFilter === 'urgentes' && !gestionFilter ? { 
                  backgroundColor: activeFilterStyles.urgentes.backgroundColor, 
                  borderColor: activeFilterStyles.urgentes.borderColor 
                } : null
              ]}
            >
              <Text style={[
                styles.statusFilterText, 
                statusFilter === 'urgentes' && !gestionFilter ? { color: activeFilterStyles.urgentes.textColor } : null
              ]}>
                Urgentes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setStatusFilter('retard'); setGestionFilter(null); }}
              style={[
                styles.statusFilterBtn, 
                statusFilter === 'retard' && !gestionFilter ? { 
                  backgroundColor: activeFilterStyles.retard.backgroundColor, 
                  borderColor: activeFilterStyles.retard.borderColor 
                } : null
              ]}
            >
              <Text style={[
                styles.statusFilterText, 
                statusFilter === 'retard' && !gestionFilter ? { color: activeFilterStyles.retard.textColor } : null
              ]}>
                En retard
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            placeholder={
              subTab === 'orders' ? "Rechercher un ticket ou un client..." :
              subTab === 'clients' ? "Rechercher par nom ou téléphone..." : "Rechercher un article..."
            }
            placeholderTextColor="#a1a1aa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* FILTER PILL */}
      {subTab === 'orders' && gestionFilter && (
        <View style={styles.filterPillSection}>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>
              Filtre : {
                gestionFilter === 'en_cours' ? 'En Cours' :
                gestionFilter === 'pretes' ? 'Prêtes' : 'Retards / Urgences'
              }
            </Text>
            <TouchableOpacity onPress={() => setGestionFilter(null)} style={styles.clearFilterBtn}>
              <Text style={styles.clearFilterText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* CONTENT LIST */}
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
        
        {/* SUBTAB 1 : ORDERS LIST */}
        {subTab === 'orders' && (
          filteredOrders.length === 0 ? (
            <Text style={styles.noResultsText}>Aucune commande trouvée</Text>
          ) : (
            filteredOrders.map((item) => {
              const status = getStatusColor(item.statut);
              const client = customers.find(c => c.id === item.customer_id);
              const isFinished = animatingOrderIds[item.id] !== undefined;
              const finishedStatus = animatingOrderIds[item.id];
              return (
                <MotiView
                  key={item.id}
                  animate={{
                    opacity: isFinished ? 0 : 1,
                    scale: isFinished ? 0 : 1,
                  }}
                  transition={{
                    type: 'timing',
                    duration: 120,
                    delay: isFinished ? 100 : 0,
                  }}
                  style={{ marginBottom: 16 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedOrder(item)}
                    style={styles.orderCard}
                  >
                  {/* HEADER : Ticket ID & Status pill */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTicketNo}>Ticket #{getDisplayTicketId(item)}</Text>
                    <View style={[styles.statusTag, { backgroundColor: status.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.text }]} />
                      <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>

                  {/* CLIENT & PRICE ROW */}
                  <View style={styles.cardDetails}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (client) setSelectedClient(client);
                      }}
                      activeOpacity={0.8}
                      style={styles.clientPillBtn}
                    >
                      <User size={13} color="#002cf7" style={{ marginRight: 4 }} />
                      <Text style={styles.clientPillBtnText}>
                        {client ? `${client.prenom} ${client.nom}` : 'Client Inconnu'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.cardPrice}>{formatPrice(item.prix_total || item.total)}</Text>
                  </View>
                  
                  {/* ARTICLES LIST */}
                  <View style={styles.cardExtraInfoRow}>
                    <Shirt size={14} color="#64748b" style={{ marginRight: 6 }} />
                    <Text style={styles.cardExtraInfoText} numberOfLines={1}>
                      {getItemsSummary(item.items || item.articles)}
                    </Text>
                  </View>

                  {client && client.active_subscription && (
                    <View style={styles.cardSubscriptionGaugeContainer}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.cardSubText}>Abonnement : {client.active_subscription.name}</Text>
                        <Text style={styles.cardSubTextBold}>
                          {client.active_subscription.remaining_clothes} / {client.active_subscription.total_clothes} vêt.
                        </Text>
                      </View>
                      {(() => {
                        const remaining = client.active_subscription.remaining_clothes;
                        const total = client.active_subscription.total_clothes;
                        const percentUsed = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
                        return (
                          <View style={styles.cardProgressBarBg}>
                            <View style={[styles.cardProgressBarFill, { width: `${percentUsed}%` }]} />
                          </View>
                        );
                      })()}
                    </View>
                  )}

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaBadge}>
                      <Calendar size={10} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.metaBadgeText}>Retrait : {formatDate(item.due_date || item.date_retrait_prevue)}</Text>
                    </View>
                    <View style={[styles.metaBadge, item.niveau_urgence === 'Express' && styles.metaBadgeUrgent]}>
                      <Clock size={10} color={item.niveau_urgence === 'Express' ? '#e11d48' : '#64748b'} style={{ marginRight: 4 }} />
                      <Text style={[styles.metaBadgeText, item.niveau_urgence === 'Express' && styles.metaBadgeUrgentText]}>
                        {item.niveau_urgence || 'Normal'}
                      </Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <CreditCard size={10} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.metaBadgeText}>{item.mode_reglement || item.mode_paiement || 'Espèces'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />
                  <View style={styles.cardFooterArea}>
                    <View style={styles.cardFooterRow}>
                      <TouchableOpacity
                        onPress={(e) => handleShowInvoice(item, e)}
                        style={styles.factureBtn}
                        activeOpacity={0.7}
                      >
                        <Receipt size={13} color="#002cf7" style={{ marginRight: 4 }} />
                        <Text style={styles.factureBtnText}>Facture</Text>
                      </TouchableOpacity>
                      {item.statut !== 'annule' && item.statut !== 'livre' && item.statut !== 'restitue' && 
                        currentUser && currentUser.role !== 'livreur' && currentUser.role !== 'agent_lavage_repassage' && (
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); handleCancelOrder(item); }}
                            style={[
                              styles.factureBtn, 
                              { 
                                marginLeft: 8, 
                                backgroundColor: cancelBtnStyle.backgroundColor, 
                                borderColor: cancelBtnStyle.borderColor 
                              }
                            ]}
                            activeOpacity={0.7}
                          >
                            <Ban size={13} color="#ef4444" style={{ marginRight: 4 }} />
                            <Text style={[styles.factureBtnText, { color: '#ef4444' }]}>Annuler</Text>
                          </TouchableOpacity>
                        )}
                    </View>

                    {/* Next Status Button */}
                    {(() => {
                      const status = item.statut;
                      
                      if (status === 'pret') {
                        const canLivrer = isTransitionAllowed('pret', 'a_livrer');
                        const canRecuperer = isTransitionAllowed('pret', 'a_recuperer');
                        
                        return (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            <TouchableOpacity
                              onPress={canLivrer ? (e) => {
                                e.stopPropagation();
                                handleNextStatusDirectList(item, 'a_livrer');
                              } : null}
                              disabled={!canLivrer}
                              activeOpacity={canLivrer ? 0.8 : 1}
                              style={{ flex: 1 }}
                            >
                              <MotiView
                                animate={{ backgroundColor: canLivrer ? '#4f46e5' : (isDarkMode ? '#334155' : '#f1f5f9') }}
                                style={[styles.cardNextStatusBlockBtn, { minHeight: 38, marginTop: 8 }]}
                              >
                                <Truck size={12} color={canLivrer ? '#ffffff' : '#94a3b8'} style={{ marginRight: 4 }} />
                                <Text style={[styles.cardNextStatusBlockBtnText, { fontSize: 11, color: canLivrer ? '#ffffff' : '#94a3b8' }]}>
                                  À livrer
                                </Text>
                              </MotiView>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              onPress={canRecuperer ? (e) => {
                                e.stopPropagation();
                                handleNextStatusDirectList(item, 'a_recuperer');
                              } : null}
                              disabled={!canRecuperer}
                              activeOpacity={canRecuperer ? 0.8 : 1}
                              style={{ flex: 1 }}
                            >
                              <MotiView
                                animate={{ backgroundColor: canRecuperer ? '#d97706' : (isDarkMode ? '#334155' : '#f1f5f9') }}
                                style={[styles.cardNextStatusBlockBtn, { minHeight: 38, marginTop: 8 }]}
                              >
                                <User size={12} color={canRecuperer ? '#ffffff' : '#94a3b8'} style={{ marginRight: 4 }} />
                                <Text style={[styles.cardNextStatusBlockBtnText, { fontSize: 11, color: canRecuperer ? '#ffffff' : '#94a3b8' }]}>
                                  À récupérer
                                </Text>
                              </MotiView>
                            </TouchableOpacity>
                          </View>
                        );
                      }
                      
                      let targetStatus = null;
                      if (status === 'attente' || status === 'en_attente') targetStatus = 'traitement';
                      else if (status === 'traitement') targetStatus = 'en_cours_lavage';
                      else if (status === 'lavage_cours' || status === 'en_cours_lavage') targetStatus = 'en_cours_repassage';
                      else if (status === 'repassage_cours' || status === 'en_cours_repassage') targetStatus = 'pret';
                      else if (status === 'a_livrer') targetStatus = 'en_cours_livraison';
                      else if (status === 'en_cours_livraison') targetStatus = 'restitue';
                      else if (status === 'a_recuperer') targetStatus = 'restitue';

                      if (!targetStatus) return null;
                      
                      const canTransition = isTransitionAllowed(status, targetStatus);
                      const nextStyle = getNextStatusStyle(item.statut);
                      if (!nextStyle) return null;
                      
                      const getNextStatusIcon = (status) => {
                        if (status === 'attente' || status === 'en_attente') return 'Sparkles';
                        if (status === 'traitement') return 'Wind';
                        if (status === 'lavage_cours' || status === 'en_cours_lavage') return 'Shirt';
                        if (status === 'repassage_cours' || status === 'en_cours_repassage') return 'Check';
                        if (status === 'a_livrer') return 'Truck';
                        if (status === 'en_cours_livraison') return 'ShoppingBag';
                        return 'CheckCircle';
                      };
                      
                      const iconName = getNextStatusIcon(item.statut);
                      
                      return (
                        <TouchableOpacity
                          onPress={canTransition ? (e) => {
                            e.stopPropagation();
                            handleNextStatus(item, false);
                          } : null}
                          disabled={!canTransition}
                          activeOpacity={canTransition ? 0.8 : 1}
                          style={{ marginHorizontal: 4 }}
                        >
                          <MotiView
                            animate={{
                              backgroundColor: canTransition ? nextStyle.bg : (isDarkMode ? '#334155' : '#f1f5f9'),
                            }}
                            transition={{
                              type: 'timing',
                              duration: 150,
                            }}
                            style={styles.cardNextStatusBlockBtn}
                          >
                            <MotiView
                              key={iconName}
                              from={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: 'timing', duration: 120 }}
                              style={{ marginRight: 6 }}
                            >
                              {iconName === 'Sparkles' && <Sparkles size={13} color={canTransition ? '#ffffff' : '#94a3b8'} />}
                              {iconName === 'Wind' && <Wind size={13} color={canTransition ? '#ffffff' : '#94a3b8'} />}
                              {iconName === 'Shirt' && <Shirt size={13} color={canTransition ? '#ffffff' : '#94a3b8'} />}
                              {iconName === 'Check' && <Check size={13} color={canTransition ? '#ffffff' : '#94a3b8'} />}
                              {iconName === 'Truck' && <Truck size={13} color={canTransition ? '#ffffff' : '#94a3b8'} />}
                              {iconName === 'ShoppingBag' && <ShoppingBag size={13} color={canTransition ? '#ffffff' : '#94a3b8'} />}
                              {iconName === 'CheckCircle' && <CheckCircle size={13} color={canTransition ? '#ffffff' : '#94a3b8'} />}
                            </MotiView>
                            <MotiView
                              key={nextStyle.label}
                              from={{ opacity: 0, translateX: 5 }}
                              animate={{ opacity: 1, translateX: 0 }}
                              transition={{ type: 'timing', duration: 120 }}
                            >
                              <Text style={[styles.cardNextStatusBlockBtnText, { color: canTransition ? '#ffffff' : '#94a3b8' }]}>
                                {nextStyle.label}
                              </Text>
                            </MotiView>
                          </MotiView>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                  
                  {/* OVERLAY FINISHED ANIMATION */}
                  {isFinished && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          backgroundColor: finishedStatus === 'annule' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(34, 197, 94, 0.95)',
                          justifyContent: 'center',
                          alignItems: 'center',
                          zIndex: 100,
                          borderRadius: 24,
                        }
                      ]}
                    >
                      <MotiView
                        from={{ scale: 0.5, rotate: '-45deg' }}
                        animate={{ scale: 1, rotate: '0deg' }}
                        transition={{ type: 'spring', damping: 10, delay: 100 }}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: '#ffffff',
                          justifyContent: 'center',
                          alignItems: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 10,
                          elevation: 3,
                        }}
                      >
                        <Check 
                          size={28} 
                          color={finishedStatus === 'annule' ? '#ef4444' : '#22c55e'} 
                          strokeWidth={3} 
                        />
                      </MotiView>
                      <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 120, delay: 50 }}
                      >
                        <Text style={{
                          color: '#ffffff',
                          fontSize: 14,
                          fontWeight: '800',
                          marginTop: 10,
                          letterSpacing: 0.5,
                          textAlign: 'center',
                        }}>
                          {finishedStatus === 'annule' ? 'COMMANDE ANNULÉE' : 'COMMANDE TRAITÉE'}
                        </Text>
                      </MotiView>
                    </MotiView>
                  )}
                </TouchableOpacity>
              </MotiView>
            );
            })
          )
        )}

        {/* SUBTAB 2 : CLIENTS LIST */}
        {subTab === 'clients' && (
          filteredClients.length === 0 ? (
            <Text style={styles.noResultsText}>Aucun client trouvé</Text>
          ) : (
            filteredClients.map((client) => (
              <TouchableOpacity
                key={client.id}
                activeOpacity={0.7}
                onPress={() => setSelectedClient(client)}
                style={styles.clientCard}
              >
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.prenom} {client.nom}</Text>
                  <Text style={styles.clientPhone}>{client.telephone}</Text>
                </View>
                <ChevronRight size={16} color="#a1a1aa" />
              </TouchableOpacity>
            ))
          )
        )}

        {/* SUBTAB 3 : CATALOGUE */}
        {subTab === 'catalog' && (
          filteredCatalog.length === 0 ? (
            <Text style={styles.noResultsText}>Aucun article trouvé</Text>
          ) : (
            filteredCatalog.map((item) => (
              <View key={item.id} style={styles.catalogCard}>
                <View>
                  <Text style={styles.catalogArticle}>{item.article}</Text>
                  <Text style={styles.catalogService}>{item.service.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.catalogPrice}>{formatPrice(item.prix)}</Text>
              </View>
            ))
          )
        )}
      </ScrollView>



      {subTab === 'clients' && (
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.fabContainer}
        >
          <TouchableOpacity 
            activeOpacity={0.85}
            onPress={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
            style={styles.fab}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </MotiView>
      )}

      {/* MODAL 1 : DETAIL COMMANDE (BOTTOM SHEET) */}
      {showOrderDetails && selectedOrder && (
        <View style={styles.absoluteModalContainer}>
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleCloseOrderDetails}>
              <BlurView intensity={85} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <MotiView
              from={{ opacity: 0, scale: 0.88, translateY: 48 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 16, mass: 0.8 }}
              style={[styles.compactModalView, { maxHeight: '90%' }]}>
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Commande #{getDisplayTicketId(selectedOrder)}</Text>
                <TouchableOpacity onPress={handleCloseOrderDetails}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>
              {/* Infos Client */}
              <ScrollView
                style={{ flexGrow: 0 }}
                contentContainerStyle={styles.compactModalScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Client & Statut</Text>
                  <View style={styles.detailCard}>
                    <TouchableOpacity
                      onPress={() => {
                        const client = customers.find(c => c.id === selectedOrder.customer_id);
                        if (client) {
                          setShowOrderDetails(false);
                          setSelectedClient(client);
                        }
                      }}
                      activeOpacity={0.8}
                      style={[styles.clientPillBtn, { marginBottom: 8 }]}
                    >
                      <User size={13} color="#002cf7" style={{ marginRight: 4 }} />
                      <Text style={styles.clientPillBtnText}>
                        {customers.find(c => c.id === selectedOrder.customer_id) ? 
                          `${customers.find(c => c.id === selectedOrder.customer_id).prenom} ${customers.find(c => c.id === selectedOrder.customer_id).nom}` : 
                          'Client inconnu'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.detailTextMuted}>Téléphone : {customers.find(c => c.id === selectedOrder.customer_id)?.telephone || 'N/A'}</Text>
                    
                    <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedOrder.statut).bg, borderColor: getStatusColor(selectedOrder.statut).border, alignSelf: 'flex-start', marginTop: 8, borderWidth: 1 }]}>
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
                </View>
                {/* Articles */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Détail des Articles</Text>
                  <View style={styles.detailCard}>
                    {(selectedOrder.items || selectedOrder.articles || []).map((art, idx) => (
                      <View key={idx} style={styles.detailArticleRow}>
                        <Text style={styles.detailArticleText}>{art.article} ({art.service.replace(/_/g, ' ')}) x{art.quantite}</Text>
                        <Text style={styles.detailArticlePrice}>{formatPrice(art.prix * art.quantite)}</Text>
                      </View>
                    ))}
                    <View style={styles.detailDivider} />
                    {(selectedOrder.remise_pourcentage > 0 || selectedOrder.remise_montant > 0) && (
                      <>
                        <View style={styles.detailArticleRow}>
                          <Text style={styles.detailLabelMuted}>Sous-total</Text>
                          <Text style={styles.detailTextMuted}>
                            {formatPrice(selectedOrder.prix_base_avant_remise || (selectedOrder.items || selectedOrder.articles || []).reduce((sum, art) => sum + (art.prix * art.quantite), 0))}
                          </Text>
                        </View>
                        <View style={styles.detailArticleRow}>
                          <Text style={[styles.detailLabelMuted, { color: '#ef4444' }]}>
                            Réduction ({selectedOrder.remise_pourcentage || Math.round(((selectedOrder.remise_montant || 0) / (selectedOrder.prix_base_avant_remise || (selectedOrder.items || selectedOrder.articles || []).reduce((sum, art) => sum + (art.prix * art.quantite), 0) || 1)) * 100)}%)
                          </Text>
                          <Text style={[styles.detailTextMuted, { color: '#ef4444', fontWeight: '600' }]}>
                            -{formatPrice(selectedOrder.remise_montant || ((selectedOrder.items || selectedOrder.articles || []).reduce((sum, art) => sum + (art.prix * art.quantite), 0) - (selectedOrder.prix_total || selectedOrder.total)))}
                          </Text>
                        </View>
                      </>
                    )}
                    <View style={styles.detailArticleRow}>
                      <Text style={styles.detailLabelBold}>Total</Text>
                      <Text style={styles.detailPriceBold}>{formatPrice(selectedOrder.prix_total || selectedOrder.total)}</Text>
                    </View>
                    <View style={styles.detailArticleRow}>
                      <Text style={styles.detailLabelMuted}>Payé (Avance)</Text>
                      <Text style={styles.detailTextMuted}>{formatPrice(selectedOrder.avance_payee !== undefined ? selectedOrder.avance_payee : selectedOrder.avance)}</Text>
                    </View>
                    <View style={styles.detailArticleRow}>
                      <Text style={styles.detailLabelMuted}>Reste à payer</Text>
                      <Text style={styles.detailTextMuted}>
                        {formatPrice((selectedOrder.prix_total || selectedOrder.total) - (selectedOrder.avance_payee !== undefined ? selectedOrder.avance_payee : (selectedOrder.avance || 0)))}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Dates & Paiement */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Détails Logistiques</Text>
                  <View style={styles.detailCard}>
                    <Text style={styles.logisticsText}>
                      Date retrait prévue : {selectedOrder.due_date ? new Date(selectedOrder.due_date).toLocaleDateString('fr-FR') : selectedOrder.date_retrait_prevue}
                    </Text>
                    <Text style={styles.logisticsText}>Mode de paiement : {selectedOrder.mode_reglement || selectedOrder.mode_paiement}</Text>
                  </View>
                </View>

                {/* Cancel & Delete Buttons */}
                {selectedOrder.statut !== 'annule' && selectedOrder.statut !== 'livre' && selectedOrder.statut !== 'restitue' && 
                 currentUser && currentUser.role !== 'livreur' && currentUser.role !== 'agent_lavage_repassage' && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 4, paddingHorizontal: 2 }}>
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

                 {/* Action Button for changing status */}
                 <View style={{ paddingHorizontal: 2 }}>
                 {selectedOrder.statut !== 'livre' && selectedOrder.statut !== 'restitue' && selectedOrder.statut !== 'annule' && (() => {
                   const status = selectedOrder.statut;
                   
                   // If status is 'pret', render two buttons side by side
                   if (status === 'pret') {
                     const canLivrer = isTransitionAllowed('pret', 'a_livrer');
                     const canRecuperer = isTransitionAllowed('pret', 'a_recuperer');
                     
                     return (
                       <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 }}>
                         <TouchableOpacity
                           onPress={canLivrer ? () => handleUpdateStatusDirect(selectedOrder, 'a_livrer') : null}
                           disabled={!canLivrer}
                           activeOpacity={canLivrer ? 0.88 : 1}
                           style={{ flex: 1 }}
                         >
                           <MotiView
                             animate={{ backgroundColor: canLivrer ? '#4f46e5' : (isDarkMode ? '#334155' : '#f1f5f9') }}
                             style={styles.statusChangeBtnSide}
                           >
                             <Truck size={16} color={canLivrer ? '#ffffff' : '#94a3b8'} style={{ marginRight: 6 }} />
                             <Text style={[styles.statusChangeBtnText, { color: canLivrer ? '#ffffff' : '#94a3b8' }]}>À livrer</Text>
                           </MotiView>
                         </TouchableOpacity>
                         
                         <TouchableOpacity
                           onPress={canRecuperer ? () => handleUpdateStatusDirect(selectedOrder, 'a_recuperer') : null}
                           disabled={!canRecuperer}
                           activeOpacity={canRecuperer ? 0.88 : 1}
                           style={{ flex: 1 }}
                         >
                           <MotiView
                             animate={{ backgroundColor: canRecuperer ? '#d97706' : (isDarkMode ? '#334155' : '#f1f5f9') }}
                             style={styles.statusChangeBtnSide}
                           >
                             <User size={16} color={canRecuperer ? '#ffffff' : '#94a3b8'} style={{ marginRight: 6 }} />
                             <Text style={[styles.statusChangeBtnText, { color: canRecuperer ? '#ffffff' : '#94a3b8' }]}>À récupérer</Text>
                           </MotiView>
                         </TouchableOpacity>
                       </View>
                     );
                   }
                   
                   // For all other statuses, render a single button
                   const getSingleStatusDetails = () => {
                     let targetStatus = null;
                     if (status === 'attente' || status === 'en_attente') targetStatus = 'traitement';
                     else if (status === 'traitement') targetStatus = 'en_cours_lavage';
                     else if (status === 'lavage_cours' || status === 'en_cours_lavage') targetStatus = 'en_cours_repassage';
                     else if (status === 'repassage_cours' || status === 'en_cours_repassage') targetStatus = 'pret';
                     else if (status === 'a_livrer') targetStatus = 'en_cours_livraison';
                     else if (status === 'en_cours_livraison') targetStatus = 'livre';
                     else if (status === 'a_recuperer') targetStatus = 'restitue';

                     if (!targetStatus) return null;

                     if (status === 'attente' || status === 'en_attente') {
                       return {
                         label: 'Passer au traitement',
                         icon: 'Sparkles',
                         color: '#7c3aed', // Purple for processing
                         iconColor: '#ffffff',
                         nextStatus: 'traitement',
                         animation: {
                           from: { rotate: '0deg', scale: 0.95 },
                           animate: { rotate: '15deg', scale: [1, 1.1, 1] },
                           transition: { loop: true, type: 'timing', duration: 1500 }
                         }
                       };
                     } else if (status === 'traitement') {
                       return {
                         label: 'Lancer le lavage',
                         icon: 'Wind',
                         color: '#002cf7', // Blue for laundry
                         iconColor: '#ffffff',
                         nextStatus: 'en_cours_lavage',
                         animation: {
                           from: { rotate: '0deg' },
                           animate: { rotate: '360deg' },
                           transition: { loop: true, type: 'timing', duration: 2500, ease: 'linear' }
                         }
                       };
                     } else if (status === 'lavage_cours' || status === 'en_cours_lavage') {
                       return {
                         label: 'Passer au repassage',
                         icon: 'Shirt',
                         color: '#0d9488', // Teal for ironing
                         iconColor: '#ffffff',
                         nextStatus: 'en_cours_repassage',
                         animation: {
                           from: { translateY: 0 },
                           animate: { translateY: [-2, 2, -2] },
                           transition: { loop: true, type: 'timing', duration: 1000 }
                         }
                       };
                     } else if (status === 'repassage_cours' || status === 'en_cours_repassage') {
                       return {
                         label: 'Marquer comme prêt',
                         icon: 'Check',
                         color: '#059669', // Green for ready
                         iconColor: '#ffffff',
                         nextStatus: 'pret',
                         animation: {
                           from: { scale: 0.8 },
                           animate: { scale: [1, 1.2, 1] },
                           transition: { loop: true, type: 'spring', damping: 10, stiffness: 100 }
                         }
                       };
                     } else if (status === 'a_livrer') {
                       return {
                         label: 'Démarrer la livraison',
                         icon: 'Truck',
                         color: '#4f46e5', // Indigo for delivery start
                         iconColor: '#ffffff',
                         nextStatus: 'en_cours_livraison',
                         animation: {
                           from: { translateX: -3 },
                           animate: { translateX: [0, 3, 0] },
                           transition: { loop: true, type: 'timing', duration: 1000 }
                         }
                       };
                     } else if (status === 'en_cours_livraison') {
                       return {
                         label: 'Terminer la livraison',
                         icon: 'ShoppingBag',
                         color: '#09090b', // Dark for delivery end
                         iconColor: '#ffffff',
                         nextStatus: 'livre',
                         animation: {
                           from: { scale: 0.9 },
                           animate: { scale: [1, 1.1, 1] },
                           transition: { loop: true, type: 'timing', duration: 1500 }
                         }
                       };
                     } else if (status === 'a_recuperer') {
                       return {
                         label: 'Marquer comme récupéré',
                         icon: 'CheckCircle',
                         color: '#d97706', // Orange for pickup
                         iconColor: '#ffffff',
                         nextStatus: 'restitue',
                         animation: {
                           from: { scale: 0.8 },
                           animate: { scale: [1, 1.15, 1] },
                           transition: { loop: true, type: 'spring', damping: 10 }
                         }
                       };
                     }
                     return null;
                   };

                   const btn = getSingleStatusDetails();
                   if (!btn) return null;

                   const canTransition = isTransitionAllowed(status, btn.nextStatus);

                   return (
                     <TouchableOpacity
                       onPress={canTransition ? () => handleNextStatus(selectedOrder, true) : null}
                       disabled={!canTransition}
                       activeOpacity={canTransition ? 0.88 : 1}
                       style={{ width: '100%' }}
                     >
                       <MotiView
                         animate={{
                           backgroundColor: canTransition ? btn.color : (isDarkMode ? '#334155' : '#ffffff')
                         }}
                         transition={{
                           type: 'timing',
                           duration: 150
                         }}
                         style={styles.statusChangeBtn}
                       >
                         <MotiView
                           key={btn.icon}
                           from={{ opacity: 0, scale: 0.3, rotate: '-45deg' }}
                           animate={{ 
                             opacity: 1, 
                             scale: 1, 
                             rotate: '0deg',
                             ...(canTransition && btn.animation ? btn.animation.animate : {})
                           }}
                           transition={canTransition && btn.animation ? btn.animation.transition : { type: 'timing', duration: 120 }}
                           style={{ marginRight: 8 }}
                         >
                            {btn.icon === 'Sparkles' && <Sparkles size={16} color={canTransition ? btn.iconColor : '#94a3b8'} />}
                            {btn.icon === 'Wind' && <Wind size={16} color={canTransition ? btn.iconColor : '#94a3b8'} />}
                            {btn.icon === 'Shirt' && <Shirt size={16} color={canTransition ? btn.iconColor : '#94a3b8'} />}
                            {btn.icon === 'Check' && <Check size={16} color={canTransition ? btn.iconColor : '#94a3b8'} />}
                            {btn.icon === 'Truck' && <Truck size={16} color={canTransition ? btn.iconColor : '#94a3b8'} />}
                            {btn.icon === 'ShoppingBag' && <ShoppingBag size={16} color={canTransition ? btn.iconColor : '#94a3b8'} />}
                            {btn.icon === 'CheckCircle' && <CheckCircle size={16} color={canTransition ? btn.iconColor : '#94a3b8'} />}
                         </MotiView>
                         
                         <MotiView
                           key={btn.label}
                           from={{ opacity: 0, translateY: 10 }}
                           animate={{ opacity: 1, translateY: 0 }}
                           transition={{ type: 'timing', duration: 150 }}
                         >
                           <Text style={[styles.statusChangeBtnText, { color: canTransition ? '#ffffff' : '#94a3b8' }]}>
                              {btn.label}
                            </Text>
                         </MotiView>
                       </MotiView>
                     </TouchableOpacity>
                   );
                 })()}
                  </View>

              </ScrollView>
            </MotiView>
          </View>
        </View>
      )}

      {/* MODAL 3 : CRÉATION / MODIFICATION CLIENT */}
      {showCustomerModal && (
        <View style={styles.absoluteModalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.compactModalOverlay}>
              <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleCloseCustomerModal}>
                <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
              </TouchableOpacity>
              <MotiView
                from={{ opacity: 0, scale: 0.88, translateY: 48 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 16, mass: 0.8 }}
                style={styles.compactModalView}>
                <View style={styles.compactModalHeader}>
                  <Text style={styles.compactModalTitle}>
                    {editingCustomer ? "Modifier le Profil Client" : "Nouveau Profil Client"}
                  </Text>
                  <TouchableOpacity onPress={handleCloseCustomerModal}>
                    <X size={20} color="#71717a" />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.compactModalScroll} bounces={false}>
                  <View style={styles.compactInputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compactLabel}>Prénom</Text>
                      <TextInput
                        placeholder="Prénom"
                        placeholderTextColor="#a1a1aa"
                        value={custPrenom}
                        onChangeText={setCustPrenom}
                        style={styles.compactInput}
                      />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compactLabel}>Nom</Text>
                      <TextInput
                        placeholder="Nom"
                        placeholderTextColor="#a1a1aa"
                        value={custNom}
                        onChangeText={setCustNom}
                        style={styles.compactInput}
                      />
                    </View>
                  </View>

                  <Text style={styles.compactLabel}>Téléphone</Text>
                  <TextInput
                    placeholder="Ex: +229 97 00 00 00"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="phone-pad"
                    value={custTelephone}
                    onChangeText={setCustTelephone}
                    style={styles.compactInput}
                  />

                  <Text style={styles.compactLabel}>Adresse</Text>
                  <TextInput
                    placeholder="Ex: Cotonou, Haie Vive"
                    placeholderTextColor="#a1a1aa"
                    value={custAdresse}
                    onChangeText={setCustAdresse}
                    style={styles.compactInput}
                  />

                  <Text style={styles.compactLabel}>Préférence de pliage</Text>
                  <View style={styles.prefSelector}>
                    <TouchableOpacity 
                      onPress={() => setCustPreferences('Plié')}
                      style={[styles.prefOption, custPreferences === 'Plié' && styles.prefOptionActive]}
                    >
                      <Text style={[styles.prefText, custPreferences === 'Plié' && styles.prefTextActive]}>Plié</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setCustPreferences('Cintre')}
                      style={[styles.prefOption, custPreferences === 'Cintre' && styles.prefOptionActive]}
                    >
                      <Text style={[styles.prefText, custPreferences === 'Cintre' && styles.prefTextActive]}>Sur Cintre</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleSaveCustomer}
                    style={styles.compactSubmitBtn}
                  >
                    <Text style={styles.compactSubmitBtnText}>Enregistrer le client</Text>
                  </TouchableOpacity>
                </ScrollView>
              </MotiView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* MODAL 4 : DETAIL CLIENT (FICHE CLIENT) */}
      <ClientDetailModal
        visible={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEditClient={(client) => handleEditCustomer(client)}
        onShowSuccess={onShowSuccess}
      />

      {/* MODAL 5 : INVOICE / FACTURE (CENTERED POPUP DIALOG) */}
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
                          {(() => {
                            const c = customers.find(cust => cust.id === invoiceOrder.customer_id);
                            return c ? `${c.prenom} ${c.nom}` : 'Client Inconnu';
                          })()}
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
                        <Text style={styles.tpeTotalLabelBold}>NET A PAYER</Text>
                        <Text style={styles.tpeTotalValBold}>{formatPrice(invoiceOrder.prix_total || invoiceOrder.total)}</Text>
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
              transition={{ type: 'timing', duration: 150 }}
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

      {/* MODAL 5 : CONFIRMATION DU PAIEMENT DE LA COMMANDE */}
      <MotiView
        pointerEvents={paymentModalVisible ? 'auto' : 'none'}
        animate={{
          opacity: paymentModalVisible ? 1 : 0
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
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setPaymentModalVisible(false)}>
              <BlurView intensity={85} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            
            <View style={[styles.popupModalView, { width: '92%', maxWidth: 380, padding: 22 }]}>
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Confirmation du Règlement</Text>
                <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                  <X size={20} color={isDarkMode ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {paymentOrder && (() => {
                const total = paymentOrder.prix_total || 0;
                const avance = paymentOrder.avance_payee || 0;
                const solde = total - avance;

                return (
                  <ScrollView contentContainerStyle={{ paddingVertical: 10 }} bounces={false} showsVerticalScrollIndicator={false}>
                    {/* Financial Summary */}
                    <View style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 18, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Total Commande</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isDarkMode ? '#ffffff' : '#0f172a' }}>{formatPrice(total)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Acompte déjà payé</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#16a34a' }}>{formatPrice(avance)}</Text>
                      </View>
                      <View style={{ height: 1, backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', marginVertical: 8 }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Solde restant à régler</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#ef4444' }}>{formatPrice(solde)}</Text>
                      </View>
                    </View>

                    {/* Payment Method Selector */}
                    <Text style={{ fontSize: 13, fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#334155', marginBottom: 8 }}>
                      Mode de règlement du solde
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setPaymentMethod('Espèces');
                          setMomoRefError('');
                        }}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 12,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: paymentMethod === 'Espèces' ? '#002cf7' : (isDarkMode ? '#334155' : '#cbd5e1'),
                          backgroundColor: paymentMethod === 'Espèces' ? (isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#e0e7ff') : 'transparent'
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: paymentMethod === 'Espèces' ? '#002cf7' : (isDarkMode ? '#94a3b8' : '#64748b') }}>
                          Espèces (Cash)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setPaymentMethod('Mobile Money')}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 12,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: paymentMethod === 'Mobile Money' ? '#002cf7' : (isDarkMode ? '#334155' : '#cbd5e1'),
                          backgroundColor: paymentMethod === 'Mobile Money' ? (isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#e0e7ff') : 'transparent'
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: paymentMethod === 'Mobile Money' ? '#002cf7' : (isDarkMode ? '#94a3b8' : '#64748b') }}>
                          Mobile Money
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Reference Input for Mobile Money */}
                    {paymentMethod === 'Mobile Money' && (
                      <View style={{ marginBottom: 18 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#334155', marginBottom: 8 }}>
                          Numéro de Référence <Text style={{ color: '#ef4444' }}>*</Text>
                        </Text>
                        <TextInput
                          value={momoRefNumber}
                          onChangeText={(text) => {
                            setMomoRefNumber(text);
                            if (text.trim()) setMomoRefError('');
                          }}
                          placeholder="Ex: TXN12345678"
                          placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                          style={{
                            borderWidth: 1,
                            borderColor: momoRefError ? '#ef4444' : (isDarkMode ? '#334155' : '#cbd5e1'),
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 13,
                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff'
                          }}
                        />
                        {momoRefError ? (
                          <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{momoRefError}</Text>
                        ) : null}
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <TouchableOpacity
                        onPress={() => setPaymentModalVisible(false)}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                          Annuler
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleConfirmPaymentAndComplete}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          backgroundColor: '#16a34a',
                          paddingVertical: 12,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>
                          Confirmer
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </View>
      </MotiView>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  absoluteModalContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  tabHeader: {
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 10,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(9, 9, 11, 0.05)',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  tabButtonTextActive: {
    color: '#09090b',
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#09090b',
    fontWeight: '500',
    height: '100%',
  },
  filterPillSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 44, 247, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  filterPillText: {
    fontSize: 12,
    color: '#002cf7',
    fontWeight: '600',
  },
  clearFilterBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#002cf7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: '800',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 100,
  },
  fab: {
    backgroundColor: '#09090b',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 110,
  },
  noResultsText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardClientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  cardTicketNo: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002cf7',
  },
  clientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  clientPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  catalogCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  catalogArticle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  catalogService: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  catalogPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalView: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeaderClose: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    backgroundColor: '#ffffff',
  },
  modalTitleLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalScroll: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
  },
  detailTextLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailArticleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailArticleText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  detailArticlePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  detailLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailPriceBold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  detailLabelMuted: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  detailTextMuted: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  logisticsText: {
    fontSize: 13,
    color: '#334155',
    paddingVertical: 3,
    fontWeight: '500',
  },
  statusChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusChangeBtnSide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusChangeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 14,
    marginBottom: 6,
  },
  selectMargin: {
    marginBottom: 12,
  },
  catalogScrollRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  catalogBadge: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  catalogBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  catalogBadgeService: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  catalogBadgePrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 4,
  },
  selectedContainer: {
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
  selectedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  selectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  selectedRowService: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  formInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 14,
  },
  submitOrderBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  submitOrderBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Compact Bottom-Sheet Client Modal Styles
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
  compactInputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  compactInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 12,
  },
  prefSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  prefOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  prefOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prefText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  prefTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  compactSubmitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  compactSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Fiche Client Detail styles
  clientProfileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  clientProfilePhone: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    fontWeight: '500',
  },
  clientProfileAddress: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  clientProfilePreferences: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 6,
    fontWeight: '600',
  },
  clientActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  clientEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clientEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  clientDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#ffe4e6',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clientDeleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f43f5e',
  },
  orderHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  orderHistoryNo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  orderHistoryDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  orderHistoryTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  categoryTabsRow: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 8,
  },
  categoryTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  categoryTabBtnActive: {
    backgroundColor: '#002cf7',
  },
  categoryTabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryTabBtnTextActive: {
    color: '#ffffff',
  },
  formArticlesList: {
    marginVertical: 8,
    gap: 8,
  },
  formArticleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
  },
  formArticleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  formArticleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  miniServiceTag: {
    backgroundColor: 'rgba(0, 44, 247, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniServiceTagText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#002cf7',
  },
  formArticlePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  formArticleAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 44, 247, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.1)',
  },
  formArticleAddBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#002cf7',
  },
  formArticleQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formQtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#002cf7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formQtyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  formQtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 8,
  },
  paymentMethodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  paymentMethodBtnActive: {
    borderColor: '#002cf7',
    backgroundColor: 'rgba(0, 44, 247, 0.05)',
  },
  paymentMethodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  paymentMethodBtnTextActive: {
    color: '#002cf7',
    fontWeight: '600',
  },
  formPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 14,
  },
  formPresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  formPresetBtnActive: {
    borderColor: '#002cf7',
    backgroundColor: 'rgba(0, 44, 247, 0.05)',
  },
  formPresetBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  formPresetBtnTextActive: {
    color: '#002cf7',
    fontWeight: '600',
  },
  receiptPreviewCard: {
    backgroundColor: 'rgba(0, 44, 247, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptRowLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  receiptRowLabelBold: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  receiptRowVal: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  receiptRowValBold: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  receiptRowValTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 44, 247, 0.1)',
    marginVertical: 8,
  },
  // Header styles
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
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  // Top Actions styles
  topActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  topActionBtnBlue: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002cf7',
    borderRadius: 14,
    height: 40,
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  topActionBtnTextBlue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  topActionBtnWhite: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#002cf7',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 40,
  },
  topActionBtnTextWhite: {
    color: '#002cf7',
    fontSize: 11,
    fontWeight: '600',
  },
  // 3-Button Filter styles
  statusFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  statusFilterBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  statusFilterBtnActive: {
    backgroundColor: '#09090b',
    borderColor: '#09090b',
  },
  statusFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  statusFilterTextActive: {
    color: '#ffffff',
  },
  // Order card style updates & invoice button styles
  urgencyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  urgencyBtn: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  urgencyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  formRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  receiptRowLabelMuted: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  receiptRowValMuted: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  cardExtraInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardExtraInfoText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaBadgeText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  metaBadgeUrgent: {
    borderColor: '#ffe4e6',
    backgroundColor: '#fff1f2',
  },
  metaBadgeUrgentText: {
    color: '#e11d48',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  factureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 44, 247, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 44, 247, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  factureBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#002cf7',
  },
  nextStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002cf7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  nextStatusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Invoice Modal specific styles
  invoiceHeaderArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  popupModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  popupModalView: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    width: '95%',
    maxWidth: 370,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardFooterArea: {
    paddingTop: 8,
    gap: 8,
  },
  cardNextStatusBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardNextStatusBlockBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  tpeScroll: {
    paddingBottom: 10,
  },
  tpeReceiptContainer: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 14,
    borderRadius: 12,
  },
  tpeBrand: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1c1917',
    letterSpacing: 1.5,
  },
  tpeBrandSub: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    color: '#78716c',
    letterSpacing: 0.8,
    marginTop: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  tpeTextMuted: {
    fontSize: 10,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 14,
  },
  tpeTextMutedCentred: {
    fontSize: 9,
    color: '#a8a29e',
    textAlign: 'center',
    marginTop: 10,
  },
  tpeDashedDivider: {
    fontSize: 12,
    color: '#d6d3d1',
    textAlign: 'center',
    letterSpacing: 2,
    marginVertical: 10,
  },
  tpeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  tpeMetaLabel: {
    fontSize: 11,
    color: '#78716c',
    fontWeight: '500',
  },
  tpeMetaVal: {
    fontSize: 11,
    color: '#1c1917',
    fontWeight: '600',
  },
  tpeSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#44403c',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tpeItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  tpeItemName: {
    fontSize: 12,
    color: '#1c1917',
    fontWeight: '600',
  },
  tpeItemService: {
    fontSize: 9,
    color: '#78716c',
    textTransform: 'uppercase',
  },
  tpeItemQty: {
    fontSize: 11,
    color: '#44403c',
    fontWeight: '500',
    marginHorizontal: 8,
  },
  tpeItemPrice: {
    fontSize: 11,
    color: '#1c1917',
    fontWeight: '600',
  },
  tpeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  tpeTotalLabel: {
    fontSize: 11,
    color: '#44403c',
    fontWeight: '500',
  },
  tpeTotalVal: {
    fontSize: 11,
    color: '#1c1917',
    fontWeight: '600',
  },
  tpeTotalLabelBold: {
    fontSize: 11,
    color: '#1c1917',
    fontWeight: '700',
  },
  tpeTotalValBold: {
    fontSize: 11,
    color: '#1c1917',
    fontWeight: '700',
  },
  tpeFooterMessage: {
    fontSize: 11,
    fontWeight: '700',
    color: '#44403c',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  barcodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#a8a29e',
    paddingVertical: 10,
    marginVertical: 6,
    borderRadius: 4,
  },
  barcodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1c1917',
    letterSpacing: 2,
  },
  invoiceBrand: {
    fontSize: 22,
    fontWeight: '700',
    color: '#002cf7',
    letterSpacing: 2,
  },
  invoiceMuted: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  invoiceDetailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  invoiceInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  invoiceInfoVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  invoiceInfoValBold: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  invoiceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  invoiceItemName: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  invoiceItemService: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  invoiceItemQty: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  invoiceItemPrice: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  invoiceTotalLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  invoiceTotalLabelBold: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  invoiceTotalLabelMuted: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  invoiceTotalVal: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  invoiceTotalValBold: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  invoiceTotalValMuted: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  invoiceFooterArea: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  invoiceFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  invoiceFooterSubtext: {
    fontSize: 9,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  invoiceCloseBtn: {
    backgroundColor: '#09090b',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  invoiceCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  fixedArticleContainer: {
    height: 310,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 10,
    marginVertical: 12,
  },
  clothingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  clothingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clothingName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  clothingAddBtn: {
    backgroundColor: 'rgba(0, 44, 247, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  clothingAddBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#002cf7',
  },
  clothingCloseBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  clothingCloseBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  servicesContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    gap: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  servicePrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#002cf7',
    marginTop: 2,
  },
  serviceAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 44, 247, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceAddBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#002cf7',
  },
  serviceQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceQtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#002cf7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceQtyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 14,
  },
  serviceQtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    minWidth: 16,
    textAlign: 'center',
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
  clientPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: 'rgba(0, 44, 247, 0.08)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    alignSelf: 'flex-start',
  },
  clientPillBtnText: {
    color: '#002cf7',
    fontSize: 11,
    fontWeight: '600',
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
    tabHeader: { backgroundColor: '#0f172a' },
    topActionsRow: { backgroundColor: '#0f172a' },
    topActionBtnWhite: { backgroundColor: '#1e293b', borderColor: '#334155' },
    topActionBtnTextWhite: { color: '#ffffff' },
    statusFilterRow: { backgroundColor: '#0f172a' },
    statusFilterBtn: { backgroundColor: '#1e293b', borderColor: '#334155' },
    statusFilterText: { color: '#cbd5e1' },
    searchSection: { backgroundColor: '#0f172a' },
    searchContainer: { backgroundColor: '#1e293b', borderColor: '#334155' },
    searchInput: { color: '#ffffff' },
    filterPillSection: { backgroundColor: '#0f172a' },
    filterPill: { backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    filterPillText: { color: '#38bdf8' },
    orderCard: { backgroundColor: '#1e293b', borderColor: '#334155', shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 5 },
    cardClientName: { color: '#ffffff' },
    cardTicketNo: { color: '#cbd5e1' },
    cardPrice: { color: '#ffffff' },
    cardExtraInfoText: { color: '#cbd5e1' },
    cardExtraInfoRow: { backgroundColor: '#0f172a', borderColor: '#334155' },
    metaBadge: { backgroundColor: '#334155', borderColor: '#475569' },
    metaBadgeText: { color: '#cbd5e1' },
    cardDivider: { backgroundColor: '#334155' },
    divider: { backgroundColor: '#334155' },
    factureBtn: { backgroundColor: 'rgba(0, 44, 247, 0.1)', borderColor: '#002cf7' },
    factureBtnText: { color: '#38bdf8' },
    cardProgressContainer: { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: '#334155' },
    cardProgressLabel: { color: '#cbd5e1' },
    cardProgressValue: { color: '#38bdf8' },
    cardProgressBarBg: { backgroundColor: '#334155' },
    tabSelector: { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
    tabButtonActive: { backgroundColor: '#1e293b' },
    tabButtonTextActive: { color: '#ffffff' },
    tabButtonTextInactive: { color: '#64748b' },
    card: { backgroundColor: '#1e293b', borderColor: '#334155' },
    cardTitle: { color: '#ffffff' },
    cardSubtitle: { color: '#94a3b8' },
    cardFooter: { borderTopColor: '#334155' },
    totalAmount: { color: '#ffffff' },
    sectionTitle: { color: '#94a3b8' },
    actionButton: { backgroundColor: '#1e293b', borderColor: '#334155' },
    actionText: { color: '#ffffff' },
    modalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    modalContent: { backgroundColor: '#1e293b', borderColor: '#334155' },
    modalTitle: { color: '#ffffff' },
    modalLabel: { color: '#e2e8f0' },
    modalInput: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' },
    infoRow: { borderBottomColor: '#334155' },
    infoLabel: { color: '#94a3b8' },
    infoValue: { color: '#ffffff' },
    clientPillBtn: { backgroundColor: 'rgba(0, 44, 247, 0.15)', borderColor: '#002cf7' },
    clientPillBtnText: { color: '#38bdf8' },
    emptyStateContainer: { backgroundColor: '#1e293b', borderColor: '#334155' },
    emptyStateText: { color: '#94a3b8' },
    
    // Clients tab list overrides
    clientCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    clientName: { color: '#ffffff' },
    clientTel: { color: '#cbd5e1' },
    clientFooter: { borderTopColor: '#334155' },
    clientMetaText: { color: '#94a3b8' },
    
    // Catalog overrides
    serviceCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    serviceName: { color: '#ffffff' },
    serviceDesc: { color: '#cbd5e1' },
    servicePrice: { color: '#ffffff' },
    catalogHeader: { backgroundColor: '#0f172a' },
    
    // Bottom Sheet Order modal list row overrides
    premiumDetailsOrderRowClickable: { backgroundColor: '#1e293b', borderColor: '#334155' },
    detailsListContainer: { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: '#334155' },

    // Modal popup views overrides (New client form, invoice details, order details)
    compactModalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    compactModalView: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 },
    compactModalTitle: { color: '#ffffff' },
    compactLabel: { color: '#cbd5e1' },
    compactInput: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff' },
    prefSelector: { backgroundColor: '#0f172a' },
    prefOptionActive: { backgroundColor: '#1e293b' },
    prefText: { color: '#cbd5e1' },
    prefTextActive: { color: '#ffffff' },
    
    popupModalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    popupModalView: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 },
    
    detailSectionTitle: { color: '#cbd5e1' },
    detailCard: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1 },
    detailTextMuted: { color: '#cbd5e1' },
    detailArticleText: { color: '#cbd5e1' },
    detailArticlePrice: { color: '#ffffff' },
    detailLabelBold: { color: '#ffffff' },
    detailLabelMuted: { color: '#94a3b8' },
    detailPriceBold: { color: '#38bdf8' },
    logisticsText: { color: '#cbd5e1' },
    detailDivider: { backgroundColor: '#334155' },

    // Client detailed profile fiche inside popup
    clientProfileName: { color: '#ffffff' },
    clientProfilePhone: { color: '#cbd5e1' },
    clientProfileAddress: { color: '#94a3b8' },
    clientProfilePreferences: { color: '#38bdf8' },
    clientEditBtn: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: '#38bdf8' },
    clientEditBtnText: { color: '#38bdf8' },
    clientDeleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#f43f5e' },
    clientDeleteBtnText: { color: '#f87171' },
    premiumSubscriptionCard: { backgroundColor: '#0f172a', borderColor: '#334155' },
    subscriptionTitle: { color: '#ffffff' },
    subActiveBadge: { backgroundColor: 'rgba(74, 222, 128, 0.1)' },
    subActiveBadgeText: { color: '#4ade80' },
    subPlanName: { color: '#38bdf8' },
    subPlanBalance: { color: '#cbd5e1' },
    progressBarBg: { backgroundColor: '#334155' },
    progressText: { color: '#cbd5e1' },
    subDateText: { color: '#94a3b8' },
    unsubscribeBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' },
    unsubscribeBtnText: { color: '#f87171' },
    
    // Client detailed profile order history cards overrides
    orderHistoryItem: { backgroundColor: '#0f172a', borderColor: '#334155' },
    orderHistoryNo: { color: '#ffffff' },
    orderHistoryDate: { color: '#cbd5e1' },
    orderHistoryTotal: { color: '#ffffff' },
  };

  const merged = {};
  Object.keys(baseStyles).forEach(key => {
    merged[key] = StyleSheet.flatten(baseStyles[key]);
  });
  Object.keys(overrides).forEach(key => {
    merged[key] = { ...merged[key], ...overrides[key] };
  });
  return merged;
};
