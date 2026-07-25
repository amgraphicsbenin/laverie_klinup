import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, BackHandler, Switch } from 'react-native';
import { Key, LogOut, X, Printer, Bell, Moon, Globe, TrendingUp, Sparkles, ChevronRight, User, Mail, Shield, Smartphone, HelpCircle, ArrowLeft } from 'lucide-react-native';
import { db } from '../../../services/db';
import SafeBlurView from '../../../components/SafeBlurView';
const BlurView = SafeBlurView;
import { MotiView } from '../../../components/SafeView';
import { useScrollPaddingBottom } from '../../../hooks/useTabBarHeight';
import { useDbState } from '../../../hooks/useDbState';

export default function ProfileScreen({ onModalStateChange, closeAllModalsTrigger, onShowSuccess }) {
  const { currentUser, isDarkMode } = useDbState();

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
      return true;
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
      db.updateStaffPin(currentUser.id, newPin);
      if (onShowSuccess) {
        onShowSuccess("Votre code PIN a été modifié avec succès.");
      } else {
        Alert.alert("Succès", "Votre code PIN a été modifié avec succès.");
      }
      setCurrentPin('');
      setNewPin('');
      setShowPinModal(false);
    } catch (e) {
      console.error("Error updating PIN:", e);
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

  const userInitials = currentUser 
    ? `${(currentUser.prenom || 'K')[0].toUpperCase()}${(currentUser.nom || 'U')[0].toUpperCase()}`
    : 'KU';

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000000' : '#f8fafc' }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.container, { paddingBottom: scrollPaddingBottom }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* HERO PROFILE CARD */}
        <MotiView 
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.heroProfileCard}
        >
          {/* Avatar with Status Badge */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          {/* Name & Role Badge */}
          <Text style={styles.profileName}>
            {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur'}
          </Text>
          
          <View style={styles.roleBadge}>
            <Shield size={12} color={isDarkMode ? '#38bdf8' : '#002cf7'} style={{ marginRight: 5 }} />
            <Text style={styles.roleBadgeText}>
              {currentUser ? getRoleLabel(currentUser.role) : 'Invité'}
            </Text>
          </View>

          {/* Email Info Bar */}
          <View style={styles.emailContainer}>
            <Mail size={14} color={isDarkMode ? '#a1a1aa' : '#64748b'} style={{ marginRight: 8 }} />
            <Text style={styles.emailText}>
              {currentUser?.email || 'non configuré'}
            </Text>
          </View>
        </MotiView>

        {/* SHIFT ACTIVITY STATS */}
        <Text style={styles.sectionTitle}>Activité de la Session (Aujourd'hui)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 44, 247, 0.08)' }]}>
              <TrendingUp size={18} color={isDarkMode ? "#38bdf8" : "#002cf7"} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{todayOrdersCount}</Text>
              <Text style={styles.statLabel}>Commandes créées</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
              <Sparkles size={18} color="#16a34a" />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: '#16a34a' }]}>{formatPrice(todayRevenueSum)}</Text>
              <Text style={styles.statLabel}>Volume encaissé</Text>
            </View>
          </View>
        </View>

        {/* APP PREFERENCES GROUP */}
        <Text style={styles.sectionTitle}>Préférences Caisse</Text>
        <View style={styles.groupedCard}>
          {/* Dark Mode */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9' }]}>
                <Moon size={16} color={isDarkMode ? "#38bdf8" : "#475569"} />
              </View>
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

          {/* Notifications */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Bell size={16} color="#f59e0b" />
              </View>
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

          {/* Auto Print */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Printer size={16} color="#10b981" />
              </View>
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

          {/* Language Selector */}
          <TouchableOpacity style={styles.settingsRow} onPress={handleLanguageToggle} activeOpacity={0.7}>
            <View style={styles.settingsLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <Globe size={16} color="#6366f1" />
              </View>
              <Text style={styles.settingsLabel}>Langue de l'interface</Text>
            </View>
            <View style={styles.settingsRight}>
              <Text style={styles.settingsValueText}>{appLanguage}</Text>
              <ChevronRight size={16} color={isDarkMode ? "#94a3b8" : "#94a3b8"} />
            </View>
          </TouchableOpacity>
        </View>

        {/* SECURITY & ACCOUNT ACTIONS */}
        <Text style={styles.sectionTitle}>Sécurité & Compte</Text>
        <View style={styles.groupedCard}>
          {/* Modify PIN */}
          <TouchableOpacity 
            onPress={() => setShowPinModal(true)}
            style={styles.settingsRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingsLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 44, 247, 0.08)' }]}>
                <Key size={16} color={isDarkMode ? "#38bdf8" : "#002cf7"} />
              </View>
              <Text style={styles.settingsLabel}>Modifier mon code PIN</Text>
            </View>
            <ChevronRight size={16} color={isDarkMode ? "#94a3b8" : "#94a3b8"} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Logout */}
          <TouchableOpacity 
            onPress={handleLogout}
            style={styles.settingsRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingsLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <LogOut size={16} color="#ef4444" />
              </View>
              <Text style={[styles.settingsLabel, { color: '#ef4444', fontWeight: '600' }]}>Se déconnecter</Text>
            </View>
            <ChevronRight size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* FOOTER INFO & SUPPORT */}
        <View style={styles.supportFooter}>
          <Text style={styles.versionText}>KLIN UP Mobile v1.5.0 — Caisse & Gestion</Text>
          <TouchableOpacity onPress={handleSupportPress} style={styles.supportBtn} activeOpacity={0.8}>
            <HelpCircle size={13} color={isDarkMode ? "#a1a1aa" : "#64748b"} style={{ marginRight: 6 }} />
            <Text style={styles.supportBtnText}>Support Technique Administrateur</Text>
          </TouchableOpacity>
        </View>

        {/* MODAL : MODIFIER PIN (FULL SCREEN PAGE) */}
        <Modal
          visible={showPinModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowPinModal(false)}
        >
          <View style={styles.fullPageContainer}>
            {/* HEADER BACK BUTTON */}
            <View style={styles.fullPageHeader}>
              <TouchableOpacity onPress={() => setShowPinModal(false)} style={styles.backBtnHeader} activeOpacity={0.7}>
                <ArrowLeft size={22} color={isDarkMode ? '#ffffff' : '#0f172a'} />
                <Text style={styles.backBtnText}>Retour</Text>
              </TouchableOpacity>

              <Text style={styles.fullPageTitle} numberOfLines={1}>Modifier mon code PIN</Text>
              <View style={{ width: 70 }} />
            </View>

            <ScrollView contentContainerStyle={styles.fullPageScroll} bounces={false}>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.modalLabel}>Code PIN actuel</Text>
                  <TextInput
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                    value={currentPin}
                    onChangeText={setCurrentPin}
                    placeholder="******"
                    placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                    style={styles.modalInput}
                  />
                </View>

                <View>
                  <Text style={styles.modalLabel}>Nouveau code PIN (6 chiffres)</Text>
                  <TextInput
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                    value={newPin}
                    onChangeText={setNewPin}
                    placeholder="******"
                    placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                    style={styles.modalInput}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleChangePin}
                  style={styles.modalSubmitBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSubmitBtnText}>Confirmer le changement</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
}

function getStyles(isDarkMode) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 18,
      paddingTop: 12,
      backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
      paddingBottom: 110,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 24 : 16,
      paddingBottom: 12,
      backgroundColor: isDarkMode ? '#000000' : '#f8fafc',
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#09090b',
      letterSpacing: -0.5,
    },
    heroProfileCard: {
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      marginBottom: 20,
    },
    avatarWrapper: {
      position: 'relative',
      marginBottom: 14,
    },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 44, 247, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDarkMode ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0, 44, 247, 0.15)',
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '800',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    onlineBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#22c55e',
      borderWidth: 2,
      borderColor: isDarkMode ? '#121212' : '#ffffff',
    },
    profileName: {
      fontSize: 20,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#09090b',
      marginBottom: 6,
      textAlign: 'center',
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 44, 247, 0.06)',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 44, 247, 0.12)',
      marginBottom: 14,
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    emailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#27272a' : '#f1f5f9',
    },
    emailText: {
      fontSize: 12.5,
      color: isDarkMode ? '#d4d4d8' : '#475569',
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#a1a1aa' : '#64748b',
      marginBottom: 10,
      marginTop: 6,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 22,
    },
    statCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      gap: 12,
    },
    statIconBadge: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statInfo: {
      flex: 1,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
    },
    statLabel: {
      fontSize: 10.5,
      color: isDarkMode ? '#a1a1aa' : '#64748b',
      fontWeight: '600',
      marginTop: 2,
    },
    groupedCard: {
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      marginBottom: 22,
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
      marginVertical: 4,
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
    },
    settingsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsLabel: {
      fontSize: 13,
      color: isDarkMode ? '#f4f4f5' : '#18181b',
      fontWeight: '600',
    },
    settingsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    settingsValueText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDarkMode ? '#a1a1aa' : '#64748b',
    },
    supportFooter: {
      alignItems: 'center',
      marginTop: 10,
      gap: 10,
      paddingBottom: 30,
    },
    supportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    supportBtnText: {
      fontSize: 11,
      color: isDarkMode ? '#a1a1aa' : '#64748b',
      fontWeight: '600',
    },
    versionText: {
      fontSize: 10,
      color: isDarkMode ? '#71717a' : '#94a3b8',
      fontWeight: '500',
    },
    fullPageContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
      paddingTop: Platform.OS === 'ios' ? 48 : 24,
    },
    fullPageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1f2937' : '#e2e8f0',
      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
    },
    backBtnHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingRight: 10,
    },
    backBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#0f172a',
    },
    fullPageTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      textAlign: 'center',
      flex: 1,
    },
    fullPageScroll: {
      padding: 16,
      paddingBottom: 40,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      padding: 18,
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      borderRadius: 24,
      padding: 22,
      width: '100%',
      maxWidth: 380,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      overflow: 'hidden',
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
      color: isDarkMode ? '#ffffff' : '#09090b',
    },
    modalBody: {
      gap: 12,
    },
    modalLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#d4d4d8' : '#475569',
      marginTop: 4,
    },
    modalInput: {
      backgroundColor: isDarkMode ? '#09090b' : '#f8fafc',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      borderRadius: 14,
      height: 48,
      paddingHorizontal: 16,
      fontSize: 14,
      color: isDarkMode ? '#ffffff' : '#09090b',
      fontWeight: '500',
    },
    modalSubmitBtn: {
      backgroundColor: '#002cf7',
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 10,
    },
    modalSubmitBtnText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
