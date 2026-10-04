/**
 * @file OrderStatusAction.js
 * @description Composant unifié pour les boutons d'action de statut d'une commande.
 * Gère de manière cohérente :
 * 1. Les commandes saisies par livreur en attente de validation caisse (Modifier + Valider)
 * 2. L'aiguillage au statut Prêt (Lancer la livraison vs Remettre au client)
 * 3. La transition séquentielle de statut standard (SlideActionButton avec spinner natif et haptique)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  CheckCircle,
  Truck,
  UserCheck,
  Edit3,
  Clock,
  Sparkles,
  Wind,
  Shirt,
  ShoppingBag,
  ChevronRight
} from 'lucide-react-native';
import { SlideActionButton } from '../../../components/motion/slide-action-button';
import { t } from '../../../services/i18n';

/**
 * Détermine si la transition d'un statut vers un autre est autorisée pour le rôle de l'utilisateur.
 */
export function isTransitionAllowed(status, targetStatus, currentUser) {
  if (!currentUser) return false;
  const role = currentUser.role;
  if (role === 'super_admin' || role === 'manager') return true;

  const s = String(status || '').trim().toLowerCase();

  if (role === 'agent_lavage_repassage') {
    const allowed = [
      'en_attente', 'attente', 'pending',
      'traitement', 'en_traitement', 'processing', 'in_treatment',
      'en_cours_lavage', 'lavage_cours', 'washing', 'lave', 'lavé',
      'en_cours_repassage', 'repassage_cours', 'ironing',
      'retard', 'en_retard', 'late'
    ];
    return allowed.includes(s) && (
      targetStatus === 'traitement' ||
      targetStatus === 'en_cours_lavage' ||
      targetStatus === 'en_cours_repassage' ||
      targetStatus === 'pret'
    );
  }

  if (role === 'agent_accueil') {
    const isValidation = ['en_attente_validation', 'attente_validation'].includes(s);
    const isPret = ['pret', 'prêt', 'ready', 'pret_a_livrer'].includes(s);
    const isAttente = ['retard', 'en_retard', 'late', 'en_attente', 'attente', 'pending'].includes(s);
    return (
      (isValidation && (targetStatus === 'en_attente' || targetStatus === 'traitement')) ||
      (isPret && (targetStatus === 'a_livrer' || targetStatus === 'a_recuperer' || targetStatus === 'restitue' || targetStatus === 'livre')) ||
      (s === 'a_recuperer' && (targetStatus === 'restitue' || targetStatus === 'livre')) ||
      (isAttente && targetStatus === 'traitement')
    );
  }

  if (role === 'livreur') {
    const isEnLivraison = ['en_cours_livraison', 'en_cours_de_livraison', 'in_delivery', 'delivering', 'livraison'].includes(s);
    return (
      (s === 'a_livrer' && targetStatus === 'en_cours_livraison') ||
      (isEnLivraison && (targetStatus === 'restitue' || targetStatus === 'livre')) ||
      ((s === 'retard' || s === 'en_retard' || s === 'late') && (targetStatus === 'en_cours_livraison' || targetStatus === 'restitue' || targetStatus === 'livre'))
    );
  }

  return false;
}

/**
 * Retourne le style visuel et les libellés correspondant au prochain statut.
 */
export function getNextStatusStyle(currentStatus) {
  const s = String(currentStatus || '').trim().toLowerCase();
  switch (s) {
    case 'en_attente_validation':
    case 'attente_validation':
      return {
        bg: '#059669',
        text: '#ffffff',
        label: 'Valider la commande (Caisse)',
        completeLabel: 'Commande validée',
        loadingText: 'Validation caisse...',
      };
    case 'attente':
    case 'en_attente':
    case 'pending':
    case 'retard':
    case 'en_retard':
    case 'late':
      return {
        bg: '#7c3aed',
        text: '#ffffff',
        label: t('orders.passer_traitement', {}, 'Passer au traitement'),
        completeLabel: 'En traitement',
        loadingText: 'Traitement en cours...',
      };
    case 'traitement':
    case 'en_traitement':
    case 'processing':
    case 'in_treatment':
      return {
        bg: '#002cf7',
        text: '#ffffff',
        label: t('orders.lancer_lavage', {}, 'Lancer le lavage'),
        completeLabel: 'Lavage lancé',
        loadingText: 'Lancement du lavage...',
        indeterminateText: 'Lavage en cours...',
        completionLabel: 'Toucher pour repasser',
        transitionsToIndeterminate: true,
        persistIntermediate: true,
      };
    case 'lavage_cours':
    case 'en_cours_lavage':
    case 'washing':
    case 'lave':
    case 'lavé':
      return {
        bg: '#0d9488',
        text: '#ffffff',
        label: t('orders.passer_repassage', {}, 'Passer au repassage'),
        completeLabel: 'En repassage',
        loadingText: 'Passage au repassage...',
        indeterminateText: 'Lavage en cours...',
        completionLabel: 'Toucher pour repasser',
        persistIntermediate: true,
      };
    case 'repassage_cours':
    case 'en_cours_repassage':
    case 'ironing':
      return {
        bg: '#059669',
        text: '#ffffff',
        label: t('orders.statut_pret', {}, 'Marquer comme prêt'),
        completeLabel: 'Commande prête',
        loadingText: 'Validation...',
        indeterminateText: 'Repassage en cours...',
        completionLabel: 'Toucher pour finaliser',
        persistIntermediate: true,
      };
    case 'pret':
    case 'prêt':
    case 'ready':
    case 'pret_a_livrer':
      return {
        bg: '#2563eb',
        text: '#ffffff',
        label: t('orders.statut_livraison', {}, 'Lancer la livraison'),
        completeLabel: 'En livraison',
        loadingText: 'Préparation...',
        indeterminateText: 'Livraison en cours...',
        completionLabel: 'Toucher pour valider la remise',
        transitionsToIndeterminate: true,
        persistIntermediate: true,
      };
    case 'a_livrer':
      return {
        bg: '#2563eb',
        text: '#ffffff',
        label: 'Démarrer la livraison',
        completeLabel: 'Livraison démarrée',
        loadingText: 'Démarrage...',
        indeterminateText: 'Livraison en cours...',
        completionLabel: 'Toucher pour valider la remise',
        transitionsToIndeterminate: true,
        persistIntermediate: true,
      };
    case 'en_cours_livraison':
    case 'en_cours_de_livraison':
    case 'in_delivery':
    case 'delivering':
    case 'livraison':
      return {
        bg: '#059669',
        text: '#ffffff',
        label: 'Confirmer la livraison',
        completeLabel: 'Commande livrée',
        loadingText: 'Confirmation...',
        indeterminateText: 'Livraison en cours...',
        completionLabel: 'Toucher pour valider la remise',
        persistIntermediate: true,
      };
    case 'a_recuperer':
      return {
        bg: '#059669',
        text: '#ffffff',
        label: 'Remettre au client',
        completeLabel: 'Commande remise',
        loadingText: 'Validation retrait...',
      };
    case 'restitue':
    case 'restitué':
    case 'livre':
    case 'livré':
    case 'delivered':
      return {
        bg: '#10b981',
        text: '#ffffff',
        label: 'Commande terminée',
        completeLabel: 'Terminée',
        loadingText: 'Clôture...',
      };
    default:
      return {
        bg: '#002cf7',
        text: '#ffffff',
        label: 'Mettre à jour le statut',
        completeLabel: 'Mis à jour',
        loadingText: 'Mise à jour...',
      };
  }
}

/**
 * Retourne l'icône associée au statut suivant.
 */
export function getNextStatusIcon(status, iconSize = 16) {
  const iconS = String(status || '').trim().toLowerCase();
  if (iconS === 'en_attente_validation' || iconS === 'attente_validation') {
    return <CheckCircle size={iconSize} color="#ffffff" />;
  }
  if (iconS === 'attente' || iconS === 'en_attente' || iconS === 'pending' || iconS === 'retard' || iconS === 'en_retard' || iconS === 'late') {
    return <Sparkles size={iconSize} color="#ffffff" />;
  }
  if (iconS === 'traitement' || iconS === 'en_traitement' || iconS === 'processing' || iconS === 'in_treatment') {
    return <Wind size={iconSize} color="#ffffff" />;
  }
  if (iconS === 'lavage_cours' || iconS === 'en_cours_lavage' || iconS === 'washing' || iconS === 'lave' || iconS === 'lavé') {
    return <Shirt size={iconSize} color="#ffffff" />;
  }
  if (iconS === 'repassage_cours' || iconS === 'en_cours_repassage' || iconS === 'ironing') {
    return <CheckCircle size={iconSize} color="#ffffff" />;
  }
  if (iconS === 'pret' || iconS === 'prêt' || iconS === 'ready' || iconS === 'pret_a_livrer' || iconS === 'a_livrer') {
    return <Truck size={iconSize} color="#ffffff" />;
  }
  if (iconS === 'en_cours_livraison' || iconS === 'en_cours_de_livraison' || iconS === 'in_delivery' || iconS === 'delivering' || iconS === 'livraison') {
    return <ShoppingBag size={iconSize} color="#ffffff" />;
  }
  if (iconS === 'a_recuperer') {
    return <UserCheck size={iconSize} color="#ffffff" />;
  }
  return <ChevronRight size={iconSize} color="#ffffff" strokeWidth={2.6} />;
}

/**
 * Calcule le statut cible séquentiel selon le cycle de vie standard.
 */
export function getTargetStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'en_attente_validation' || s === 'attente_validation') return 'en_attente';
  if (s === 'attente' || s === 'en_attente' || s === 'pending') return 'traitement';
  if (s === 'traitement' || s === 'en_traitement' || s === 'processing' || s === 'in_treatment') return 'en_cours_lavage';
  if (s === 'lavage_cours' || s === 'en_cours_lavage' || s === 'washing' || s === 'lave' || s === 'lavé') return 'en_cours_repassage';
  if (s === 'repassage_cours' || s === 'en_cours_repassage' || s === 'ironing') return 'pret';
  if (s === 'pret' || s === 'prêt' || s === 'ready' || s === 'pret_a_livrer') return 'a_livrer';
  if (s === 'a_livrer') return 'en_cours_livraison';
  if (s === 'en_cours_livraison' || s === 'en_cours_de_livraison' || s === 'in_delivery' || s === 'delivering' || s === 'livraison') return 'restitue';
  if (s === 'a_recuperer') return 'restitue';
  if (s === 'retard' || s === 'en_retard' || s === 'late') return 'traitement';
  return 'traitement';
}

export default function OrderStatusAction({
  order,
  currentUser,
  isDarkMode = false,
  buttonHeight = 42,
  keyPrefix = 'btn',
  onAdvanceStatus,
  onEditOrder,
  onValidateOrder,
  containerStyle
}) {
  if (!order) return null;

  const status = String(order.statut || '').trim().toLowerCase();

  // CAS 1 : COMMANDE SAISIE PAR UN LIVREUR EN ATTENTE DE VALIDATION CAISSE
  if (status === 'en_attente_validation' || status === 'attente_validation' || (order.cree_par_livreur && !order.validee_par_caisse)) {
    const canValidate = currentUser && currentUser.role !== 'livreur' && currentUser.role !== 'agent_lavage_repassage';

    return (
      <View style={[styles.container, containerStyle]}>
        {canValidate ? (
          <>
            <TouchableOpacity
              onPress={(e) => {
                if (e?.stopPropagation) e.stopPropagation();
                if (onEditOrder) onEditOrder(order);
              }}
              style={[
                styles.editBtn,
                {
                  backgroundColor: isDarkMode ? 'rgba(0, 44, 247, 0.12)' : '#eff6ff',
                  borderColor: isDarkMode ? 'rgba(0, 44, 247, 0.35)' : '#bfdbfe',
                }
              ]}
              activeOpacity={0.8}
            >
              <Edit3 size={15} color="#002cf7" strokeWidth={2.2} />
              <Text style={styles.editBtnText}>
                MODIFIER LA COMMANDE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                if (e?.stopPropagation) e.stopPropagation();
                if (onValidateOrder) onValidateOrder(order);
              }}
              style={styles.validateBtn}
              activeOpacity={0.85}
            >
              <CheckCircle size={16} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.validateBtnText}>
                VALIDER LA COMMANDE
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={[
            styles.waitingBox,
            {
              backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
              borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.35)' : '#ddd6fe',
            }
          ]}>
            <Clock size={13} color="#7c3aed" />
            <Text style={[styles.waitingText, { color: isDarkMode ? '#c4b5fd' : '#6d28d9' }]}>
              En attente de validation par la caisse
            </Text>
          </View>
        )}
      </View>
    );
  }

  // CAS 2 : STATUT « PRÊT » (DOUBLE BOUTON LIVRAISON OU RETRAIT COMPTOIR)
  if (status === 'pret' || status === 'pret_a_livrer' || status === 'ready' || status === 'prêt') {
    const canLivrer = isTransitionAllowed('pret', 'a_livrer', currentUser);
    const canRecuperer = isTransitionAllowed('pret', 'restitue', currentUser) || isTransitionAllowed('pret', 'a_recuperer', currentUser);

    return (
      <View style={[styles.container, containerStyle]}>
        {canLivrer && (
          <SlideActionButton
            color="#4f46e5"
            isDarkMode={isDarkMode}
            disabled={!canLivrer}
            height={buttonHeight}
            minLoadingDuration={250}
            icon={<Truck size={16} color="#ffffff" />}
            loadingText="Préparation livraison..."
            completeLabel="Prêt pour livraison"
            onComplete={() => onAdvanceStatus && onAdvanceStatus(order, 'a_livrer')}
          >
            Lancer la livraison
          </SlideActionButton>
        )}
        {canRecuperer && (
          <SlideActionButton
            color="#d97706"
            isDarkMode={isDarkMode}
            disabled={!canRecuperer}
            height={buttonHeight}
            minLoadingDuration={250}
            icon={<UserCheck size={16} color="#ffffff" />}
            loadingText="Validation retrait..."
            completeLabel="Remis au client"
            onComplete={() => onAdvanceStatus && onAdvanceStatus(order, 'restitue')}
          >
            Remettre au client
          </SlideActionButton>
        )}
      </View>
    );
  }

  // CAS 3 : STATUT STANDARD DU CYCLE DE PRODUCTION
  const targetStatus = getTargetStatus(status);
  if (!targetStatus) return null;

  const canTransition = isTransitionAllowed(status, targetStatus, currentUser);
  const nextStyle = getNextStatusStyle(order.statut);
  if (!nextStyle) return null;

  const isIntermediate = [
    'en_cours_lavage',
    'lavage_cours',
    'washing',
    'en_cours_repassage',
    'repassage_cours',
    'ironing',
    'en_cours_livraison',
    'en_cours_de_livraison',
    'in_delivery',
    'delivering',
    'livraison',
  ].includes(status);

  return (
    <View style={[styles.singleButtonContainer, containerStyle]}>
      <SlideActionButton
        key={`${keyPrefix}-${order.id}`}
        state={isIntermediate ? 'indeterminate' : undefined}
        transitionsToIndeterminate={nextStyle.transitionsToIndeterminate}
        persistIntermediate={nextStyle.persistIntermediate}
        indeterminateText={nextStyle.indeterminateText}
        completionLabel={nextStyle.completionLabel}
        color={canTransition ? nextStyle.bg : '#94a3b8'}
        isDarkMode={isDarkMode}
        disabled={!canTransition}
        height={buttonHeight}
        minLoadingDuration={250}
        icon={getNextStatusIcon(order.statut)}
        loadingText={nextStyle.loadingText}
        completeLabel={nextStyle.completeLabel}
        onComplete={() => onAdvanceStatus && onAdvanceStatus(order, targetStatus)}
        onHumanComplete={() => onAdvanceStatus && onAdvanceStatus(order, targetStatus)}
      >
        {nextStyle.label}
      </SlideActionButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 6,
    marginHorizontal: 2,
  },
  singleButtonContainer: {
    marginHorizontal: 2,
    marginTop: 6,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  editBtnText: {
    color: '#002cf7',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  validateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  validateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
