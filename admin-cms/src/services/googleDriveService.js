/**
 * Service d'intégration Google Drive & Google Sheets API v4
 * Permet l'authentification OAuth 2.0 (Google Identity Services)
 * et la création directe de feuilles de calcul pré-remplies dans le Drive de l'utilisateur.
 */

const STORAGE_CLIENT_ID_KEY = 'klinup_google_client_id';
const STORAGE_TOKEN_KEY = 'klinup_google_access_token';
const STORAGE_TOKEN_EXP_KEY = 'klinup_google_token_expiry';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

/**
 * Récupère le Google Client ID configuré (.env ou localStorage)
 */
export function getGoogleClientId() {
  const envId = (import.meta.env?.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (envId) return envId;
  if (typeof window !== 'undefined') {
    return (localStorage.getItem(STORAGE_CLIENT_ID_KEY) || '').trim();
  }
  return '';
}

/**
 * Enregistre un Google Client ID dans le stockage local
 */
export function saveGoogleClientId(clientId) {
  if (typeof window !== 'undefined') {
    const cleanId = (clientId || '').trim();
    if (cleanId) {
      localStorage.setItem(STORAGE_CLIENT_ID_KEY, cleanId);
    } else {
      localStorage.removeItem(STORAGE_CLIENT_ID_KEY);
    }
  }
}

/**
 * Charge dynamiquement le script officiel Google Identity Services (GIS)
 */
let gisLoadingPromise = null;
export function loadGisScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error("Environnement non navigateur"));
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  if (gisLoadingPromise) return gisLoadingPromise;

  gisLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', (e) => reject(new Error("Échec chargement Google Identity Services")));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Impossible de charger le script Google Identity Services"));
    document.head.appendChild(script);
  });

  return gisLoadingPromise;
}

/**
 * Récupère le jeton d'accès en cache s'il est encore valide
 */
export function getCachedAccessToken() {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem(STORAGE_TOKEN_KEY);
  const expiry = sessionStorage.getItem(STORAGE_TOKEN_EXP_KEY);
  if (token && expiry && Date.now() < Number(expiry)) {
    return token;
  }
  return null;
}

/**
 * Sauvegarde le jeton d'accès en session
 */
export function setCachedAccessToken(token, expiresInSeconds = 3500) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
  sessionStorage.setItem(STORAGE_TOKEN_EXP_KEY, String(Date.now() + expiresInSeconds * 1000));
}

/**
 * Déconnecte et réinitialise les jetons Google de la session
 */
export function disconnectGoogle() {
  if (typeof window === 'undefined') return;
  const token = sessionStorage.getItem(STORAGE_TOKEN_KEY);
  if (token && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch (e) {
      console.warn("Erreur révocation token Google", e);
    }
  }
  sessionStorage.removeItem(STORAGE_TOKEN_KEY);
  sessionStorage.removeItem(STORAGE_TOKEN_EXP_KEY);
}

/**
 * Demande une autorisation OAuth 2.0 à l'utilisateur via popup Google
 */
export async function requestGoogleAccessToken(customClientId = null) {
  const clientId = customClientId || getGoogleClientId();
  if (!clientId) {
    throw new Error("Client ID Google non configuré. Veuillez renseigner votre Google Client ID.");
  }

  // Vérifier d'abord le cache de session
  const cached = getCachedAccessToken();
  if (cached) return cached;

  await loadGisScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(new Error(`Autorisation Google refusée : ${response.error_description || response.error}`));
            return;
          }
          if (response.access_token) {
            const expiresIn = Number(response.expires_in) || 3500;
            setCachedAccessToken(response.access_token, expiresIn);
            resolve(response.access_token);
          } else {
            reject(new Error("Aucun jeton d'accès retourné par Google."));
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Crée une feuille de calcul Google Sheets, y insère les données du catalogue et applique la mise en forme
 * 
 * @param {Object} params
 * @param {string} params.title Titre du classeur Google Sheets
 * @param {Array<string>} params.headers En-têtes des colonnes
 * @param {Array<Array<any>>} params.rows Données des lignes
 * @param {string} [params.accessToken] Jeton d'accès (optionnel, demandé automatiquement si omis)
 * @returns {Promise<{ spreadsheetId: string, spreadsheetUrl: string }>}
 */
export async function createAndPopulateGoogleSheet({
  title = 'Catalogue KLIN UP',
  headers = [],
  rows = [],
  accessToken = null
}) {
  const token = accessToken || await requestGoogleAccessToken();

  // 1. Création de la feuille de calcul via l'API Google Sheets
  const createPayload = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: 'Catalogue',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    if (createRes.status === 401) {
      // Jeton expiré ou invalide
      disconnectGoogle();
      throw new Error("Session Google expirée. Veuillez vous reconnecter.");
    }
    throw new Error(errData?.error?.message || `Erreur création Google Sheet (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const sheetId = sheetData.sheets?.[0]?.properties?.sheetId ?? 0;

  // 2. Insertion des données (En-têtes + Lignes)
  const allValues = [headers, ...rows];
  const updateRange = `Catalogue!A1`;

  const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: allValues
    })
  });

  if (!valuesRes.ok) {
    const valErr = await valuesRes.json().catch(() => ({}));
    console.warn("Erreur insertion données dans Google Sheet", valErr);
  }

  // 3. Mise en forme professionnelle (En-tête vert émeraude, gras, centré, auto-resize)
  try {
    const formattingPayload = {
      requests: [
        // Style de l'en-tête (fond vert #10b981, texte blanc en gras)
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: headers.length
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.063, green: 0.725, blue: 0.506 },
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  fontSize: 10
                },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
          }
        },
        // Auto-dimensionnement des colonnes pour un affichage optimal
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: headers.length
            }
          }
        }
      ]
    };

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattingPayload)
    });
  } catch (fmtErr) {
    console.warn("Formatage visuel Google Sheets non bloquant ignoré:", fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl
  };
}
