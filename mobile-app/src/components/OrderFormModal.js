import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { CustomSelect } from './CustomSelect';
import { db } from '../services/db';
import { useTabBarHeight } from '../hooks/useTabBarHeight';

export function OrderFormModal({ visible, onClose }) {
  const customers = db.getCustomers();
  const catalog = db.getCatalog();
  const tabBarHeight = useTabBarHeight();

  const [orderClient, setOrderClient] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [orderAvance, setOrderAvance] = useState('0');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('Espèce');
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [orderUrgency, setOrderUrgency] = useState('Normal');
  const [expandedArticles, setExpandedArticles] = useState([]);

  // Reset form when opening
  useEffect(() => {
    if (visible) {
      setOrderClient('');
      setSelectedArticles([]);
      setOrderAvance('0');
      setOrderPaymentMethod('Espèce');
      setOrderDiscount('0');
      setOrderUrgency('Normal');
      setExpandedArticles([]);
    }
  }, [visible]);

  const isArticleExpanded = (articleName, items) => {
    if (expandedArticles.includes(articleName)) return true;
    const hasItemInCart = selectedArticles.some(a => items.some(i => i.id === a.id));
    return hasItemInCart;
  };

  const toggleExpandArticle = (articleName) => {
    if (expandedArticles.includes(articleName)) {
      setExpandedArticles(expandedArticles.filter(name => name !== articleName));
    } else {
      setExpandedArticles([...expandedArticles, articleName]);
    }
  };

  const addArticleToOrder = (item) => {
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

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0 FCFA';
    return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
  };

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
      setExpandedArticles([]);
      onClose();
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créer la commande.");
    }
  };

  return (
    <MotiView
      pointerEvents={visible ? 'auto' : 'none'}
      animate={{
        opacity: visible ? 1 : 0
      }}
      transition={{ type: 'timing', duration: 220 }}
      style={[
        StyleSheet.absoluteFill,
        { 
          zIndex: 9999,
          bottom: tabBarHeight
        }
      ]}
    >
      <View style={styles.absoluteModalContainer}>
        <View style={styles.compactModalOverlay}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <MotiView
            animate={{
              opacity: visible ? 1 : 0,
              scale: visible ? 1 : 0.9,
              translateY: visible ? 0 : 40
            }}
            transition={{ type: 'spring', damping: 15, mass: 0.8 }}
            style={[styles.compactModalView, { maxHeight: '90%' }]}
          >
            <View style={styles.compactModalHeader}>
              <Text style={styles.compactModalTitle}>Nouvelle Commande</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={styles.compactModalScroll} 
              showsVerticalScrollIndicator={false}
            >
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
          </MotiView>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  absoluteModalContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
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
    marginBottom: 10,
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
  fixedArticleContainer: {
    height: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 10,
    marginVertical: 12,
  },
  clothingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#ffffff',
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
  emptyDetailsText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
});
