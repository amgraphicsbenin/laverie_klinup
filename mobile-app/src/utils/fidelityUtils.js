/**
 * Utilitaires pour le système de Fidélité & Récompenses (Reward System) Klin UP
 * Design épuré, icônes solides vectorielles et intégration thème natif
 */

import React from 'react';
import { Award, ShieldCheck, Crown, Star, Gift, Tag, Truck, Shirt, Sparkles } from 'lucide-react-native';

export const FIDELITY_TIERS = {
  BRONZE: {
    key: 'BRONZE',
    name: 'Bronze',
    title: 'Client Bronze',
    iconName: 'Award',
    minPts: 0,
    maxPts: 49,
    nextTierKey: 'SILVER',
    nextTierName: 'Argent',
    nextTierPts: 50,
    color: '#d97706',
    bgLight: 'rgba(217, 119, 6, 0.10)',
    border: 'rgba(217, 119, 6, 0.25)',
    advantages: ['1 pt accumulé par tranche de 1 000 FCFA réglés']
  },
  SILVER: {
    key: 'SILVER',
    name: 'Argent',
    title: 'Client Argent',
    iconName: 'ShieldCheck',
    minPts: 50,
    maxPts: 149,
    nextTierKey: 'GOLD',
    nextTierName: 'Or',
    nextTierPts: 150,
    color: '#0284c7',
    bgLight: 'rgba(2, 132, 199, 0.10)',
    border: 'rgba(2, 132, 199, 0.25)',
    advantages: ['Remise 5% sur tous les abonnements', '1 pt / 1 000 FCFA']
  },
  GOLD: {
    key: 'GOLD',
    name: 'Or',
    title: 'Client Or',
    iconName: 'Star',
    minPts: 150,
    maxPts: 299,
    nextTierKey: 'PLATINUM',
    nextTierName: 'Platine VIP',
    nextTierPts: 300,
    color: '#ca8a04',
    bgLight: 'rgba(202, 138, 4, 0.10)',
    border: 'rgba(202, 138, 4, 0.25)',
    advantages: ['Remise 10% sur le pressing & abonnements', 'Traitement prioritaire']
  },
  PLATINUM: {
    key: 'PLATINUM',
    name: 'Platine VIP',
    title: 'Client VIP Platine',
    iconName: 'Crown',
    minPts: 300,
    maxPts: Infinity,
    nextTierKey: null,
    nextTierName: null,
    nextTierPts: null,
    color: '#7c3aed',
    bgLight: 'rgba(124, 58, 237, 0.10)',
    border: 'rgba(124, 58, 237, 0.25)',
    advantages: ['Remise VIP 15% permanente', 'Lavage gratuit / mois (100 pts offerts)', 'Traitement Express Prioritaire gratuit']
  }
};

const DEFAULT_REWARD_CATALOG = [
  { id: 'remise_1000', title: 'Remise de 1 000 FCFA', cost: 30, discountAmount: 1000, iconName: 'Tag', description: 'Réduction de 1 000 FCFA sur la prochaine commande.' },
  { id: 'lavage_offert', title: 'Lavage 1 Vêtement Offert', cost: 50, discountAmount: 2000, iconName: 'Shirt', description: 'Un lavage gratuit pour une pièce au choix.' },
  { id: 'livraison_offerte', title: 'Livraison Offerte', cost: 60, discountAmount: 1500, iconName: 'Truck', description: 'Frais de livraison 100% offerts.' },
  { id: 'repassage_offert', title: 'Repassage Offert', cost: 100, discountAmount: 4000, iconName: 'Sparkles', description: 'Repassage complet offert sur vos vêtements.' },
  { id: 'remise_5000', title: 'Remise 5 000 FCFA Abonnement', cost: 150, discountAmount: 5000, iconName: 'Gift', description: "Réduction de 5 000 FCFA lors du renouvellement d'abonnement." }
];

// Keep for backward compatibility (static fallback)
export const REWARD_CATALOG = DEFAULT_REWARD_CATALOG;

/**
 * Retourne le catalogue de récompenses dynamique depuis les données Supabase.
 * Les items de récompenses sont stockés dans la table catalog avec categorie='reward_catalog'.
 * Fallback sur le catalogue par défaut si aucune donnée Supabase n'est disponible.
 * @param {Array} catalogData - Le tableau memoryDb.catalog (passé par le composant)
 */
export function getRewardCatalog(catalogData = []) {
  const rewardItems = (catalogData || []).filter(item => item.categorie === 'reward_catalog');
  if (rewardItems.length > 0) {
    return rewardItems.map(item => ({
      id: item.id,
      title: item.article,
      cost: Number(item.prix),
      discountAmount: Number(item.discount_amount || 0),
      iconName: item.service || 'Gift',
      description: item.description || ''
    }));
  }
  return DEFAULT_REWARD_CATALOG;
}

export function getFidelityTier(points = 0) {
  const pts = Number(points) || 0;
  if (pts >= 300) {
    return {
      ...FIDELITY_TIERS.PLATINUM,
      currentPts: pts,
      ptsToNext: 0,
      progressPct: 100
    };
  }
  if (pts >= 150) {
    const min = 150;
    const max = 300;
    const ptsToNext = max - pts;
    const progressPct = Math.min(100, Math.max(0, Math.round(((pts - min) / (max - min)) * 100)));
    return {
      ...FIDELITY_TIERS.GOLD,
      currentPts: pts,
      ptsToNext,
      progressPct
    };
  }
  if (pts >= 50) {
    const min = 50;
    const max = 150;
    const ptsToNext = max - pts;
    const progressPct = Math.min(100, Math.max(0, Math.round(((pts - min) / (max - min)) * 100)));
    return {
      ...FIDELITY_TIERS.SILVER,
      currentPts: pts,
      ptsToNext,
      progressPct
    };
  }
  // Bronze
  const min = 0;
  const max = 50;
  const ptsToNext = max - pts;
  const progressPct = Math.min(100, Math.max(0, Math.round(((pts - min) / (max - min)) * 100)));
  return {
    ...FIDELITY_TIERS.BRONZE,
    currentPts: pts,
    ptsToNext,
    progressPct
  };
}

export function renderTierIcon(iconName, size = 18, color = '#002cf7') {
  switch (iconName) {
    case 'Crown':
      return <Crown size={size} color={color} />;
    case 'Star':
      return <Star size={size} color={color} fill={color} />;
    case 'ShieldCheck':
      return <ShieldCheck size={size} color={color} />;
    case 'Award':
    default:
      return <Award size={size} color={color} />;
  }
}

export function renderRewardIcon(iconName, size = 20, color = '#002cf7') {
  switch (iconName) {
    case 'Tag':
      return <Tag size={size} color={color} />;
    case 'Shirt':
      return <Shirt size={size} color={color} />;
    case 'Truck':
      return <Truck size={size} color={color} />;
    case 'Sparkles':
      return <Sparkles size={size} color={color} />;
    case 'Gift':
    default:
      return <Gift size={size} color={color} />;
  }
}
