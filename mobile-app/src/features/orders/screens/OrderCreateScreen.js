import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Platform, Alert, RefreshControl } from 'react-native';
import { Plus, Check, ShoppingBag, User, Sparkles, AlertTriangle, UserPlus } from 'lucide-react-native';
import { CustomSelect } from '../../../components/CustomSelect';
import { db } from '../../../services/db';
import { useScrollPaddingBottom } from '../../../hooks/useTabBarHeight';
import { useDbState } from '../../../hooks/useDbState';

export default function OrderCreateScreen({ onNavigate, onShowSuccess }) {
  const { isDarkMode, customers, catalog } = useDbState();
  const scrollPaddingBottom = useScrollPaddingBottom();
  const styles = getStyles(isDarkMode);

  // Active sub-page tab: 'commande' | 'client'
  const [activeMode, setActiveMode] = useState('commande');

  // Mode Commande state
  const [orderClient, setOrderClient] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [orderAvance, setOrderAvance] = useState('0');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('Espèce');
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [orderUrgency, setOrderUrgency] = useState('Normal');
  const [expandedArticles, setExpandedArticles] = useState([]);

  const [payWithSubscription, setPayWithSubscription] = useState(false);
  const [subscribePlanId, setSubscribePlanId] = useState('');

  // Mode Nouveau Client state
  const [clientNom, setClientNom] = useState('');
  const [clientPrenom, setClientPrenom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientPrefPliage, setClientPrefPliage] = useState('Plié');

  const activeCustomer = orderClient ? customers.find(c => c.id === orderClient) : null;

  useEffect(() => {
    if (activeCustomer && activeCustomer.active_subscription) {
      setPayWithSubscription(true);
    } else {
      setPayWithSubscription(false);
    }
    setSubscribePlanId('');
  }, [orderClient]);

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0 FCFA';
    return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
  };

  const getTotalClothesCount = () => {
    return selectedArticles.reduce((sum, item) => sum + item.quantity, 0);
  };

  const addArticleToOrder = (item) => {
    const existingIndex = selectedArticles.findIndex(a => a.id === item.id);
    if (existingIndex > -1) {
      const updated = [...selectedArticles];
      updated[existingIndex].quantity += 1;
      setSelectedArticles(updated);
    } else {
      setSelectedArticles([...selectedArticles, {
        id: item.id,
        article: item.article,
        service: item.service,
        price: item.prix,
        quantity: 1
      }]);
    }
  };

  const removeArticleFromOrder = (itemId) => {
    const existingIndex = selectedArticles.findIndex(a => a.id === itemId);
    if (existingIndex > -1) {
      const updated = [...selectedArticles];
      if (updated[existingIndex].quantity > 1) {
        updated[existingIndex].quantity -= 1;
        setSelectedArticles(updated);
      } else {
        setSelectedArticles(selectedArticles.filter(a => a.id !== itemId));
      }
    }
  };

  const isArticleExpanded = (articleName, items) => {
    if (expandedArticles.includes(articleName)) return true;
    return items.some(item => selectedArticles.some(cart => cart.id === item.id));
  };

  const toggleExpandArticle = (articleName) => {
    if (expandedArticles.includes(articleName)) {
      setExpandedArticles(expandedArticles.filter(a => a !== articleName));
    } else {
      setExpandedArticles([...expandedArticles, articleName]);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderClient) {
      Alert.alert("Champ requis", "Veuillez sélectionner un client.");
      return;
    }
    if (selectedArticles.length === 0) {
      Alert.alert("Articles requis", "Veuillez ajouter au moins un vêtement.");
      return;
    }

    const totalClothes = selectedArticles.reduce((sum, item) => sum + item.quantity, 0);
    if (payWithSubscription && !subscribePlanId && activeCustomer && activeCustomer.active_subscription) {
      const remaining = activeCustomer.active_subscription.remaining_clothes;
      if (remaining < totalClothes) {
        Alert.alert(
          "Solde d'abonnement insuffisant",
          `Le solde du client (${remaining} vêtements) est insuffisant pour cette commande (${totalClothes} vêtements).`
        );
        return;
      }
    }

    const currentTotal = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = Number(orderDiscount) || 0;
    const discountAmount = Math.round(currentTotal * (discountPercent / 100));
    const netTotal = currentTotal - discountAmount;
    
    const isSubscriptionActive = (!!payWithSubscription || !!subscribePlanId) && activeCustomer && (!!activeCustomer.active_subscription || !!subscribePlanId);
    const isImmediateSub = !!subscribePlanId;
    
    const finalModeReglement = isSubscriptionActive ? (isImmediateSub ? orderPaymentMethod : 'abonnement') : orderPaymentMethod;
    const finalAvance = (isSubscriptionActive && !isImmediateSub) ? 0 : (parseFloat(orderAvance) || 0);

    try {
      const currentUser = db.getCurrentUser();
      const newOrder = {
        customer_id: orderClient,
        articles: selectedArticles.map(a => ({
          article: a.article,
          service: a.service,
          quantite: a.quantity,
          prix: a.price
        })),
        total: netTotal,
        avance: finalAvance,
        statut: 'attente',
        mode_paiement: finalModeReglement,
        niveau_urgence: orderUrgency,
        remise_pourcentage: discountPercent,
        created_by_id: currentUser ? currentUser.id : 'u1',
        pay_with_subscription: payWithSubscription,
        subscribe_plan_id: subscribePlanId
      };

      await db.createOrder(newOrder);

      // Clean state
      setOrderClient('');
      setSelectedArticles([]);
      setOrderAvance('0');
      setOrderDiscount('0');
      setOrderUrgency('Normal');
      setExpandedArticles([]);
      setPayWithSubscription(false);
      setSubscribePlanId('');

      if (onShowSuccess) onShowSuccess("Commande créée avec succès !");
      if (onNavigate) onNavigate('gestion');
    } catch (e) {
      Alert.alert("Erreur", e.message || "Impossible de créer la commande.");
    }
  };

  const handleCreateClient = async () => {
    if (!clientPrenom.trim() || !clientNom.trim()) {
      Alert.alert("Champs requis", "Veuillez saisir le prénom et le nom du client.");
      return;
    }
    if (!clientTelephone.trim()) {
      Alert.alert("Champ requis", "Veuillez saisir le numéro de téléphone.");
      return;
    }

    try {
      const newCustomer = await db.addCustomer({
        prenom: clientPrenom.trim(),
        nom: clientNom.trim(),
        telephone: clientTelephone.trim(),
        adresse: clientAdresse.trim(),
        preferences_pliage: clientPrefPliage,
      });

      // Clear new client form state
      setClientPrenom('');
      setClientNom('');
      setClientTelephone('');
      setClientAdresse('');
      setClientPrefPliage('Plié');

      if (onShowSuccess) onShowSuccess(`Client ${newCustomer.prenom} ${newCustomer.nom} créé avec succès !`);
      
      // Auto-select the newly created client and switch back to Order Creation form!
      setOrderClient(newCustomer.id);
      setActiveMode('commande');
    } catch (e) {
      Alert.alert("Erreur", e.message || "Impossible de créer le client.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar with Segmented Buttons (Nouvelle Commande / Nouveau Client) */}
      <View style={styles.headerBar}>
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveMode('commande')}
            style={[
              styles.segmentedBtn,
              activeMode === 'commande' && styles.segmentedBtnActive
            ]}
          >
            <ShoppingBag size={15} color={activeMode === 'commande' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b')} style={{ marginRight: 6 }} />
            <Text style={[
              styles.segmentedBtnText,
              activeMode === 'commande' && styles.segmentedBtnTextActive
            ]}>
              Nouvelle Commande
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveMode('client')}
            style={[
              styles.segmentedBtn,
              activeMode === 'client' && styles.segmentedBtnActive
            ]}
          >
            <UserPlus size={15} color={activeMode === 'client' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b')} style={{ marginRight: 6 }} />
            <Text style={[
              styles.segmentedBtnText,
              activeMode === 'client' && styles.segmentedBtnTextActive
            ]}>
              Nouveau Client
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeMode === 'client' ? (
        /* PAGE 2: NOUVEAU CLIENT */
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <UserPlus size={16} color="#002cf7" />
              <Text style={styles.sectionTitle}>Création d'un Nouveau Client</Text>
            </View>

            <View style={styles.formRowInline}>
              <View style={styles.formFieldInline}>
                <Text style={styles.formLabel}>Prénom *</Text>
                <TextInput
                  value={clientPrenom}
                  onChangeText={setClientPrenom}
                  placeholder="Ex: Jean"
                  placeholderTextColor="#a1a1aa"
                  style={styles.formInput}
                />
              </View>
              <View style={styles.formFieldInline}>
                <Text style={styles.formLabel}>Nom *</Text>
                <TextInput
                  value={clientNom}
                  onChangeText={setClientNom}
                  placeholder="Ex: KOFFI"
                  placeholderTextColor="#a1a1aa"
                  style={styles.formInput}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Numéro de Téléphone *</Text>
            <TextInput
              keyboardType="phone-pad"
              value={clientTelephone}
              onChangeText={setClientTelephone}
              placeholder="Ex: 97000000"
              placeholderTextColor="#a1a1aa"
              style={styles.formInput}
            />

            <Text style={styles.formLabel}>Adresse / Quartier</Text>
            <TextInput
              value={clientAdresse}
              onChangeText={setClientAdresse}
              placeholder="Ex: Cotonou, Cadjehoun"
              placeholderTextColor="#a1a1aa"
              style={styles.formInput}
            />

            <Text style={styles.formLabel}>Préférence de pliage</Text>
            <View style={styles.urgencyRow}>
              {['Plié', 'Sur Cintre'].map((pref) => {
                const isActive = clientPrefPliage === pref;
                return (
                  <TouchableOpacity
                    key={pref}
                    onPress={() => setClientPrefPliage(pref)}
                    style={[
                      styles.urgencyBtn,
                      isActive && { backgroundColor: '#002cf7', borderColor: '#002cf7' }
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.urgencyBtnText, isActive && { color: '#ffffff' }]}>
                      {pref}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity 
            activeOpacity={0.85}
            onPress={handleCreateClient}
            style={styles.submitBtn}
          >
            <Text style={styles.submitBtnText}>Enregistrer le Client</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* PAGE 1: NOUVELLE COMMANDE */
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Sélection du Client */}
          <View style={[styles.cardSection, { zIndex: 30, elevation: 30 }]}>
            <View style={styles.sectionHeader}>
              <User size={16} color="#002cf7" />
              <Text style={styles.sectionTitle}>1. Client & Abonnement</Text>
            </View>

            <Text style={styles.formLabel}>Client</Text>
            <CustomSelect
              value={orderClient}
              onChange={setOrderClient}
              options={customers.map(c => ({ value: c.id, label: `${c.prenom} ${c.nom} (${c.telephone})` }))}
              placeholder="Sélectionner un client"
              style={styles.selectMargin}
            />

            {/* Subscriptions Info Card */}
            {activeCustomer && (
              <View style={styles.subContainer}>
                {activeCustomer.active_subscription ? (
                  <View style={styles.subCard}>
                    <View style={styles.subHeaderRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          if (!subscribePlanId) setPayWithSubscription(!payWithSubscription);
                        }}
                        disabled={!!subscribePlanId}
                        style={styles.checkboxRow}
                      >
                        <View style={[
                          styles.checkbox,
                          payWithSubscription && styles.checkboxChecked,
                          !!subscribePlanId && styles.checkboxDisabled
                        ]}>
                          {payWithSubscription && <Check size={12} color="#ffffff" />}
                        </View>
                        <Text style={[styles.checkboxLabel, !!subscribePlanId && { color: '#a1a1aa' }]}>
                          Déduire du solde abonnement
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.subTextBold}>
                        ({activeCustomer.active_subscription.remaining_clothes} vêt. restants)
                      </Text>
                    </View>

                    {payWithSubscription && !subscribePlanId && getTotalClothesCount() > activeCustomer.active_subscription.remaining_clothes && (
                      <View style={styles.alertRow}>
                        <AlertTriangle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                        <Text style={styles.alertText}>
                          Solde insuffisant ({getTotalClothesCount()} vêt. requis)
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.subCard}>
                    <Text style={styles.subLabelSmallBold}>Souscrire un abonnement immédiat :</Text>
                    <CustomSelect
                      value={subscribePlanId}
                      onChange={(val) => {
                        setSubscribePlanId(val);
                        setPayWithSubscription(!!val);
                      }}
                      options={[
                        { label: "-- Pas d'abonnement --", value: "" },
                        ...catalog.filter(c => c.categorie === 'abonnement' && c.is_active !== false && c.statut !== 'inactif').map(p => ({
                          label: `${p.article} (${p.prix.toLocaleString('fr-FR')} FCFA)`,
                          value: p.id
                        }))
                      ]}
                      placeholder="Pas d'abonnement"
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Step 2: Vêtements & Prestations */}
          <View style={[styles.cardSection, { zIndex: 20, elevation: 20 }]}>
            <View style={styles.sectionHeader}>
              <ShoppingBag size={16} color="#002cf7" />
              <Text style={styles.sectionTitle}>2. Sélection des Vêtements</Text>
            </View>

            <View style={styles.fixedArticleContainer}>
              <ScrollView 
                nestedScrollEnabled={true} 
                showsVerticalScrollIndicator={true}
                style={styles.fixedArticleScrollView}
                contentContainerStyle={{ paddingRight: 4, paddingBottom: 4 }}
              >
                {(() => {
                  const uniqueArticles = [...new Set(catalog
                    .filter(c => 
                      c.article &&
                      c.categorie !== 'system_setting' && 
                      c.service !== 'system' && 
                      c.categorie !== 'abonnement' && 
                      c.service !== 'abonnement' &&
                      !c.id?.startsWith('setting_') &&
                      c.is_active !== false &&
                      (c.service === 'lavage_simple' || c.service === 'repassage' || c.service === 'traitement')
                    )
                    .map(c => c.article.trim())
                  )];

                  if (uniqueArticles.length === 0) {
                    return <Text style={styles.emptyText}>Aucun article disponible</Text>;
                  }

                  return uniqueArticles.map(articleName => {
                    const items = catalog.filter(c => 
                      c.article && 
                      c.article.trim().toLowerCase() === articleName.toLowerCase() &&
                      c.categorie !== 'system_setting' &&
                      c.service !== 'system' &&
                      c.categorie !== 'abonnement' &&
                      c.service !== 'abonnement' &&
                      !c.id?.startsWith('setting_') &&
                      c.is_active !== false &&
                      (c.service === 'lavage_simple' || c.service === 'repassage' || c.service === 'traitement')
                    );
                    
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
                            {items.map(item => {
                              const serviceLabel = 
                                (item.service === 'lavage_simple' || item.service === 'traitement') ? 'Traitement' :
                                item.service === 'repassage' ? 'Repassage' :
                                item.service ? item.service.replace(/_/g, ' ') : 'Service';

                              const qty = getQtyInCart(item.id);

                              return (
                                <View key={item.id || `${articleName}_${item.service}`} style={styles.serviceRow}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.serviceLabel}>{serviceLabel}</Text>
                                    <Text style={styles.servicePrice}>{formatPrice(item.prix)}</Text>
                                  </View>
                                  {qty === 0 ? (
                                    <TouchableOpacity 
                                      onPress={() => addArticleToOrder(item)}
                                      style={styles.serviceAddBtn}
                                    >
                                      <Plus size={12} color="#002cf7" style={{ marginRight: 4 }} />
                                      <Text style={styles.serviceAddBtnText}>Ajouter</Text>
                                    </TouchableOpacity>
                                  ) : (
                                    <View style={styles.serviceQtyRow}>
                                      <TouchableOpacity onPress={() => removeArticleFromOrder(item.id)} style={styles.serviceQtyBtn}>
                                        <Text style={styles.serviceQtyBtnText}>-</Text>
                                      </TouchableOpacity>
                                      <Text style={styles.serviceQtyText}>{qty}</Text>
                                      <TouchableOpacity onPress={() => addArticleToOrder(item)} style={styles.serviceQtyBtn}>
                                        <Text style={styles.serviceQtyBtnText}>+</Text>
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}
              </ScrollView>
            </View>
          </View>

          {/* Step 3: Options & Paiement */}
          <View style={[styles.cardSection, { zIndex: 10, elevation: 10 }]}>
            <View style={styles.sectionHeader}>
              <Sparkles size={16} color="#002cf7" />
              <Text style={styles.sectionTitle}>3. Options & Paiement</Text>
            </View>

            {/* Niveau d'urgence */}
            <Text style={styles.formLabel}>Niveau d'Urgence</Text>
            <View style={styles.urgencyRow}>
              {['Normal', 'Express'].map((level) => {
                const isActive = orderUrgency === level;
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setOrderUrgency(level)}
                    style={[
                      styles.urgencyBtn, 
                      isActive && { backgroundColor: level === 'Express' ? '#e11d48' : '#002cf7', borderColor: level === 'Express' ? '#e11d48' : '#002cf7' }
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.urgencyBtnText, isActive && { color: '#ffffff' }]}>
                      {level === 'Express' ? '⚡ Express (24h)' : '⏱ Normal (48h)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Avance & Mode de paiement */}
            <View style={[styles.formRowInline, { zIndex: 20, elevation: 20 }]}>
              <View style={styles.formFieldInline}>
                <Text style={styles.formLabel}>Avance (FCFA)</Text>
                <TextInput
                  keyboardType="numeric"
                  value={orderAvance}
                  onChangeText={setOrderAvance}
                  style={styles.formInput}
                />
              </View>
              <View style={[styles.formFieldInline, { zIndex: 20, elevation: 20 }]}>
                <Text style={styles.formLabel}>Mode Règlement</Text>
                <CustomSelect
                  value={orderPaymentMethod}
                  onChange={setOrderPaymentMethod}
                  options={[
                    { value: 'Espèce', label: 'Espèce' },
                    { value: 'Mobile Money', label: 'Mobile Money' }
                  ]}
                  placeholder="Mode"
                  buttonStyle={styles.formSelectButton}
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
          </View>

          {/* Facturation & Live Receipt Preview */}
          {(() => {
            const isSubscriptionActive = (!!payWithSubscription || !!subscribePlanId) && activeCustomer && (!!activeCustomer.active_subscription || !!subscribePlanId);
            let currentTotal = 0;
            let isImmediateSub = false;
            
            if (subscribePlanId) {
              const subPlan = catalog.find(c => c.id === subscribePlanId && c.categorie === 'abonnement');
              currentTotal = subPlan ? subPlan.prix : 0;
              isImmediateSub = true;
            } else if (isSubscriptionActive) {
              currentTotal = 0;
            } else {
              currentTotal = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            }

            if (!isSubscriptionActive && orderUrgency === 'Express') {
              const expressMarkupItem = catalog.find(c => c.id === 'setting_express_markup');
              const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;
              currentTotal = Math.round(currentTotal * (1 + expressMarkup / 100));
            }

            const discountPercent = Number(orderDiscount) || 0;
            const discountAmount = Math.round(currentTotal * (discountPercent / 100));
            const netTotal = currentTotal - discountAmount;
            const currentAvance = (isSubscriptionActive && !isImmediateSub) ? 0 : (parseFloat(orderAvance) || 0);
            const currentReste = netTotal - currentAvance;

            return (
              <View style={styles.receiptPreviewCard}>
                <Text style={styles.receiptSectionTitle}>Récapitulatif de la Facture</Text>
                
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Total Brut</Text>
                  <Text style={styles.receiptRowVal}>
                    {isSubscriptionActive && !isImmediateSub ? 'Forfait Abonnement' : formatPrice(currentTotal)}
                  </Text>
                </View>

                {discountAmount > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Réduction ({discountPercent}%)</Text>
                    <Text style={[styles.receiptRowVal, { color: '#ef4444' }]}>-{formatPrice(discountAmount)}</Text>
                  </View>
                )}

                <View style={styles.receiptDivider} />

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabelBold}>Total Net À Payer</Text>
                  <Text style={[styles.receiptRowValBold, { color: '#002cf7' }]}>{formatPrice(netTotal)}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Avance versée</Text>
                  <Text style={[styles.receiptRowVal, { color: '#10b981' }]}>{formatPrice(currentAvance)}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabelBold}>Reste à régler</Text>
                  <Text style={[styles.receiptRowValBold, { color: currentReste > 0 ? '#ef4444' : '#10b981' }]}>
                    {formatPrice(currentReste)}
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Action Button */}
          <TouchableOpacity 
            activeOpacity={0.85}
            onPress={handleCreateOrder}
            style={styles.submitBtn}
          >
            <Text style={styles.submitBtnText}>Valider et Créer la Commande</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function getStyles(isDarkMode) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    },
    headerBar: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#27272a' : '#f1f5f9',
    },
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#121212' : '#f1f5f9',
      borderRadius: 16,
      padding: 4,
    },
    segmentedBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
    },
    segmentedBtnActive: {
      backgroundColor: '#002cf7',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    segmentedBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#d4d4d8' : '#475569',
    },
    segmentedBtnTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
    scrollContent: {
      padding: 20,
      gap: 16,
    },
    cardSection: {
      backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#09090b',
    },
    formLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#d4d4d8' : '#475569',
      marginBottom: 6,
      marginTop: 8,
    },
    selectMargin: {
      marginBottom: 8,
    },
    subContainer: {
      marginTop: 8,
    },
    subCard: {
      backgroundColor: isDarkMode ? '#18181b' : '#eff6ff',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#dbeafe',
    },
    subHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: '#002cf7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#002cf7',
    },
    checkboxDisabled: {
      opacity: 0.5,
    },
    checkboxLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#09090b',
    },
    subTextBold: {
      fontSize: 12,
      fontWeight: '700',
      color: '#002cf7',
    },
    subLabelSmallBold: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#d4d4d8' : '#334155',
      marginBottom: 6,
    },
    alertRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    alertText: {
      fontSize: 12,
      color: '#ef4444',
      fontWeight: '600',
    },
    clothingCard: {
      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
      borderRadius: 12,
      padding: 12,
      marginVertical: 4,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
    },
    clothingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    clothingName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#09090b',
    },
    clothingAddBtn: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.2)' : '#eff6ff',
      borderRadius: 8,
    },
    clothingAddBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#002cf7',
    },
    clothingCloseBtn: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
      borderRadius: 8,
    },
    clothingCloseBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#d4d4d8' : '#64748b',
    },
    servicesContainer: {
      marginTop: 10,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#27272a' : '#f1f5f9',
      paddingTop: 8,
    },
    serviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    serviceLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: isDarkMode ? '#d4d4d8' : '#334155',
    },
    servicePrice: {
      fontSize: 11,
      color: isDarkMode ? '#a1a1aa' : '#64748b',
    },
    serviceAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#002cf7',
    },
    serviceAddBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#002cf7',
    },
    serviceQtyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    serviceQtyBtn: {
      width: 26,
      height: 26,
      borderRadius: 6,
      backgroundColor: '#002cf7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    serviceQtyBtnText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 14,
    },
    serviceQtyText: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#09090b',
      minWidth: 16,
      textAlign: 'center',
    },
    urgencyRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
      marginBottom: 8,
    },
    urgencyBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
    },
    urgencyBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#d4d4d8' : '#475569',
    },
    formRowInline: {
      flexDirection: 'row',
      gap: 10,
    },
    formFieldInline: {
      flex: 1,
    },
    formInput: {
      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#09090b',
    },
    formSelectButton: {
      height: 42,
    },
    receiptPreviewCard: {
      backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
    },
    receiptSectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#09090b',
      marginBottom: 10,
    },
    receiptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 3,
    },
    receiptRowLabel: {
      fontSize: 13,
      color: isDarkMode ? '#a1a1aa' : '#64748b',
    },
    receiptRowVal: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#09090b',
    },
    receiptRowLabelBold: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#09090b',
    },
    receiptRowValBold: {
      fontSize: 14,
      fontWeight: '700',
    },
    receiptDivider: {
      height: 1,
      backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0',
      marginVertical: 8,
    },
    submitBtn: {
      backgroundColor: '#002cf7',
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
      marginTop: 8,
    },
    submitBtnText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
    emptyText: {
      fontSize: 13,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      textAlign: 'center',
      paddingVertical: 10,
    },
    fixedArticleContainer: {
      height: 280,
      maxHeight: 280,
      borderRadius: 14,
      overflow: 'hidden',
      marginTop: 8,
    },
    fixedArticleScrollView: {
      flex: 1,
    },
  });
}
