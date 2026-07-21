/**
 * @file PaymentModal.js
 * @description Composant modal de confirmation de règlement final pour une commande.
 * Permet de sélectionner le mode de paiement (Espèces, Mobile Money) et de saisir la référence si Mobile Money.
 */

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

/**
 * Composant de confirmation du paiement final.
 * 
 * @param {Object} props - Propriétés du composant.
 * @param {Boolean} props.visible - Contrôle la visibilité de la modale.
 * @param {Function} props.onClose - Rappel de fermeture de la modale.
 * @param {Object} props.order - La commande concernée.
 * @param {Boolean} props.isDarkMode - Thème sombre actif.
 * @param {Function} props.formatPrice - Fonction utilitaire pour formater la devise.
 * @param {Function} props.onConfirm - Callback appelé lors de la validation du paiement avec (method, ref).
 * @param {Object} props.styles - Styles hérités du parent.
 */
export default function PaymentModal({
  visible,
  onClose,
  order,
  isDarkMode,
  formatPrice,
  onConfirm,
  styles
}) {
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [momoRefNumber, setMomoRefNumber] = useState('');
  const [momoRefError, setMomoRefError] = useState('');
  const baseBorderColor = isDarkMode ? '#334155' : '#cbd5e1';
  const baseBg = 'transparent';
  const activeBg = isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#e0e7ff';
  const baseTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const activeColor = '#002cf7';

  const cashBorder = paymentMethod === 'Espèces' ? activeColor : baseBorderColor;
  const cashBg = paymentMethod === 'Espèces' ? activeBg : baseBg;
  const cashColor = paymentMethod === 'Espèces' ? activeColor : baseTextColor;

  const momoBorder = paymentMethod === 'Mobile Money' ? activeColor : baseBorderColor;
  const momoBg = paymentMethod === 'Mobile Money' ? activeBg : baseBg;
  const momoColor = paymentMethod === 'Mobile Money' ? activeColor : baseTextColor;

  const momoInputBorder = momoRefError ? '#ef4444' : baseBorderColor;

  // Réinitialise les états locaux à l'ouverture de la modale
  useEffect(() => {
    if (visible) {
      setPaymentMethod('Espèces');
      setMomoRefNumber('');
      setMomoRefError('');
    }
  }, [visible]);

  /**
   * Valide les champs et lance la confirmation du paiement.
   */
  const handleConfirm = () => {
    if (paymentMethod === 'Mobile Money' && !momoRefNumber.trim()) {
      setMomoRefError("Le numéro de référence est obligatoire.");
      return;
    }
    onConfirm(paymentMethod, momoRefNumber.trim());
  };

  if (!order) return null;

  return (
    <MotiView
      pointerEvents={visible ? 'auto' : 'none'}
      animate={{
        opacity: visible ? 1 : 0
      }}
      transition={{ type: 'timing', duration: 120 }}
      style={[
        StyleSheet.absoluteFill,
        { 
          zIndex: 9999,
          bottom: 86
        }
      ]}
    >
      <View style={styles.absoluteModalContainer || { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        <View style={styles.popupModalOverlay || { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={35} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          <View style={[styles.popupModalView || { width: '90%', maxWidth: 400, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderRadius: 12, padding: 20 }, { maxHeight: '80%' }]}>
            
            {/* En-tête de la modale */}
            <View style={styles.compactModalHeader || { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.compactModalTitle || { fontSize: 16, fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                Enregistrer le Règlement
              </Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <X size={20} color={isDarkMode ? '#94a3b8' : '#71717a'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Résumé financier */}
              <View style={{ marginBottom: 15, padding: 12, backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Total Commande:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                    {formatPrice(order.prix_total || order.total || 0)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Avance déjà payée:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#16a34a' }}>
                    {formatPrice(order.avance_payee || order.avance || 0)}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', marginVertical: 6 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Reste à payer:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ef4444' }}>
                    {formatPrice(order.reste || 0)}
                  </Text>
                </View>
              </View>

              {/* Sélection du mode de règlement */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#334155', marginBottom: 10 }}>
                Sélectionner le mode de règlement :
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
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
                    borderColor: cashBorder,
                    backgroundColor: cashBg
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: cashColor }}>
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
                    borderColor: momoBorder,
                    backgroundColor: momoBg
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: momoColor }}>
                    Mobile Money
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Champ optionnel Référence Mobile Money */}
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
                      borderColor: momoInputBorder,
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

              {/* Boutons de validation */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={onClose}
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
                  onPress={handleConfirm}
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
          </View>
        </View>
      </View>
    </MotiView>
  );
}
