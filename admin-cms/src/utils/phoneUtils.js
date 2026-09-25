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
