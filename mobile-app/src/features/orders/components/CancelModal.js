/**
 * @file CancelModal.js
 * @description Modale moderne HeroUI pour la saisie et la validation obligatoire du motif d'annulation d'une commande.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Platform, StyleSheet } from 'react-native';
import { Ban } from 'lucide-react-native';
import { Modal } from '../../../components/ui/modal';

export default function CancelModal({
  isOpen,
  onClose,
  order,
  client,
  isDarkMode = false,
  formatPrice,
  getDisplayTicketId,
  onConfirmCancel
}) {
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCancelReason('');
      setCancelReasonError('');
    }
  }, [isOpen]);

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

  const handleConfirm = () => {
    const error = validateCancelReason(cancelReason);
    if (error) {
      setCancelReasonError(error);
      return;
    }
    if (onConfirmCancel && order) {
      onConfirmCancel(order, cancelReason.trim());
    }
  };

  if (!isOpen || !order) return null;

  const displayTicket = getDisplayTicketId ? getDisplayTicketId(order) : (order.ticket_numero || order.id);
  const clientName = client ? `${client.prenom} ${client.nom}` : (order.client_nom || 'Client');
  const totalPrice = formatPrice ? formatPrice(order.prix_total !== undefined ? order.prix_total : (order.total || 0)) : `${order.prix_total || order.total || 0} FCFA`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      isDarkMode={isDarkMode}
    >
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header layout="row">
              <Modal.Icon variant="danger">
                <Ban size={20} color="#ef4444" />
              </Modal.Icon>
              <View style={{ flex: 1 }}>
                <Modal.Heading>Annuler la commande</Modal.Heading>
                <Modal.Description numberOfLines={1}>
                  Ticket {displayTicket}
                </Modal.Description>
              </View>
            </Modal.Header>

            <Modal.Body>
              {/* Récapitulatif de la commande ciblée */}
              <View
                style={[
                  styles.summaryBox,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                    borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                  }
                ]}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.clientName,
                      { color: isDarkMode ? '#ffffff' : '#09090b' }
                    ]}
                  >
                    {clientName}
                  </Text>
                  <Text
                    style={[
                      styles.ticketText,
                      { color: isDarkMode ? '#a1a1aa' : '#64748b' }
                    ]}
                  >
                    Ticket {displayTicket}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.priceText,
                    { color: isDarkMode ? '#f87171' : '#dc2626' }
                  ]}
                >
                  {totalPrice}
                </Text>
              </View>

              <Text
                style={[
                  styles.instructionText,
                  { color: isDarkMode ? '#d4d4d8' : '#475569' }
                ]}
              >
                Veuillez spécifier le motif d'annulation de cette commande :
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: cancelReasonError ? '#ef4444' : (isDarkMode ? '#3f3f46' : '#cbd5e1'),
                    backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#09090b',
                    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
                  }
                ]}
                placeholder="Ex: Erreur de saisie, client absent, doublon..."
                placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
                multiline={true}
                numberOfLines={3}
                value={cancelReason}
                onChangeText={(text) => {
                  setCancelReason(text);
                  if (cancelReasonError) setCancelReasonError('');
                }}
              />

              {cancelReasonError ? (
                <Text style={styles.errorText}>
                  {cancelReasonError}
                </Text>
              ) : null}
            </Modal.Body>

            <Modal.Footer>
              <Modal.Button slot="close" variant="secondary" style={{ flex: 1 }}>
                Retour
              </Modal.Button>
              <Modal.Button variant="danger" onPress={handleConfirm} style={{ flex: 1 }}>
                Confirmer
              </Modal.Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

const styles = StyleSheet.create({
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '700',
  },
  ticketText: {
    fontSize: 11,
    marginTop: 2,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  input: {
    width: '100%',
    minHeight: 88,
    textAlignVertical: 'top',
    padding: 12,
    fontSize: 13.5,
    lineHeight: 19,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11.5,
    marginTop: 6,
    fontWeight: '600',
  },
});
