import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, BackHandler, StatusBar as RNStatusBar, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { initializeDatabase, db } from './src/services/db';
import { useDbState } from './src/hooks/useDbState';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GestionScreen from './src/screens/GestionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { OrderFormModal } from './src/components/OrderFormModal';
import './src/services/alert';
import { registerAlertHandler } from './src/services/alert';

export default function App() {
  const dbState = useDbState();
  const currentUser = dbState.currentUser;
  const isDarkMode = dbState.isDarkMode;

  const [dbReady, setDbReady] = useState(false);
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

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const activeWidth = Platform.OS === 'web' ? 393 : SCREEN_WIDTH;

  // Tabs list based on permissions
  const getTabsList = () => {
    const list = ['accueil'];
    if (currentUser && currentUser.role !== 'agent_lavage_repassage') {
      list.push('gestion');
      list.push('historique');
    }
    list.push('profile');
    return list;
  };
  const tabs = currentUser ? getTabsList() : ['accueil'];

  const scrollViewRef = React.useRef(null);
  const [isScrollingFromSwipe, setIsScrollingFromSwipe] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const tabIndex = tabs.indexOf(activeTab);
    if (tabIndex !== -1 && scrollViewRef.current && !isScrollingFromSwipe) {
      scrollViewRef.current.scrollTo({ x: tabIndex * activeWidth, animated: true });
    }
  }, [activeTab, currentUser]);

  const handleMomentumScrollEnd = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const tabIndex = Math.round(contentOffset / activeWidth);
    if (tabIndex >= 0 && tabIndex < tabs.length) {
      setIsScrollingFromSwipe(true);
      setActiveTab(tabs[tabIndex]);
      setTimeout(() => setIsScrollingFromSwipe(false), 100);
    }
  };

  const handleTabPress = (tabName) => {
    setIsScrollingFromSwipe(false);
    setActiveTab(tabName);
    const tabIndex = tabs.indexOf(tabName);
    if (tabIndex !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: tabIndex * activeWidth, animated: true });
    }
  };

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
        setDbReady(true);
      } catch (err) {
        console.error("DB Initialization error", err);
        // Fallback set ready so screen shows at least
        setDbReady(true);
      }
    }
    setup();
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

  // Adapt tabs automatically for specific roles
  useEffect(() => {
    if (currentUser && currentUser.role === 'agent_lavage_repassage') {
      setActiveTab('accueil');
    }
  }, [currentUser]);

  // Handle native Android back gesture / hardware back button
  useEffect(() => {
    if (Platform.OS === 'web' || !currentUser) return;

    const backAction = () => {
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
      
      // 3. If we are not on the main tab, go back to the main tab
      if (activeTab !== 'accueil') {
        setActiveTab('accueil');
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
  }, [currentUser, activeTab, selectedOrder, orderFormVisible]);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#eff6ff', '#f8fafc', '#ffffff']}
          style={StyleSheet.absoluteFill}
        />
        <MotiView
          from={{ opacity: 0.4, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1.05 }}
          transition={{
            type: 'timing',
            duration: 1500,
            loop: true,
            repeatReverse: true,
          }}
          style={{ alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#2563eb" style={{ marginBottom: 16 }} />
          <Text style={styles.loadingText}>KLIN UP</Text>
          <Text style={styles.loadingSubtext}>Initialisation de la base de données...</Text>
        </MotiView>
      </View>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'accueil':
        return (
          <DashboardScreen 
            onNavigate={(tab) => { setActiveTab(tab); setOrderFormVisible(false); }}
            setSelectedOrder={setSelectedOrder}
            setGestionFilter={setGestionFilter}
            onModalStateChange={setLocalModalOpen}
            closeAllModalsTrigger={closeModalsTrigger}
            onShowSuccess={triggerSuccess}
          />
        );
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
              setActiveTab('gestion');
              setInitSelectedClient(client);
            }}
            onShowSuccess={triggerSuccess}
          />
        );
      case 'profile':
        return <ProfileScreen onModalStateChange={setLocalModalOpen} closeAllModalsTrigger={closeModalsTrigger} onShowSuccess={triggerSuccess} />;
      default:
        return (
          <DashboardScreen 
            onNavigate={(tab) => { setActiveTab(tab); setOrderFormVisible(false); }} 
            setSelectedOrder={setSelectedOrder}
            setGestionFilter={setGestionFilter}
            onModalStateChange={setLocalModalOpen}
            closeAllModalsTrigger={closeModalsTrigger}
            onShowSuccess={triggerSuccess}
          />
        );
    }
  };

  const appContent = (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} translucent={true} backgroundColor="transparent" />
      {!currentUser ? (
        <LoginScreen />
      ) : (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', paddingTop: insets.top }]}>
          <View style={styles.content}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
              bounces={false}
            >
              <View style={{ width: activeWidth, flex: 1 }}>
                <DashboardScreen 
                  onNavigate={(tab) => handleTabPress(tab)}
                  setSelectedOrder={setSelectedOrder}
                  setGestionFilter={setGestionFilter}
                  onModalStateChange={setLocalModalOpen}
                  closeAllModalsTrigger={closeModalsTrigger}
                  onShowSuccess={triggerSuccess}
                />
              </View>
              {currentUser.role !== 'agent_lavage_repassage' && (
                <>
                  <View style={{ width: activeWidth, flex: 1 }}>
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
                  </View>
                  <View style={{ width: activeWidth, flex: 1 }}>
                    <HistoryScreen 
                      onModalStateChange={setLocalModalOpen} 
                      closeAllModalsTrigger={closeModalsTrigger}
                      onSelectClient={(client) => {
                        handleTabPress('gestion');
                        setInitSelectedClient(client);
                      }}
                      onShowSuccess={triggerSuccess}
                    />
                  </View>
                </>
              )}
              <View style={{ width: activeWidth, flex: 1 }}>
                <ProfileScreen onModalStateChange={setLocalModalOpen} closeAllModalsTrigger={closeModalsTrigger} onShowSuccess={triggerSuccess} />
              </View>
            </ScrollView>
          </View>

      {/* BOTTOM TAB BAR */}
      <View style={[
        styles.tabBar,
        {
          height: 82 + insets.bottom,          // 48dp icons + 12dp top/22dp bottom padding + native safe bottom inset
          paddingTop: 12,
          paddingBottom: 22 + insets.bottom,
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          borderTopColor: isDarkMode ? '#334155' : 'rgba(0, 0, 0, 0.05)',
        }
      ]}>
        <TouchableOpacity 
          onPress={() => { handleTabPress('accueil'); setOrderFormVisible(false); setLocalModalOpen(false); }}
          style={styles.tabItem}
        >
          <MotiView
            animate={{ scale: activeTab === 'accueil' ? 1.06 : 1 }}
            transition={{ type: 'timing', duration: 120 }}
          >
            <MaterialCommunityIcons
              name={activeTab === 'accueil' ? 'home' : 'home-outline'}
              size={22}
              color={activeTab === 'accueil' ? '#002cf7' : '#a1a1aa'}
            />
          </MotiView>
          <Text style={[styles.tabLabel, activeTab === 'accueil' && styles.tabLabelActive]}>Accueil</Text>
        </TouchableOpacity>

        {currentUser.role !== 'agent_lavage_repassage' && (
          <TouchableOpacity 
            onPress={() => { handleTabPress('gestion'); setOrderFormVisible(false); setLocalModalOpen(false); }}
            style={styles.tabItem}
          >
            <MotiView
              animate={{ scale: activeTab === 'gestion' ? 1.06 : 1 }}
              transition={{ type: 'timing', duration: 120 }}
            >
              <MaterialCommunityIcons
                name={activeTab === 'gestion' ? 'clipboard-list' : 'clipboard-list-outline'}
                size={22}
                color={activeTab === 'gestion' ? '#002cf7' : '#a1a1aa'}
              />
            </MotiView>
            <Text style={[styles.tabLabel, activeTab === 'gestion' && styles.tabLabelActive]}>Gestion</Text>
          </TouchableOpacity>
        )}

        {/* Center Plus Button (always visible for non-atelier staff, turns red & 'x' to close other active modals) */}
        {currentUser.role !== 'agent_lavage_repassage' && (
          <View 
            style={styles.centerTabItem}
            pointerEvents="auto"
          >
            <TouchableOpacity 
              onPress={isAnyModalVisible ? handleCloseActiveModal : () => {
                if (!orderFormVisible) setOrderFormKey(prev => prev + 1);
                setOrderFormVisible(!orderFormVisible);
              }}
              activeOpacity={0.85}
            >
              <MotiView
                animate={{ 
                  backgroundColor: isAnyModalVisible ? '#ef4444' : '#002cf7',
                  scale: (isAnyModalVisible || orderFormVisible) ? 1.05 : 1,
                  rotate: (isAnyModalVisible || orderFormVisible) ? '135deg' : '0deg'
                }}
                transition={{ type: 'timing', duration: 120 }}
                style={styles.scanButtonCircle}
              >
                <MaterialCommunityIcons name="plus" size={26} color="#ffffff" />
              </MotiView>
            </TouchableOpacity>
          </View>
        )}

        {currentUser.role !== 'agent_lavage_repassage' && (
          <TouchableOpacity 
            onPress={() => { handleTabPress('historique'); setOrderFormVisible(false); setLocalModalOpen(false); }}
            style={styles.tabItem}
          >
            <MotiView
              animate={{ scale: activeTab === 'historique' ? 1.06 : 1 }}
              transition={{ type: 'timing', duration: 120 }}
            >
              <MaterialCommunityIcons
                name={activeTab === 'historique' ? 'history' : 'history'}
                size={22}
                color={activeTab === 'historique' ? '#002cf7' : '#a1a1aa'}
              />
            </MotiView>
            <Text style={[styles.tabLabel, activeTab === 'historique' && styles.tabLabelActive]}>Historique</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={() => { handleTabPress('profile'); setOrderFormVisible(false); setLocalModalOpen(false); }}
          style={styles.tabItem}
        >
          <MotiView
            animate={{ scale: activeTab === 'profile' ? 1.06 : 1 }}
            transition={{ type: 'timing', duration: 120 }}
          >
            <MaterialCommunityIcons
              name={activeTab === 'profile' ? 'account-circle' : 'account-circle-outline'}
              size={22}
              color={activeTab === 'profile' ? '#002cf7' : '#a1a1aa'}
            />
          </MotiView>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profil</Text>
        </TouchableOpacity>
      </View>
      <OrderFormModal key={orderFormKey} visible={orderFormVisible} onClose={() => setOrderFormVisible(false)} onShowSuccess={triggerSuccess} />

        </View>
      )}
      {/* GLOBAL FLOATING SUCCESS TOAST */}
      {successToast.visible && (
        <MotiView
          pointerEvents="auto"
          animate={{
            opacity: 1,
            translateY: Platform.OS === 'ios' ? 50 : 25,
            scale: 1,
          }}
          from={{
            opacity: 0,
            translateY: -120,
            scale: 0.88,
          }}
          transition={{ type: 'timing', duration: 150 }}
          style={styles.globalToastContainer}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 45 : 95} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.globalToastContent}>
            <View style={styles.toastIconCircle}>
              <MaterialCommunityIcons name="check-bold" size={16} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toastTitle}>Succès</Text>
              <Text style={styles.toastMessage}>{successToast.message}</Text>
            </View>
          </View>
        </MotiView>
      )}
      {/* GLOBAL CUSTOM PREMIUM ALERT MODAL */}
      {customAlertState.visible && (
        <MotiView
          pointerEvents="auto"
          animate={{ opacity: 1 }}
          from={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 100 }}
          style={[StyleSheet.absoluteFill, { zIndex: 100000, elevation: 100000, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.5)' }]}
        >
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => {
            if (customAlertState.buttons.length <= 1) {
              setCustomAlertState(prev => ({ ...prev, visible: false }));
            }
          }}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>
          
          <MotiView
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            from={{ opacity: 0, scale: 0.9, translateY: 15 }}
            transition={{ type: 'spring', damping: 18, mass: 0.8 }}
            style={{
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDarkMode ? '#334155' : '#e2e8f0',
              padding: 24,
              width: '90%',
              maxWidth: 340,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: isDarkMode ? 0.4 : 0.15,
              shadowRadius: 24,
              elevation: 20,
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
              color: isDarkMode ? '#ffffff' : '#0f172a',
              textAlign: 'center',
              marginBottom: 10,
            }}>
              {customAlertState.title}
            </Text>
            
            {/* Message */}
            <Text style={{
              fontSize: 13,
              color: isDarkMode ? '#cbd5e1' : '#475569',
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
                  textColor = isDarkMode ? '#cbd5e1' : '#475569';
                  borderW = 1.5;
                  borderC = isDarkMode ? '#334155' : '#e2e8f0';
                }
                
                return (
                  <TouchableOpacity
                    key={index}
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
          </MotiView>
        </MotiView>
      )}
    </View>
  );

  // On web: wrap in a phone-sized container centered in the browser
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={[styles.webPhone, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
          {appContent}
        </View>
      </View>
    );
  }

  return appContent;
}

const PHONE_W = 393;
const PHONE_H = 852;

const styles = StyleSheet.create({
  // ── Web-only phone frame wrapper ──
  webOuter: {
    flex: 1,
    backgroundColor: '#0c0c10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPhone: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 25,
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
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    // Shadows for premium elevated card look
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    flex: 1,
  },
  centerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: 60,
  },
  scanButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#002cf7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#002cf7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 9,
    color: '#a1a1aa',
    marginTop: 3,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#002cf7',
    fontWeight: '600',
  },
  globalToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    padding: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 999,
    zIndex: 9999,
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
