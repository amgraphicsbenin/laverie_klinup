import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { User, Shield, RefreshCw, Key, LogOut, CheckCircle2, X } from 'lucide-react-native';
import { db } from '../services/db';

export default function ProfileScreen() {
  const currentUser = db.getCurrentUser();
  const isRemote = db.isRemote();
  const syncQueue = db.getSyncQueue ? db.getSyncQueue() : [];
  const resetRequests = db.getPinResetRequests ? db.getPinResetRequests() : [];

  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');

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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9fafc',
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3b82f6',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },
  profileRole: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  emailContainer: {
    width: '100%',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    alignItems: 'flex-start',
  },
  emailLabel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  emailText: {
    fontSize: 13,
    color: '#18181b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
    marginBottom: 8,
    marginTop: 10,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
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
    color: '#52525b',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f4f4f5',
    marginVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  actionIcon: {
    marginRight: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
  },
  noRequestsText: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
    paddingVertical: 10,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  requestEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181b',
  },
  requestDate: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 2,
  },
  approveBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approvedText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
  },
  modalBody: {
    gap: 12,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525b',
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#18181b',
  },
  modalSubmitBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
