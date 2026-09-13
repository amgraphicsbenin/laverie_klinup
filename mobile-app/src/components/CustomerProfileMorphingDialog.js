"use client";
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogDescription,
  useMorphingDialog,
} from './motion/morphing-dialog';
import GamifiedCustomerCard from './GamifiedCustomerCard';

export function CustomerProfileMorphingDialog({
  client,
  rank = 1,
  tier = 'Bronze',
  tierObj,
  ordersCount = 0,
  totalSpent = 0,
  photoUrl,
  initials = 'CL',
  fullName = 'Client',
  progressPercent = 65,
  isDarkMode = false,
  cardWidth = 260,
  onOpenFullSheet,
}) {
  if (!client) return null;

  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        bounce: 0.05,
        duration: 0.25,
        damping: 18,
        stiffness: 200,
      }}
      isDarkMode={isDarkMode}
    >
      {/* Trigger: La carte client gamifiée */}
      <MorphingDialogTrigger>
        <GamifiedCustomerCard
          rank={rank}
          name={fullName}
          initials={initials}
          points={client.points_fidelite || 0}
          tier={tier}
          ordersCount={ordersCount}
          progressPercent={progressPercent}
          photoUrl={photoUrl}
          isDarkMode={isDarkMode}
          width={cardWidth}
          showExpandButton={true}
        />
      </MorphingDialogTrigger>

      {/* Container: Overlay fluide on-screen */}
      <MorphingDialogContainer>
        <MorphingDialogContent style={styles.dialogCard}>
          <DialogInnerBody
            client={client}
            rank={rank}
            tier={tier}
            tierObj={tierObj}
            ordersCount={ordersCount}
            totalSpent={totalSpent}
            photoUrl={photoUrl}
            initials={initials}
            fullName={fullName}
            progressPercent={progressPercent}
            isDarkMode={isDarkMode}
            onOpenFullSheet={onOpenFullSheet}
          />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}

function DialogInnerBody({
  client,
  rank,
  tier,
  tierObj,
  ordersCount,
  totalSpent,
  photoUrl,
  initials,
  fullName,
  progressPercent,
  isDarkMode,
  onOpenFullSheet,
}) {
  const { closeDialog } = useMorphingDialog('DialogInnerBody');
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);

  const formatPrice = (p) => {
    const num = Number(p || 0);
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  const handleCall = () => {
    if (client.telephone) {
      Linking.openURL(`tel:${client.telephone}`).catch((e) => {
        console.warn('Cannot open telephone url:', e);
      });
    }
  };

  const hasDebt = (client.solde_dette || 0) > 0;

  return (
    <View style={[styles.cardWrapper, isDarkMode && styles.cardWrapperDark]}>
      {/* Bouton Fermer flottant en haut à droite */}
      <MorphingDialogClose style={styles.closeBtn} />

      {/* Bannière dorée supérieure */}
      <LinearGradient
        colors={['#FDE68A', '#FEF3C7', '#FFFBEB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.topRow}>
          {/* Badge Rang / Médaille */}
          <View style={styles.medalContainer}>
            <View style={[styles.ribbon, styles.ribbonLeft]} />
            <View style={[styles.ribbon, styles.ribbonRight]} />
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
            <Text style={styles.pointsText}>{client.points_fidelite || 0} Pts</Text>
          </LinearGradient>
        </View>

        {/* Grand Avatar chevauchant */}
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

      {/* Contenu Déroulant */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Identité & Palier */}
        <View style={styles.identitySection}>
          <MorphingDialogTitle
            style={[styles.dialogTitle, isDarkMode && styles.dialogTitleDark]}
            numberOfLines={1}
          >
            {fullName}
          </MorphingDialogTitle>

          <View style={styles.tierBadgeRow}>
            <View style={[styles.tierChip, isDarkMode && styles.tierChipDark]}>
              <Award size={14} color="#B45309" />
              <MorphingDialogSubtitle style={styles.tierText}>
                {tier}
              </MorphingDialogSubtitle>
            </View>

            {client.abonnement_actif ? (
              <View style={[styles.subChip, isDarkMode && styles.subChipDark]}>
                <CheckCircle2 size={13} color="#059669" />
                <Text style={styles.subText}>Abonné</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Détails animés */}
        <MorphingDialogDescription style={styles.detailsContainer}>
          {/* Bloc Coordonnées & Appel Direct */}
          {client.telephone ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCall}
              style={[styles.contactCard, isDarkMode && styles.contactCardDark]}
            >
              <View style={styles.contactIconBox}>
                <Phone size={16} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.contactLabel, isDarkMode && styles.contactLabelDark]}>
                  Téléphone (Appel direct)
                </Text>
                <Text style={[styles.contactValue, isDarkMode && styles.contactValueDark]}>
                  {client.telephone}
                </Text>
              </View>
              <View style={styles.callPill}>
                <Text style={styles.callPillText}>Appeler</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {client.adresse ? (
            <View style={[styles.contactCard, isDarkMode && styles.contactCardDark, { marginTop: 8 }]}>
              <View style={[styles.contactIconBox, { backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9' }]}>
                <MapPin size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.contactLabel, isDarkMode && styles.contactLabelDark]}>
                  Adresse
                </Text>
                <Text style={[styles.contactValue, isDarkMode && styles.contactValueDark]} numberOfLines={2}>
                  {client.adresse}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Grille de Métriques (2 x 2) */}
          <View style={styles.metricsGrid}>
            {/* Commandes */}
            <View style={[styles.metricCard, isDarkMode && styles.metricCardDark]}>
              <View style={styles.metricIconRow}>
                <ShoppingBag size={15} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                <Text style={[styles.metricLabel, isDarkMode && styles.metricLabelDark]}>Commandes</Text>
              </View>
              <Text style={[styles.metricNumber, isDarkMode && styles.metricNumberDark]}>
                {ordersCount}
              </Text>
            </View>

            {/* Total Dépensé */}
            <View style={[styles.metricCard, isDarkMode && styles.metricCardDark]}>
              <View style={styles.metricIconRow}>
                <CreditCard size={15} color={isDarkMode ? '#FBBF24' : '#D97706'} />
                <Text style={[styles.metricLabel, isDarkMode && styles.metricLabelDark]}>Dépensé</Text>
              </View>
              <Text style={[styles.metricNumber, isDarkMode && styles.metricNumberDark]} numberOfLines={1}>
                {formatPrice(totalSpent)}
              </Text>
            </View>

            {/* Solde Dette */}
            <View style={[styles.metricCard, isDarkMode && styles.metricCardDark]}>
              <View style={styles.metricIconRow}>
                {hasDebt ? (
                  <AlertTriangle size={15} color="#EF4444" />
                ) : (
                  <ShieldCheck size={15} color="#10B981" />
                )}
                <Text style={[styles.metricLabel, isDarkMode && styles.metricLabelDark]}>Solde Dette</Text>
              </View>
              <Text
                style={[
                  styles.metricNumber,
                  { color: hasDebt ? '#EF4444' : '#10B981' },
                ]}
                numberOfLines={1}
              >
                {formatPrice(client.solde_dette || 0)}
              </Text>
            </View>

            {/* Date Création */}
            <View style={[styles.metricCard, isDarkMode && styles.metricCardDark]}>
              <View style={styles.metricIconRow}>
                <Calendar size={15} color={isDarkMode ? '#A855F7' : '#7C3AED'} />
                <Text style={[styles.metricLabel, isDarkMode && styles.metricLabelDark]}>Membre</Text>
              </View>
              <Text style={[styles.metricNumber, isDarkMode && styles.metricNumberDark]} numberOfLines={1}>
                {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : 'Récemment'}
              </Text>
            </View>
          </View>

          {/* Jauge Progression Fidélité */}
          <View style={[styles.progressBox, isDarkMode && styles.progressBoxDark]}>
            <View style={styles.progressHeaderRow}>
              <Text style={[styles.progressBoxTitle, isDarkMode && styles.progressBoxTitleDark]}>
                Progression Palier Fidélité
              </Text>
              <Text style={styles.progressBoxPct}>{clampedProgress}%</Text>
            </View>

            <View style={[styles.progressBarBackground, isDarkMode && styles.progressBarBackgroundDark]}>
              <LinearGradient
                colors={['#B45309', '#F59E0B', '#FBBF24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${clampedProgress}%` }]}
              />
            </View>

            <Text style={[styles.progressSubText, isDarkMode && styles.progressSubTextDark]}>
              {client.points_fidelite || 0} points fidélité acquis
              {tierObj?.nextTier ? ` • Prochain palier : ${tierObj.nextTier}` : ''}
            </Text>
          </View>

          {/* Boutons d'Action Inférieurs */}
          <View style={styles.actionButtonsCol}>
            {client.telephone ? (
              <TouchableOpacity
                style={styles.primaryCtaBtn}
                activeOpacity={0.85}
                onPress={handleCall}
              >
                <Phone size={16} color="#FFFFFF" />
                <Text style={styles.primaryCtaText}>Appeler le client</Text>
              </TouchableOpacity>
            ) : null}

            {onOpenFullSheet ? (
              <TouchableOpacity
                style={[styles.secondaryCtaBtn, isDarkMode && styles.secondaryCtaBtnDark]}
                activeOpacity={0.8}
                onPress={() => {
                  closeDialog();
                  setTimeout(() => {
                    onOpenFullSheet(client);
                  }, 120);
                }}
              >
                <Text style={[styles.secondaryCtaText, isDarkMode && styles.secondaryCtaTextDark]}>
                  Voir l'historique et la fiche complète
                </Text>
                <ChevronRight size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            ) : null}
          </View>
        </MorphingDialogDescription>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dialogCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
  },
  cardWrapperDark: {
    backgroundColor: '#18181b',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 100,
  },
  headerBanner: {
    height: 105,
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 36, // avoid overlapping close button
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
    bottom: -36,
    zIndex: 10,
  },
  avatarOuterRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FBBF24',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  scrollBody: {
    maxHeight: Dimensions.get('window').height * 0.74,
  },
  scrollContent: {
    paddingTop: 44,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  dialogTitleDark: {
    color: '#F8FAFC',
  },
  tierBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierChipDark: {
    backgroundColor: 'rgba(254, 243, 199, 0.15)',
  },
  tierText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 12,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subChipDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  subText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 11,
  },
  detailsContainer: {
    width: '100%',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  contactIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  contactLabelDark: {
    color: '#94A3B8',
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  contactValueDark: {
    color: '#F8FAFC',
  },
  callPill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  callPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  metricLabelDark: {
    color: '#94A3B8',
  },
  metricNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricNumberDark: {
    color: '#F8FAFC',
  },
  progressBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  progressBoxDark: {
    backgroundColor: 'rgba(254, 243, 199, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  progressBoxTitleDark: {
    color: '#FDE68A',
  },
  progressBoxPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarBackgroundDark: {
    backgroundColor: '#27272a',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressSubText: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '500',
    marginTop: 4,
  },
  progressSubTextDark: {
    color: '#D1D5DB',
  },
  actionButtonsCol: {
    marginTop: 16,
    gap: 8,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 14,
  },
  secondaryCtaBtnDark: {
    backgroundColor: '#27272a',
  },
  secondaryCtaText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 12,
  },
  secondaryCtaTextDark: {
    color: '#CBD5E1',
  },
});

export default CustomerProfileMorphingDialog;
