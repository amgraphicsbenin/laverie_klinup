/**
 * @file CancelModal.js
 * @description Composant modal permettant de saisir et de valider le motif d'annulation d'une commande.
 */

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { X, Ban } from 'lucide-react-native';
import SafeBlurView from '../../../components/SafeBlurView';
const BlurView = SafeBlurView;
import { MotiView } from '../../../components/SafeView';

/**
 * Composant de modal d'annulation de commande.
 * 
 * @param {Object} props - Propriétés du composant.
 * @param {Boolean} props.visible - Contrôle la visibilité de la modale.
 * @param {Function} props.onClose - Rappel déclenché lors de la fermeture de la modale.
 * @param {Object} props.order - La commande que l'on souhaite annuler.
 * @param {Boolean} props.isDarkMode - Indicateur du thème actif.
 * @param {Function} props.onConfirm - Action à exécuter avec le motif validé.
 * @param {Object} props.styles - Styles partagés hérités du parent.
 */
export default function CancelModal({ 
  visible, 
  onClose, 
  order, 
  isDarkMode, 
  onConfirm, 
  styles 
}) {
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

  // Réinitialise les champs locaux lorsque la modale s'ouvre ou se ferme
  useEffect(() => {
    if (visible) {
      setCancelReason('');
      setCancelReasonError('');
    }
  }, [visible]);

  /**
   * Valide la saisie textuelle du motif d'annulation.
   * @param {String} text - Le texte saisi.
   * @returns {String|null} Message d'erreur en français ou null si valide.
   */
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

  /**
   * Soumet le motif d'annulation au parent après validation.
   */
  const handleConfirm = () => {
    const error = validateCancelReason(cancelReason);
    if (error) {
      setCancelReasonError(error);
      return;
    }
    onConfirm(cancelReason.trim());
  };

  if (!visible || !orderToCancel) return null;

  const inputBorderColor = cancelReasonError ? '#ef4444' : (isDarkMode ? '#27272a' : '#e2e8f0');
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
          bottom: 0
        }
      ]}
    >
      <View style={styles.absoluteModalContainer}>
        <View style={styles.compactModalOverlay}>
          <TouchableOpacity 
            activeOpacity={1} 
            style={StyleSheet.absoluteFill} 
            onPress={onClose}
          >
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
              <TouchableOpacity onPress={onClose}>
                <X size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <View style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 24, 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginBottom: 12 
              }}>
                <Ban size={22} color="#ef4444" />
              </View>
              <Text style={{ 
                fontSize: 13, 
                color: isDarkMode ? '#d4d4d8' : '#64748b', 
                textAlign: 'center', 
                paddingHorizontal: 10 
              }}>
                Veuillez spécifier le motif d'annulation de la commande #{order ? (order.ticket_numero || order.id) : ''}.
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
                    borderColor: inputBorderColor,
                    borderRadius: 12,
                    borderWidth: 1,
                    backgroundColor: isDarkMode ? '#09090b' : '#f8fafc',
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
                onPress={onClose}
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: isDarkMode ? '#d4d4d8' : '#27272a', fontWeight: '700', fontSize: 13 }}>
                  Retour
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
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
  );
}
