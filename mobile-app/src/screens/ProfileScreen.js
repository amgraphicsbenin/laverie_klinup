import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, BackHandler } from 'react-native';
import { User, Shield, RefreshCw, Key, LogOut, CheckCircle2, X } from 'lucide-react-native';
import { db } from '../services/db';
import { BlurView } from 'expo-blur';
import { useScrollPaddingBottom } from '../hooks/useTabBarHeight';

export default function ProfileScreen({ onModalStateChange, closeAllModalsTrigger }) {
  const currentUser = db.getCurrentUser();
  const isRemote = db.isRemote();
  const syncQueue = db.getSyncQueue ? db.getSyncQueue() : [];
  const resetRequests = db.getPinResetRequests ? db.getPinResetRequests() : [];

  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const scrollPaddingBottom = useScrollPaddingBottom();

  // Close PIN modal when trigger increments
  useEffect(() => {
    if (closeAllModalsTrigger > 0) {
      setShowPinModal(false);
      setCurrentPin('');
      setNewPin('');
    }
  }, [closeAllModalsTrigger]);

  // Notify parent of modal visibility
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(showPinModal);
    }
  }, [showPinModal]);

  // Handle Android back button/gesture to close the PIN modal
  useEffect(() => {
    if (Platform.OS === 'web' || !showPinModal) return;

    const backAction = () => {
      setShowPinModal(false);
      setCurrentPin('');
      setNewPin('');
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [showPinModal]);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Administrateur';
      case 'manager': return 'Gestionnaire';
      case 'livreur': return 'Livreur';
      case 'agent_lavage_repassage': return 'Atelier Lavage & Repassage';
      default: return "Agent d'accueil";
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter de votre session ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Déconnexion", style: "destructive", onPress: () => {
          db.setCurrentUser(null);
        }}
      ]
    );
  };

  const handleChangePin = async () => {
    if (!currentPin || !newPin) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires.");
      return;
    }
    if (newPin.length !== 6) {
      Alert.alert("Erreur", "Le nouveau code PIN doit faire 6 chiffres.");
      return;
    }

    if (currentUser.code_pin !== currentPin) {
      Alert.alert("Erreur", "Code PIN actuel incorrect.");
      return;
    }

    try {
      await db.updateStaffPin(currentUser.id, newPin);
      Alert.alert("Succès", "Votre code PIN a été modifié avec succès.");
      setCurrentPin('');
      setNewPin('');
      setShowPinModal(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de modifier le code PIN.");
    }
  };

  const handleApprovePinRequest = async (request) => {
    Alert.alert(
      "Approuver la demande",
      `Approuver la réinitialisation du PIN pour ${request.email} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Approuver", onPress: async () => {
          try {
            await db.approvePinResetRequest(request.id);
            Alert.alert("Succès", "Demande approuvée.");
          } catch (e) {
            Alert.alert("Erreur", "Impossible d'approuver la demande.");
          }
        }}
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
      {/* Profil Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentUser ? `${currentUser.prenom[0].toUpperCase()}${currentUser.nom[0].toUpperCase()}` : 'KU'}
          </Text>
        </View>
        <Text style={styles.profileName}>{currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur'}</Text>
        <Text style={styles.profileRole}>{currentUser ? getRoleLabel(currentUser.role) : 'Invite'}</Text>
        
        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>Adresse email :</Text>
          <Text style={styles.emailText}>{currentUser ? currentUser.email : 'non configuré'}</Text>
        </View>
      </View>

      {/* Sync Status Section */}
      <Text style={styles.sectionTitle}>État de synchronisation</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <View style={[styles.dot, { backgroundColor: isRemote ? '#22c55e' : '#f59e0b' }]} />
            <Text style={styles.infoLabel}>Serveur Central (Supabase)</Text>
          </View>
          <Text style={styles.infoValue}>{isRemote ? 'Connecté' : 'Déconnecté'}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <RefreshCw size={14} color="#71717a" style={{ marginRight: 6 }} />
            <Text style={styles.infoLabel}>Opérations en attente (Hors-ligne)</Text>
          </View>
          <Text style={styles.infoValue}>{syncQueue.length} en attente</Text>
        </View>
      </View>

      {/* Admin specific : Demandes de réinitialisation PIN */}
      {currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'manager') && (
        <View>
          <Text style={styles.sectionTitle}>Demandes de réinitialisation de PIN</Text>
          <View style={styles.infoCard}>
            {resetRequests.length === 0 ? (
              <Text style={styles.noRequestsText}>Aucune demande en attente</Text>
            ) : (
              resetRequests.map((req) => (
                <View key={req.id} style={styles.requestRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestEmail}>{req.email}</Text>
                    <Text style={styles.requestDate}>{req.created_at?.split('T')[0]}</Text>
                  </View>
                  {!req.approved ? (
                    <TouchableOpacity 
                      onPress={() => handleApprovePinRequest(req)}
                      style={styles.approveBtn}
                    >
                      <Text style={styles.approveBtnText}>Approuver</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.approvedBadge}>
                      <CheckCircle2 size={12} color="#22c55e" style={{ marginRight: 4 }} />
                      <Text style={styles.approvedText}>Approuvée</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Account actions */}
      <Text style={styles.sectionTitle}>Paramètres de sécurité</Text>
      <TouchableOpacity 
        onPress={() => setShowPinModal(true)}
        style={styles.actionButton}
      >
        <Key size={16} color="#3b82f6" style={styles.actionIcon} />
        <Text style={styles.actionText}>Modifier mon code PIN</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleLogout}
        style={[styles.actionButton, { marginTop: 12, borderColor: '#fecaca' }]}
      >
        <LogOut size={16} color="#ef4444" style={styles.actionIcon} />
        <Text style={[styles.actionText, { color: '#ef4444' }]}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* MODAL : MODIFIER PIN */}
      <Modal
        animationType="slide"
        visible={showPinModal}
        onRequestClose={() => setShowPinModal(false)}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier mon PIN</Text>
              <TouchableOpacity onPress={() => setShowPinModal(false)}>
                <X size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Code PIN actuel</Text>
              <TextInput
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                value={currentPin}
                onChangeText={setCurrentPin}
                style={styles.modalInput}
              />

              <Text style={styles.modalLabel}>Nouveau code PIN (6 chiffres)</Text>
              <TextInput
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                value={newPin}
                onChangeText={setNewPin}
                style={styles.modalInput}
              />

              <TouchableOpacity
                onPress={handleChangePin}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitBtnText}>Confirmer le changement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
     </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#09090b',
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.08)',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2563eb',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  profileRole: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  emailContainer: {
    width: '100%',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'flex-start',
  },
  emailLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  emailText: {
    fontSize: 13,
    color: '#0f172a',
    marginTop: 3,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginTop: 14,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
  },
  actionIcon: {
    marginRight: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  noRequestsText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 10,
    fontWeight: '500',
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  requestEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  requestDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  approveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approvedText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalBody: {
    gap: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  modalSubmitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
