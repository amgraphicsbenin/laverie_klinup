import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, FlatList, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { Plus, Search, User, Phone, MapPin, Settings, FolderHeart, Calendar, CreditCard, ShoppingBag, Receipt, Printer, Trash2, Edit3, X, Check, ChevronRight, Clock, Sparkles, Shirt, Wind, Truck, CheckCircle, Download, Award } from 'lucide-react-native';
import { db } from '../services/db';
import { CustomSelect } from '../components/CustomSelect';
import { BlurView } from 'expo-blur';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollPaddingBottom } from '../hooks/useTabBarHeight';

export default function GestionScreen({ 
  selectedOrder, 
  setSelectedOrder, 
  gestionFilter, 
  setGestionFilter, 
  openOrderFormOnMount, 
  onCloseOrderFormOnMount,
  orderFormVisible,
  setOrderFormVisible,
  onModalStateChange,
  closeAllModalsTrigger
}) {
  const [subTab, setSubTab] = useState('orders'); // orders, clients, catalog
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
    if (order.ticket_numero && /^\d+$/.test(order.ticket_numero)) return order.ticket_numero;
    if (/^\d+$/.test(order.id)) return order.id;
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
  const orders = db.getOrders();
  const customers = db.getCustomers();
  const catalog = db.getCatalog();
  const currentUser = db.getCurrentUser();

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

  useEffect(() => {
    if (selectedOrder) {
      setShowOrderDetails(true);
    }
  }, [selectedOrder]);

  // Handle Android back button/gesture to close modals and forms inside GestionScreen
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const backAction = () => {
      if (showInvoiceModal) {
        setShowInvoiceModal(false);
        setInvoiceOrder(null);
        return true;
      }
      if (showCustomerModal) {
        setShowCustomerModal(false);
        setEditingCustomer(null);
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
    showInvoiceModal,
    showCustomerModal,
    showOrderDetails,
    selectedClient,
    setSelectedOrder
  ]);

  // Notify parent of modal visibility
  useEffect(() => {
    if (onModalStateChange) {
      const isAnyModalOpen = showInvoiceModal || showCustomerModal || selectedClient !== null || showOrderDetails;
      onModalStateChange(isAnyModalOpen);
    }
  }, [showInvoiceModal, showCustomerModal, selectedClient, showOrderDetails, onModalStateChange]);

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

  // Customer Management
  const handleSaveCustomer = async () => {
    if (!custNom || !custTelephone) {
      Alert.alert("Erreur", "Le nom et le téléphone sont obligatoires.");
      return;
    }

    try {
      if (editingCustomer) {
        await db.updateCustomer(editingCustomer.id, {
          nom: custNom,
          prenom: custPrenom,
          telephone: custTelephone,
          adresse: custAdresse,
          preferences_pliage: custPreferences
        });
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
      setShowCustomerModal(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer le profil client.");
    }
  };

  const handleEditCustomer = (client) => {
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

    // Filter by dashboard selected card (gestionFilter overrides local statusFilter)
    if (gestionFilter === 'en_cours') {
      return o.statut !== 'livre' && o.statut !== 'restitue';
    }
    if (gestionFilter === 'pretes') {
      return o.statut === 'pret' || o.statut === 'a_recuperer' || o.statut === 'a_livrer';
    }
    if (gestionFilter === 'retards') {
      return o.est_en_retard || o.statut === 'retard' || (o.statut !== 'restitue' && o.statut !== 'livre' && o.due_date && new Date(o.due_date) < new Date());
    }

    // Apply 3-button local status filter
    if (statusFilter === 'actives') {
      return o.statut !== 'livre' && o.statut !== 'restitue';
    }
    if (statusFilter === 'urgentes') {
      return o.niveau_urgence === 'Express';
    }
    if (statusFilter === 'retard') {
      return o.est_en_retard || o.statut === 'retard' || (o.statut !== 'restitue' && o.statut !== 'livre' && o.due_date && new Date(o.due_date) < new Date());
    }
    return true;
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
            onPress={() => setShowOrderForm(true)}
            style={styles.topActionBtnBlue}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.topActionBtnTextBlue}>Ajouter une commande</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
            style={styles.topActionBtnWhite}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#002cf7" style={{ marginRight: 6 }} />
            <Text style={styles.topActionBtnTextWhite}>Ajouter un profil client</Text>
          </TouchableOpacity>
        </View>

        {/* FILTRE DE 3 BOUTONS AVEC COULEURS SÉMANTIQUES */}
        {subTab === 'orders' && (
          <View style={styles.statusFilterRow}>
            <TouchableOpacity
              onPress={() => { setStatusFilter('actives'); setGestionFilter(null); }}
              style={[
                styles.statusFilterBtn, 
                statusFilter === 'actives' && !gestionFilter ? { backgroundColor: '#002cf7', borderColor: '#002cf7' } : null
              ]}
            >
              <Text style={[
                styles.statusFilterText, 
                statusFilter === 'actives' && !gestionFilter ? { color: '#ffffff' } : null
              ]}>
                Actives
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setStatusFilter('urgentes'); setGestionFilter(null); }}
              style={[
                styles.statusFilterBtn, 
                statusFilter === 'urgentes' && !gestionFilter ? { backgroundColor: '#e11d48', borderColor: '#e11d48' } : null
              ]}
            >
              <Text style={[
                styles.statusFilterText, 
                statusFilter === 'urgentes' && !gestionFilter ? { color: '#ffffff' } : null
              ]}>
                Urgentes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setStatusFilter('retard'); setGestionFilter(null); }}
              style={[
                styles.statusFilterBtn, 
                statusFilter === 'retard' && !gestionFilter ? { backgroundColor: '#d97706', borderColor: '#d97706' } : null
              ]}
            >
              <Text style={[
                styles.statusFilterText, 
                statusFilter === 'retard' && !gestionFilter ? { color: '#ffffff' } : null
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
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
        
        {/* SUBTAB 1 : ORDERS LIST */}
        {subTab === 'orders' && (
          filteredOrders.length === 0 ? (
            <Text style={styles.noResultsText}>Aucune commande trouvée</Text>
          ) : (
            filteredOrders.map((item) => {
              const status = getStatusColor(item.statut);
              const client = customers.find(c => c.id === item.customer_id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedOrder(item)}
                  style={styles.orderCard}
                >
                  <View style={styles.cardHeader}>
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
                    <View style={[styles.statusTag, { backgroundColor: status.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.text }]} />
                      <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardTicketNo}>Ticket #{getDisplayTicketId(item)}</Text>
                    <Text style={styles.cardPrice}>{formatPrice(item.prix_total || item.total)}</Text>
                  </View>
                  
                  <View style={styles.cardExtraInfoRow}>
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
                    </View>

                    {/* Next Status Button */}
                    {(() => {
                      const status = item.statut;
                      
                      if (status === 'pret') {
                        return (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleNextStatusDirectList(item, 'a_livrer');
                              }}
                              activeOpacity={0.8}
                              style={{ flex: 1 }}
                            >
                              <MotiView
                                animate={{ backgroundColor: '#4f46e5' }}
                                style={[styles.cardNextStatusBlockBtn, { minHeight: 34 }]}
                              >
                                <Truck size={12} color="#ffffff" style={{ marginRight: 4 }} />
                                <Text style={[styles.cardNextStatusBlockBtnText, { fontSize: 10 }]}>
                                  À livrer
                                </Text>
                              </MotiView>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleNextStatusDirectList(item, 'a_recuperer');
                              }}
                              activeOpacity={0.8}
                              style={{ flex: 1 }}
                            >
                              <MotiView
                                animate={{ backgroundColor: '#d97706' }}
                                style={[styles.cardNextStatusBlockBtn, { minHeight: 34 }]}
                              >
                                <User size={12} color="#ffffff" style={{ marginRight: 4 }} />
                                <Text style={[styles.cardNextStatusBlockBtnText, { fontSize: 10 }]}>
                                  À récupérer
                                </Text>
                              </MotiView>
                            </TouchableOpacity>
                          </View>
                        );
                      }
                      
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
                          onPress={(e) => {
                            e.stopPropagation();
                            handleNextStatus(item, false);
                          }}
                          activeOpacity={0.8}
                          style={{ marginHorizontal: 4 }}
                        >
                          <MotiView
                            animate={{
                              backgroundColor: nextStyle.bg,
                            }}
                            transition={{
                              type: 'timing',
                              duration: 1000,
                            }}
                            style={styles.cardNextStatusBlockBtn}
                          >
                            <MotiView
                              key={iconName}
                              from={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: 'timing', duration: 800 }}
                              style={{ marginRight: 6 }}
                            >
                              {iconName === 'Sparkles' && <Sparkles size={13} color="#ffffff" />}
                              {iconName === 'Wind' && <Wind size={13} color="#ffffff" />}
                              {iconName === 'Shirt' && <Shirt size={13} color="#ffffff" />}
                              {iconName === 'Check' && <Check size={13} color="#ffffff" />}
                              {iconName === 'Truck' && <Truck size={13} color="#ffffff" />}
                              {iconName === 'ShoppingBag' && <ShoppingBag size={13} color="#ffffff" />}
                              {iconName === 'CheckCircle' && <CheckCircle size={13} color="#ffffff" />}
                            </MotiView>
                            <MotiView
                              key={nextStyle.label}
                              from={{ opacity: 0, translateX: 5 }}
                              animate={{ opacity: 1, translateX: 0 }}
                              transition={{ type: 'timing', duration: 800 }}
                            >
                              <Text style={styles.cardNextStatusBlockBtnText}>
                                {nextStyle.label}
                              </Text>
                            </MotiView>
                          </MotiView>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                </TouchableOpacity>
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
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
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
                    {selectedOrder.remise_pourcentage > 0 && (
                      <>
                        <View style={styles.detailArticleRow}>
                          <Text style={styles.detailLabelMuted}>Sous-total</Text>
                          <Text style={styles.detailTextMuted}>
                            {formatPrice((selectedOrder.items || selectedOrder.articles || []).reduce((sum, art) => sum + (art.prix * art.quantite), 0))}
                          </Text>
                        </View>
                        <View style={styles.detailArticleRow}>
                          <Text style={[styles.detailLabelMuted, { color: '#ef4444' }]}>Réduction ({selectedOrder.remise_pourcentage}%)</Text>
                          <Text style={[styles.detailTextMuted, { color: '#ef4444', fontWeight: '600' }]}>
                            -{formatPrice(
                              (selectedOrder.items || selectedOrder.articles || []).reduce((sum, art) => sum + (art.prix * art.quantite), 0) - 
                              (selectedOrder.prix_total || selectedOrder.total)
                            )}
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
                          {/* Action Button for changing status */}
                 {selectedOrder.statut !== 'livre' && selectedOrder.statut !== 'restitue' && (() => {
                   const status = selectedOrder.statut;
                   
                   // If status is 'pret', render two buttons side by side
                   if (status === 'pret') {
                     return (
                       <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 }}>
                         <TouchableOpacity
                           onPress={() => handleUpdateStatusDirect(selectedOrder, 'a_livrer')}
                           activeOpacity={0.88}
                           style={{ flex: 1 }}
                         >
                           <MotiView
                             animate={{ backgroundColor: '#4f46e5' }}
                             style={styles.statusChangeBtnSide}
                           >
                             <Truck size={16} color="#ffffff" style={{ marginRight: 6 }} />
                             <Text style={styles.statusChangeBtnText}>À livrer</Text>
                           </MotiView>
                         </TouchableOpacity>
                         
                         <TouchableOpacity
                           onPress={() => handleUpdateStatusDirect(selectedOrder, 'a_recuperer')}
                           activeOpacity={0.88}
                           style={{ flex: 1 }}
                         >
                           <MotiView
                             animate={{ backgroundColor: '#d97706' }}
                             style={styles.statusChangeBtnSide}
                           >
                             <User size={16} color="#ffffff" style={{ marginRight: 6 }} />
                             <Text style={styles.statusChangeBtnText}>À récupérer</Text>
                           </MotiView>
                         </TouchableOpacity>
                       </View>
                     );
                   }
                   
                   // For all other statuses, render a single button
                   const getSingleStatusDetails = () => {
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

                   return (
                     <TouchableOpacity
                       onPress={() => handleNextStatus(selectedOrder, true)}
                       activeOpacity={0.88}
                       style={{ width: '100%' }}
                     >
                       <MotiView
                         animate={{
                           backgroundColor: btn.color
                         }}
                         transition={{
                           type: 'timing',
                           duration: 1200
                         }}
                         style={styles.statusChangeBtn}
                       >
                         <MotiView
                           key={btn.icon}
                           from={{ opacity: 0, scale: 0.3, rotate: '-45deg' }}
                           animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
                           transition={{ type: 'timing', duration: 1000 }}
                           style={{ marginRight: 8 }}
                         >
                           <MotiView
                             from={btn.animation.from}
                             animate={btn.animation.animate}
                             transition={btn.animation.transition}
                           >
                             {btn.icon === 'Sparkles' && <Sparkles size={16} color={btn.iconColor} />}
                             {btn.icon === 'Wind' && <Wind size={16} color={btn.iconColor} />}
                             {btn.icon === 'Shirt' && <Shirt size={16} color={btn.iconColor} />}
                             {btn.icon === 'Check' && <Check size={16} color={btn.iconColor} />}
                             {btn.icon === 'Truck' && <Truck size={16} color={btn.iconColor} />}
                             {btn.icon === 'ShoppingBag' && <ShoppingBag size={16} color={btn.iconColor} />}
                             {btn.icon === 'CheckCircle' && <CheckCircle size={16} color={btn.iconColor} />}
                           </MotiView>
                         </MotiView>
                         
                         <MotiView
                           key={btn.label}
                           from={{ opacity: 0, translateY: 10 }}
                           animate={{ opacity: 1, translateY: 0 }}
                           transition={{ type: 'timing', duration: 1000 }}
                         >
                           <Text style={styles.statusChangeBtnText}>{btn.label}</Text>
                         </MotiView>
                       </MotiView>
                     </TouchableOpacity>
                   );
                 })()}
                  </View>
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
              <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setShowCustomerModal(false)}>
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
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
                  <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
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

      {/* MODAL 4 : DETAIL CLIENT (FICHE CLIENT - BOTTOM SHEET DOCKÉ) */}
      {selectedClient !== null && selectedClient && (
        <View style={styles.absoluteModalContainer}>
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSelectedClient(null)}>
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <View style={[styles.compactModalView, { maxHeight: '90%' }]}>
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Fiche Client</Text>
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
                        
                        <View style={styles.clientActionRow}>
                          <TouchableOpacity
                            onPress={() => handleEditCustomer(activeClient)}
                            style={styles.clientEditBtn}
                          >
                            <Edit3 size={14} color="#2563eb" />
                            <Text style={styles.clientEditBtnText}>Modifier</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteCustomer(activeClient.id)}
                            style={styles.clientDeleteBtn}
                          >
                            <Trash2 size={14} color="#ef4444" />
                            <Text style={styles.clientDeleteBtnText}>Supprimer</Text>
                          </TouchableOpacity>
                        </View>
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
                  return clientOrders.length === 0 ? (
                    <Text style={styles.noResultsText}>Aucune commande pour ce client</Text>
                  ) : (
                    clientOrders.map(item => {
                      const status = getStatusColor(item.statut);
                      return (
                        <View key={item.id} style={styles.orderHistoryItem}>
                          <View>
                            <Text style={styles.orderHistoryNo}>Ticket #{getDisplayTicketId(item)}</Text>
                            <Text style={styles.orderHistoryDate}>{item.created_at.split('T')[0]}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <View style={[styles.statusTag, { backgroundColor: status.bg, borderColor: status.border, marginBottom: 4, borderWidth: 1 }]}>
                              <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                            </View>
                            <Text style={styles.orderHistoryTotal}>{formatPrice(item.prix_total || item.total)}</Text>
                          </View>
                        </View>
                      );
                    })
                  );
                })()}
              </ScrollView>
            </View>
          </View>
        </View>
      )}

      {/* MODAL 5 : INVOICE / FACTURE (CENTERED POPUP DIALOG) */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
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
    backgroundColor: '#f4f5f7',
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
    backgroundColor: '#f4f5f7',
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
    backgroundColor: '#f4f5f7',
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
    paddingHorizontal: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
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
  },
  cardTicketNo: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
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
    backgroundColor: '#f4f5f7',
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
    backgroundColor: '#f4f5f7',
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
    backgroundColor: '#f4f5f7',
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
    marginTop: 8,
    paddingHorizontal: 4,
  },
  cardExtraInfoText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
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
    backgroundColor: '#ffffff',
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
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  cardNextStatusBlockBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
