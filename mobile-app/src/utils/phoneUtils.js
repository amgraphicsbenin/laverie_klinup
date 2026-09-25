import { isValidPhoneNumber } from 'libphonenumber-js';

export const SUPPORTED_COUNTRIES = [
  { name: 'Bénin', code: '229', iso: 'BJ', flag: '🇧🇯' },
  { name: 'Togo', code: '228', iso: 'TG', flag: '🇹🇬' },
  { name: "Côte d'Ivoire", code: '225', iso: 'CI', flag: '🇨🇮' },
  { name: 'Sénégal', code: '221', iso: 'SN', flag: '🇸🇳' },
  { name: 'Mali', code: '223', iso: 'ML', flag: '🇲🇱' },
  { name: 'Burkina Faso', code: '226', iso: 'BF', flag: '🇧🇫' },
  { name: 'Niger', code: '227', iso: 'NE', flag: '🇳🇪' },
  { name: 'Cameroun', code: '237', iso: 'CM', flag: '🇨🇲' },
  { name: 'Gabon', code: '241', iso: 'GA', flag: '🇬🇦' },
  { name: 'France', code: '33', iso: 'FR', flag: '🇫🇷' }
];

/**
 * Normalise un numéro de téléphone selon l'indicatif.
 * Au Bénin (+229), convertit automatiquement les anciens numéros à 8 chiffres en 10 chiffres (préfixe '01').
 * @param {string} phone Le numéro saisi
 * @param {string} indicatif L'indicatif du pays
 * @returns {string} Le numéro normalisé
 */
export const normalizePhoneNumber = (phone, indicatif = '229') => {
  if (!phone) return '';
  let cleanPhone = String(phone).replace(/\D/g, '');
  const cleanCode = String(indicatif || '229').replace(/\D/g, '');
  if (cleanCode === '229' && cleanPhone.length === 8) {
    cleanPhone = '01' + cleanPhone;
  }
  return cleanPhone;
};

/**
 * Valide un numéro de téléphone selon l'indicatif en utilisant libphonenumber-js.
 * Supporte automatiquement la saisie béninoise à 8 ou 10 chiffres.
 * @param {string} phone Le numéro de téléphone saisi
 * @param {string} indicatif L'indicatif du pays (ex: '229' ou '+229')
 * @returns {boolean} true si valide, false sinon
 */
export const validatePhoneNumber = (phone, indicatif) => {
  if (!phone) return false;
  
  try {
    // Nettoyage de l'indicatif
    let cleanCode = (indicatif || '229').trim();
    if (!cleanCode.startsWith('+')) {
      cleanCode = '+' + cleanCode;
    }
    
    // Nettoyage et normalisation du numéro de téléphone
    let cleanPhone = phone.replace(/\D/g, '');
    if ((cleanCode === '+229' || cleanCode === '229') && cleanPhone.length === 8) {
      cleanPhone = '01' + cleanPhone;
    }
    
    // On construit le format E.164 (ex: +2290197000000)
    const fullNumber = `${cleanCode}${cleanPhone}`;
    
    return isValidPhoneNumber(fullNumber);
  } catch (error) {
    return false;
  }
};

import { Linking } from 'react-native';

export const formatPhoneForWhatsApp = (phoneStr, indicatif = '229') => {
  if (!phoneStr) return '';
  let cleaned = String(phoneStr).replace(/\D/g, '');
  let cleanIndicatif = String(indicatif || '229').replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleanIndicatif !== '229') {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith(cleanIndicatif) && cleaned.length > cleanIndicatif.length + 5) {
    return cleaned;
  }
  return cleanIndicatif + cleaned;
};

export const sendWhatsAppMessage = (phone, text, indicatif = '229') => {
  if (!phone) return;
  const formattedPhone = formatPhoneForWhatsApp(phone, indicatif);
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  Linking.openURL(url).catch(err => console.warn("Impossible d'ouvrir WhatsApp :", err));
};

export const sendOrderCreatedWhatsAppNotification = (order, customer) => {
  if (!customer || !customer.telephone) return;

  const formattedDueDate = order.due_date ? new Date(order.due_date).toLocaleDateString('fr-FR') : 'N/A';
  const totalVal = Number(order.prix_total !== undefined ? order.prix_total : (order.total || 0));
  const avanceVal = Number(order.avance_payee !== undefined ? order.avance_payee : (order.avance || 0));
  const remainingVal = Math.max(0, totalVal - avanceVal);
  const orderCode = order.identifiant_unique_marquage || order.id || 'PRO-0';
  const itemsList = order.items || order.articles || [];
  const typeArticlesStr = order.type_article || (itemsList.map(a => `${a.quantite || a.quantity || 1}x ${a.article}`).join(', ')) || 'Articles divers';

  let text = '';
  if (order.is_subscription_order && order.subscription_details) {
    const det = order.subscription_details;
    if (det.immediate_subscription) {
      text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${orderCode} (${typeArticlesStr}) a bien été enregistrée chez Pressing Pro avec souscription immédiate au forfait ${det.immediate_subscription.name} (${Number(det.immediate_subscription.prix || 0).toLocaleString()} FCFA).\nArticles déposés: ${det.clothes_deducted} vêtements\nNouveau solde restant: ${det.new_balance} vêt.\nAcompte payé: ${avanceVal.toLocaleString()} FCFA\nReste à payer sur l'abonnement: ${remainingVal.toLocaleString()} FCFA\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
    } else {
      text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${orderCode} (${typeArticlesStr}) a bien été enregistrée chez Pressing Pro via votre forfait ${det.name}.\nArticles déposés: ${det.clothes_deducted} vêtements\nSolde précédent: ${det.previous_balance} vêt.\nNouveau solde restant: ${det.new_balance} vêt.\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
    }
  } else {
    text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${orderCode} (${typeArticlesStr}) a bien été enregistrée chez Pressing Pro.\nTotal: ${totalVal.toLocaleString()} FCFA\nAcompte payé: ${avanceVal.toLocaleString()} FCFA\nReste à payer: ${remainingVal.toLocaleString()} FCFA\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
  }

  sendWhatsAppMessage(customer.telephone, text, customer.indicatif || '229');
};

export const sendOrderStatusWhatsAppNotification = (order, customer, nextStatus) => {
  if (!customer || !customer.telephone) return;

  const normalizedStatus = (nextStatus || order.statut || '').toLowerCase();
  const orderCode = order.identifiant_unique_marquage || order.id || 'PRO-0';
  let text = '';

  if (normalizedStatus === 'pret') {
    text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${orderCode} est prête chez Pressing Pro ! Vous pouvez passer la récupérer ou contacter le service client pour la livraison. Merci pour votre confiance !`;
  } else if (normalizedStatus === 'restitue' || normalizedStatus === 'livre') {
    const isDelivery = order.subscription_details?.type_livraison === 'livraison' || order.mode_reglement === 'livraison';
    const actionLabel = isDelivery ? 'livrée' : 'récupérée';
    text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${orderCode} vous a été ${actionLabel} avec succès. Merci pour votre confiance et à bientôt chez Pressing Pro !`;
  }

  if (text) {
    sendWhatsAppMessage(customer.telephone, text, customer.indicatif || '229');
  }
};
