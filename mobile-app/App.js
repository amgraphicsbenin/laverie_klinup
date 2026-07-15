import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Dimensions, StatusBar as RNStatusBar, BackHandler, useWindowDimensions } from 'react-native';
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

// ─── Android gesture navigation bar height helper ─────────────────────────────
// On Android 10+ with gesture navigation, the navigation bar is typically
// 0px tall visually (pill gesture area). We add a safe bottom padding so
// the tab bar never overlaps the gesture area. Using StatusBar height
// subtraction from window vs screen height gives us a reliable measurement.
function useAndroidNavBarHeight() {
  const { height: windowH } = useWindowDimensions();
  const screenH = Dimensions.get('screen').height;
  if (Platform.OS !== 'android') return 0;
  // nav bar height = screen height – window height – status bar height
  const statusBarH = RNStatusBar.currentHeight || 0;
  const navBarH = screenH - windowH - statusBarH;
  // Clamp: gesture-nav bar is usually 0–24dp, 3-button bar is ~48dp
  return Math.max(0, navBarH);
}
// ──────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const androidNavBarH = useAndroidNavBarHeight();
  const [activeTab, setActiveTab] = useState('accueil');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openOrderFormOnMount, setOpenOrderFormOnMount] = useState(false);
  const [gestionFilter, setGestionFilter] = useState(null);
  const [orderFormVisible, setOrderFormVisible] = useState(false);
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const isAnyModalVisible = localModalOpen || selectedOrder !== null;

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
          />
        );
      case 'historique':
        return <HistoryScreen onModalStateChange={setLocalModalOpen} />;
      case 'profile':
        return <ProfileScreen onModalStateChange={setLocalModalOpen} />;
      default:
        return (
          <DashboardScreen 
            onNavigate={(tab) => { setActiveTab(tab); setOrderFormVisible(false); }} 
            setSelectedOrder={setSelectedOrder}
            setGestionFilter={setGestionFilter}
            onModalStateChange={setLocalModalOpen}
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
          height: Platform.OS === 'ios'
            ? 88
            : 54 + androidNavBarH,          // 54dp icons + gesture nav bar space
          paddingBottom: Platform.OS === 'ios'
            ? 24
            : Math.max(8, androidNavBarH),  // at least 8dp, grows with nav bar
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

        {/* Center Plus Button (with smooth fade out when any modal is visible) */}
        <View 
          style={styles.centerTabItem}
          pointerEvents={isAnyModalVisible ? 'none' : 'auto'}
        >
          <MotiView
            animate={{ 
              opacity: isAnyModalVisible ? 0 : 1,
              scale: isAnyModalVisible ? 0.6 : 1,
              translateY: isAnyModalVisible ? 15 : 0
            }}
            transition={{ type: 'timing', duration: 300 }}
            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <TouchableOpacity 
              onPress={() => setOrderFormVisible(!orderFormVisible)}
              style={styles.scanButtonCircle}
              activeOpacity={0.85}
            >
              <MotiView
                animate={{ 
                  scale: orderFormVisible ? 1.05 : 1,
                  rotate: orderFormVisible ? '135deg' : '0deg'
                }}
                transition={{ type: 'timing', duration: 250 }}
              >
                <MaterialCommunityIcons name="plus" size={26} color="#ffffff" />
              </MotiView>
            </TouchableOpacity>
          </MotiView>
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
      <OrderFormModal visible={orderFormVisible} onClose={() => setOrderFormVisible(false)} />
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#002cf7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -12,
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
});
