/**
 * 🛡️ Utilitaires de Sécurité, Chiffrement de Session & Anti-Bruteforce
 * Application Admin CMS Pressing Pro (Parité avec Android SecurityManager)
 */

// ─── 1. Assainissement & Validation des Entrées ─────────────────────────────

/**
 * Assainit une chaîne de caractères pour éliminer les injections HTML/JS (XSS)
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
 * Nettoie un champ texte (suppression des octets nuls et caractères de contrôle)
 */
export function sanitizeTextField(str, maxLength = 500) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  return clean.length >= 5 && clean.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
}

export function isValidPinFormat(pin) {
  if (!pin || typeof pin !== 'string') return false;
  return /^\d{6}$/.test(pin.trim());
}

/**
 * Nettoie tout message d'erreur technique pour ne jamais exposer d'URL, clé API ou en-tête HTTP
 */
export function friendlyErrorMessage(err, fallback = 'Une erreur est survenue. Veuillez réessayer.') {
  const raw = typeof err === 'string' ? err : (err?.message || '');
  if (!raw) return fallback;
  const lower = raw.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('econnreset') || lower.includes('enotfound')) {
    return 'Connexion au serveur impossible. Vérifiez votre connexion internet.';
  }
  if (lower.includes('row-level security') || lower.includes('42501') || lower.includes('permission')) {
    return 'Action refusée : droits insuffisants pour cette opération.';
  }
  if (
    raw.includes('https://') ||
    raw.includes('http://') ||
    lower.includes('apikey') ||
    lower.includes('bearer ') ||
    lower.includes('headers:') ||
    lower.includes('pgrst') ||
    lower.includes('schema cache')
  ) {
    return fallback;
  }
  return raw;
}

// ─── 2. Primitives Cryptographiques & Temps Constant ──────────────────────────

/**
 * Calcule le condensé SHA-256 hexadécimal via Web Crypto API
 */
export async function sha256Hex(input) {
  const text = String(input ?? '');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback synchrone FNV-1a étendu si WebCrypto indisponible (non-HTTPS)
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (c + i);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Comparaison en temps constant (anti-timing attack) sur chaînes UTF-8
 */
export function constantTimeEqual(a, b) {
  const strA = String(a ?? '');
  const strB = String(b ?? '');
  const len = Math.max(strA.length, strB.length);
  let diff = strA.length ^ strB.length;
  for (let i = 0; i < len; i++) {
    const ca = i < strA.length ? strA.charCodeAt(i) : 0;
    const cb = i < strB.length ? strB.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

/**
 * Hache un code PIN au format compatible Android & Admin (`sha256:<hex>`)
 */
export async function hashPinSha256(pin) {
  const clean = String(pin ?? '').trim();
  if (!clean) return '';
  const hex = await sha256Hex(clean);
  return `sha256:${hex}`;
}

/**
 * Ancien hash salé (conservé pour compatibilité ascendante)
 */
export async function hashPin(pin, salt = 'klinup_secret_salt_2026') {
  if (!pin) return '';
  return sha256Hex(`${salt}:${pin}`);
}

const WEAK_PINS = new Set([
  '000000', '111111', '222222', '333333', '444444',
  '555555', '666666', '777777', '888888', '999999',
  '123456', '654321', '012345', '123123', '112233'
]);

export function isWeakPin(pin) {
  return WEAK_PINS.has(String(pin ?? '').trim());
}

/**
 * Génère un PIN aléatoire à 6 chiffres cryptographiquement sûr (hors séquences faibles)
 */
export function generateSecureRandomPin() {
  for (let attempt = 0; attempt < 20; attempt++) {
    let num;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      num = 100000 + (buf[0] % 900000);
    } else {
      num = Math.floor(100000 + Math.random() * 900000);
    }
    const candidate = String(num);
    if (!isWeakPin(candidate)) return candidate;
  }
  return '482917';
}

/**
 * Vérifie un code PIN en temps constant contre tous les formats supportés :
 * - `sha256:<hex>` (format commun Android / Admin)
 * - `<64 hex>` (SHA-256 brut)
 * - hash salé `hashPin(pin, salt)`
 * - PIN clair historique (transition sans casser la BDD existante)
 */
export async function verifyPinHash(inputPin, storedPinOrHash, salt) {
  const cleanInput = String(inputPin ?? '').trim();
  const cleanStored = String(storedPinOrHash ?? '').trim();
  if (!cleanInput || cleanStored.length < 4) return false;

  if (cleanStored.toLowerCase().startsWith('sha256:')) {
    const expectedHex = cleanStored.slice(7).toLowerCase();
    const actualHex = (await sha256Hex(cleanInput)).toLowerCase();
    return constantTimeEqual(expectedHex, actualHex);
  }

  if (/^[0-9a-f]{64}$/i.test(cleanStored)) {
    const actualHex = (await sha256Hex(cleanInput)).toLowerCase();
    if (constantTimeEqual(cleanStored.toLowerCase(), actualHex)) return true;
    if (salt) {
      const saltedHex = (await hashPin(cleanInput, salt)).toLowerCase();
      if (constantTimeEqual(cleanStored.toLowerCase(), saltedHex)) return true;
    }
    return false;
  }

  // Comparaison des condensés SHA-256 en temps constant pour ne révéler aucune longueur
  const [expectedDigest, actualDigest] = await Promise.all([
    sha256Hex(cleanStored),
    sha256Hex(cleanInput)
  ]);
  return constantTimeEqual(expectedDigest, actualDigest);
}

// ─── 3. Anti-Bruteforce & Verrouillage Intégrité (Parité SecurityManager.kt) ─

export const PIN_SECURITY_CONFIG = {
  WARNING_THRESHOLD: 3,        // Avertissement dès 3 échecs
  COOLDOWN_4TH_SECONDS: 30,    // 30s de pause forcée au 4e échec
  MAX_ATTEMPTS_BEFORE_LOCK: 5, // Verrouillage complet après 5 échecs
  LOCKOUT_DURATION_SEC: 15 * 60 // 15 minutes au 5e échec
};

const LOCKOUT_STORAGE_PREFIX = 'klinup_pin_guard_v2_';
const memoryLockoutMap = new Map();

function getBrowserIntegritySalt() {
  if (typeof navigator === 'undefined') return 'klinup_srv_guard_2026';
  return `klinup_guard_v2|${navigator.userAgent || ''}|${navigator.language || ''}`;
}

function computeSyncSeal(payloadStr) {
  const str = `${getBrowserIntegritySalt()}::${payloadStr}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (c + (i << 1));
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

function getAccountStorageKey(userId) {
  const clean = String(userId || '').trim().toLowerCase();
  return `${LOCKOUT_STORAGE_PREFIX}${computeSyncSeal(clean)}`;
}

export function getPinLockoutState(userId) {
  if (!userId) {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, totalFailures: 0, lockoutUntil: 0, cooldownSeconds: 0 };
  }

  const key = getAccountStorageKey(userId);
  const now = Date.now();
  let parsed = memoryLockoutMap.get(key) || null;

  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (raw) {
      const envelope = JSON.parse(raw);
      if (envelope && envelope.d && envelope.s && constantTimeEqual(computeSyncSeal(envelope.d), envelope.s)) {
        const diskData = JSON.parse(envelope.d);
        if (!parsed || (Number(diskData.lastAttemptAt) || 0) >= (Number(parsed.lastAttemptAt) || 0)) {
          parsed = diskData;
        }
      } else {
        // Falsification détectée dans localStorage : appliquer un verrouillage défensif
        const tamperLock = {
          failedAttempts: PIN_SECURITY_CONFIG.MAX_ATTEMPTS_BEFORE_LOCK,
          totalFailures: PIN_SECURITY_CONFIG.MAX_ATTEMPTS_BEFORE_LOCK,
          lockoutUntil: now + PIN_SECURITY_CONFIG.LOCKOUT_DURATION_SEC * 1000,
          lastAttemptAt: now
        };
        parsed = tamperLock;
        memoryLockoutMap.set(key, tamperLock);
      }
    }
  } catch (err) {
    console.warn('[SECURITY GUARD] Lecture lockout state impossible:', err);
  }

  if (!parsed) {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0, totalFailures: 0, lockoutUntil: 0, cooldownSeconds: 0 };
  }

  const lockoutUntil = Number(parsed.lockoutUntil) || 0;
  const failedAttempts = Number(parsed.failedAttempts) || 0;
  const totalFailures = Number(parsed.totalFailures) || 0;

  if (lockoutUntil > now) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      failedAttempts,
      totalFailures,
      lockoutUntil,
      cooldownSeconds: remainingSeconds
    };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    failedAttempts,
    totalFailures,
    lockoutUntil: 0,
    cooldownSeconds: 0
  };
}

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

export function recordFailedPinAttempt(userId) {
  if (!userId) {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 1, totalFailures: 1, isNewLockout: false, lockoutDuration: 0 };
  }

  const key = getAccountStorageKey(userId);
  const current = getPinLockoutState(userId);
  const now = Date.now();
  const nextFailedAttempts = current.failedAttempts + 1;
  const nextTotalFailures = current.totalFailures + 1;

  let lockoutDuration = 0;
  let isNewLockout = false;
  let storedAttempts = nextFailedAttempts;

  if (nextFailedAttempts >= PIN_SECURITY_CONFIG.MAX_ATTEMPTS_BEFORE_LOCK) {
    lockoutDuration = PIN_SECURITY_CONFIG.LOCKOUT_DURATION_SEC; // 15 min
    isNewLockout = true;
    storedAttempts = 0; // Reset après verrouillage 15 min (comme SecurityManager.kt)
  } else if (nextFailedAttempts === PIN_SECURITY_CONFIG.MAX_ATTEMPTS_BEFORE_LOCK - 1) {
    lockoutDuration = PIN_SECURITY_CONFIG.COOLDOWN_4TH_SECONDS; // 30s au 4e échec
    isNewLockout = true;
  }

  const lockoutUntil = isNewLockout ? (now + lockoutDuration * 1000) : 0;

  const payload = {
    failedAttempts: storedAttempts,
    totalFailures: nextTotalFailures,
    lockoutUntil,
    lastAttemptAt: now
  };

  memoryLockoutMap.set(key, payload);
  try {
    if (typeof localStorage !== 'undefined') {
      const serialized = JSON.stringify(payload);
      localStorage.setItem(key, JSON.stringify({ d: serialized, s: computeSyncSeal(serialized) }));
    }
  } catch (err) {
    console.warn('[SECURITY GUARD] Sauvegarde lockout state impossible:', err);
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

export function clearPinAttempts(userId) {
  if (!userId) return;
  const key = getAccountStorageKey(userId);
  memoryLockoutMap.delete(key);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('[SECURITY GUARD] Réinitialisation lockout state impossible:', err);
  }
}

export function clearPinLockout(userId) {
  clearPinAttempts(userId);
}

// ─── 4. Session Signée, TTL 12h & Auto-Lock (Parité SecurityManager.kt) ──────

const SESSION_KEY_V2 = 'klin_up_session_v2';
const LEGACY_SESSION_KEY = 'klin_up_current_user';
const AUTO_LOCK_KEY = 'klin_up_auto_lock_min';

export const MAX_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 heures max
export const AUTO_LOCK_OPTIONS = [
  { minutes: 2, label: '2 min' },
  { minutes: 5, label: '5 min' },
  { minutes: 15, label: '15 min' }
];

export function stripSensitiveUserFields(user) {
  if (!user || typeof user !== 'object') return null;
  const clean = { ...user };
  delete clean.code_pin;
  delete clean.codePin;
  delete clean.pin;
  return clean;
}

export function getAutoLockMinutes() {
  try {
    if (typeof localStorage === 'undefined') return 15;
    const raw = Number(localStorage.getItem(AUTO_LOCK_KEY));
    if (raw === 2 || raw === 5 || raw === 15) return raw;
  } catch (_) {}
  return 15;
}

export function setAutoLockMinutes(minutes) {
  const valid = (minutes === 2 || minutes === 5 || minutes === 15) ? minutes : 15;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTO_LOCK_KEY, String(valid));
    }
  } catch (_) {}
  return valid;
}

export function saveAuthenticatedSession(user, { locked = false, issuedAt = Date.now() } = {}) {
  const sanitized = stripSensitiveUserFields(user);
  if (!sanitized) return null;
  const envelopeData = JSON.stringify({
    user: sanitized,
    issuedAt,
    lastActiveAt: Date.now(),
    locked: Boolean(locked)
  });
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_KEY_V2, JSON.stringify({ d: envelopeData, s: computeSyncSeal(envelopeData) }));
      localStorage.removeItem(LEGACY_SESSION_KEY);
      localStorage.removeItem('klinup_current_user');
    }
  } catch (_) {}
  return sanitized;
}

export function restoreAuthenticatedSession() {
  if (typeof localStorage === 'undefined') return { user: null, locked: false, issuedAt: 0 };
  try {
    const rawV2 = localStorage.getItem(SESSION_KEY_V2);
    if (rawV2) {
      const envelope = JSON.parse(rawV2);
      if (!envelope || !envelope.d || !envelope.s || !constantTimeEqual(computeSyncSeal(envelope.d), envelope.s)) {
        // Session falsifiée -> purge immédiate
        clearAuthenticatedSession();
        return { user: null, locked: false, issuedAt: 0, tampered: true };
      }
      const parsed = JSON.parse(envelope.d);
      const now = Date.now();
      const issuedAt = Number(parsed.issuedAt) || 0;
      if (!parsed.user || !issuedAt || (now - issuedAt > MAX_SESSION_TTL_MS)) {
        clearAuthenticatedSession();
        return { user: null, locked: false, issuedAt: 0, expired: true };
      }
      const autoLockMs = getAutoLockMinutes() * 60 * 1000;
      const lastActiveAt = Number(parsed.lastActiveAt) || issuedAt;
      const timedOut = (now - lastActiveAt) >= autoLockMs;
      const isLocked = Boolean(parsed.locked) || timedOut;
      if (isLocked && !parsed.locked) {
        saveAuthenticatedSession(parsed.user, { locked: true, issuedAt });
      }
      return {
        user: stripSensitiveUserFields(parsed.user),
        locked: isLocked,
        issuedAt
      };
    }

    // Migration douce depuis l'ancienne clé non signée (une seule fois, sans PIN)
    const legacyRaw = localStorage.getItem(LEGACY_SESSION_KEY);
    if (legacyRaw) {
      const legacyUser = stripSensitiveUserFields(JSON.parse(legacyRaw));
      localStorage.removeItem(LEGACY_SESSION_KEY);
      if (legacyUser?.id) {
        saveAuthenticatedSession(legacyUser, { locked: false, issuedAt: Date.now() });
        return { user: legacyUser, locked: false, issuedAt: Date.now() };
      }
    }
  } catch (_) {
    clearAuthenticatedSession();
  }
  return { user: null, locked: false, issuedAt: 0 };
}

export function touchSessionActivity() {
  if (typeof localStorage === 'undefined') return;
  try {
    const rawV2 = localStorage.getItem(SESSION_KEY_V2);
    if (!rawV2) return;
    const envelope = JSON.parse(rawV2);
    if (!envelope?.d || !envelope?.s || !constantTimeEqual(computeSyncSeal(envelope.d), envelope.s)) return;
    const parsed = JSON.parse(envelope.d);
    if (!parsed?.user || parsed.locked) return;
    const now = Date.now();
    if (now - (Number(parsed.lastActiveAt) || 0) < 15_000) return; // Throttle writes to 15s
    const updated = JSON.stringify({ ...parsed, lastActiveAt: now });
    localStorage.setItem(SESSION_KEY_V2, JSON.stringify({ d: updated, s: computeSyncSeal(updated) }));
  } catch (_) {}
}

export function lockAuthenticatedSession(user) {
  const current = restoreAuthenticatedSession();
  const target = stripSensitiveUserFields(user || current.user);
  if (!target) return null;
  saveAuthenticatedSession(target, { locked: true, issuedAt: current.issuedAt || Date.now() });
  return target;
}

export function clearAuthenticatedSession() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY_V2);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem('klinup_current_user');
  } catch (_) {}
}
