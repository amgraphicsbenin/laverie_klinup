import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, BackHandler } from 'react-native';
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

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('accueil');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openOrderFormOnMount, setOpenOrderFormOnMount] = useState(false);
  const [gestionFilter, setGestionFilter] = useState(null);
  const [orderFormVisible, setOrderFormVisible] = useState(false);
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const [closeModalsTrigger, setCloseModalsTrigger] = useState(0);
  const [initSelectedClient, setInitSelectedClient] = useState(null);
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });

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


  // Hook to get live updates
  const dbState = useDbState();
  const currentUser = dbState.currentUser;

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
          />
        );
      case 'profile':
        return <ProfileScreen onModalStateChange={setLocalModalOpen} closeAllModalsTrigger={closeModalsTrigger} />;
      default:
        return (
          <DashboardScreen 
            onNavigate={(tab) => { setActiveTab(tab); setOrderFormVisible(false); }} 
            setSelectedOrder={setSelectedOrder}
            setGestionFilter={setGestionFilter}
            onModalStateChange={setLocalModalOpen}
            closeAllModalsTrigger={closeModalsTrigger}
          />
        );
    }
  };

  const appContent = (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" translucent={Platform.OS === 'android'} backgroundColor="transparent" />
      {!currentUser ? (
        <LoginScreen />
      ) : (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <MotiView
              key={activeTab}
              from={{ opacity: 0, scale: 0.98, translateY: 6 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 16, mass: 0.6 }}
              style={{ flex: 1 }}
            >
              {renderActiveScreen()}
            </MotiView>
          </View>

      {/* BOTTOM TAB BAR */}
      <View style={[
        styles.tabBar,
        {
          height: 82 + insets.bottom,          // 48dp icons + 12dp top/22dp bottom padding + native safe bottom inset
          paddingTop: 12,
          paddingBottom: 22 + insets.bottom,
        }
      ]}>
        <TouchableOpacity 
          onPress={() => { setActiveTab('accueil'); setOrderFormVisible(false); setLocalModalOpen(false); }}
          style={styles.tabItem}
        >
          <MotiView
            animate={{ scale: activeTab === 'accueil' ? 1.06 : 1 }}
            transition={{ type: 'timing', duration: 200 }}
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
            onPress={() => { setActiveTab('gestion'); setOrderFormVisible(false); setLocalModalOpen(false); }}
            style={styles.tabItem}
          >
            <MotiView
              animate={{ scale: activeTab === 'gestion' ? 1.06 : 1 }}
              transition={{ type: 'timing', duration: 200 }}
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

        {/* Center Plus Button (always visible, turns red & 'x' to close other active modals) */}
        <View 
          style={styles.centerTabItem}
          pointerEvents="auto"
        >
          <TouchableOpacity 
            onPress={isAnyModalVisible ? handleCloseActiveModal : () => setOrderFormVisible(!orderFormVisible)}
            activeOpacity={0.85}
          >
            <MotiView
              animate={{ 
                backgroundColor: isAnyModalVisible ? '#ef4444' : '#002cf7',
                scale: (isAnyModalVisible || orderFormVisible) ? 1.05 : 1,
                rotate: (isAnyModalVisible || orderFormVisible) ? '135deg' : '0deg'
              }}
              transition={{ type: 'timing', duration: 250 }}
              style={styles.scanButtonCircle}
            >
              <MaterialCommunityIcons name="plus" size={26} color="#ffffff" />
            </MotiView>
          </TouchableOpacity>
        </View>

        {currentUser.role !== 'agent_lavage_repassage' && (
          <TouchableOpacity 
            onPress={() => { setActiveTab('historique'); setOrderFormVisible(false); setLocalModalOpen(false); }}
            style={styles.tabItem}
          >
            <MotiView
              animate={{ scale: activeTab === 'historique' ? 1.06 : 1 }}
              transition={{ type: 'timing', duration: 200 }}
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
          onPress={() => { setActiveTab('profile'); setOrderFormVisible(false); setLocalModalOpen(false); }}
          style={styles.tabItem}
        >
          <MotiView
            animate={{ scale: activeTab === 'profile' ? 1.06 : 1 }}
            transition={{ type: 'timing', duration: 200 }}
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
      <OrderFormModal visible={orderFormVisible} onClose={() => setOrderFormVisible(false)} onShowSuccess={triggerSuccess} />

      {/* GLOBAL FLOATING SUCCESS TOAST */}
      <MotiView
        pointerEvents={successToast.visible ? 'auto' : 'none'}
        animate={{
          opacity: successToast.visible ? 1 : 0,
          translateY: successToast.visible ? (Platform.OS === 'ios' ? 50 : 25) : -120,
          scale: successToast.visible ? 1 : 0.88,
        }}
        transition={{ type: 'spring', damping: 15, mass: 0.8 }}
        style={styles.globalToastContainer}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 45 : 95} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.globalToastContent}>
          <MotiView
            animate={{
              scale: successToast.visible ? 1 : 0.5,
              rotate: successToast.visible ? '0deg' : '-45deg',
            }}
            transition={{ type: 'spring', damping: 10, delay: 150 }}
            style={styles.toastIconCircle}
          >
            <MaterialCommunityIcons name="check-bold" size={16} color="#ffffff" />
          </MotiView>
          <MotiView
            animate={{
              opacity: successToast.visible ? 1 : 0,
              translateX: successToast.visible ? 0 : 15,
            }}
            transition={{ type: 'timing', duration: 400, delay: 250 }}
            style={{ flex: 1 }}
          >
            <Text style={styles.toastTitle}>Succès</Text>
            <Text style={styles.toastMessage}>{successToast.message}</Text>
          </MotiView>
        </View>
      </MotiView>
    </SafeAreaView>
  )}
</View>
  );

  // On web: wrap in a phone-sized container centered in the browser
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={styles.webPhone}>
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
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 25,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    // height + paddingBottom set dynamically below via tabBarDynamic()
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
