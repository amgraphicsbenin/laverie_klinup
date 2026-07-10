import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, Search, User, Phone, MapPin, Settings, FolderHeart, Calendar, CreditCard, ShoppingBag, Receipt, Printer, Trash2, Edit3, X, Check, ChevronRight, Clock } from 'lucide-react-native';
import { db } from '../services/db';
import { CustomSelect } from '../components/CustomSelect';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

export default function GestionScreen({ 
  selectedOrder, 
  setSelectedOrder, 
  gestionFilter, 
  setGestionFilter, 
  openOrderFormOnMount, 
  onCloseOrderFormOnMount,
  orderFormVisible,
  setOrderFormVisible
}) {
  const [subTab, setSubTab] = useState('orders'); // orders, clients, catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('actives'); // actives, urgentes, retard
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const [localShowOrderForm, localSetShowOrderForm] = useState(false);
  const showOrderForm = orderFormVisible !== undefined ? orderFormVisible : localShowOrderForm;
  const setShowOrderForm = setOrderFormVisible !== undefined ? setOrderFormVisible : localSetShowOrderForm;

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

  const [expandedArticles, setExpandedArticles] = useState({});

  const toggleExpandArticle = (articleName) => {
    setExpandedArticles(prev => ({
      ...prev,
      [articleName]: !prev[articleName]
    }));
  };

  const isArticleExpanded = (articleName, items) => {
    if (expandedArticles[articleName]) return true;
    return items.some(item => selectedArticles.some(cartItem => cartItem.id === item.id && cartItem.quantity > 0));
  };

  useEffect(() => {
    if (!showOrderForm) {
      setExpandedArticles({});
    }
  }, [showOrderForm]);

  // Handle openOrderFormOnMount from tab bar trigger
  useEffect(() => {
    if (openOrderFormOnMount) {
      setShowOrderForm(true);
      if (onCloseOrderFormOnMount) {
        onCloseOrderFormOnMount();
      }
    }
  }, [openOrderFormOnMount]);

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
        return { bg: '#2563eb', text: '#ffffff', label: 'Lavage' };
      case 'lavage_cours':
      case 'en_cours_lavage':
        return { bg: '#0891b2', text: '#ffffff', label: 'Repassage' };
      case 'repassage_cours':
      case 'en_cours_repassage':
        return { bg: '#10b981', text: '#ffffff', label: 'Prêt' };
      case 'pret':
      case 'a_recuperer':
      case 'a_livrer':
        return { bg: '#64748b', text: '#ffffff', label: 'Livré' };
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

  // Order Form state
  const [orderClient, setOrderClient] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]); // [{ id, article, service, quantity, price }]
  const [orderAvance, setOrderAvance] = useState('0');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('Espèce');
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [orderUrgency, setOrderUrgency] = useState('Normal');

  // Client Details View
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    if (selectedOrder) {
      setShowOrderDetails(true);
    }
  }, [selectedOrder]);

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  // Status transitions
  const handleNextStatus = async (order, updateSelected = false) => {
    let nextStatus = 'en_attente';
    if (order.statut === 'attente' || order.statut === 'en_attente') nextStatus = 'en_cours_lavage';
    else if (order.statut === 'lavage_cours' || order.statut === 'en_cours_lavage') nextStatus = 'en_cours_repassage';
    else if (order.statut === 'repassage_cours' || order.statut === 'en_cours_repassage') nextStatus = 'pret';
    else if (order.statut === 'pret') nextStatus = 'restitue';

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

  // Order Submission
  const handleCreateOrder = async () => {
    if (!orderClient) {
      Alert.alert("Erreur", "Veuillez sélectionner un client.");
      return;
    }
    if (selectedArticles.length === 0) {
      Alert.alert("Erreur", "Veuillez ajouter au moins un article.");
      return;
    }

    const total = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = Number(orderDiscount) || 0;
    const discountAmount = Math.round(total * (discountPercent / 100));
    const netTotal = total - discountAmount;
    const avance = parseFloat(orderAvance) || 0;
    const reste = netTotal - avance;

    try {
      const newOrder = {
        customer_id: orderClient,
        articles: selectedArticles.map(a => ({
          article: a.article,
          service: a.service,
          quantite: a.quantity,
          prix: a.price
        })),
        total: netTotal,
        avance,
        reste,
        statut: 'attente',
        mode_paiement: orderPaymentMethod,
        niveau_urgence: orderUrgency,
        remise_pourcentage: discountPercent,
        created_by_id: currentUser ? currentUser.id : 'u1'
      };

      await db.createOrder(newOrder);

      // Clean state
      setOrderClient('');
      setSelectedArticles([]);
      setOrderAvance('0');
      setOrderDiscount('0');
      setOrderUrgency('Normal');
      setShowOrderForm(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créer la commande.");
    }
  };

  const addArticleToOrder = (item) => {
    // Supprimer tout autre service pour le même vêtement avant d'ajouter le nouveau
    const clearedCart = selectedArticles.filter(a => !(a.article === item.article && a.service !== item.service));
    
    const existingIdx = clearedCart.findIndex(a => a.id === item.id);
    if (existingIdx !== -1) {
      const copy = [...clearedCart];
      copy[existingIdx].quantity += 1;
      setSelectedArticles(copy);
    } else {
      setSelectedArticles([...clearedCart, {
        id: item.id,
        article: item.article,
        service: item.service,
        quantity: 1,
        price: item.prix
      }]);
    }
  };

  const removeArticleFromOrder = (id) => {
    const existing = selectedArticles.find(a => a.id === id);
    if (existing && existing.quantity > 1) {
      const copy = [...selectedArticles];
      const idx = copy.findIndex(a => a.id === id);
      copy[idx].quantity -= 1;
      setSelectedArticles(copy);
    } else {
      setSelectedArticles(selectedArticles.filter(a => a.id !== id));
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'pret':
      case 'a_recuperer':
      case 'a_livrer':
        return { bg: '#e8f5e9', text: '#2e7d32', label: 'Prêt' };
      case 'lavage_cours':
      case 'en_cours_lavage':
        return { bg: '#e3f2fd', text: '#1565c0', label: 'Lavage' };
      case 'repassage_cours':
      case 'en_cours_repassage':
        return { bg: '#e0f7fa', text: '#00838f', label: 'Repassage' };
      case 'attente':
      case 'en_attente':
        return { bg: '#fff3e0', text: '#e65100', label: 'En attente' };
      case 'en_cours_livraison':
        return { bg: '#fffde7', text: '#fbc02d', label: 'En livraison' };
      case 'restitue':
      case 'livre':
      default:
        return { bg: '#f4f4f5', text: '#71717a', label: 'Livré' };
    }
  };

  const formatPrice = (price) => {
    return (price || 0).toLocaleString('fr-FR') + ' FCFA';
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
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
                    <Text style={styles.cardClientName}>{client ? `${client.prenom} ${client.nom}` : 'Client Inconnu'}</Text>
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
                      const nextStyle = getNextStatusStyle(item.statut);
                      if (!nextStyle) return null;
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
                              duration: 250,
                            }}
                            style={styles.cardNextStatusBlockBtn}
                          >
                            <Check size={14} color="#ffffff" style={{ marginRight: 6 }} />
                            <Text style={styles.cardNextStatusBlockBtnText}>
                              Marquer comme : {nextStyle.label}
                            </Text>
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
            <View style={[styles.compactModalView, { maxHeight: '90%' }]}>
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Commande #{getDisplayTicketId(selectedOrder)}</Text>
                <TouchableOpacity onPress={handleCloseOrderDetails}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.compactModalScroll} showsVerticalScrollIndicator={false}>
                {/* Infos Client */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Client & Statut</Text>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailTextLarge}>
                      {customers.find(c => c.id === selectedOrder.customer_id) ? 
                        `${customers.find(c => c.id === selectedOrder.customer_id).prenom} ${customers.find(c => c.id === selectedOrder.customer_id).nom}` : 
                        'Client inconnu'}
                    </Text>
                    <Text style={styles.detailTextMuted}>Téléphone : {customers.find(c => c.id === selectedOrder.customer_id)?.telephone || 'N/A'}</Text>
                    
                    <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedOrder.statut).bg, borderColor: getStatusColor(selectedOrder.statut).border, alignSelf: 'flex-start', marginTop: 8, borderWidth: 1 }]}>
                      <Text style={[styles.statusTagText, { color: getStatusColor(selectedOrder.statut).text }]}>
                        {getStatusColor(selectedOrder.statut).label}
                      </Text>
                    </View>
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

                {/* Action Button for changing status */}
                {selectedOrder.statut !== 'livre' && selectedOrder.statut !== 'restitue' && (
                  <TouchableOpacity
                    onPress={() => handleNextStatus(selectedOrder, true)}
                    style={styles.statusChangeBtn}
                  >
                    <Text style={styles.statusChangeBtnText}>
                      {selectedOrder.statut === 'attente' || selectedOrder.statut === 'en_attente' ? 'Passer au Lavage' :
                       selectedOrder.statut === 'lavage_cours' || selectedOrder.statut === 'en_cours_lavage' ? 'Passer au Repassage' :
                       selectedOrder.statut === 'repassage_cours' || selectedOrder.statut === 'en_cours_repassage' ? 'Marquer comme Prêt' : 'Marquer comme Livré'}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      )}

      {/* MODAL 2 : CRÉATION DE COMMANDE (BOTTOM SHEET DOCKÉ) */}
      {showOrderForm && (
        <View style={styles.absoluteModalContainer}>
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setShowOrderForm(false)}>
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.compactModalView, { maxHeight: '90%' }]}
            >
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Nouvelle Commande</Text>
                <TouchableOpacity onPress={() => setShowOrderForm(false)}>
                  <X size={20} color="#71717a" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.compactModalScroll} showsVerticalScrollIndicator={false}>
                {/* Sélection du client */}
                <Text style={styles.formLabel}>Client</Text>
                <CustomSelect
                  value={orderClient}
                  onChange={setOrderClient}
                  options={customers.map(c => ({ value: c.id, label: `${c.prenom} ${c.nom} (${c.telephone})` }))}
                  placeholder="Sélectionner le client"
                  style={styles.selectMargin}
                />

                {/* Choisir les vêtements */}
                <Text style={styles.formLabel}>Choisir les vêtements</Text>
                <View style={styles.fixedArticleContainer}>
                  <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                    {(() => {
                      const uniqueArticles = [...new Set(catalog
                        .filter(c => c.categorie !== 'system_setting' && c.service !== 'system' && c.categorie !== 'abonnement' && c.service !== 'abonnement')
                        .map(c => c.article)
                      )];

                      if (uniqueArticles.length === 0) {
                        return <Text style={styles.emptyDetailsText}>Aucun article trouvé</Text>;
                      }

                      return uniqueArticles.map(articleName => {
                        const items = catalog.filter(c => c.article === articleName);
                        const traitementItem = items.find(i => i.service === 'lavage_simple') || items.find(i => i.service.includes('lavage')) || items.find(i => i.service.includes('sec') || i.service.includes('nettoyage'));
                        const repassageItem = items.find(i => i.service === 'repassage');
                        
                        const isExpanded = isArticleExpanded(articleName, items);

                        const getQtyInCart = (itemId) => {
                          const cartItem = selectedArticles.find(a => a.id === itemId);
                          return cartItem ? cartItem.quantity : 0;
                        };

                        return (
                          <View key={articleName} style={styles.clothingCard}>
                            <View style={styles.clothingHeader}>
                              <Text style={styles.clothingName}>{articleName}</Text>
                              <TouchableOpacity 
                                onPress={() => toggleExpandArticle(articleName)}
                                style={isExpanded ? styles.clothingCloseBtn : styles.clothingAddBtn}
                              >
                                <Text style={isExpanded ? styles.clothingCloseBtnText : styles.clothingAddBtnText}>
                                  {isExpanded ? 'Masquer' : 'Ajouter'}
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {isExpanded && (
                              <View style={styles.servicesContainer}>
                                {/* Traitement Service */}
                                {traitementItem && (
                                  <View style={styles.serviceRow}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.serviceLabel}>Traitement (Lavage)</Text>
                                      <Text style={styles.servicePrice}>{formatPrice(traitementItem.prix)}</Text>
                                    </View>
                                    {getQtyInCart(traitementItem.id) === 0 ? (
                                      <TouchableOpacity 
                                        onPress={() => addArticleToOrder(traitementItem)}
                                        style={styles.serviceAddBtn}
                                      >
                                        <Plus size={12} color="#002cf7" style={{ marginRight: 4 }} />
                                        <Text style={styles.serviceAddBtnText}>Ajouter</Text>
                                      </TouchableOpacity>
                                    ) : (
                                      <View style={styles.serviceQtyRow}>
                                        <TouchableOpacity onPress={() => removeArticleFromOrder(traitementItem.id)} style={styles.serviceQtyBtn}>
                                          <Text style={styles.serviceQtyBtnText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.serviceQtyText}>{getQtyInCart(traitementItem.id)}</Text>
                                        <TouchableOpacity onPress={() => addArticleToOrder(traitementItem)} style={styles.serviceQtyBtn}>
                                          <Text style={styles.serviceQtyBtnText}>+</Text>
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                )}

                                {/* Repassage Service */}
                                {repassageItem && (
                                  <View style={styles.serviceRow}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.serviceLabel}>Repassage</Text>
                                      <Text style={styles.servicePrice}>{formatPrice(repassageItem.prix)}</Text>
                                    </View>
                                    {getQtyInCart(repassageItem.id) === 0 ? (
                                      <TouchableOpacity 
                                        onPress={() => addArticleToOrder(repassageItem)}
                                        style={styles.serviceAddBtn}
                                      >
                                        <Plus size={12} color="#002cf7" style={{ marginRight: 4 }} />
                                        <Text style={styles.serviceAddBtnText}>Ajouter</Text>
                                      </TouchableOpacity>
                                    ) : (
                                      <View style={styles.serviceQtyRow}>
                                        <TouchableOpacity onPress={() => removeArticleFromOrder(repassageItem.id)} style={styles.serviceQtyBtn}>
                                          <Text style={styles.serviceQtyBtnText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.serviceQtyText}>{getQtyInCart(repassageItem.id)}</Text>
                                        <TouchableOpacity onPress={() => addArticleToOrder(repassageItem)} style={styles.serviceQtyBtn}>
                                          <Text style={styles.serviceQtyBtnText}>+</Text>
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      });
                    })()}
                  </ScrollView>
                </View>

                {/* Niveau d'urgence */}
                <Text style={styles.formLabel}>Urgence</Text>
                <View style={styles.urgencyRow}>
                  {['Normal', 'Express'].map((level) => {
                    const isActive = orderUrgency === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        onPress={() => setOrderUrgency(level)}
                        style={[
                          styles.urgencyBtn, 
                          isActive ? { backgroundColor: level === 'Express' ? '#e11d48' : '#002cf7', borderColor: level === 'Express' ? '#e11d48' : '#002cf7' } : null
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.urgencyBtnText, isActive && { color: '#ffffff' }]}>
                          {level === 'Express' ? 'Express (24h)' : 'Normal (48h)'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Avance et Mode de règlement (same line) */}
                <View style={styles.formRowInline}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Avance (FCFA)</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={orderAvance}
                      onChangeText={setOrderAvance}
                      style={styles.formInput}
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.formLabel}>Mode Règlement</Text>
                    <CustomSelect
                      value={orderPaymentMethod}
                      onChange={setOrderPaymentMethod}
                      options={[
                        { value: 'Espèce', label: 'Espèce' },
                        { value: 'Mobile Money', label: 'Mobile Money' }
                      ]}
                      placeholder="Choisir"
                    />
                  </View>
                </View>

                {/* Réduction (%) */}
                <Text style={styles.formLabel}>Réduction (%)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={orderDiscount}
                  onChangeText={(val) => {
                    const num = parseInt(val, 10);
                    if (val === '') setOrderDiscount('0');
                    else if (!isNaN(num) && num >= 0 && num <= 100) setOrderDiscount(num.toString());
                  }}
                  style={styles.formInput}
                  placeholder="Ex: 10"
                  placeholderTextColor="#a1a1aa"
                />

                {/* Live Receipt Card */}
                {(() => {
                  const currentTotal = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const discountPercent = Number(orderDiscount) || 0;
                  const discountAmount = Math.round(currentTotal * (discountPercent / 100));
                  const netTotal = currentTotal - discountAmount;
                  const currentAvance = parseFloat(orderAvance) || 0;
                  const currentReste = netTotal - currentAvance;

                  // Dynamic availability delay calculation from CMS
                  const expressHours = catalog.find(c => c.id === 'setting_express_hours')?.prix || 6;
                  const normalHours = catalog.find(c => c.id === 'setting_normal_hours')?.prix || 48;
                  const delay = orderUrgency === 'Express' ? `${expressHours}h (Express)` : `${normalHours}h (Normal)`;

                  return (
                    <View style={styles.receiptPreviewCard}>
                      <Text style={styles.receiptSectionTitle}>Facturation</Text>
                      
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptRowLabel}>Total Brut</Text>
                        <Text style={styles.receiptRowVal}>{formatPrice(currentTotal)}</Text>
                      </View>
                      
                      {discountAmount > 0 && (
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptRowLabel}>Réduction ({discountPercent}%)</Text>
                          <Text style={[styles.receiptRowVal, { color: '#ef4444' }]}>-{formatPrice(discountAmount)}</Text>
                        </View>
                      )}

                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptRowLabelBold}>Net à Payer</Text>
                        <Text style={styles.receiptRowValBold}>{formatPrice(netTotal)}</Text>
                      </View>

                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptRowLabel}>Acompte (Avance)</Text>
                        <Text style={styles.receiptRowVal}>{formatPrice(currentAvance)}</Text>
                      </View>

                      <View style={styles.receiptDivider} />

                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptRowLabelBold}>Solde Restant</Text>
                        <Text style={[styles.receiptRowValTotal, { color: currentReste > 0 ? '#ef4444' : '#10b981' }]}>
                          {formatPrice(currentReste)}
                        </Text>
                      </View>

                      <View style={[styles.receiptRow, { marginTop: 6 }]}>
                        <Text style={styles.receiptRowLabelMuted}>Mode règlement :</Text>
                        <Text style={styles.receiptRowValMuted}>{orderPaymentMethod}</Text>
                      </View>

                      <View style={[styles.receiptRow, { marginTop: 4 }]}>
                        <Text style={styles.receiptRowLabelMuted}>Disponibilité :</Text>
                        <Text style={[styles.receiptRowValMuted, { fontWeight: '700', color: '#002cf7' }]}>Sous {delay}</Text>
                      </View>
                    </View>
                  );
                })()}

                <TouchableOpacity
                  onPress={handleCreateOrder}
                  style={styles.submitOrderBtn}
                >
                  <Text style={styles.submitOrderBtnText}>Enregistrer la Commande</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      )}

      {/* MODAL 3 : CRÉATION / MODIFICATION CLIENT */}
      {showCustomerModal && (
        <View style={styles.absoluteModalContainer}>
          <View style={styles.compactModalOverlay}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setShowCustomerModal(false)}>
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.compactModalView}
            >
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
            </KeyboardAvoidingView>
          </View>
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
                <View style={styles.detailCard}>
                  <Text style={styles.clientProfileName}>{selectedClient.prenom} {selectedClient.nom}</Text>
                  <Text style={styles.clientProfilePhone}>{selectedClient.telephone}</Text>
                  <Text style={styles.clientProfileAddress}>{selectedClient.adresse || 'Aucune adresse renseignée'}</Text>
                  <Text style={styles.clientProfilePreferences}>Préférence : {selectedClient.preferences_pliage || 'Plié'}</Text>
                  
                  <View style={styles.clientActionRow}>
                    <TouchableOpacity
                      onPress={() => handleEditCustomer(selectedClient)}
                      style={styles.clientEditBtn}
                    >
                      <Edit3 size={14} color="#2563eb" />
                      <Text style={styles.clientEditBtnText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteCustomer(selectedClient.id)}
                      style={styles.clientDeleteBtn}
                    >
                      <Trash2 size={14} color="#ef4444" />
                      <Text style={styles.clientDeleteBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>

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

                <TouchableOpacity
                  onPress={() => { setShowInvoiceModal(false); setInvoiceOrder(null); }}
                  style={[styles.invoiceCloseBtn, { marginTop: 16 }]}
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
    paddingTop: 16,
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
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
    fontWeight: '600',
    color: '#0f172a',
  },
  compactModalScroll: {
    paddingBottom: 135,
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
  // Top Actions styles
  topActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
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
});
