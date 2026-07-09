import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, Search, User, Phone, MapPin, Settings, FolderHeart, Calendar, CreditCard, ShoppingBag, Receipt, Printer, Trash2, Edit3, X, Check } from 'lucide-react-native';
import { db } from '../services/db';
import { CustomSelect } from '../components/CustomSelect';

export default function GestionScreen({ selectedOrder, setSelectedOrder }) {
  const [subTab, setSubTab] = useState('orders'); // orders, clients, catalog
  const [searchQuery, setSearchQuery] = useState('');
  
  // Database states
  const orders = db.getOrders();
  const customers = db.getCustomers();
  const catalog = db.getCatalog();
  const currentUser = db.getCurrentUser();

  // Modals visibility
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
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
    let nextStatus = 'attente';
    if (order.statut === 'attente') nextStatus = 'lavage_cours';
    else if (order.statut === 'lavage_cours') nextStatus = 'repassage_cours';
    else if (order.statut === 'repassage_cours') nextStatus = 'pret';
    else if (order.statut === 'pret') nextStatus = 'livre';

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
          preferences: custPreferences
        });
      } else {
        await db.createCustomer({
          nom: custNom,
          prenom: custPrenom,
          telephone: custTelephone,
          adresse: custAdresse,
          preferences: custPreferences
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
    setCustPreferences(client.preferences || 'Plié');
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

  // Filters
  const filteredOrders = orders.filter(o => {
    const client = customers.find(c => c.id === o.customer_id);
    const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
    const ticketNo = (o.ticket_numero || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return clientName.includes(query) || ticketNo.includes(query);
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
        
        {subTab === 'orders' && (
          <TouchableOpacity 
            onPress={() => setShowOrderForm(true)}
            style={styles.addButton}
          >
            <Plus size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
        
        {subTab === 'clients' && (
          <TouchableOpacity 
            onPress={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
            style={styles.addButton}
          >
            <Plus size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

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
                    <Text style={styles.cardPrice}>{formatPrice(item.total)}</Text>
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

      {/* MODAL 1 : DETAIL COMMANDE */}
      <Modal
        animationType="slide"
        visible={showOrderDetails}
        onRequestClose={handleCloseOrderDetails}
      >
        {selectedOrder && (
          <View style={styles.modalView}>
            <View style={styles.modalHeaderClose}>
              <Text style={styles.modalTitleLarge}>Commande #{selectedOrder.ticket_numero || selectedOrder.id.substring(0, 8)}</Text>
              <TouchableOpacity onPress={handleCloseOrderDetails}>
                <X size={22} color="#18181b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Infos Client */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Client & Statut</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.detailTextLarge}>
                    {(() => {
                      const c = customers.find(x => x.id === selectedOrder.customer_id);
                      return c ? `${c.prenom} ${c.nom}` : 'Client Inconnu';
                    })()}
                  </Text>
                  <View style={[styles.statusTag, { backgroundColor: getStatusColor(selectedOrder.statut).bg, alignSelf: 'flex-start', marginTop: 8 }]}>
                    <Text style={[styles.statusTagText, { color: getStatusColor(selectedOrder.statut).text }]}>
                      {getStatusColor(selectedOrder.statut).label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Panier Articles */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Détail des Articles</Text>
                <View style={styles.detailCard}>
                  {selectedOrder.articles && selectedOrder.articles.map((art, idx) => (
                    <View key={idx} style={styles.detailArticleRow}>
                      <Text style={styles.detailArticleText}>{art.article} ({art.service.replace(/_/g, ' ')}) x{art.quantite}</Text>
                      <Text style={styles.detailArticlePrice}>{formatPrice(art.prix * art.quantite)}</Text>
                    </View>
                  ))}
                  <View style={styles.detailDivider} />
                  <View style={styles.detailArticleRow}>
                    <Text style={styles.detailLabelBold}>Total</Text>
                    <Text style={styles.detailPriceBold}>{formatPrice(selectedOrder.total)}</Text>
                  </View>
                  <View style={styles.detailArticleRow}>
                    <Text style={styles.detailLabelMuted}>Payé (Avance)</Text>
                    <Text style={styles.detailTextMuted}>{formatPrice(selectedOrder.avance)}</Text>
                  </View>
                  <View style={styles.detailArticleRow}>
                    <Text style={styles.detailLabelMuted}>Reste à payer</Text>
                    <Text style={styles.detailTextMuted}>{formatPrice(selectedOrder.reste)}</Text>
                  </View>
                </View>
              </View>

              {/* Dates & Paiement */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Détails Logistiques</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.logisticsText}>Date retrait prévue : {selectedOrder.date_retrait_prevue}</Text>
                  <Text style={styles.logisticsText}>Mode de paiement : {selectedOrder.mode_paiement}</Text>
                </View>
              </View>

              {/* Action Button for changing status */}
              {selectedOrder.statut !== 'livre' && (
                <TouchableOpacity
                  onPress={() => handleNextStatus(selectedOrder)}
                  style={styles.statusChangeBtn}
                >
                  <Text style={styles.statusChangeBtnText}>
                    {selectedOrder.statut === 'attente' ? 'Passer au Lavage' :
                     selectedOrder.statut === 'lavage_cours' ? 'Passer au Repassage' :
                     selectedOrder.statut === 'repassage_cours' ? 'Marquer comme Prêt' : 'Marquer comme Livré'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* MODAL 2 : CRÉATION DE COMMANDE */}
      <Modal
        animationType="slide"
        visible={showOrderForm}
        onRequestClose={() => setShowOrderForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalView}
        >
          <View style={styles.modalHeaderClose}>
            <Text style={styles.modalTitleLarge}>Nouvelle Commande</Text>
            <TouchableOpacity onPress={() => setShowOrderForm(false)}>
              <X size={22} color="#18181b" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Sélection du client */}
            <Text style={styles.formLabel}>Client</Text>
            <CustomSelect
              value={orderClient}
              onChange={setOrderClient}
              options={customers.map(c => ({ value: c.id, label: `${c.prenom} ${c.nom} (${c.telephone})` }))}
              placeholder="Sélectionner le client"
              style={styles.selectMargin}
            />

            {/* Sélecteur rapide d'articles */}
            <Text style={styles.formLabel}>Ajouter des Articles</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catalogScrollRow}>
              {catalog.filter(c => c.categorie !== 'system_setting' && c.service !== 'system').map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => addArticleToOrder(item)}
                  style={styles.catalogBadge}
                >
                  <Text style={styles.catalogBadgeText}>{item.article}</Text>
                  <Text style={styles.catalogBadgeService}>{item.service.replace(/_/g, ' ')}</Text>
                  <Text style={styles.catalogBadgePrice}>{item.prix} F</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Articles Sélectionnés */}
            {selectedArticles.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={styles.selectedTitle}>Panier de commande</Text>
                {selectedArticles.map((item) => (
                  <View key={item.id} style={styles.selectedRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedRowName}>{item.article}</Text>
                      <Text style={styles.selectedRowService}>{item.service.replace(/_/g, ' ')}</Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity onPress={() => removeArticleFromOrder(item.id)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => addArticleToOrder(item)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Avance payée */}
            <Text style={styles.formLabel}>Avance (FCFA)</Text>
            <TextInput
              keyboardType="numeric"
              value={orderAvance}
              onChangeText={setOrderAvance}
              style={styles.formInput}
            />

            {/* Date retrait */}
            <Text style={styles.formLabel}>Date de retrait prévue</Text>
            <TextInput
              value={orderExpDate}
              onChangeText={setOrderExpDate}
              placeholder="AAAA-MM-JJ"
              style={styles.formInput}
            />

            <TouchableOpacity
              onPress={handleCreateOrder}
              style={styles.submitOrderBtn}
            >
              <Text style={styles.submitOrderBtnText}>Enregistrer la Commande</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3 : CRÉATION / MODIFICATION CLIENT */}
      <Modal
        animationType="slide"
        visible={showCustomerModal}
        onRequestClose={() => setShowCustomerModal(false)}
        transparent={true}
      >
        <View style={styles.compactModalOverlay}>
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
      </Modal>

      {/* MODAL 4 : DETAIL CLIENT (FICHE CLIENT) */}
      <Modal
        animationType="slide"
        visible={selectedClient !== null}
        onRequestClose={() => setSelectedClient(null)}
      >
        {selectedClient && (
          <View style={styles.modalView}>
            <View style={styles.modalHeaderClose}>
              <Text style={styles.modalTitleLarge}>Fiche Client</Text>
              <TouchableOpacity onPress={() => setSelectedClient(null)}>
                <X size={22} color="#18181b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.detailCard}>
                <Text style={styles.clientProfileName}>{selectedClient.prenom} {selectedClient.nom}</Text>
                <Text style={styles.clientProfilePhone}>{selectedClient.telephone}</Text>
                <Text style={styles.clientProfileAddress}>{selectedClient.adresse || 'Aucune adresse renseignée'}</Text>
                <Text style={styles.clientProfilePreferences}>Préférence : {selectedClient.preferences || 'Plié'}</Text>
                
                <View style={styles.clientActionRow}>
                  <TouchableOpacity
                    onPress={() => handleEditCustomer(selectedClient)}
                    style={styles.clientEditBtn}
                  >
                    <Edit3 size={14} color="#3b82f6" />
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
                          <View style={[styles.statusTag, { backgroundColor: status.bg, marginBottom: 4 }]}>
                            <Text style={[styles.statusTagText, { color: status.text }]}>{status.label}</Text>
                          </View>
                          <Text style={styles.orderHistoryTotal}>{formatPrice(item.total)}</Text>
                        </View>
                      </View>
                    );
                  })
                );
              })()}
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
  tabHeader: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717a',
  },
  tabButtonTextActive: {
    color: '#18181b',
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    paddingHorizontal: 10,
    height: 40,
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
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  noResultsText: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 30,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardClientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
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
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTicketNo: {
    fontSize: 11,
    color: '#71717a',
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181b',
  },
  clientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
  },
  clientPhone: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  catalogCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  catalogArticle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
  },
  catalogService: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 2,
  },
  catalogPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181b',
  },
  modalView: {
    flex: 1,
    backgroundColor: '#f9fafc',
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
    color: '#18181b',
  },
  modalScroll: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
    marginBottom: 8,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  detailTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },
  detailArticleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailArticleText: {
    fontSize: 13,
    color: '#52525b',
  },
  detailArticlePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#f4f4f5',
    marginVertical: 10,
  },
  detailLabelBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181b',
  },
  detailPriceBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  detailLabelMuted: {
    fontSize: 12,
    color: '#71717a',
  },
  detailTextMuted: {
    fontSize: 12,
    color: '#52525b',
  },
  logisticsText: {
    fontSize: 13,
    color: '#52525b',
    paddingVertical: 2,
  },
  statusChangeBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  statusChangeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525b',
    marginTop: 14,
    marginBottom: 6,
  },
  selectMargin: {
    marginBottom: 10,
  },
  catalogScrollRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  catalogBadge: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  catalogBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181b',
  },
  catalogBadgeService: {
    fontSize: 9,
    color: '#71717a',
    marginTop: 2,
  },
  catalogBadgePrice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 4,
  },
  selectedContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  selectedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    marginBottom: 8,
  },
  selectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  selectedRowName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181b',
  },
  selectedRowService: {
    fontSize: 9,
    color: '#71717a',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181b',
  },
  formInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#18181b',
    marginBottom: 12,
  },
  submitOrderBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitOrderBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Compact Bottom-Sheet Client Modal Styles (matching Order Creation style)
  compactModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  compactModalView: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  compactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compactModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
  },
  compactModalScroll: {
    paddingBottom: 20,
  },
  compactInputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#52525b',
    marginBottom: 4,
  },
  compactInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#18181b',
    marginBottom: 10,
  },
  prefSelector: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    padding: 2,
    marginBottom: 14,
  },
  prefOption: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  prefOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  prefText: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  prefTextActive: {
    color: '#18181b',
    fontWeight: '600',
  },
  compactSubmitBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  compactSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Fiche Client Detail styles
  clientProfileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },
  clientProfilePhone: {
    fontSize: 13,
    color: '#52525b',
    marginTop: 4,
  },
  clientProfileAddress: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  clientProfilePreferences: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  clientActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingTop: 10,
  },
  clientEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clientEditBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  clientDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clientDeleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  orderHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  orderHistoryNo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181b',
  },
  orderHistoryDate: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 2,
  },
  orderHistoryTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#18181b',
  },
});
