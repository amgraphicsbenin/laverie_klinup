import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Mail, ChevronLeft, Lock } from 'lucide-react-native';
import { db } from '../services/db';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);

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
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>

            <View style={styles.avatarContainer}>
              <View style={[
                styles.avatar,
                {
                  backgroundColor: selectedUser.role === 'super_admin' ? '#3b82f6' :
                                   selectedUser.role === 'manager' ? '#8b5cf6' : '#10b981'
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
    backgroundColor: '#f9fafc',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#52525b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#52525b',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#18181b',
    height: '100%',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 13,
    color: '#71717a',
    marginLeft: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
    textAlign: 'center',
  },
  userRole: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  pinTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 6,
  },
  pinSubtitle: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  pinContainer: {
    alignItems: 'center',
    position: 'relative',
    height: 50,
    marginBottom: 10,
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
    width: 40,
    height: 45,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 8,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  pinDotFilled: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  pinDotError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  dotText: {
    fontSize: 20,
    color: '#18181b',
  },
  shakeAnimation: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 8,
  },
});
