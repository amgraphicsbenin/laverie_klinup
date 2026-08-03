import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, BackHandler, Switch, Image } from 'react-native';
import { Key, LogOut, X, Bell, Moon, TrendingUp, Sparkles, ChevronRight, User, Mail, Shield, Smartphone, HelpCircle, ArrowLeft, Check, BarChart2, Award, DollarSign, Package, Zap, CheckCircle2, Calendar, MapPin, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../../services/db';
import SafeBlurView from '../../../components/SafeBlurView';
const BlurView = SafeBlurView;
import { MotiView } from '../../../components/SafeView';
import { useScrollPaddingBottom } from '../../../hooks/useTabBarHeight';
import { useDbState } from '../../../hooks/useDbState';
import { t } from '../../../services/i18n';

export default function ProfileScreen({ onModalStateChange, closeAllModalsTrigger, onShowSuccess }) {
  const { currentUser, isDarkMode, currentLang = 'fr' } = useDbState();

  const [showPinModal, setShowPinModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  
  // Interactive app preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const scrollPaddingBottom = useScrollPaddingBottom();
  const styles = getStyles(isDarkMode);

  // Compute performance metrics for this active user
  const userPerformance = useMemo(() => {
    if (!currentUser) return null;

    const orders = db.getOrders() || [];
    const todayStr = new Date().toDateString();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const userOrders = orders.filter(o => 
      o.created_by_id === currentUser.id || 
      o.user_id === currentUser.id || 
      o.staff_id === currentUser.id
    );

    const todayOrders = userOrders.filter(o => o.created_at && new Date(o.created_at).toDateString() === todayStr);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

    const monthOrders = userOrders.filter(o => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);

    const totalOrders = userOrders.length;
    const totalRevenue = userOrders.reduce((sum, o) => sum + (o.prix_total || o.total || 0), 0);
    const expressCount = userOrders.filter(o => o.niveau_urgence === 'Express').length;
    const completedCount = userOrders.filter(o => o.statut === 'livre' || o.statut === 'restitue' || o.statut === 'pret').length;

    return {
      todayCount: todayOrders.length,
      todayRevenue,
      monthCount: monthOrders.length,
      monthRevenue,
      totalOrders,
      totalRevenue,
      expressCount,
      completedCount,
    };
  }, [currentUser, db.getOrders()]);

  const storeName = useMemo(() => {
    if (!currentUser) return null;
    const storeId = currentUser.store_id || currentUser.storeId;
    if (!storeId || storeId === 'all') {
      return currentUser.role === 'super_admin' 
        ? 'Tous les points de laverie (Accès Global)' 
        : 'Point de Laverie Central';
    }

    // 1. Chercher dans la liste des boutiques (local + Supabase)
    const stores = db.getStores ? db.getStores() : [];
    const found = stores.find(s => s && (s.id === storeId || s.code === storeId || s.nom === storeId));
    if (found && (found.nom || found.name)) {
      const displayName = found.nom || found.name;
      const displayCode = found.code && found.code !== displayName ? ` (${found.code})` : '';
      return `${displayName}${displayCode}`;
    }

    // 2. Si l'utilisateur possède un nom de boutique direct
    if (currentUser.store_name || currentUser.store_nom || currentUser.point_laverie) {
      return currentUser.store_name || currentUser.store_nom || currentUser.point_laverie;
    }

    // 3. Fallbacks connus si hors-ligne
    if (storeId === 'store_akpakpa' || storeId === 'KLP-AKP') return 'Point Akpakpa - Saint Jean';
    if (storeId === 'store_calavi' || storeId === 'KLP-CAL') return 'Point Calavi - Université';
    if (storeId === 'store_central' || storeId === 'KLP-CTR') return 'Pressing & Laverie Central';

    // 4. Si l'ID est un identifiant généré (ex: store_l8ig2nlor), afficher un nom propre au lieu de l'ID brut
    if (typeof storeId === 'string' && storeId.startsWith('store_')) {
      const cleanName = storeId.replace(/^store_/, '');
      if (cleanName && !/^[a-z0-9]{8,15}$/.test(cleanName)) {
        return `Point ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`;
      }
      return 'Point de Laverie Partenaire';
    }

    return storeId;
  }, [currentUser]);

  // Close PIN modal when trigger increments
  useEffect(() => {
    if (closeAllModalsTrigger > 0) {
      setShowPinModal(false);
      setShowPerformanceModal(false);
      setCurrentPin('');
      setNewPin('');
    }
  }, [closeAllModalsTrigger]);

  // Notify parent of modal visibility
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(showPinModal || showPerformanceModal);
    }
  }, [showPinModal, showPerformanceModal]);

  // Handle Android back button/gesture to close modals
  useEffect(() => {
    if (Platform.OS === 'web' || (!showPinModal && !showPerformanceModal)) return;

    const backAction = () => {
      if (showPerformanceModal) {
        setShowPerformanceModal(false);
        return true;
      }
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
  }, [showPinModal, showPerformanceModal]);



  const getRoleLabel = (role) => {
    return t(`roles.${role || 'agent_accueil'}`, {}, t('roles.agent_accueil'));
  };

  const formatPrice = (price) => {
    if (currentUser && (currentUser.role === 'livreur' || currentUser.role === 'agent_lavage_repassage')) {
      return '******';
    }
    return `${(price || 0).toLocaleString('fr-FR')} FCFA`;
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout_confirm_title'),
      t('auth.logout_confirm_message'),
      [
        { text: t('app.cancel'), style: "cancel" },
        { text: t('auth.logout_action'), style: "destructive", onPress: () => {
          db.setCurrentUser(null);
        }}
      ]
    );
  };

  const handleChangePin = async () => {
    if (!currentPin || !newPin) {
      Alert.alert(t('alert.error'), t('profile.pin_error_fields'));
      return;
    }
    if (newPin.length !== 6) {
      Alert.alert(t('alert.error'), t('profile.pin_error_length'));
      return;
    }

    if (currentUser.code_pin !== currentPin) {
      Alert.alert(t('alert.error'), t('profile.pin_error_current'));
      return;
    }

    try {
      db.updateStaffPin(currentUser.id, newPin);
      if (onShowSuccess) {
        onShowSuccess(t('profile.pin_success'));
      } else {
        Alert.alert(t('alert.success'), t('profile.pin_success'));
      }
      setCurrentPin('');
      setNewPin('');
      setShowPinModal(false);
    } catch (e) {
      console.error("Error updating PIN:", e);
      Alert.alert(t('alert.error'), t('profile.pin_error_update'));
    }
  };

  const handleSupportPress = () => {
    Alert.alert(
      t('profile.support_title'),
      t('profile.support_message'),
      [{ text: t('alert.compris') }]
    );
  };

  const handlePickImage = async () => {
    if (!currentUser) return;

    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target?.files?.[0];
          if (!file) return;

          if (file.size > 3 * 1024 * 1024) {
            Alert.alert(t('alert.error', {}, 'Erreur'), 'La taille de l\'image ne doit pas dépasser 3 Mo.');
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result;
            if (base64Data) {
              db.updateStaffPicture(currentUser.id, base64Data);
              if (onShowSuccess) {
                onShowSuccess('Photo de profil mise à jour avec succès !');
              }
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission requise', 'L\'accès à vos photos est requis pour changer la photo de profil.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          db.updateStaffPicture(currentUser.id, imageUri);
          if (onShowSuccess) {
            onShowSuccess('Photo de profil mise à jour avec succès !');
          }
        }
      }
    } catch (err) {
      console.error("Erreur sélection photo de profil:", err);
      Alert.alert(t('alert.error', {}, 'Erreur'), 'Impossible de charger la photo de profil.');
    }
  };

  const userInitials = currentUser 
    ? `${(currentUser.prenom || 'K')[0].toUpperCase()}${(currentUser.nom || 'U')[0].toUpperCase()}`
    : 'KU';

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000000' : '#f8fafc' }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.container, { paddingBottom: scrollPaddingBottom }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* HERO PROFILE CARD */}
        <MotiView 
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 150 }}
          style={styles.heroProfileCard}
        >
          {/* Avatar with Status Badge & Camera Overlay */}
          <TouchableOpacity 
            onPress={handlePickImage} 
            activeOpacity={0.8}
            style={styles.avatarWrapper}
            accessibilityLabel="Modifier la photo de profil"
          >
            <View style={styles.avatar}>
              {currentUser?.user_picture ? (
                <Image 
                  source={{ uri: currentUser.user_picture }} 
                  style={styles.avatarImage} 
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{userInitials}</Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Camera size={11} color="#ffffff" />
            </View>
            <View style={styles.onlineBadge} />
          </TouchableOpacity>

          {/* Name & Role Badge */}
          <Text style={styles.profileName}>
            {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : t('app.information')}
          </Text>
          
          {/* Badges Container : Role Pill + Store Pill */}
          <View style={styles.badgesRow}>
            {/* Role Badge Pill */}
            <View style={styles.pillBadge}>
              <Shield size={12} color={isDarkMode ? '#38bdf8' : '#002cf7'} style={{ marginRight: 5 }} />
              <Text style={styles.pillBadgeText}>
                {currentUser ? getRoleLabel(currentUser.role) : t('roles.invité')}
              </Text>
            </View>

            {/* Store Badge Pill */}
            {storeName && (
              <View style={styles.pillBadge}>
                <MapPin size={12} color={isDarkMode ? '#38bdf8' : '#002cf7'} style={{ marginRight: 5 }} />
                <Text style={styles.pillBadgeText}>
                  {storeName}
                </Text>
              </View>
            )}
          </View>

          {/* Email Info Bar */}
          <View style={styles.emailContainer}>
            <Mail size={14} color={isDarkMode ? '#a1a1aa' : '#64748b'} style={{ marginRight: 8 }} />
            <Text style={styles.emailText}>
              {currentUser?.email || t('profile.email_non_config')}
            </Text>
          </View>
        </MotiView>

        {/* MES PERFORMANCES MENU ITEM */}
        <Text style={styles.sectionTitle}>{t('profile.mes_performances', {}, 'Mes performances')}</Text>
        <View style={styles.groupedCard}>
          <TouchableOpacity 
            onPress={() => setShowPerformanceModal(true)}
            style={styles.settingsRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingsLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 44, 247, 0.08)' }]}>
                <BarChart2 size={16} color={isDarkMode ? "#38bdf8" : "#002cf7"} />
              </View>
              <View style={{ marginLeft: 4 }}>
                <Text style={styles.settingsLabel}>{t('profile.mes_performances', {}, 'Mes performances')}</Text>
                <Text style={{ fontSize: 11, color: isDarkMode ? '#a1a1aa' : '#64748b', marginTop: 1 }}>
                  {userPerformance ? `${userPerformance.todayCount} cmd aujourd'hui • ${userPerformance.totalOrders} au total` : 'Statistiques & Bilan'}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={isDarkMode ? "#94a3b8" : "#94a3b8"} />
          </TouchableOpacity>
        </View>

        {/* APP PREFERENCES GROUP */}
        <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>
        <View style={styles.groupedCard}>
          {/* Dark Mode */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9' }]}>
                <Moon size={16} color={isDarkMode ? "#38bdf8" : "#475569"} />
              </View>
              <Text style={styles.settingsLabel}>{t('profile.mode_sombre')}</Text>
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
              <Text style={styles.settingsLabel}>{t('profile.notifications')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
              thumbColor={notificationsEnabled ? "#002cf7" : "#f1f5f9"}
            />
          </View>
        </View>

        {/* SECURITY & ACCOUNT ACTIONS */}
        <Text style={styles.sectionTitle}>{t('profile.securite')}</Text>
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
              <Text style={styles.settingsLabel}>{t('profile.modifier_pin')}</Text>
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
              <Text style={[styles.settingsLabel, { color: '#ef4444', fontWeight: '600' }]}>{t('profile.se_deconnecter')}</Text>
            </View>
            <ChevronRight size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* FOOTER INFO & SUPPORT */}
        <View style={styles.supportFooter}>
          <Text style={styles.versionText}>{t('profile.version')}</Text>
          <TouchableOpacity onPress={handleSupportPress} style={styles.supportBtn} activeOpacity={0.8}>
            <HelpCircle size={13} color={isDarkMode ? "#a1a1aa" : "#64748b"} style={{ marginRight: 6 }} />
            <Text style={styles.supportBtnText}>{t('profile.support_button')}</Text>
          </TouchableOpacity>
        </View>

        {/* MODAL : MES PERFORMANCES (FULL SCREEN PAGE) */}
        <Modal
          visible={showPerformanceModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowPerformanceModal(false)}
        >
          <View style={styles.fullPageContainer}>
            {/* HEADER BACK BUTTON */}
            <View style={styles.fullPageHeader}>
              <TouchableOpacity onPress={() => setShowPerformanceModal(false)} style={styles.backBtnHeader} activeOpacity={0.7}>
                <ArrowLeft size={22} color={isDarkMode ? '#ffffff' : '#0f172a'} />
                <Text style={styles.backBtnText}>{t('profile.back', {}, 'Retour')}</Text>
              </TouchableOpacity>

              <Text style={styles.fullPageTitle} numberOfLines={1}>{t('profile.mes_performances', {}, 'Mes performances')}</Text>
              <View style={{ width: 70 }} />
            </View>

            <ScrollView contentContainerStyle={styles.fullPageScroll} showsVerticalScrollIndicator={false}>
              {/* AGENT SUMMARY HERO CARD */}
              <MotiView 
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={[styles.perfHeroCard, { backgroundColor: isDarkMode ? '#18181b' : '#ffffff' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.perfAvatarBox, { backgroundColor: isDarkMode ? '#002cf7' : '#002cf7' }]}>
                    <Award size={24} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: isDarkMode ? '#ffffff' : '#09090b' }}>
                      {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Agent KLIN UP'}
                    </Text>
                    <Text style={{ fontSize: 13, color: isDarkMode ? '#38bdf8' : '#002cf7', fontWeight: '600', marginTop: 2 }}>
                      {currentUser ? getRoleLabel(currentUser.role) : ''}
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* SECTION 1: AUJOURD'HUI */}
              <Text style={styles.perfSectionTitle}>{t('profile.activite_aujourdhui', {}, "Activité d'aujourd'hui")}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 44, 247, 0.08)' }]}>
                    <TrendingUp size={18} color={isDarkMode ? "#38bdf8" : "#002cf7"} />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValue}>{userPerformance?.todayCount || 0}</Text>
                    <Text style={styles.statLabel}>{t('profile.commandes_crees', {}, 'Commandes créées')}</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                    <Sparkles size={18} color="#16a34a" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={[styles.statValue, { color: '#16a34a' }]}>{formatPrice(userPerformance?.todayRevenue || 0)}</Text>
                    <Text style={styles.statLabel}>{t('profile.volume_encaisse', {}, 'Volume encaissé')}</Text>
                  </View>
                </View>
              </View>

              {/* SECTION 2: CE MOIS */}
              <Text style={styles.perfSectionTitle}>{t('profile.performance_mois', {}, 'Performance du Mois')}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
                    <Calendar size={18} color="#7c3aed" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={[styles.statValue, { color: '#7c3aed' }]}>{userPerformance?.monthCount || 0}</Text>
                    <Text style={styles.statLabel}>Commandes du Mois</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
                    <DollarSign size={18} color="#0ea5e9" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={[styles.statValue, { color: '#0ea5e9' }]}>{formatPrice(userPerformance?.monthRevenue || 0)}</Text>
                    <Text style={styles.statLabel}>CA du Mois</Text>
                  </View>
                </View>
              </View>

              {/* SECTION 3: BILAN GLOBAL */}
              <Text style={styles.perfSectionTitle}>{t('profile.bilan_global', {}, 'Bilan Global Agent')}</Text>
              <View style={styles.groupedCard}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsLeft}>
                    <View style={[styles.settingIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                      <Package size={16} color="#6366f1" />
                    </View>
                    <Text style={styles.settingsLabel}>{t('profile.total_commandes_agent', {}, 'Total commandes gérées')}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isDarkMode ? '#ffffff' : '#09090b' }}>
                    {userPerformance?.totalOrders || 0}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsLeft}>
                    <View style={[styles.settingIconBox, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                      <Sparkles size={16} color="#16a34a" />
                    </View>
                    <Text style={styles.settingsLabel}>{t('profile.ca_cumule', {}, 'Chiffre d\'affaires total')}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#16a34a' }}>
                    {formatPrice(userPerformance?.totalRevenue || 0)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsLeft}>
                    <View style={[styles.settingIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                      <Zap size={16} color="#f59e0b" />
                    </View>
                    <Text style={styles.settingsLabel}>{t('profile.express_gerees', {}, 'Commandes Express')}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isDarkMode ? '#ffffff' : '#09090b' }}>
                    {userPerformance?.expressCount || 0}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.settingsRow}>
                  <View style={styles.settingsLeft}>
                    <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <CheckCircle2 size={16} color="#10b981" />
                    </View>
                    <Text style={styles.settingsLabel}>{t('profile.commandes_livrees', {}, 'Commandes finalisées')}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#10b981' }}>
                    {userPerformance?.completedCount || 0}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

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
                <Text style={styles.backBtnText}>{t('profile.back')}</Text>
              </TouchableOpacity>

              <Text style={styles.fullPageTitle} numberOfLines={1}>{t('profile.modifier_pin_title')}</Text>
              <View style={{ width: 70 }} />
            </View>

            <ScrollView contentContainerStyle={styles.fullPageScroll} bounces={false}>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.modalLabel}>{t('profile.pin_actuel')}</Text>
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
                  <Text style={styles.modalLabel}>{t('profile.nouveau_pin')}</Text>
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
                  <Text style={styles.modalSubmitBtnText}>{t('profile.confirmer_pin')}</Text>
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
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 38,
    },
    cameraBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDarkMode ? '#38bdf8' : '#002cf7',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDarkMode ? '#121212' : '#ffffff',
      zIndex: 2,
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
    badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    pillBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 44, 247, 0.06)',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 44, 247, 0.12)',
    },
    pillBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDarkMode ? '#38bdf8' : '#002cf7',
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
    perfHeroCard: {
      padding: 16,
      borderRadius: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    perfAvatarBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    perfSectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#a1a1aa' : '#64748b',
      marginBottom: 10,
      marginTop: 14,
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
    langItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      marginBottom: 8,
    },
    langItemActive: {
      borderColor: '#002cf7',
      backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.12)' : 'rgba(0, 44, 247, 0.06)',
    },
    langItemLeft: {
      flexDirection: 'column',
      gap: 2,
    },
    langItemLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#09090b',
    },
    langItemLabelActive: {
      color: '#002cf7',
    },
    langItemSubLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: isDarkMode ? '#a1a1aa' : '#64748b',
    },
  });
}