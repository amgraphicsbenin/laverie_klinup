import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, BackHandler } from 'react-native';
import { Mail, ChevronLeft, Lock } from 'lucide-react-native';
import { db } from '../services/db';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Android back button/gesture to go back to email input screen
  useEffect(() => {
    if (Platform.OS === 'web' || !selectedUser) return;

    const backAction = () => {
      setSelectedUser(null);
      setPin('');
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectedUser]);

  const handleEmailSubmit = () => {
    if (!email) return;
    setLoading(true);
    // Simulate lookup in local staff list
    setTimeout(() => {
      const staffList = db.getStaff();
      const found = staffList.find(s => s.email.toLowerCase().trim() === email.toLowerCase().trim());
      setLoading(false);
      if (found) {
        setSelectedUser(found);
      } else {
        alert("Email introuvable. Veuillez vérifier vos identifiants.");
      }
    }, 500);
  };

  const handlePinInput = (val) => {
    // Only numeric digits
    const cleaned = val.replace(/[^0-9]/g, '');
    setPin(cleaned);

    if (cleaned.length === 6 && selectedUser) {
      if (selectedUser.code_pin === cleaned) {
        db.setCurrentUser(selectedUser);
        setSelectedUser(null);
        setPin('');
      } else {
        setPinError(true);
        setTimeout(() => {
          setPin('');
          setPinError(false);
        }, 800);
      }
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Administrateur';
      case 'manager': return 'Gestionnaire';
      case 'livreur': return 'Livreur';
      case 'agent_lavage_repassage': return 'Atelier Lavage & Repassage';
      default: return "Agent d'accueil";
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        {!selectedUser ? (
          // ECRAN 1 : SAISIE EMAIL
          <View>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={styles.title}>Connexion KLIN UP</Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour accéder à la plateforme de caisse & atelier.
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={16} color="#71717a" style={styles.inputIcon} />
                <TextInput
                  placeholder="Entrez votre adresse email"
                  placeholderTextColor="#a1a1aa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleEmailSubmit}
              disabled={loading}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // ECRAN 2 : SAISIE DU CODE PIN
          <View>
            <TouchableOpacity 
              onPress={() => { setSelectedUser(null); setPin(''); }}
              style={styles.backButton}
            >
              <ChevronLeft size={20} color="#71717a" />
            </TouchableOpacity>

            <View style={styles.avatarContainer}>
              <View style={[
                styles.avatar,
                {
                  backgroundColor: selectedUser.role === 'super_admin' ? '#2563eb' :
                                   selectedUser.role === 'manager' ? '#7c3aed' : '#059669'
                }
              ]}>
                <Text style={styles.avatarText}>
                  {selectedUser.prenom[0].toUpperCase()}{selectedUser.nom[0].toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.userName}>{selectedUser.prenom} {selectedUser.nom}</Text>
            <Text style={styles.userRole}>{getRoleLabel(selectedUser.role)}</Text>

            <Text style={styles.pinTitle}>Vérifiez votre identité</Text>
            <Text style={styles.pinSubtitle}>
              Entrez votre code PIN à 6 chiffres pour accéder à l'espace de travail.
            </Text>

            <View style={styles.pinContainer}>
              <TextInput
                keyboardType="numeric"
                maxLength={6}
                value={pin}
                onChangeText={handlePinInput}
                secureTextEntry
                style={styles.hiddenPinInput}
                autoFocus
              />
              
              <View style={[styles.pinDotsRow, pinError && styles.shakeAnimation]}>
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const hasDigit = pin.length > idx;
                  return (
                    <View 
                      key={idx} 
                      style={[
                        styles.pinDot,
                        hasDigit && styles.pinDotFilled,
                        pinError && styles.pinDotError
                      ]}
                    >
                      {hasDigit && <Text style={styles.dotText}>•</Text>}
                    </View>
                  );
                })}
              </View>
            </View>

            {pinError && (
              <Text style={styles.errorText}>Code PIN incorrect. Veuillez réessayer.</Text>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 28,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.08)',
  },
  logo: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    height: '100%',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  userRole: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
    fontWeight: '500',
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  pinSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  pinContainer: {
    alignItems: 'center',
    position: 'relative',
    height: 52,
    marginBottom: 16,
  },
  hiddenPinInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    zIndex: 2,
  },
  pinDotsRow: {
    flexDirection: 'row',
    zIndex: 1,
  },
  pinDot: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  pinDotFilled: {
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.04)',
  },
  pinDotError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  dotText: {
    fontSize: 24,
    color: '#2563eb',
  },
  shakeAnimation: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});
