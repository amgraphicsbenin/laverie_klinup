import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, BackHandler, Switch } from 'react-native';
import { User, Key, LogOut, X, Printer, Bell, Moon, Globe, TrendingUp, Sparkles, ChevronRight } from 'lucide-react-native';
import { db } from '../services/db';
import { BlurView } from 'expo-blur';
import { useScrollPaddingBottom } from '../hooks/useTabBarHeight';
import { useDbState } from '../hooks/useDbState';

export default function ProfileScreen({ onModalStateChange, closeAllModalsTrigger, onShowSuccess }) {
  const { currentUser, isRemote, isDarkMode } = useDbState();
  const syncQueue = db.getSyncQueue ? db.getSyncQueue() : [];

  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  
  // Interactive app preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [appLanguage, setAppLanguage] = useState("Français");

  // Statistics calculated dynamically from database
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [todayRevenueSum, setTodayRevenueSum] = useState(0);

  const scrollPaddingBottom = useScrollPaddingBottom();
  const styles = getStyles(isDarkMode);

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

  // Compute daily stats for this cashier/employee shift
  useEffect(() => {
    if (!currentUser) return;
    const orders = db.getOrders();
    const todayStr = new Date().toDateString();
    
    const todayOrders = orders.filter(o => {
      const isCreator = o.created_by_id === currentUser.id;
      const isToday = new Date(o.created_at).toDateString() === todayStr;
      return isCreator && isToday;
    });
    
    setTodayOrdersCount(todayOrders.length);
    const rev = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    setTodayRevenueSum(rev);
  }, [currentUser]);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Administrateur';
      case 'manager': return 'Gestionnaire';
      case 'livreur': return 'Livreur';
      case 'agent_lavage_repassage': return 'Atelier Lavage & Repassage';
      default: return "Agent d'accueil";
    }
  };

  const formatPrice = (price) => {
    if (currentUser && (currentUser.role === 'livreur' || currentUser.role === 'agent_lavage_repassage')) {
      return '******';
    }
    return `${(price || 0).toLocaleString('fr-FR')} FCFA`;
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
      if (onShowSuccess) {
        onShowSuccess("Votre code PIN a été modifié avec succès.");
      } else {
        Alert.alert("Succès", "Votre code PIN a été modifié avec succès.");
      }
      setCurrentPin('');
      setNewPin('');
      setShowPinModal(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de modifier le code PIN.");
    }
  };

  const handleLanguageToggle = () => {
    setAppLanguage(prev => prev === "Français" ? "English" : "Français");
  };

  const handleSupportPress = () => {
    Alert.alert(
      "Support Technique",
      "Besoin d'assistance avec l'application ou la caisse ?\n\nContactez le gérant au +229 97 00 00 00 ou par WhatsApp.",
      [{ text: "Compris" }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollPaddingBottom }]} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Profil Card */}
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

        {/* Section 2: Shift Activity Stats */}
        <Text style={styles.sectionTitle}>Activité de la Session (Aujourd'hui)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <TrendingUp size={16} color={isDarkMode ? "#38bdf8" : "#002cf7"} />
            <Text style={styles.statValue}>{todayOrdersCount}</Text>
            <Text style={styles.statLabel}>Commandes Créées</Text>
          </View>
          <View style={styles.statCard}>
            <Sparkles size={16} color="#16a34a" />
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{formatPrice(todayRevenueSum)}</Text>
            <Text style={styles.statLabel}>Volume Encaissé</Text>
          </View>
        </View>

        {/* Section 3: App Preferences */}
        <Text style={styles.sectionTitle}>Préférences Caisse</Text>
        <View style={styles.infoCard}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <Moon size={16} color={isDarkMode ? "#94a3b8" : "#71717a"} style={{ marginRight: 6 }} />
              <Text style={styles.settingsLabel}>Mode Sombre</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={(val) => db.setDarkMode(val)}
              trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
              thumbColor={isDarkMode ? "#002cf7" : "#f1f5f9"}
            />
          </View>
          
          <View style={styles.divider} />

          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <Bell size={16} color={isDarkMode ? "#94a3b8" : "#71717a"} style={{ marginRight: 6 }} />
              <Text style={styles.settingsLabel}>Notifications en temps réel</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
              thumbColor={notificationsEnabled ? "#002cf7" : "#f1f5f9"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <Printer size={16} color={isDarkMode ? "#94a3b8" : "#71717a"} style={{ marginRight: 6 }} />
              <Text style={styles.settingsLabel}>Impression ticket automatique</Text>
            </View>
            <Switch
              value={autoPrintEnabled}
              onValueChange={setAutoPrintEnabled}
              trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
              thumbColor={autoPrintEnabled ? "#002cf7" : "#f1f5f9"}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleLanguageToggle} activeOpacity={0.7}>
            <View style={styles.settingsLeft}>
              <Globe size={16} color={isDarkMode ? "#94a3b8" : "#71717a"} style={{ marginRight: 6 }} />
              <Text style={styles.settingsLabel}>Langue de l'interface</Text>
            </View>
            <View style={styles.settingsRight}>
              <Text style={styles.settingsValueText}>{appLanguage}</Text>
              <ChevronRight size={14} color={isDarkMode ? "#94a3b8" : "#64748b"} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 4: Security & Account Actions */}
        <Text style={styles.sectionTitle}>Paramètres de sécurité</Text>
        <TouchableOpacity 
          onPress={() => setShowPinModal(true)}
          style={styles.actionButton}
        >
          <Key size={16} color={isDarkMode ? "#38bdf8" : "#002cf7"} style={styles.actionIcon} />
          <Text style={styles.actionText}>Modifier mon code PIN</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleLogout}
          style={[styles.actionButton, { marginTop: 12, borderColor: '#fecaca' }]}
        >
          <LogOut size={16} color="#ef4444" style={styles.actionIcon} />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Footer info & support */}
        <View style={styles.supportFooter}>
          <Text style={styles.versionText}>KLIN UP Mobile v1.5.0 — Boutique</Text>
          <TouchableOpacity onPress={handleSupportPress} style={styles.supportBtn} activeOpacity={0.8}>
            <Text style={styles.supportBtnText}>Support Technique Administrateur</Text>
          </TouchableOpacity>
        </View>

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
                  <X size={20} color={isDarkMode ? "#94a3b8" : "#71717a"} />
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

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: isDarkMode ? '#ffffff' : '#09090b',
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#334155' : '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDarkMode ? 0.15 : 0.03,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0, 44, 247, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 44, 247, 0.08)',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '600',
    color: isDarkMode ? '#38bdf8' : '#002cf7',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#ffffff' : '#0f172a',
  },
  profileRole: {
    fontSize: 13,
    color: isDarkMode ? '#94a3b8' : '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  emailContainer: {
    width: '100%',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#334155' : '#f1f5f9',
    alignItems: 'flex-start',
  },
  emailLabel: {
    fontSize: 11,
    color: isDarkMode ? '#94a3b8' : '#64748b',
    fontWeight: '600',
  },
  emailText: {
    fontSize: 13,
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    marginTop: 3,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? '#94a3b8' : '#64748b',
    marginBottom: 8,
    marginTop: 14,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#334155' : '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDarkMode ? 0.15 : 0.03,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#334155' : '#ffffff',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDarkMode ? 0.15 : 0.03,
    shadowRadius: 20,
    elevation: 3,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: isDarkMode ? '#38bdf8' : '#002cf7',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 10,
    color: isDarkMode ? '#94a3b8' : '#64748b',
    fontWeight: '600',
    marginTop: 3,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 12,
    color: isDarkMode ? '#e2e8f0' : '#475569',
    fontWeight: '500',
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? '#ffffff' : '#0f172a',
    marginRight: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
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
    color: isDarkMode ? '#ffffff' : '#0f172a',
  },
  supportFooter: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
    paddingBottom: 20,
  },
  supportBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
  },
  supportBtnText: {
    fontSize: 10,
    color: isDarkMode ? '#94a3b8' : '#64748b',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 9,
    color: isDarkMode ? '#64748b' : '#94a3b8',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
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
    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
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
    color: isDarkMode ? '#ffffff' : '#0f172a',
  },
  modalBody: {
    gap: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? '#e2e8f0' : '#475569',
  },
  modalInput: {
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: isDarkMode ? '#ffffff' : '#0f172a',
    fontWeight: '500',
  },
  modalSubmitBtn: {
    backgroundColor: isDarkMode ? '#38bdf8' : '#002cf7',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: isDarkMode ? '#38bdf8' : '#002cf7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalSubmitBtnText: {
    color: isDarkMode ? '#0f172a' : '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
