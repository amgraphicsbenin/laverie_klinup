import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Platform, Alert, RefreshControl } from 'react-native';
import { Plus, Check, ShoppingBag, User, Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { CustomSelect } from '../../../components/CustomSelect';
import { db } from '../../../services/db';
import { useScrollPaddingBottom } from '../../../hooks/useTabBarHeight';
import { useDbState } from '../../../hooks/useDbState';

export default function OrderCreateScreen({ onNavigate, onShowSuccess }) {
  const { isDarkMode, customers, catalog } = useDbState();
  const scrollPaddingBottom = useScrollPaddingBottom();
  const styles = getStyles(isDarkMode);

  const [orderClient, setOrderClient] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [orderAvance, setOrderAvance] = useState('0');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('Espèce');
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [orderUrgency, setOrderUrgency] = useState('Normal');
  const [expandedArticles, setExpandedArticles] = useState([]);

  const [payWithSubscription, setPayWithSubscription] = useState(false);
  const [subscribePlanId, setSubscribePlanId] = useState('');

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

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.headerIconWrap}>
            <ShoppingBag size={20} color="#002cf7" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Nouvelle Commande</Text>
            <Text style={styles.headerSub}>Création d'un ticket de dépot</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Sélection du Client */}
        <View style={styles.cardSection}>
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
                      ...catalog.filter(c => c.categorie === 'abonnement').map(p => ({
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
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <ShoppingBag size={16} color="#002cf7" />
            <Text style={styles.sectionTitle}>2. Sélection des Vêtements</Text>
          </View>

          {(() => {
            const uniqueArticles = [...new Set(catalog
              .filter(c => c.categorie !== 'system_setting' && c.service !== 'system' && c.categorie !== 'abonnement' && c.service !== 'abonnement')
              .map(c => c.article)
            )];

            if (uniqueArticles.length === 0) {
              return <Text style={styles.emptyText}>Aucun article disponible</Text>;
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
        </View>

        {/* Step 3: Options & Paiement */}
        <View style={styles.cardSection}>
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
          <View style={styles.formRowInline}>
            <View style={styles.formFieldInline}>
              <Text style={styles.formLabel}>Avance (FCFA)</Text>
              <TextInput
                keyboardType="numeric"
                value={orderAvance}
                onChangeText={setOrderAvance}
                style={styles.formInput}
              />
            </View>
            <View style={styles.formFieldInline}>
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
    </View>
  );
}

function getStyles(isDarkMode) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1e293b' : '#f1f5f9',
    },
    headerIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.2)' : '#eff6ff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    headerSub: {
      fontSize: 12,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    scrollContent: {
      padding: 20,
      gap: 16,
    },
    cardSection: {
      backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
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
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    formLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#cbd5e1' : '#475569',
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
      backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#eff6ff',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(0, 44, 247, 0.3)' : '#dbeafe',
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
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    subTextBold: {
      fontSize: 12,
      fontWeight: '700',
      color: '#002cf7',
    },
    subLabelSmallBold: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#cbd5e1' : '#334155',
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
      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
      borderRadius: 12,
      padding: 12,
      marginVertical: 4,
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    clothingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    clothingName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#0f172a',
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
      backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
      borderRadius: 8,
    },
    clothingCloseBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#cbd5e1' : '#64748b',
    },
    servicesContainer: {
      marginTop: 10,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#1e293b' : '#f1f5f9',
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
      color: isDarkMode ? '#cbd5e1' : '#334155',
    },
    servicePrice: {
      fontSize: 11,
      color: isDarkMode ? '#94a3b8' : '#64748b',
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
      color: isDarkMode ? '#ffffff' : '#0f172a',
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
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    },
    urgencyBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#cbd5e1' : '#475569',
    },
    formRowInline: {
      flexDirection: 'row',
      gap: 10,
    },
    formFieldInline: {
      flex: 1,
    },
    formInput: {
      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    formSelectButton: {
      height: 42,
    },
    receiptPreviewCard: {
      backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    receiptSectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
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
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    receiptRowVal: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    receiptRowLabelBold: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    receiptRowValBold: {
      fontSize: 14,
      fontWeight: '700',
    },
    receiptDivider: {
      height: 1,
      backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
      marginVertical: 8,
    },
    submitBtn: {
      backgroundColor: '#002cf7',
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#002cf7',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
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
  });
}
