import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Platform, BackHandler, ScrollView, StatusBar as RNStatusBar, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { initializeDatabase, db } from './src/services/db';
import { useDbState } from './src/hooks/useDbState';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import DashboardScreen from './src/features/dashboard/screens/DashboardScreen';
import GestionScreen from './src/features/orders/screens/GestionScreen';
import HistoryScreen from './src/features/orders/screens/HistoryScreen';
import ProfileScreen from './src/features/profile/screens/ProfileScreen';
import OrderCreateScreen from './src/features/orders/screens/OrderCreateScreen';
import { LinearGradient } from 'expo-linear-gradient';
import SafeBlurView from './src/components/SafeBlurView';
const BlurView = SafeBlurView;
import { MotiView } from './src/components/SafeView';
import { OrderFormModal } from './src/components/OrderFormModal';
import { registerAlertHandler } from './src/services/alert';
import SplashScreen from './src/components/SplashScreen';
import FlaticonIcon from './src/components/FlaticonIcon';
import { initSystemNotifications, savePushTokenToSupabase } from './src/services/notificationService';
import * as Notifications from 'expo-notifications';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App crash:', error, info);
    this.setState({ errorInfo: info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', paddingTop: 60 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 12 }}>Erreur détectée</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1f2937', textAlign: 'center', marginBottom: 12 }}>
            {this.state.error?.message || String(this.state.error)}
          </Text>
          <ScrollView style={{ flex: 1, width: '100%', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#dc2626' }}>
              {this.state.error?.stack || 'Pas de trace d\'empilement disponible'}
            </Text>
            {this.state.errorInfo?.componentStack && (
              <Text style={{ fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#4b5563', marginTop: 10 }}>
                {this.state.errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {

  const dbState = useDbState();
  const currentUser = dbState.currentUser;
  const isDarkMode = dbState.isDarkMode;

  const [dbReady, setDbReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('accueil');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openOrderFormOnMount, setOpenOrderFormOnMount] = useState(false);
  const [gestionFilter, setGestionFilter] = useState(null);
  const [orderFormVisible, setOrderFormVisible] = useState(false);
  const [orderFormKey, setOrderFormKey] = useState(0);
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const [closeModalsTrigger, setCloseModalsTrigger] = useState(0);
  const [initSelectedClient, setInitSelectedClient] = useState(null);
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });
  const [customAlertState, setCustomAlertState] = useState({ visible: false, title: '', message: '', buttons: [] });

  const scrollViewRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(393);

  const availableTabs = currentUser?.role === 'agent_lavage_repassage' 
    ? ['accueil', 'profile'] 
    : ['accueil', 'gestion', 'creer_commande', 'historique', 'profile'];

  const switchTab = (tabName, animated = false) => {
    setActiveTab(tabName);
    const targetIndex = availableTabs.indexOf(tabName);
    if (targetIndex !== -1 && scrollViewRef.current && containerWidth > 0) {
      scrollViewRef.current.scrollTo({ x: targetIndex * containerWidth, animated });
    }
  };

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    if (containerWidth > 0) {
      const pageIndex = Math.round(offsetX / containerWidth);
      if (pageIndex >= 0 && pageIndex < availableTabs.length) {
        const targetTab = availableTabs[pageIndex];
        if (targetTab !== activeTab) {
          setActiveTab(targetTab);
        }
      }
    }
  };

  const handleMomentumScrollEnd = (e) => {
    handleScroll(e);
  };

  useEffect(() => {
    const targetIndex = availableTabs.indexOf(activeTab);
    if (targetIndex !== -1 && scrollViewRef.current && containerWidth > 0) {
      scrollViewRef.current.scrollTo({ x: targetIndex * containerWidth, animated: false });
    }
  }, [containerWidth, currentUser?.role]);

  useEffect(() => {
    registerAlertHandler(({ title, message, buttons }) => {
      setCustomAlertState({
        visible: true,
        title: title || 'Information',
        message: message || '',
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }]
      });
    });
  }, []);

  // Listen for AppState changes to refresh data when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        db.refreshData().catch(err => console.warn('Foreground refresh error:', err));
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const triggerSuccess = (message) => {
    setSuccessToast({ visible: true, message });
    setTimeout(() => {
      setSuccessToast({ visible: false, message: '' });
    }, 3200);
  };

  const isAnyModalVisible = localModalOpen || selectedOrder !== null;

  const handleCloseActiveModal = () => {
    setSelectedOrder(null);
    setCloseModalsTrigger(prev => prev + 1);
  };

  // Load database on mount
  useEffect(() => {
    async function setup() {
      try {
        await initializeDatabase();
        await initSystemNotifications();
      } catch (err) {
        console.error("DB Initialization error", err);
      } finally {
        setDbReady(true);
      }
    }
    setup();
  }, []);

  // ── Sauvegarder le push token quand l'utilisateur se connecte ──
  // NOTE : Le store_id est passé dans le useEffect ci-dessous (currentUser),
  // ne pas appeler savePushTokenToSupabase sans store_id ici pour éviter
  // d'écraser le store_id correct avec la valeur par défaut 'store_central'.

  // ── Listener foreground : notification reçue quand l'app est ouverte ──
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Notification reçue en foreground (app ouverte)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Reçue en foreground:', notification.request.content.title);
      // La notification est déjà affichée par setNotificationHandler
      // On peut optionnellement afficher un toast interne ici
    });

    // Tap sur une notification (depuis écran verrouillé ou tiroir de notifications)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.screen === 'gestion') {
        // Naviguer vers l'écran de gestion des commandes
        switchTab('gestion');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);


  const getAlertIcon = (title, message) => {
    const t = (title || '').toLowerCase();
    const m = (message || '').toLowerCase();
    
    if (t.includes('erreur') || t.includes('fail') || t.includes('impossible') || m.includes('erreur') || m.includes('échoué') || t.includes('insuffisant')) {
      return { name: 'alert-circle', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    }
    if (t.includes('succès') || t.includes('success') || t.includes('confirme') || m.includes('succès') || t.includes('enregistré')) {
      return { name: 'check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
    if (t.includes('attention') || t.includes('warning') || m.includes('attention') || t.includes('supprimer') || t.includes('résilier') || t.includes('confirmation')) {
      return { name: 'alert', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    }
    return { name: 'information', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' };
  };

  const handleButtonPress = (btn) => {
    setCustomAlertState(prev => ({ ...prev, visible: false }));
    if (btn.onPress) {
      btn.onPress();
    }
  };

  // Adapt tabs automatically for specific roles and save push token for remote notifications
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'agent_lavage_repassage') {
        switchTab('accueil');
      }
      // Save push token to Supabase so remote push notifications reach all staff when app is closed/in background
      savePushTokenToSupabase(currentUser.id, currentUser.store_id || 'store_central').catch(() => {});
    }
  }, [currentUser]);

  // Handle native Android back gesture / hardware back button
  useEffect(() => {
    if (Platform.OS === 'web' || !currentUser) return;

    const backAction = () => {
      // 0. If custom alert is open, dismiss it
      if (customAlertState && customAlertState.visible) {
        setCustomAlertState(prev => ({ ...prev, visible: false }));
        return true;
      }

      // 1. If order form is visible, close it
      if (orderFormVisible) {
        setOrderFormVisible(false);
        return true;
      }
      
      // 2. If an order detail is selected, deselect it
      if (selectedOrder) {
        setSelectedOrder(null);
        return true;
      }

      // 3. If any local modal is open, close it
      if (localModalOpen) {
        setCloseModalsTrigger(prev => prev + 1);
        return true;
      }
      
      // 4. If we are not on the main tab, go back to the main tab
      if (activeTab !== 'accueil') {
        switchTab('accueil');
        return true;
      }
      
      // Otherwise, return false to let the system exit/minimize the app
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentUser, activeTab, selectedOrder, orderFormVisible, customAlertState?.visible, localModalOpen]);



  const renderTabScreen = (tabKey) => {
    switch (tabKey) {
      case 'gestion':
        return (
          <GestionScreen 
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            gestionFilter={gestionFilter}
            setGestionFilter={setGestionFilter}
            openOrderFormOnMount={openOrderFormOnMount}
            onCloseOrderFormOnMount={() => setOpenOrderFormOnMount(false)}
            orderFormVisible={orderFormVisible}
            setOrderFormVisible={setOrderFormVisible}
            onOpenOrderForm={() => { setOrderFormKey(prev => prev + 1); setOrderFormVisible(true); }}
            onModalStateChange={setLocalModalOpen}
            closeAllModalsTrigger={closeModalsTrigger}
            initialSelectedClient={initSelectedClient}
            onClearInitialSelectedClient={() => setInitSelectedClient(null)}
            onShowSuccess={triggerSuccess}
          />
        );
      case 'historique':
        return (
          <HistoryScreen 
            onModalStateChange={setLocalModalOpen} 
            closeAllModalsTrigger={closeModalsTrigger}
            onSelectClient={(client) => {
              switchTab('gestion');
              setInitSelectedClient(client);
            }}
            onShowSuccess={triggerSuccess}
          />
        );
      case 'profile':
        return <ProfileScreen onModalStateChange={setLocalModalOpen} closeAllModalsTrigger={closeModalsTrigger} onShowSuccess={triggerSuccess} />;
      case 'creer_commande':
        return (
          <OrderCreateScreen
            onNavigate={(tab) => { switchTab(tab); setOrderFormVisible(false); }}
            onShowSuccess={triggerSuccess}
          />
        );
      case 'accueil':
      default:
        return (
          <DashboardScreen 
            onNavigate={(tab) => { switchTab(tab); setOrderFormVisible(false); }}
            setSelectedOrder={setSelectedOrder}
            setGestionFilter={setGestionFilter}
            onModalStateChange={setLocalModalOpen}
            closeAllModalsTrigger={closeModalsTrigger}
            onSelectClient={(client) => {
              switchTab('gestion');
              setInitSelectedClient(client);
            }}
            onShowSuccess={triggerSuccess}
          />
        );
    }
  };

  const isAtelier = currentUser?.role === 'agent_lavage_repassage';
  const totalSlots = isAtelier ? 2 : 5;
  const tabBarInnerWidth = Math.max(100, containerWidth - 8);
  const slotWidth = tabBarInnerWidth / totalSlots;
  const pillWidth = Math.min(48, slotWidth - 8);
  const pillHeight = 32;
  
  const getActiveSlotIndex = (tab) => {
    if (isAtelier) {
      return tab === 'profile' ? 1 : 0;
    }
    switch (tab) {
      case 'gestion': return 1;
      case 'creer_commande': return 2;
      case 'historique': return 3;
      case 'profile': return 4;
      case 'accueil':
      default: return 0;
    }
  };

  const activeSlotIndex = getActiveSlotIndex(activeTab);
  const pillTranslateX = (activeSlotIndex * slotWidth) + (slotWidth - pillWidth) / 2;

  const isNavBarHidden = 
    selectedOrder !== null || 
    localModalOpen || 
    orderFormVisible;

  const appContent = (
    <View style={{ flex: 1, backgroundColor: showSplash ? '#002cf7' : (isDarkMode ? '#000000' : '#ffffff') }}>
      <ExpoStatusBar 
        style={showSplash ? 'light' : (isDarkMode ? 'light' : 'dark')} 
        backgroundColor={showSplash ? '#002cf7' : (isDarkMode ? '#000000' : '#ffffff')}
        translucent={Platform.OS === 'android'}
      />
      {!dbReady ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#000000' : '#ffffff' }}>
          <ActivityIndicator size="large" color="#002cf7" />
          <Text style={{ marginTop: 14, fontSize: 13, fontWeight: '600', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
            Chargement de KLIN UP...
          </Text>
        </View>
      ) : !currentUser ? (
        <LoginScreen />
      ) : (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff', paddingTop: insets.top }]}>
          <View 
            style={styles.content}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && Math.abs(w - containerWidth) > 1) {
                setContainerWidth(w);
              }
            }}
          >
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled={true}
              nestedScrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              bounces={false}
              scrollEventThrottle={16}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              style={{ flex: 1 }}
              contentContainerStyle={{ width: containerWidth * availableTabs.length }}
              keyboardShouldPersistTaps="handled"
            >
              {availableTabs.map((tabKey) => (
                <View key={tabKey} style={{ width: containerWidth, flex: 1, overflow: 'hidden' }}>
                  {renderTabScreen(tabKey)}
                </View>
              ))}
            </ScrollView>
          </View>

      {/* BOTTOM TAB BAR WITH SMOOTH ANIMATED TRANSITION */}
      <MotiView
        pointerEvents={isNavBarHidden ? 'none' : 'auto'}
        animate={{
          translateY: isNavBarHidden ? 110 : 0,
          opacity: isNavBarHidden ? 0 : 1,
          scale: isNavBarHidden ? 0.95 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 22,
          stiffness: 180,
          mass: 0.7,
        }}
        style={[
          styles.tabBar,
          {
            paddingTop: 6,
            paddingBottom: Math.max(8, insets.bottom),
            backgroundColor: '#002cf7',
          }
        ]}
      >
        {/* Sliding Active Pill Background Indicator */}
        <MotiView
          animate={{
            translateX: pillTranslateX,
            width: pillWidth,
          }}
          transition={{
            type: 'spring',
            damping: 22,
            stiffness: 190,
            mass: 0.5,
          }}
          style={{
            position: 'absolute',
            left: 4,
            top: 6,
            width: pillWidth,
            height: pillHeight,
            borderRadius: 9999,
            backgroundColor: '#ffffff',
            transform: [{ translateX: pillTranslateX }],
            zIndex: 0,
          }}
        />

        <TouchableOpacity 
          onPress={() => { switchTab('accueil'); setOrderFormVisible(false); setLocalModalOpen(false); }}
          style={[styles.tabItem, { zIndex: 1 }]}
          activeOpacity={0.8}
        >
          <View style={styles.tabItemInner}>
            <View style={styles.tabIconWrapper}>
              <FlaticonIcon
                name="accueil"
                active={activeTab === 'accueil'}
                size={20}
                color={activeTab === 'accueil' ? '#002cf7' : '#ffffff'}
              />
            </View>
            <Text style={[
              styles.tabLabel, 
              { color: '#ffffff' },
              activeTab === 'accueil' && styles.tabLabelActive
            ]}>
              Accueil
            </Text>
          </View>
        </TouchableOpacity>

        {currentUser.role !== 'agent_lavage_repassage' && (
          <TouchableOpacity 
            onPress={() => { switchTab('gestion'); setOrderFormVisible(false); setLocalModalOpen(false); }}
            style={[styles.tabItem, { zIndex: 1 }]}
            activeOpacity={0.8}
          >
            <View style={styles.tabItemInner}>
              <View style={styles.tabIconWrapper}>
                <FlaticonIcon
                  name="gestion"
                  active={activeTab === 'gestion'}
                  size={20}
                  color={activeTab === 'gestion' ? '#002cf7' : '#ffffff'}
                />
              </View>
              <Text style={[
                styles.tabLabel, 
                { color: '#ffffff' },
                activeTab === 'gestion' && styles.tabLabelActive
              ]}>
                Gestion
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Add Order Tab Button ("Ajouter" - Dedicated Page) */}
        {currentUser.role !== 'agent_lavage_repassage' && (
          <TouchableOpacity 
            onPress={() => { switchTab('creer_commande'); setOrderFormVisible(false); setLocalModalOpen(false); }}
            style={[styles.tabItem, { zIndex: 1 }]}
            activeOpacity={0.8}
          >
            <View style={styles.tabItemInner}>
              <View style={styles.tabIconWrapper}>
                <FlaticonIcon
                  name="ajouter"
                  active={activeTab === 'creer_commande'}
                  size={20}
                  color={activeTab === 'creer_commande' ? '#002cf7' : '#ffffff'}
                />
              </View>
              <Text style={[
                styles.tabLabel, 
                { color: '#ffffff' },
                activeTab === 'creer_commande' && styles.tabLabelActive
              ]}>
                Ajouter
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {currentUser.role !== 'agent_lavage_repassage' && (
          <TouchableOpacity 
            onPress={() => { switchTab('historique'); setOrderFormVisible(false); setLocalModalOpen(false); }}
            style={[styles.tabItem, { zIndex: 1 }]}
            activeOpacity={0.8}
          >
            <View style={styles.tabItemInner}>
              <View style={styles.tabIconWrapper}>
                <FlaticonIcon
                  name="historique"
                  active={activeTab === 'historique'}
                  size={20}
                  color={activeTab === 'historique' ? '#002cf7' : '#ffffff'}
                />
              </View>
              <Text style={[
                styles.tabLabel, 
                { color: '#ffffff' },
                activeTab === 'historique' && styles.tabLabelActive
              ]}>
                Historique
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={() => { switchTab('profile'); setOrderFormVisible(false); setLocalModalOpen(false); }}
          style={[styles.tabItem, { zIndex: 1 }]}
          activeOpacity={0.8}
        >
            <View style={styles.tabItemInner}>
              <View style={styles.tabIconWrapper}>
                <FlaticonIcon
                  name="profile"
                  active={activeTab === 'profile'}
                  size={20}
                  color={activeTab === 'profile' ? '#002cf7' : '#ffffff'}
                />
              </View>
              <Text style={[
                styles.tabLabel, 
                { color: '#ffffff' },
                activeTab === 'profile' && styles.tabLabelActive
              ]}>
                Profil
              </Text>
            </View>
        </TouchableOpacity>
      </MotiView>
      <OrderFormModal key={orderFormKey} visible={orderFormVisible} onClose={() => setOrderFormVisible(false)} onShowSuccess={triggerSuccess} />

        </View>
      )}
      {/* GLOBAL FLOATING SUCCESS TOAST */}
      {successToast.visible && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -20 }}
          transition={{ type: 'timing', duration: 220 }}
          pointerEvents="auto"
          style={[
            styles.globalToastContainer,
            {
              top: Platform.OS === 'android' 
                ? (RNStatusBar.currentHeight || insets.top || 24) + 12 
                : Math.max(insets.top + 8, 20),
            }
          ]}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 45 : 95} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <View style={styles.globalToastContent}>
            <View style={styles.toastIconCircle}>
              <MaterialCommunityIcons name="check-bold" size={16} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toastTitle, { color: isDarkMode ? '#4ade80' : '#15803d' }]}>Succès</Text>
              <Text style={[styles.toastMessage, { color: isDarkMode ? '#e4e4e7' : '#475569' }]}>{successToast.message}</Text>
            </View>
          </View>
        </MotiView>
      )}
      {/* GLOBAL CUSTOM PREMIUM ALERT MODAL */}
      {customAlertState.visible && (
        <View
          pointerEvents="auto"
          style={[StyleSheet.absoluteFill, { zIndex: 100000, elevation: 100000, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
        >
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => {
            if (customAlertState.buttons.length <= 1) {
              setCustomAlertState(prev => ({ ...prev, visible: false }));
            }
          }}>
            <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          
          <View
            style={{
              backgroundColor: isDarkMode ? '#121212' : '#ffffff',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
              padding: 24,
              width: '90%',
              maxWidth: 340,
              alignItems: 'center',
              shadowColor: 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0,
              shadowRadius: 0,
              elevation: 0,
            }}
          >
            {/* Alert Icon */}
            {(() => {
              const iconInfo = getAlertIcon(customAlertState.title, customAlertState.message);
              return (
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: iconInfo.bg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <MaterialCommunityIcons name={iconInfo.name} size={28} color={iconInfo.color} />
                </View>
              );
            })()}
            
            {/* Title */}
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: isDarkMode ? '#ffffff' : '#09090b',
              textAlign: 'center',
              marginBottom: 10,
            }}>
              {customAlertState.title}
            </Text>
            
            {/* Message */}
            <Text style={{
              fontSize: 13,
              color: isDarkMode ? '#d4d4d8' : '#475569',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 24,
            }}>
              {customAlertState.message}
            </Text>
            
            {/* Buttons Row */}
            <View style={{
              flexDirection: customAlertState.buttons.length > 2 ? 'column' : 'row',
              gap: 10,
              width: '100%',
              justifyContent: 'center',
            }}>
              {customAlertState.buttons.map((btn, index) => {
                const isDestructive = btn.style === 'destructive' || btn.text.toLowerCase() === 'supprimer' || btn.text.toLowerCase() === 'résilier';
                const isCancel = btn.style === 'cancel' || btn.text.toLowerCase() === 'annuler' || btn.text.toLowerCase() === 'non';
                
                let btnBg = '#002cf7';
                let textColor = '#ffffff';
                let borderW = 0;
                let borderC = 'transparent';
                
                if (isDestructive) {
                  btnBg = '#ef4444';
                } else if (isCancel) {
                  btnBg = 'transparent';
                  textColor = isDarkMode ? '#d4d4d8' : '#475569';
                  borderW = 1.5;
                  borderC = isDarkMode ? '#27272a' : '#e2e8f0';
                }
                
                return (
                  <TouchableOpacity
                    key={btn.text}
                    activeOpacity={0.8}
                    onPress={() => handleButtonPress(btn)}
                    style={{
                      flex: customAlertState.buttons.length > 2 ? 0 : 1,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: btnBg,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: borderW,
                      borderColor: borderC,
                      paddingHorizontal: 12,
                      width: '100%',
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: textColor,
                    }}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* OPENING ANIMATED SPLASH SCREEN OVERLAY */}
      {showSplash && (
        <SplashScreen
          isReady={dbReady}
          onAnimationFinish={() => setShowSplash(false)}
        />
      )}
    </View>
  );

  // On web: wrap in a phone-sized container centered in the browser
  if (Platform.OS === 'web') {
    return (
      <ErrorBoundary>
        <View style={styles.webOuter}>
          <View style={[styles.webPhone, { backgroundColor: isDarkMode ? '#000000' : '#f8fafc' }]}>
            {appContent}
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  return <ErrorBoundary>{appContent}</ErrorBoundary>;
}

const PHONE_W = 393;
const PHONE_H = 852;

const styles = StyleSheet.create({
  // ── Web-only phone frame wrapper ──
  webOuter: {
    flex: 1,
    height: '100vh',
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#0c0c10',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  webPhone: {
    width: PHONE_W,
    height: PHONE_H,
    maxHeight: '100vh',
    maxWidth: '100vw',
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 0, // dynamic safe area applied in App render
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 16,
    letterSpacing: 3,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 6,
    fontWeight: '500',
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    flexDirection: 'row',
    backgroundColor: '#002cf7',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 6,
    borderWidth: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: 52,
  },
  tabIconWrapper: {
    height: 32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 52,
  },
  scanButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#002cf7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 9,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  globalToastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    padding: 14,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    zIndex: 99999,
    overflow: 'hidden',
  },
  globalToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  toastMessage: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
});
