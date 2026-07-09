import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, Search, User, Phone, MapPin, Settings, FolderHeart, Calendar, CreditCard, ShoppingBag, Receipt, Printer, Trash2, Edit3, X, Check, ChevronRight } from 'lucide-react-native';
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
  onCloseOrderFormOnMount 
}) {
  const [subTab, setSubTab] = useState('orders'); // orders, clients, catalog
  const [searchQuery, setSearchQuery] = useState('');

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
  const [showOrderForm, setShowOrderForm] = useState(false);
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
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('Espèces');
  const [orderExpDate, setOrderExpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

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
  const handleNextStatus = async (order) => {
    let nextStatus = 'en_attente';
    if (order.statut === 'attente' || order.statut === 'en_attente') nextStatus = 'en_cours_lavage';
    else if (order.statut === 'lavage_cours' || order.statut === 'en_cours_lavage') nextStatus = 'en_cours_repassage';
    else if (order.statut === 'repassage_cours' || order.statut === 'en_cours_repassage') nextStatus = 'pret';
    else if (order.statut === 'pret') nextStatus = 'restitue';

    try {
      await db.updateOrderStatus(order.id, nextStatus);
      const updated = db.getOrders().find(o => o.id === order.id);
      if (updated) setSelectedOrder(updated);
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
    const avance = parseFloat(orderAvance) || 0;
    const reste = total - avance;

    try {
      const newOrder = {
        customer_id: orderClient,
        articles: selectedArticles.map(a => ({
          article: a.article,
          service: a.service,
          quantite: a.quantity,
          prix: a.price
        })),
        total,
        avance,
        reste,
        statut: 'attente',
        date_retrait_prevue: orderExpDate,
        mode_paiement: orderPaymentMethod,
        created_by_id: currentUser ? currentUser.id : 'u1'
      };

      await db.createOrder(newOrder);

      // Clean state
      setOrderClient('');
      setSelectedArticles([]);
      setOrderAvance('0');
      setShowOrderForm(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créer la commande.");
    }
  };

  const addArticleToOrder = (item) => {
    const existingIdx = selectedArticles.findIndex(a => a.id === item.id);
    if (existingIdx !== -1) {
      const copy = [...selectedArticles];
      copy[existingIdx].quantity += 1;
      setSelectedArticles(copy);
    } else {
      setSelectedArticles([...selectedArticles, {
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

    // Filter by dashboard selected card
    if (gestionFilter === 'en_cours') {
      return o.statut !== 'livre' && o.statut !== 'restitue';
    }
    if (gestionFilter === 'pretes') {
      return o.statut === 'pret' || o.statut === 'a_recuperer' || o.statut === 'a_livrer';
    }
    if (gestionFilter === 'retards') {
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
      {/* TABS SELECTOR */}
      <View style={styles.tabHeader}>
        <View style={styles.tabSelector}>
          <TouchableOpacity 
            onPress={() => { setSubTab('orders'); setSearchQuery(''); }}
            style={[styles.tabButton, subTab === 'orders' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, subTab === 'orders' && styles.tabButtonTextActive]}>Commandes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setSubTab('clients'); setSearchQuery(''); }}
            style={[styles.tabButton, subTab === 'clients' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, subTab === 'clients' && styles.tabButtonTextActive]}>Clients</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setSubTab('catalog'); setSearchQuery(''); }}
            style={[styles.tabButton, subTab === 'catalog' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, subTab === 'catalog' && styles.tabButtonTextActive]}>Catalogue</Text>
          </TouchableOpacity>
        </View>
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
                      <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardTicketNo}>Ticket #{item.ticket_numero || item.id.substring(0, 8)}</Text>
                    <Text style={styles.cardPrice}>{formatPrice(item.prix_total || item.total)}</Text>
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
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.compactModalView, { maxHeight: '90%' }]}>
              <View style={styles.compactModalHeader}>
                <Text style={styles.compactModalTitle}>Commande #{selectedOrder.ticket_numero || selectedOrder.id.substring(0, 8)}</Text>
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
                    onPress={() => handleNextStatus(selectedOrder)}
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
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
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

                {/* Catégories d'articles */}
                <Text style={styles.formLabel}>Choisir les Articles</Text>
                <View style={styles.categoryTabsRow}>
                  {['Tous', 'Lavage', 'Repassage', 'Sec'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={[styles.categoryTabBtn, selectedCategory === cat && styles.categoryTabBtnActive]}
                    >
                      <Text style={[styles.categoryTabBtnText, selectedCategory === cat && styles.categoryTabBtnTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Liste des articles filtrés */}
                <View style={styles.formArticlesList}>
                  {catalog.filter(c => {
                    if (c.categorie === 'system_setting' || c.service === 'system') return false;
                    if (selectedCategory === 'Tous') return true;
                    if (selectedCategory === 'Lavage') return c.service.includes('lavage');
                    if (selectedCategory === 'Repassage') return c.service.includes('repassage');
                    if (selectedCategory === 'Sec') return c.service.includes('sec') || c.service.includes('nettoyage');
                    return true;
                  }).map(item => {
                    const inCart = selectedArticles.find(a => a.id === item.id);
                    const qty = inCart ? inCart.quantity : 0;
                    return (
                      <View key={item.id} style={styles.formArticleItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.formArticleName}>{item.article}</Text>
                          <View style={styles.formArticleMeta}>
                            <View style={styles.miniServiceTag}>
                              <Text style={styles.miniServiceTagText}>{item.service.replace(/_/g, ' ')}</Text>
                            </View>
                            <Text style={styles.formArticlePrice}>{formatPrice(item.prix)}</Text>
                          </View>
                        </View>
                        {qty === 0 ? (
                          <TouchableOpacity 
                            onPress={() => addArticleToOrder(item)} 
                            style={styles.formArticleAddBtn}
                          >
                            <Plus size={12} color="#002cf7" style={{ marginRight: 4 }} />
                            <Text style={styles.formArticleAddBtnText}>Ajouter</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.formArticleQtyRow}>
                            <TouchableOpacity onPress={() => removeArticleFromOrder(item.id)} style={styles.formQtyBtn}>
                              <Text style={styles.formQtyBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.formQtyText}>{qty}</Text>
                            <TouchableOpacity onPress={() => addArticleToOrder(item)} style={styles.formQtyBtn}>
                              <Text style={styles.formQtyBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Mode de règlement */}
                <Text style={styles.formLabel}>Mode de Règlement</Text>
                <View style={styles.paymentMethodRow}>
                  {['Espèces', 'Wave', 'Orange Money'].map((method) => {
                    const isActive = orderPaymentMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        onPress={() => setOrderPaymentMethod(method)}
                        style={[styles.paymentMethodBtn, isActive && styles.paymentMethodBtnActive]}
                      >
                        <Text style={[styles.paymentMethodBtnText, isActive && styles.paymentMethodBtnTextActive]}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Avance payée avec presets */}
                <Text style={styles.formLabel}>Avance (FCFA)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={orderAvance}
                  onChangeText={setOrderAvance}
                  style={styles.formInput}
                />
                
                {/* Presets Avance */}
                <View style={styles.formPresetsRow}>
                  {['0', '1000', '2000', '5000', 'total'].map((preset) => {
                    const currentTotal = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const label = preset === 'total' ? 'Total' : formatPrice(parseInt(preset));
                    const val = preset === 'total' ? currentTotal.toString() : preset;
                    const isActive = orderAvance === val;
                    return (
                      <TouchableOpacity 
                        key={preset}
                        onPress={() => setOrderAvance(val)}
                        style={[styles.formPresetBtn, isActive && styles.formPresetBtnActive]}
                      >
                        <Text style={[styles.formPresetBtnText, isActive && styles.formPresetBtnTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Date retrait avec presets */}
                <Text style={styles.formLabel}>Date de retrait prévue</Text>
                <TextInput
                  value={orderExpDate}
                  onChangeText={setOrderExpDate}
                  placeholder="AAAA-MM-JJ"
                  style={styles.formInput}
                />
                
                {/* Presets Date */}
                <View style={styles.formPresetsRow}>
                  {[
                    { label: 'Demain', days: 1 },
                    { label: 'Dans 2 jours', days: 2 },
                    { label: 'Dans 3 jours', days: 3 },
                  ].map((preset) => {
                    const targetDate = (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + preset.days);
                      return d.toISOString().split('T')[0];
                    })();
                    const isActive = orderExpDate === targetDate;
                    return (
                      <TouchableOpacity 
                        key={preset.label}
                        onPress={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + preset.days);
                          setOrderExpDate(d.toISOString().split('T')[0]);
                        }}
                        style={[styles.formPresetBtn, isActive && styles.formPresetBtnActive]}
                      >
                        <Text style={[styles.formPresetBtnText, isActive && styles.formPresetBtnTextActive]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Live Receipt Card */}
                {(() => {
                  const currentTotal = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const currentAvance = parseFloat(orderAvance) || 0;
                  const currentReste = currentTotal - currentAvance;
                  return (
                    <View style={styles.receiptPreviewCard}>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptRowLabel}>Total commande</Text>
                        <Text style={styles.receiptRowValBold}>{formatPrice(currentTotal)}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptRowLabel}>Avance</Text>
                        <Text style={styles.receiptRowVal}>{formatPrice(currentAvance)}</Text>
                      </View>
                      <View style={styles.receiptDivider} />
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptRowLabelBold}>Reste à payer</Text>
                        <Text style={[styles.receiptRowValTotal, { color: currentReste > 0 ? '#ef4444' : '#10b981' }]}>
                          {formatPrice(currentReste)}
                        </Text>
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
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
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
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
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
                            <Text style={styles.orderHistoryNo}>Ticket #{item.ticket_numero || item.id.substring(0, 8)}</Text>
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    alignItems: 'center',
    marginBottom: 10,
  },
  cardClientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
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
    fontWeight: '800',
    color: '#0f172a',
  },
  clientCard: {
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
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '800',
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
    fontWeight: '800',
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
    fontWeight: '800',
    color: '#0f172a',
  },
  detailPriceBold: {
    fontSize: 15,
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#0f172a',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: '800',
    color: '#0f172a',
  },
  compactModalScroll: {
    paddingBottom: 30,
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
    fontWeight: '700',
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
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#002cf7',
  },
  formArticlePrice: {
    fontSize: 12,
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '800',
    color: '#ffffff',
  },
  formQtyText: {
    fontSize: 12,
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
  },
  receiptRowVal: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  receiptRowValBold: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '800',
  },
  receiptRowValTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 44, 247, 0.1)',
    marginVertical: 8,
  },
});
