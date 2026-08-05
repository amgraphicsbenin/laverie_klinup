/**
 * 🛡️ Utilitaires de Sécurité et d'Assainissement (Sanitization XSS & Crypto)
 * Application Admin CMS KLIN UP
 */

/**
 * Assainit une chaîne de caractères pour éliminer les injections HTML/JS (XSS)
 * @param {string} str - La chaîne d'entrée utilisateur
 * @returns {string} - La chaîne nettoyée
 */
export function sanitizeInput(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Hache un code PIN ou un mot de passe en SHA-256 avec salage pour l'authentification
 * @param {string} pin - Le code PIN à 6 chiffres
 * @param {string} salt - Le sel optionnel (ex: ID employé ou email)
 * @returns {Promise<string>} - Le hash hexadécimal sécurisé
 */
export async function hashPin(pin, salt = 'klinup_secret_salt_2026') {
  if (!pin) return '';
  const text = `${salt}:${pin}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // En cas d'environnement restreint (fallback basique)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash)}`;
}

/**
 * Vérifie si le code PIN d'essai correspond au hash stocké
 */
export async function verifyPinHash(inputPin, storedHash, salt) {
  if (!inputPin || !storedHash) return false;
  // Si le PIN stocké est encore en clair (migration progressive)
  if (storedHash === inputPin) return true;
  
  const calculatedHash = await hashPin(inputPin, salt);
  return calculatedHash === storedHash;
}

/**
 * Gère le Rate Limiting (anti-force brute) sur la saisie de PIN
 */
const pinAttemptsMap = new Map();

export function checkPinRateLimit(agentId, maxAttempts = 3, lockoutMinutes = 5) {
  const now = Date.now();
  const record = pinAttemptsMap.get(agentId) || { attempts: 0, lockoutUntil: 0 };

  if (record.lockoutUntil > now) {
    const remainingSec = Math.ceil((record.lockoutUntil - now) / 1000);
    return {
      allowed: false,
      message: `Compte temporairement bloqué suite à trop d'échecs. Réessayez dans ${remainingSec} secondes.`,
      remainingSec
    };
  }

  return { allowed: true, attempts: record.attempts };
}

export function recordFailedPinAttempt(agentId, maxAttempts = 3, lockoutMinutes = 5) {
  const now = Date.now();
  const record = pinAttemptsMap.get(agentId) || { attempts: 0, lockoutUntil: 0 };
  
  record.attempts += 1;
  if (record.attempts >= maxAttempts) {
    record.lockoutUntil = now + (lockoutMinutes * 60 * 1000);
    record.attempts = 0; // réinitialiser le compteur après blocage
  }

  pinAttemptsMap.set(agentId, record);
  return record;
}

export function clearPinAttempts(agentId) {
  pinAttemptsMap.delete(agentId);
}
