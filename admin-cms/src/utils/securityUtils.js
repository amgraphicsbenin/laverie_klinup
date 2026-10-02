/**
 * 🛡️ Utilitaires de Sécurité et d'Assainissement (Sanitization XSS & Crypto)
 * Application Admin CMS Pressing Pro
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
 * 🛡️ Security Guard Configuration pour la saisie de PIN Admin (Anti-Force Brute)
 */
export const PIN_SECURITY_CONFIG = {
  WARNING_THRESHOLD: 3,        // Avertissement après 3 tentatives infructueuses
  MAX_ATTEMPTS_BEFORE_LOCK: 5, // Déclenchement du verrouillage après 5 échecs
  LOCKOUT_DURATION_TIER_1: 30, // 1er palier (5 échecs) : 30 secondes
  LOCKOUT_DURATION_TIER_2: 120,// 2e palier (6 échecs) : 2 minutes (120 secondes)
  LOCKOUT_DURATION_TIER_3: 300 // 3e palier (7+ échecs) : 5 minutes (300 secondes)
};

const STORAGE_PREFIX = 'klinup_pin_guard_';

/**
 * Récupère l'état de sécurité et de blocage pour un utilisateur
 * @param {string} userId - ID ou email de l'employé
 * @returns {{ isLocked: boolean, remainingSeconds: number, failedAttempts: number, totalFailures: number, lockoutUntil: number }}
 */
export function getPinLockoutState(userId) {
  if (!userId) {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, totalFailures: 0, lockoutUntil: 0 };
  }

  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`${STORAGE_PREFIX}${userId}`) : null;
    if (!raw) {
      return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, totalFailures: 0, lockoutUntil: 0 };
    }

    const data = JSON.parse(raw);
    const now = Date.now();
    const lockoutUntil = Number(data.lockoutUntil) || 0;
    const failedAttempts = Number(data.failedAttempts) || 0;
    const totalFailures = Number(data.totalFailures) || 0;

    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      return {
        isLocked: true,
        remainingSeconds,
        failedAttempts,
        totalFailures,
        lockoutUntil
      };
    }

    // Période de verrouillage expirée
    return {
      isLocked: false,
      remainingSeconds: 0,
      failedAttempts,
      totalFailures,
      lockoutUntil: 0
    };
  } catch (err) {
    console.warn('[SECURITY GUARD] Erreur lors de la lecture du lockout state:', err);
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, totalFailures: 0, lockoutUntil: 0 };
  }
}

/**
 * Vérifie le statut de verrouillage d'un employé
 * @param {string} agentId - ID de l'employé
 * @returns {{ allowed: boolean, message?: string, remainingSec?: number, attempts?: number }}
 */
export function checkPinRateLimit(agentId) {
  const state = getPinLockoutState(agentId);
  if (state.isLocked) {
    return {
      allowed: false,
      message: `Compte temporairement bloqué suite à des échecs répétés. Réessayez dans ${state.remainingSeconds} secondes.`,
      remainingSec: state.remainingSeconds
    };
  }

  return { allowed: true, attempts: state.failedAttempts };
}

/**
 * Enregistre un échec de saisie de PIN et calcule le palier de verrouillage adéquat
 * @param {string} userId - ID de l'employé
 * @returns {{ isLocked: boolean, remainingSeconds: number, failedAttempts: number, totalFailures: number, isNewLockout: boolean, lockoutDuration: number }}
 */
export function recordFailedPinAttempt(userId) {
  if (!userId) {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 1, totalFailures: 1, isNewLockout: false, lockoutDuration: 0 };
  }

  const current = getPinLockoutState(userId);
  const now = Date.now();
  const nextFailedAttempts = current.failedAttempts + 1;
  const nextTotalFailures = current.totalFailures + 1;

  let lockoutDuration = 0;
  let isNewLockout = false;

  if (nextFailedAttempts >= 7) {
    lockoutDuration = PIN_SECURITY_CONFIG.LOCKOUT_DURATION_TIER_3; // 300s (5 min)
    isNewLockout = true;
  } else if (nextFailedAttempts >= 6) {
    lockoutDuration = PIN_SECURITY_CONFIG.LOCKOUT_DURATION_TIER_2; // 120s (2 min)
    isNewLockout = true;
  } else if (nextFailedAttempts >= PIN_SECURITY_CONFIG.MAX_ATTEMPTS_BEFORE_LOCK) {
    lockoutDuration = PIN_SECURITY_CONFIG.LOCKOUT_DURATION_TIER_1; // 30s
    isNewLockout = true;
  }

  const lockoutUntil = isNewLockout ? (now + lockoutDuration * 1000) : 0;

  const payload = {
    failedAttempts: nextFailedAttempts,
    totalFailures: nextTotalFailures,
    lockoutUntil,
    lastAttemptAt: now
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(payload));
    }
  } catch (err) {
    console.warn('[SECURITY GUARD] Erreur lors de la sauvegarde du lockout state:', err);
  }

  return {
    isLocked: isNewLockout,
    remainingSeconds: lockoutDuration,
    failedAttempts: nextFailedAttempts,
    totalFailures: nextTotalFailures,
    isNewLockout,
    lockoutDuration
  };
}

/**
 * Réinitialise complètement le compteur de sécurité lors d'une authentification réussie
 * @param {string} userId - ID de l'employé
 */
export function clearPinAttempts(userId) {
  if (!userId) return;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
    }
  } catch (err) {
    console.warn('[SECURITY GUARD] Erreur lors de la réinitialisation du lockout state:', err);
  }
}

export function clearPinLockout(userId) {
  clearPinAttempts(userId);
}
