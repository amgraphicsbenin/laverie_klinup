/**
 * @file CustomerCreateEditModal.js
 * @description Modale de création et d'édition rapide d'un client au sein de l'écran de gestion.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SmoothScrollView as ScrollView } from '../../../components/SmoothScroll';
import { ArrowLeft, Check, UserCheck } from 'lucide-react-native';
import { SlideActionButton } from '../../../components/motion/slide-action-button';

export default function CustomerCreateEditModal({
  visible,
  editingCustomer = null,
  catalog = [],
  isDarkMode = false,
  onClose,
  onSave
}) {
  const [custNom, setCustNom] = useState('');
  const [custPrenom, setCustPrenom] = useState('');
  const [custTelephone, setCustTelephone] = useState('');
  const [custAdresse, setCustAdresse] = useState('');
  const [custPreferences, setCustPreferences] = useState('Plié');
  const [custSubscriptionPlanId, setCustSubscriptionPlanId] = useState('');

  useEffect(() => {
    if (visible && editingCustomer) {
      setCustNom(editingCustomer.nom || '');
      setCustPrenom(editingCustomer.prenom || '');
      setCustTelephone(editingCustomer.telephone || '');
      setCustAdresse(editingCustomer.adresse || '');
      setCustPreferences(editingCustomer.preferences_pliage || 'Plié');
      setCustSubscriptionPlanId('');
    } else if (visible && !editingCustomer) {
      setCustNom('');
      setCustPrenom('');
      setCustTelephone('');
      setCustAdresse('');
      setCustPreferences('Plié');
      setCustSubscriptionPlanId('');
    }
  }, [visible, editingCustomer]);

  const handleConfirmSave = async () => {
    if (!custNom.trim() || !custTelephone.trim()) {
      Alert.alert("Champs requis", "Veuillez renseigner le nom et le numéro de téléphone.");
      return;
    }

    if (onSave) {
      await onSave({
        nom: custNom.trim(),
        prenom: custPrenom.trim(),
        telephone: custTelephone.trim(),
        adresse: custAdresse.trim(),
        preferences_pliage: custPreferences,
        subscription_plan_id: custSubscriptionPlanId,
      });
    }
  };

  if (!visible) return null;

  const subscriptionPlans = (catalog || []).filter(
    c => (c.categorie === 'abonnement' || c.service === 'abonnement') && c.is_active !== false && c.statut !== 'inactif'
  );

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.fullPageContainer}
      >
        <View style={styles.fullPageInnerWrapper}>
          {/* HEADER BACK BUTTON */}
          <View style={styles.fullPageHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color={isDarkMode ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>

            <Text style={styles.fullPageTitle} numberOfLines={1}>
              {editingCustomer ? "Modifier le Profil Client" : "Nouveau Profil Client"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.fullPageScroll} bounces={false}>
            <View style={styles.compactInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.compactLabel}>Prénom</Text>
                <TextInput
                  placeholder="Prénom"
                  placeholderTextColor={isDarkMode ? '#71717a' : '#a1a1aa'}
                  value={custPrenom}
                  onChangeText={setCustPrenom}
                  style={styles.compactInput}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.compactLabel}>Nom <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  placeholder="Nom"
                  placeholderTextColor={isDarkMode ? '#71717a' : '#a1a1aa'}
                  value={custNom}
                  onChangeText={setCustNom}
                  style={styles.compactInput}
                />
              </View>
            </View>

            <Text style={styles.compactLabel}>Téléphone <Text style={{ color: '#ef4444' }}>*</Text></Text>
            <TextInput
              placeholder="Ex: +229 97 00 00 00"
              placeholderTextColor={isDarkMode ? '#71717a' : '#a1a1aa'}
              keyboardType="phone-pad"
              value={custTelephone}
              onChangeText={setCustTelephone}
              style={styles.compactInput}
            />

            <Text style={styles.compactLabel}>Adresse</Text>
            <TextInput
              placeholder="Ex: Cotonou, Haie Vive"
              placeholderTextColor={isDarkMode ? '#71717a' : '#a1a1aa'}
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

            {!editingCustomer && subscriptionPlans.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.compactLabel}>Forfait d'abonnement (Facultatif)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  <TouchableOpacity
                    onPress={() => setCustSubscriptionPlanId("")}
                    style={[
                      styles.planChip,
                      !custSubscriptionPlanId && styles.planChipActive
                    ]}
                  >
                    <Text style={[styles.planChipText, !custSubscriptionPlanId && styles.planChipTextActive]}>
                      Aucun
                    </Text>
                  </TouchableOpacity>
                  {subscriptionPlans.map((p) => {
                    const isSelected = custSubscriptionPlanId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setCustSubscriptionPlanId(isSelected ? "" : p.id)}
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
            )}

            <SlideActionButton
              color="#002cf7"
              isDarkMode={isDarkMode}
              height={46}
              minLoadingDuration={1000}
              icon={editingCustomer ? <Check size={18} color="#ffffff" /> : <UserCheck size={18} color="#ffffff" />}
              loadingText={editingCustomer ? "Modification du profil..." : "Création du profil..."}
              completeLabel={editingCustomer ? "Profil modifié !" : "Client enregistré !"}
              onComplete={handleConfirmSave}
              style={{ marginTop: 14 }}
            >
              {editingCustomer ? "Modifier le profil" : "Enregistrer le client"}
            </SlideActionButton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const lightStyles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  fullPageInnerWrapper: {
    flex: 1,
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  fullPageScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  compactInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  compactLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  compactInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
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
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  prefOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  prefText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  prefTextActive: {
    color: '#002cf7',
    fontWeight: '700',
  },
  planChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  planChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#002cf7',
  },
  planChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  planChipTextActive: {
    color: '#002cf7',
    fontWeight: '700',
  },
});

const darkStyles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  fullPageInnerWrapper: {
    flex: 1,
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 14,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  fullPageScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  compactInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  compactLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#d4d4d8',
    marginBottom: 6,
  },
  compactInput: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
  },
  prefSelector: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  prefOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  prefOptionActive: {
    backgroundColor: '#27272a',
  },
  prefText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  prefTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  planChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
  },
  planChipActive: {
    backgroundColor: 'rgba(0, 44, 247, 0.2)',
    borderColor: '#002cf7',
  },
  planChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  planChipTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
});
