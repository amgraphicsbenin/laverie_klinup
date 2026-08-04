import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Platform, Alert, RefreshControl } from 'react-native';
import { Plus, Check, ShoppingBag, User, Sparkles, AlertTriangle, UserPlus, Gift, MapPin } from 'lucide-react-native';
import { CustomSelect } from '../../../components/CustomSelect';
import { db } from '../../../services/db';
import { useScrollPaddingBottom } from '../../../hooks/useTabBarHeight';
import { useDbState } from '../../../hooks/useDbState';
import { t } from '../../../services/i18n';

export default function OrderCreateScreen({ onNavigate, onShowSuccess, isActive }) {
  const { isDarkMode, customers, catalog: rawCatalog, currentUser } = useDbState();
  const catalog = useMemo(() => {
    if (!rawCatalog) return [];
    if (!currentUser?.store_id || currentUser?.store_id === 'all') return rawCatalog;
    return rawCatalog.filter(c => !c.store_id || c.store_id === 'all' || c.store_id === currentUser.store_id);
  }, [rawCatalog, currentUser]);
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
  const [momoRefNumber, setMomoRefNumber] = useState('');
  const [momoRefError, setMomoRefError] = useState('');
  const [momoOperator, setMomoOperator] = useState('MTN');
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const [payWithSubscription, setPayWithSubscription] = useState(false);
  const [subscribePlanId, setSubscribePlanId] = useState('');
  const [appliedReward, setAppliedReward] = useState(null);

  // Mode Nouveau Client state
  const [clientNom, setClientNom] = useState('');
  const [clientPrenom, setClientPrenom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientQuartier, setClientQuartier] = useState('');
  const [clientVille, setClientVille] = useState('Cotonou');
  const [clientLatitude, setClientLatitude] = useState('');
  const [clientLongitude, setClientLongitude] = useState('');
  const [clientDeliveryPreview, setClientDeliveryPreview] = useState(null);
  const [clientPrefPliage, setClientPrefPliage] = useState('Plié');
  const [clientSubscriptionPlanId, setClientSubscriptionPlanId] = useState('');

  const activeCustomer = orderClient ? customers.find(c => c.id === orderClient) : null;
  const isSubscriptionMode = (!!payWithSubscription || !!subscribePlanId) && activeCustomer && (!!activeCustomer.active_subscription || !!subscribePlanId);

  useEffect(() => {
    if (isSubscriptionMode) {
      setOrderAvance('0');
      setOrderDiscount('0');
      setOrderUrgency('Normal');
    }
  }, [isSubscriptionMode]);

  const getAvailableRewards = (customer) => {
    if (!customer || !Array.isArray(customer.rewards)) return [];
    return customer.rewards.filter(r => r.status === 'available' || !r.status);
  };

  const resetForm = () => {
    // Mode commande reset
    setOrderClient('');
    setSelectedArticles([]);
    setOrderAvance('0');
    setOrderPaymentMethod('Espèce');
    setOrderDiscount('0');
    setOrderUrgency('Normal');
    setExpandedArticles([]);
    setPayWithSubscription(false);
    setSubscribePlanId('');
    setAppliedReward(null);
    setMomoRefNumber('');
    setMomoRefError('');
    setMomoOperator('MTN');
    setClientSearchQuery('');
    setActiveMode('commande');

    // Mode nouveau client reset
    setClientNom('');
    setClientPrenom('');
    setClientTelephone('');
    setClientAdresse('');
    setClientQuartier('');
    setClientVille('Cotonou');
    setClientLatitude('');
    setClientLongitude('');
    setClientDeliveryPreview(null);
    setClientPrefPliage('Plié');
    setClientSubscriptionPlanId('');
  };

  // Whenever the tab becomes inactive (user switches away), format/reset the form completely
  useEffect(() => {
    if (isActive === false) {
      resetForm();
    }
  }, [isActive]);

  const handleCancelOrder = () => {
    const hasData = !!orderClient || selectedArticles.length > 0 || parseFloat(orderAvance) > 0 || parseInt(orderDiscount) > 0 || !!subscribePlanId || !!appliedReward;
    if (hasData) {
      Alert.alert(
        "Confirmer l'annulation",
        "Voulez-vous vraiment annuler la création de cette commande ? Toutes les informations saisies seront réinitialisées.",
        [
          { text: "Continuer l'édition", style: "cancel" },
          {
            text: "Oui, annuler",
            style: "destructive",
            onPress: () => {
              resetForm();
              if (onNavigate) onNavigate('accueil');
            }
          }
        ]
      );
    } else {
      resetForm();
      if (onNavigate) onNavigate('accueil');
    }
  };

  useEffect(() => {
    if (activeCustomer && activeCustomer.active_subscription) {
      setPayWithSubscription(true);
    } else {
      setPayWithSubscription(false);
    }
    setSubscribePlanId('');
    setAppliedReward(null);
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

    if (finalModeReglement === 'Mobile Money') {
      const ref = momoRefNumber.trim();
      if (!ref) {
        setMomoRefError("Numéro de référence Mobile Money requis.");
        return;
      }
      if (!/^\d{8,15}$/.test(ref)) {
        setMomoRefError("Le numéro de référence doit contenir entre 8 et 15 chiffres.");
        return;
      }
    }

    try {
      const currentUser = db.getCurrentUser();

      let rewardDiscountVal = 0;
      if (appliedReward) {
        if (appliedReward.discount_amount > 0) {
          rewardDiscountVal = Number(appliedReward.discount_amount);
        } else if (appliedReward.discountAmount > 0) {
          rewardDiscountVal = Number(appliedReward.discountAmount);
        } else {
          const match = (appliedReward.title || '').match(/(\d[\d\s]*)\s*FCFA/i);
          if (match) {
            rewardDiscountVal = parseInt(match[1].replace(/\s/g, ''), 10) || 0;
          }
        }
      }

      const deliveryCalc = activeCustomer && activeCustomer.coordonnees_livraison
        ? db.calculateDeliveryFee(currentUser?.store_id || 'store_central', activeCustomer.coordonnees_livraison)
        : { fee: 0, distanceKm: 0, zoneLabel: 'N/A' };
      const deliveryFee = deliveryCalc.fee || 0;

      const finalTotal = Math.max(0, netTotal - rewardDiscountVal) + deliveryFee;

      const newOrder = {
        customer_id: orderClient,
        articles: selectedArticles.map(a => ({
          article: a.article,
          service: a.service,
          quantite: a.quantity,
          prix: a.price
        })),
        total: finalTotal,
        frais_livraison: deliveryFee,
        distance_km: deliveryCalc.distanceKm,
        avance: finalAvance,
        statut: 'attente',
        mode_paiement: finalModeReglement,
        niveau_urgence: orderUrgency,
        remise_pourcentage: discountPercent,
        applied_reward_id: appliedReward ? appliedReward.id : null,
        applied_reward_title: appliedReward ? appliedReward.title : null,
        applied_reward_discount: rewardDiscountVal,
        created_by_id: currentUser ? currentUser.id : 'u1',
        pay_with_subscription: payWithSubscription,
        subscribe_plan_id: subscribePlanId,
        reference_paiement: finalModeReglement === 'Mobile Money' ? momoRefNumber.trim() : null,
        operateur_momo: finalModeReglement === 'Mobile Money' ? momoOperator : null
      };

      const created = await db.createOrder(newOrder);

      if (created && appliedReward && activeCustomer) {
        if (db.markCustomerRewardUsed) {
          await db.markCustomerRewardUsed(activeCustomer.id, appliedReward.id, created.id);
        }
      }

      // Clean state
      setOrderClient('');
      setSelectedArticles([]);
      setOrderAvance('0');
      setOrderDiscount('0');
      setOrderUrgency('Normal');
      setExpandedArticles([]);
      setPayWithSubscription(false);
      setSubscribePlanId('');
      setAppliedReward(null);
      setMomoRefNumber('');
      setMomoRefError('');
      setMomoOperator('MTN');

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
      const lat = clientLatitude.trim() ? parseFloat(clientLatitude.trim()) : null;
      const lng = clientLongitude.trim() ? parseFloat(clientLongitude.trim()) : null;
      const coords = (lat != null && lng != null && !isNaN(lat) && !isNaN(lng))
        ? `${lat},${lng}`
        : null;

      const newCustomer = await db.addCustomer({
        prenom: clientPrenom.trim(),
        nom: clientNom.trim(),
        telephone: clientTelephone.trim(),
        adresse: clientAdresse.trim(),
        quartier: clientQuartier.trim(),
        ville: clientVille.trim() || 'Cotonou',
        latitude: lat,
        longitude: lng,
        coordonnees_livraison: coords,
        preferences_pliage: clientPrefPliage,
        store_id: currentUser?.store_id
      });

      if (newCustomer && clientSubscriptionPlanId) {
        await db.subscribeCustomer(newCustomer.id, clientSubscriptionPlanId);
      }

      // Clear new client form state
      setClientPrenom('');
      setClientNom('');
      setClientTelephone('');
      setClientAdresse('');
      setClientQuartier('');
      setClientVille('Cotonou');
      setClientLatitude('');
      setClientLongitude('');
      setClientDeliveryPreview(null);
      setClientPrefPliage('Plié');
      setClientSubscriptionPlanId('');

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

            <Text style={styles.formLabel}>Adresse (Rue / Domicile)</Text>
            <TextInput
              value={clientAdresse}
              onChangeText={setClientAdresse}
              placeholder="Ex: Rue 123, Immeuble..."
              placeholderTextColor="#a1a1aa"
              style={styles.formInput}
            />

            <View style={styles.formRowInline}>
              <View style={styles.formFieldInline}>
                <Text style={styles.formLabel}>Quartier</Text>
                <TextInput
                  value={clientQuartier}
                  onChangeText={setClientQuartier}
                  placeholder="Ex: Cadjehoun"
                  placeholderTextColor="#a1a1aa"
                  style={styles.formInput}
                />
              </View>
              <View style={styles.formFieldInline}>
                <Text style={styles.formLabel}>Ville</Text>
                <TextInput
                  value={clientVille}
                  onChangeText={setClientVille}
                  placeholder="Ex: Cotonou"
                  placeholderTextColor="#a1a1aa"
                  style={styles.formInput}
                />
              </View>
            </View>

            {/* Section Position GPS & Estimation des Frais de Livraison */}
            <View style={{
              borderRadius: 14,
              borderWidth: 1,
              padding: 12,
              marginBottom: 16,
              backgroundColor: isDarkMode ? '#1e293b' : '#f0f7ff',
              borderColor: isDarkMode ? '#1d4ed8' : '#93c5fd'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <MapPin size={16} color="#002cf7" />
                <Text style={[styles.formLabel, { marginLeft: 6, marginBottom: 0, color: '#002cf7', fontWeight: '700' }]}>
                  Position GPS (Calcul de livraison)
                </Text>
              </View>
              <Text style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, marginBottom: 10 }}>
                Saisissez la latitude et la longitude du domicile du client pour calculer automatiquement les frais de livraison.
              </Text>

              <View style={styles.formRowInline}>
                <View style={styles.formFieldInline}>
                  <Text style={styles.formLabel}>Latitude</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={clientLatitude}
                    onChangeText={(v) => {
                      setClientLatitude(v);
                      setClientDeliveryPreview(null);
                    }}
                    placeholder="Ex: 6.3650"
                    placeholderTextColor="#a1a1aa"
                    style={styles.formInput}
                  />
                </View>
                <View style={styles.formFieldInline}>
                  <Text style={styles.formLabel}>Longitude</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={clientLongitude}
                    onChangeText={(v) => {
                      setClientLongitude(v);
                      setClientDeliveryPreview(null);
                    }}
                    placeholder="Ex: 2.4100"
                    placeholderTextColor="#a1a1aa"
                    style={styles.formInput}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  const lat = parseFloat(clientLatitude.trim());
                  const lng = parseFloat(clientLongitude.trim());
                  if (isNaN(lat) || isNaN(lng)) {
                    Alert.alert("Coordonnées invalides", "Veuillez saisir une latitude et une longitude valides.");
                    return;
                  }
                  const storeId = currentUser?.store_id;
                  const result = db.calculateDeliveryFee(storeId, null, lat, lng);
                  setClientDeliveryPreview(result);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  marginTop: 6,
                  backgroundColor: '#002cf7'
                }}
                activeOpacity={0.85}
              >
                <MapPin size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                  Estimer les frais de livraison
                </Text>
              </TouchableOpacity>

              {clientDeliveryPreview && (
                <View style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor: clientDeliveryPreview.fee > 0 ? (isDarkMode ? '#0f2a1a' : '#f0fff4') : (isDarkMode ? '#1a1a2e' : '#fff8f0'),
                  borderColor: clientDeliveryPreview.fee > 0 ? '#22c55e' : '#f97316'
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                      📍 Distance estimée
                    </Text>
                    <Text style={{ fontWeight: '700', color: isDarkMode ? '#fff' : '#0f172a', fontSize: 13 }}>
                      {clientDeliveryPreview.distanceKm} km
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <Text style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                      🚚 Zone
                    </Text>
                    <Text style={{ fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 12 }}>
                      {clientDeliveryPreview.zoneLabel}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <Text style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                      💰 Frais de livraison
                    </Text>
                    <Text style={{ fontWeight: '800', fontSize: 15, color: clientDeliveryPreview.fee > 0 ? '#22c55e' : '#f97316' }}>
                      {clientDeliveryPreview.fee > 0 ? `${clientDeliveryPreview.fee.toLocaleString('fr-FR')} FCFA` : 'Hors zone'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

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

            <Text style={[styles.formLabel, { marginTop: 14 }]}>Forfait d'abonnement (Facultatif)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setClientSubscriptionPlanId("")}
                style={[
                  styles.planChip,
                  !clientSubscriptionPlanId && styles.planChipActive
                ]}
              >
                <Text style={[styles.planChipText, !clientSubscriptionPlanId && styles.planChipTextActive]}>
                  Aucun
                </Text>
              </TouchableOpacity>
              {((catalog || []).filter(c => (c.categorie === 'abonnement' || c.service === 'abonnement') && c.is_active !== false && c.statut !== 'inactif')).map((p) => {
                const isSelected = clientSubscriptionPlanId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setClientSubscriptionPlanId(isSelected ? "" : p.id)}
                    style={[styles.planChip, isSelected && styles.planChipActive]}
                  >
                    <Text style={[styles.planChipText, isSelected && styles.planChipTextActive]}>
                      {p.article} ({(p.prix || 0).toLocaleString('fr-FR')} FCFA)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
                    const ALLOWED_SERVICES = ['lavage_simple', 'traitement', 'repassage'];
                    const rawItems = catalog.filter(c =>
                      c.article &&
                      c.article.trim().toLowerCase() === articleName.toLowerCase() &&
                      c.categorie !== 'system_setting' &&
                      c.service !== 'system' &&
                      c.categorie !== 'abonnement' &&
                      c.service !== 'abonnement' &&
                      !c.id?.startsWith('setting_') &&
                      c.is_active !== false &&
                      ALLOWED_SERVICES.includes(c.service)
                    );

                    const canonicalMap = new Map();
                    rawItems
                      .filter(item => item.service === 'repassage')
                      .forEach(item => canonicalMap.set('repassage', { ...item }));
                    rawItems
                      .filter(item => item.service === 'traitement')
                      .forEach(item => { if (!canonicalMap.has('lavage_simple')) canonicalMap.set('lavage_simple', { ...item, service: 'lavage_simple' }); });
                    rawItems
                      .filter(item => item.service === 'lavage_simple')
                      .forEach(item => canonicalMap.set('lavage_simple', { ...item, service: 'lavage_simple' }));

                    const serviceOrder = ['lavage_simple', 'repassage'];
                    const items = serviceOrder
                      .filter(k => canonicalMap.has(k))
                      .map(k => canonicalMap.get(k));

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
            <Text style={[styles.formLabel, isSubscriptionMode && { color: isDarkMode ? '#52525b' : '#94a3b8' }]}>
              Niveau d'Urgence
            </Text>
            <View style={[styles.urgencyRow, isSubscriptionMode && { opacity: 0.7 }]}>
              {['Normal', 'Express'].map((level) => {
                const isActive = (isSubscriptionMode ? 'Normal' : orderUrgency) === level;
                const isDisabled = isSubscriptionMode;
                return (
                  <TouchableOpacity
                    key={level}
                    disabled={isDisabled}
                    onPress={() => !isDisabled && setOrderUrgency(level)}
                    style={[
                      styles.urgencyBtn,
                      isActive ? { backgroundColor: '#002cf7', borderColor: '#002cf7' } : null,
                      isDisabled && level === 'Express' && {
                        backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
                        borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                      }
                    ]}
                    activeOpacity={isDisabled ? 1 : 0.8}
                  >
                    <Text style={[
                      styles.urgencyBtnText,
                      isActive && { color: '#ffffff' },
                      isDisabled && level === 'Express' && { color: isDarkMode ? '#52525b' : '#94a3b8' }
                    ]}>
                      {level === 'Express' ? '⚡ Express (24h)' : '⏱ Normal (48h)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Avance & Mode de paiement */}
            <View style={[styles.formRowInline, { zIndex: 20, elevation: 20 }]}>
              <View style={styles.formFieldInline}>
                <Text style={[styles.formLabel, isSubscriptionMode && { color: isDarkMode ? '#52525b' : '#94a3b8' }]}>
                  Avance (FCFA)
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={isSubscriptionMode ? '0' : orderAvance}
                  onChangeText={setOrderAvance}
                  editable={!isSubscriptionMode}
                  style={[
                    styles.formInput,
                    isSubscriptionMode && {
                      backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
                      color: isDarkMode ? '#52525b' : '#94a3b8',
                      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                      opacity: 0.7
                    }
                  ]}
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

            {/* Champ Référence Mobile Money Obligatoire */}
            {orderPaymentMethod === 'Mobile Money' && (
              <View style={{ marginBottom: 14 }}>
                {/* Opérateur Mobile Money */}
                <Text style={[styles.formLabel, { color: '#002cf7', marginBottom: 6 }]}>
                  Opérateur Réseau <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {['MTN', 'MOOV', 'CELTIS'].map((op) => (
                    <TouchableOpacity
                      key={op}
                      onPress={() => setMomoOperator(op)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: momoOperator === op ? 2 : 1.5,
                        borderColor: momoOperator === op ? '#002cf7' : (isDarkMode ? '#3f3f46' : '#d4d4d8'),
                        backgroundColor: momoOperator === op
                          ? (op === 'MTN' ? '#FFCC00' : op === 'MOOV' ? '#0057A8' : '#E30613')
                          : (isDarkMode ? '#18181b' : '#f8fafc'),
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{
                        fontWeight: '800',
                        fontSize: 12,
                        color: momoOperator === op ? (op === 'MTN' ? '#1a1a1a' : '#ffffff') : (isDarkMode ? '#94a3b8' : '#64748b')
                      }}>{op}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: '#002cf7' }]}>
                  N° Référence Transaction Mobile Money <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={momoRefNumber}
                  onChangeText={(text) => {
                    const val = text.replace(/\D/g, '').slice(0, 15);
                    setMomoRefNumber(val);
                    if (momoRefError) setMomoRefError('');
                  }}
                  placeholder="8 à 15 chiffres (ex: 12345678)"
                  placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                  keyboardType="numeric"
                  maxLength={15}
                  style={[
                    styles.formInput,
                    momoRefError ? { borderColor: '#ef4444', borderWidth: 1.5 } : { borderColor: '#002cf7' }
                  ]}
                />
                {!!momoRefError && (
                  <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: '600' }}>
                    {momoRefError}
                  </Text>
                )}
              </View>
            )}

            {/* Réduction (%) */}
            <Text style={[styles.formLabel, isSubscriptionMode && { color: isDarkMode ? '#52525b' : '#94a3b8' }]}>
              Réduction (%)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={isSubscriptionMode ? '0' : orderDiscount}
              onChangeText={(val) => {
                const num = parseInt(val, 10);
                if (val === '') setOrderDiscount('0');
                else if (!isNaN(num) && num >= 0 && num <= 100) setOrderDiscount(num.toString());
              }}
              editable={!isSubscriptionMode}
              style={[
                styles.formInput,
                isSubscriptionMode && {
                  backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
                  color: isDarkMode ? '#52525b' : '#94a3b8',
                  borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                  opacity: 0.7
                }
              ]}
              placeholder="Ex: 10"
              placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
            />
          </View>

          {/* Section Récompense Fidélité Client Disponible */}
          {activeCustomer && (() => {
            const availableRewards = getAvailableRewards(activeCustomer);
            if (availableRewards.length === 0) return null;

            return (
              <View style={[styles.cardSection, { borderColor: isDarkMode ? '#38bdf8' : '#002cf7', borderWidth: 1.5, marginBottom: 16 }]}>
                <View style={styles.sectionHeader}>
                  <Gift size={16} color="#002cf7" />
                  <Text style={styles.sectionTitle}>Récompense Fidélité Client Disponible</Text>
                </View>

                <Text style={[styles.subLabelSmallBold, { marginBottom: 10, color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                  Sélectionnez une récompense débloquée à appliquer sur cette commande :
                </Text>

                {availableRewards.map((reward) => {
                  const isApplied = appliedReward?.id === reward.id;
                  const rewardVal = Number(reward.discount_amount || reward.discountAmount || 0);
                  return (
                    <View
                      key={reward.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDarkMode ? '#18181b' : '#f8fafc',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: isApplied ? '#002cf7' : (isDarkMode ? '#27272a' : '#e2e8f0')
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 44, 247, 0.08)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10
                        }}
                      >
                        <Gift size={18} color={isDarkMode ? '#38bdf8' : '#002cf7'} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                          {reward.title}
                        </Text>
                        {rewardVal > 0 ? (
                          <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '600', marginTop: 2 }}>
                            Réduction de {formatPrice(rewardVal)}
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                            {reward.description || 'Avantage fidélité client'}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          if (isApplied) {
                            setAppliedReward(null);
                          } else {
                            setAppliedReward(reward);
                          }
                        }}
                        style={{
                          backgroundColor: isApplied ? '#10b981' : '#002cf7',
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 8
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>
                          {isApplied ? 'Appliquée ✓' : 'Appliquer'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          })()}

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

            let rewardDiscountVal = 0;
            if (appliedReward) {
              if (appliedReward.discount_amount > 0) {
                rewardDiscountVal = Number(appliedReward.discount_amount);
              } else if (appliedReward.discountAmount > 0) {
                rewardDiscountVal = Number(appliedReward.discountAmount);
              } else {
                const match = (appliedReward.title || '').match(/(\d[\d\s]*)\s*FCFA/i);
                if (match) {
                  rewardDiscountVal = parseInt(match[1].replace(/\s/g, ''), 10) || 0;
                }
              }
            }

            const deliveryCalc = activeCustomer && activeCustomer.coordonnees_livraison
              ? db.calculateDeliveryFee(currentUser?.store_id || 'store_central', activeCustomer.coordonnees_livraison)
              : { fee: 0, distanceKm: 0, zoneLabel: 'N/A' };
            const deliveryFee = deliveryCalc.fee || 0;

            const netTotal = Math.max(0, currentTotal - discountAmount - rewardDiscountVal) + deliveryFee;
            const currentAvance = (isSubscriptionActive && !isImmediateSub) ? 0 : (parseFloat(orderAvance) || 0);
            const currentReste = netTotal - currentAvance;
            const totalClothes = selectedArticles.reduce((sum, item) => sum + item.quantity, 0);
            const clothesBaseValue = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const subPlan = subscribePlanId ? catalog.find(c => c.id === subscribePlanId && c.categorie === 'abonnement') : null;

            return (
              <View style={styles.receiptPreviewCard}>
                <Text style={styles.receiptSectionTitle}>Récapitulatif de la Facture</Text>

                {isImmediateSub && subPlan ? (
                  <>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Abonnement Choisi</Text>
                      <Text style={[styles.receiptRowVal, { fontWeight: '700', color: isDarkMode ? '#38bdf8' : '#002cf7' }]}>
                        {subPlan.article} ({subPlan.nombre_vetements || 0} vêt.)
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Prix Souscription</Text>
                      <Text style={styles.receiptRowVal}>{formatPrice(subPlan.prix)}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Vêtements Commande En Cours</Text>
                      <Text style={styles.receiptRowVal}>
                        {totalClothes} vêt. (Valeur {formatPrice(clothesBaseValue)})
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Prise en Charge par l'Abonnement</Text>
                      <Text style={[styles.receiptRowVal, { color: '#10b981', fontWeight: '700' }]}>
                        -{totalClothes} vêt. (0 FCFA)
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabelBold}>Solde Restant (Nouvel Abonnement)</Text>
                      <Text style={[styles.receiptRowValBold, { color: '#10b981' }]}>
                        {Math.max(0, (subPlan.nombre_vetements || 0) - totalClothes)} vêt.
                      </Text>
                    </View>
                  </>
                ) : isSubscriptionActive && activeCustomer && activeCustomer.active_subscription ? (
                  <>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Formule Active</Text>
                      <Text style={[styles.receiptRowVal, { fontWeight: '700', color: isDarkMode ? '#38bdf8' : '#002cf7' }]}>
                        {activeCustomer.active_subscription.name}
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Solde Actuel</Text>
                      <Text style={styles.receiptRowVal}>
                        {activeCustomer.active_subscription.remaining_clothes} vêt.
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Vêtements Déduits</Text>
                      <Text style={[styles.receiptRowVal, { color: '#ef4444' }]}>
                        -{totalClothes} vêt.
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabelBold}>Solde Restant (Abonnement)</Text>
                      <Text style={[styles.receiptRowValBold, { color: '#10b981' }]}>
                        {activeCustomer.active_subscription.remaining_clothes - totalClothes} vêt.
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Total Brut</Text>
                    <Text style={styles.receiptRowVal}>{formatPrice(currentTotal)}</Text>
                  </View>
                )}

                {discountAmount > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Réduction ({discountPercent}%)</Text>
                    <Text style={[styles.receiptRowVal, { color: '#ef4444' }]}>-{formatPrice(discountAmount)}</Text>
                  </View>
                )}

                {appliedReward && (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptRowLabel, { color: '#10b981', fontWeight: '700' }]}>
                      Récompense ({appliedReward.title})
                    </Text>
                    <Text style={[styles.receiptRowVal, { color: '#10b981', fontWeight: '700' }]}>
                      -{formatPrice(rewardDiscountVal)}
                    </Text>
                  </View>
                )}

                {deliveryFee > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptRowLabel, { color: '#3b82f6', fontWeight: '700' }]}>
                      Frais de Livraison ({deliveryCalc.zoneLabel} • {deliveryCalc.distanceKm} km)
                    </Text>
                    <Text style={[styles.receiptRowVal, { color: '#3b82f6', fontWeight: '700' }]}>
                      +{formatPrice(deliveryFee)}
                    </Text>
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

                <View style={styles.receiptDivider} />

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Mode de Règlement</Text>
                  <Text style={styles.receiptRowVal}>{orderPaymentMethod}</Text>
                </View>
                {orderPaymentMethod === 'Mobile Money' && (
                  <>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Opérateur MoMo</Text>
                      <Text style={[styles.receiptRowVal, { fontWeight: '700', color: isDarkMode ? '#38bdf8' : '#002cf7' }]}>
                        {momoOperator}
                      </Text>
                    </View>
                    {!!momoRefNumber.trim() && (
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptRowLabel}>N° Réf. MoMo</Text>
                        <Text style={[styles.receiptRowVal, { fontWeight: '700' }]}>
                          {momoRefNumber.trim()}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })()}

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 12 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCancelOrder}
              style={[
                styles.submitBtn,
                {
                  flex: 1,
                  backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#27272a' : '#cbd5e1',
                }
              ]}
            >
              <Text style={[styles.submitBtnText, { color: isDarkMode ? '#e4e4e7' : '#475569' }]}>
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateOrder}
              style={[styles.submitBtn, { flex: 2 }]}
            >
              <Text style={styles.submitBtnText}>Créer la Commande</Text>
            </TouchableOpacity>
          </View>
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
    planChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    planChipActive: {
      backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 44, 247, 0.08)',
      borderColor: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    planChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#d4d4d8' : '#64748b',
    },
    planChipTextActive: {
      color: isDarkMode ? '#38bdf8' : '#002cf7',
      fontWeight: '700',
    },
  });
}
