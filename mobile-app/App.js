import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { Home, Layers, Receipt, User } from 'lucide-react-native';
import { initializeDatabase } from './src/services/db';
import { useDbState } from './src/hooks/useDbState';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GestionScreen from './src/screens/GestionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState('accueil');
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>KLIN UP</Text>
        <Text style={styles.loadingSubtext}>Initialisation de la base de données...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'accueil':
        return (
          <DashboardScreen 
            onNavigate={(tab) => setActiveTab(tab)}
            setSelectedOrder={setSelectedOrder}
          />
        );
      case 'gestion':
        return (
          <GestionScreen 
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
          />
        );
      case 'historique':
        return <HistoryScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen onNavigate={(tab) => setActiveTab(tab)} setSelectedOrder={setSelectedOrder} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderActiveScreen()}
      </View>

      {/* BOTTOM TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          onPress={() => setActiveTab('accueil')}
          style={[styles.tabItem, activeTab === 'accueil' && styles.tabItemActive]}
        >
          <Home size={20} color={activeTab === 'accueil' ? '#3b82f6' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'accueil' && styles.tabLabelActive]}>Accueil</Text>
        </TouchableOpacity>

        {currentUser.role !== 'agent_lavage_repassage' && (
          <TouchableOpacity 
            onPress={() => setActiveTab('gestion')}
            style={[styles.tabItem, activeTab === 'gestion' && styles.tabItemActive]}
          >
            <Layers size={20} color={activeTab === 'gestion' ? '#3b82f6' : '#71717a'} />
            <Text style={[styles.tabLabel, activeTab === 'gestion' && styles.tabLabelActive]}>Gestion</Text>
          </TouchableOpacity>
        )}

        {currentUser.role !== 'agent_lavage_repassage' && (
          <TouchableOpacity 
            onPress={() => setActiveTab('historique')}
            style={[styles.tabItem, activeTab === 'historique' && styles.tabItemActive]}
          >
            <Receipt size={20} color={activeTab === 'historique' ? '#3b82f6' : '#71717a'} />
            <Text style={[styles.tabLabel, activeTab === 'historique' && styles.tabLabelActive]}>Archives</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={() => setActiveTab('profile')}
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
        >
          <User size={20} color={activeTab === 'profile' ? '#3b82f6' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 16,
    letterSpacing: 2,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 6,
  },
  tabBar: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabItemActive: {
    // optional background highlight
  },
  tabLabel: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
