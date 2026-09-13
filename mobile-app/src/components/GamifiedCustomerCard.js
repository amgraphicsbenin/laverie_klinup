import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, ShoppingBag, ShieldCheck, Sparkles, Plus } from 'lucide-react-native';

export const GamifiedCustomerCard = ({
  rank = 1,
  name = 'Jean Dona',
  initials = 'JD',
  points = 32,
  tier = 'Bronze',
  ordersCount = 9,
  progressPercent = 65,
  photoUrl,
  isDarkMode = false,
  width = 270,
  showExpandButton = false,
  onPress,
  style,
}) => {
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={[
        styles.cardContainer,
        width ? { width } : null,
        isDarkMode && styles.cardContainerDark,
        style,
      ]}
    >
      {/* Bannière supérieure dorée */}
      <LinearGradient
        colors={['#FDE68A', '#FEF3C7', '#FFFBEB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.topRow}>
          {/* Badge Rang / Médaille */}
          <View style={styles.medalContainer}>
            {/* Rubans violets */}
            <View style={[styles.ribbon, styles.ribbonLeft]} />
            <View style={[styles.ribbon, styles.ribbonRight]} />
            
            {/* Médaillon central */}
            <LinearGradient
              colors={['#F59E0B', '#FBBF24']}
              style={styles.medalCircle}
            >
              <Text style={styles.medalText}>#{rank}</Text>
            </LinearGradient>
          </View>

          {/* Badge Points */}
          <LinearGradient
            colors={['#F59E0B', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pointsBadge}
          >
            <Sparkles size={13} color="#FFFFFF" />
            <Text style={styles.pointsText}>{points} Pts</Text>
          </LinearGradient>
        </View>

        {/* Avatar chevauchant */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarOuterRing}>
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.avatarInner}
            >
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>

      {/* Contenu inférieur */}
      <View style={[styles.bodyContent, isDarkMode && styles.bodyContentDark]}>
        <View style={styles.nameHeaderRow}>
          <Text style={[styles.clientName, isDarkMode && styles.clientNameDark]} numberOfLines={1}>
            {name}
          </Text>
          {showExpandButton && (
            <View style={[styles.expandBtn, isDarkMode && styles.expandBtnDark]}>
              <Plus size={11} color={isDarkMode ? '#FDE68A' : '#78350F'} />
            </View>
          )}
        </View>

        {/* Badges d'information */}
        <View style={styles.statsRow}>
          <View style={[styles.chip, styles.tierChip, isDarkMode && styles.tierChipDark]}>
            <Award size={14} color="#B45309" />
            <Text style={styles.tierText}>{tier}</Text>
          </View>

          <View style={[styles.chip, styles.orderChip, isDarkMode && styles.orderChipDark]}>
            <ShoppingBag size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            <Text style={[styles.orderText, isDarkMode && styles.orderTextDark]}>
              {String(ordersCount).padStart(2, '0')} Commande{ordersCount > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Barre de progression fidélité */}
        <View style={styles.progressSection}>
          <View style={[styles.progressBarBackground, isDarkMode && styles.progressBarBackgroundDark]}>
            <LinearGradient
              colors={['#B45309', '#F59E0B', '#FBBF24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${clampedProgress}%` }]}
            />
          </View>

          {/* Écusson cible */}
          <View style={[styles.shieldWrapper, isDarkMode && styles.shieldWrapperDark]}>
            <ShieldCheck size={16} color="#B45309" />
          </View>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FDE68A',
    overflow: 'hidden',
  },
  cardContainerDark: {
    backgroundColor: '#18181b',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  headerBanner: {
    height: 95,
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbon: {
    position: 'absolute',
    top: -3,
    width: 7,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
  ribbonLeft: {
    left: 4,
    transform: [{ rotate: '-16deg' }],
  },
  ribbonRight: {
    right: 4,
    transform: [{ rotate: '16deg' }],
  },
  medalCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  medalText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pointsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -32,
    zIndex: 10,
  },
  avatarOuterRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#FBBF24',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  bodyContent: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bodyContentDark: {
    backgroundColor: '#18181b',
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
    maxWidth: '100%',
  },
  expandBtn: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtnDark: {
    backgroundColor: 'rgba(254, 243, 199, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  clientNameDark: {
    color: '#F8FAFC',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tierChip: {
    backgroundColor: '#FEF3C7',
  },
  tierChipDark: {
    backgroundColor: 'rgba(254, 243, 199, 0.15)',
  },
  tierText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 12,
  },
  orderChip: {
    backgroundColor: '#F1F5F9',
  },
  orderChipDark: {
    backgroundColor: '#27272a',
  },
  orderText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 12,
  },
  orderTextDark: {
    color: '#94A3B8',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 9,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarBackgroundDark: {
    backgroundColor: '#27272a',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  shieldWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldWrapperDark: {
    backgroundColor: 'rgba(254, 243, 199, 0.18)',
  },
});

export default GamifiedCustomerCard;
