/**
 * @file PaymentModal.js
 * @description Modale moderne HeroUI pour le règlement du solde restant dû (Espèces ou Mobile Money).
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { Modal } from '../../../components/ui/modal';

export default function PaymentModal({
  isOpen,
  onClose,
  order,
  isDarkMode = false,
  formatPrice,
  onConfirmPayment
}) {
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [momoRefNumber, setMomoRefNumber] = useState('');
  const [momoRefError, setMomoRefError] = useState('');
  const [momoOperator, setMomoOperator] = useState('MTN');

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('Espèces');
      setMomoRefNumber('');
      setMomoRefError('');
      setMomoOperator('MTN');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (paymentMethod === 'Mobile Money') {
      const ref = momoRefNumber.trim();
      if (!ref) {
        setMomoRefError("Le numéro de référence est obligatoire.");
        return;
      }
      if (!/^\d{8,15}$/.test(ref)) {
        setMomoRefError("Le numéro de référence doit contenir entre 8 et 15 chiffres.");
        return;
      }
    }

    if (onConfirmPayment && order) {
      onConfirmPayment(
        order,
        paymentMethod,
        paymentMethod === 'Mobile Money' ? momoRefNumber.trim() : null,
        paymentMethod === 'Mobile Money' ? momoOperator : null
      );
    }
  };

  if (!isOpen || !order) return null;

  const total = Number(order.prix_total !== undefined ? order.prix_total : (order.total || 0));
  const avance = Number(order.avance_payee !== undefined ? order.avance_payee : (order.avance || 0));
  const solde = Math.max(0, total - avance);
  const displayTicket = order.ticket_numero || order.id || '-';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isDarkMode={isDarkMode}
    >
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header layout="row">
              <Modal.Icon variant="success">
                <CreditCard size={20} color="#10b981" />
              </Modal.Icon>
              <View style={{ flex: 1 }}>
                <Modal.Heading>Confirmation du Règlement</Modal.Heading>
                <Modal.Description numberOfLines={1}>
                  Ticket {displayTicket}
                </Modal.Description>
              </View>
            </Modal.Header>

            <Modal.Body scrollable={false}>
              {/* Financial Summary */}
              <View style={[
                styles.summaryBox,
                {
                  backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
                  borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                }
              ]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                    Total Commande
                  </Text>
                  <Text style={[styles.summaryValue, { color: isDarkMode ? '#ffffff' : '#09090b' }]}>
                    {formatPrice ? formatPrice(total) : `${total} FCFA`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                    Acompte déjà payé
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                    {formatPrice ? formatPrice(avance) : `${avance} FCFA`}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.totalLabel, { color: isDarkMode ? '#f8fafc' : '#09090b' }]}>
                    Solde restant à régler
                  </Text>
                  <Text style={[styles.totalValue, { color: '#ef4444' }]}>
                    {formatPrice ? formatPrice(solde) : `${solde} FCFA`}
                  </Text>
                </View>
              </View>

              {/* Payment Method Selector */}
              <Text style={[styles.fieldTitle, { color: isDarkMode ? '#d4d4d8' : '#334155' }]}>
                Mode de règlement du solde
              </Text>
              <View style={styles.methodRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setPaymentMethod('Espèces');
                    setMomoRefError('');
                  }}
                  style={[
                    styles.methodBtn,
                    {
                      borderColor: paymentMethod === 'Espèces' ? '#002cf7' : (isDarkMode ? '#27272a' : '#d4d4d8'),
                      backgroundColor: paymentMethod === 'Espèces' ? (isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#e0e7ff') : 'transparent',
                    }
                  ]}
                >
                  <Text style={[
                    styles.methodBtnText,
                    { color: paymentMethod === 'Espèces' ? '#002cf7' : (isDarkMode ? '#94a3b8' : '#64748b') }
                  ]}>
                    Espèces (Cash)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPaymentMethod('Mobile Money')}
                  style={[
                    styles.methodBtn,
                    {
                      borderColor: paymentMethod === 'Mobile Money' ? '#002cf7' : (isDarkMode ? '#27272a' : '#d4d4d8'),
                      backgroundColor: paymentMethod === 'Mobile Money' ? (isDarkMode ? 'rgba(0, 44, 247, 0.15)' : '#e0e7ff') : 'transparent',
                    }
                  ]}
                >
                  <Text style={[
                    styles.methodBtnText,
                    { color: paymentMethod === 'Mobile Money' ? '#002cf7' : (isDarkMode ? '#94a3b8' : '#64748b') }
                  ]}>
                    Mobile Money
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mobile Money Details */}
              {paymentMethod === 'Mobile Money' && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={[styles.fieldTitle, { color: isDarkMode ? '#d4d4d8' : '#334155' }]}>
                    Opérateur Réseau <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <View style={styles.operatorRow}>
                    {['MTN', 'MOOV', 'CELTIS'].map((op) => (
                      <TouchableOpacity
                        key={op}
                        onPress={() => setMomoOperator(op)}
                        activeOpacity={0.8}
                        style={[
                          styles.operatorBtn,
                          {
                            borderWidth: momoOperator === op ? 2 : 1.5,
                            borderColor: momoOperator === op ? '#002cf7' : (isDarkMode ? '#3f3f46' : '#d4d4d8'),
                            backgroundColor: momoOperator === op
                              ? (op === 'MTN' ? '#FFCC00' : op === 'MOOV' ? '#0057A8' : '#E30613')
                              : (isDarkMode ? '#18181b' : '#f8fafc'),
                          }
                        ]}
                      >
                        <Text style={[
                          styles.operatorBtnText,
                          {
                            color: momoOperator === op ? (op === 'MTN' ? '#1a1a1a' : '#ffffff') : (isDarkMode ? '#94a3b8' : '#64748b')
                          }
                        ]}>
                          {op}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldTitle, { color: isDarkMode ? '#d4d4d8' : '#334155' }]}>
                    Numéro de Référence <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={momoRefNumber}
                    onChangeText={(text) => {
                      const val = text.replace(/\D/g, '').slice(0, 15);
                      setMomoRefNumber(val);
                      if (val.trim()) setMomoRefError('');
                    }}
                    placeholder="8 à 15 chiffres (ex: 12345678)"
                    placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    keyboardType="numeric"
                    maxLength={15}
                    style={[
                      styles.input,
                      {
                        borderColor: momoRefError ? '#ef4444' : (isDarkMode ? '#27272a' : '#d4d4d8'),
                        color: isDarkMode ? '#f8fafc' : '#09090b',
                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                      }
                    ]}
                  />
                  {momoRefError ? (
                    <Text style={styles.errorText}>{momoRefError}</Text>
                  ) : null}
                </View>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Modal.Button slot="close" variant="secondary" style={{ flex: 1 }}>
                Annuler
              </Modal.Button>
              <Modal.Button variant="success" onPress={handleConfirm} style={{ flex: 1 }}>
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
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  fieldTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  methodBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  operatorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  operatorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
  },
  operatorBtnText: {
    fontWeight: '800',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
  },
});
