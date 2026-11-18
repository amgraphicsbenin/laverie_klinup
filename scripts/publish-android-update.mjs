/**
 * Script de publication OTA d'une mise à jour Android vers Firebase (projet: klinup-apps).
 * Aucune dépendance externe requise (Node 18+).
 *
 * Usage :
 *   set FIREBASE_SERVICE_ACCOUNT=C:\chemin\vers\service-account.json
 *   node scripts/publish-android-update.mjs --versionCode=2 --versionName=1.0.1 --notes="Corrections et améliorations"
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PROJECT_ID = 'klinup-apps';
const BUCKET = 'klinup-apps.firebasestorage.app';
const DEFAULT_APK = path.resolve('android-app/app/build/outputs/apk/release/app-release.apk');

function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) args[raw.slice(2)] = 'true';
    else args[raw.slice(2, eq)] = raw.slice(eq + 1);
  }
  return args;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/devstorage.read_write https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    })
  );
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(serviceAccount.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payload}.${signature}`
    })
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Échec authentification Google OAuth2 : ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function uploadToStorage(token, objectName, buffer, contentType) {
  const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?uploadType=media&name=${encodeURIComponent(objectName)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType
    },
    body: buffer
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Erreur upload Storage (${objectName}) : ${JSON.stringify(data)}`);
  }
  const dlToken = data.downloadTokens ? `&token=${data.downloadTokens}` : '';
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(objectName)}?alt=media${dlToken}`;
}

async function updateFirestoreDoc(token, manifest, envName) {
  const docId = envName ? `android_${envName}` : 'android';
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/app_updates/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        versionCode: { integerValue: String(manifest.versionCode) },
        versionName: { stringValue: manifest.versionName },
        apkUrl: { stringValue: manifest.apkUrl },
        releaseNotes: { stringValue: manifest.releaseNotes },
        mandatory: { booleanValue: Boolean(manifest.mandatory) }
      }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`⚠️ Firestore app_updates/${docId} non mis à jour (${res.status}) : ${err}`);
  } else {
    console.log(`✅ Document Firestore app_updates/${docId} mis à jour.`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const saPath = args.serviceAccount || process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let serviceAccount = null;
  if (rawJson && rawJson.trim().startsWith('{')) {
    serviceAccount = JSON.parse(rawJson);
  } else if (saPath && fs.existsSync(saPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  } else {
    console.error('❌ Aucun Service Account Firebase trouvé (FIREBASE_SERVICE_ACCOUNT_JSON ou FIREBASE_SERVICE_ACCOUNT).');
    process.exit(1);
  }

  const versionCode = Number(args.versionCode);
  const versionName = args.versionName;
  if (!Number.isInteger(versionCode) || versionCode <= 0 || !versionName) {
    console.error('❌ Paramètres requis : --versionCode=<int> --versionName=<semver>');
    process.exit(1);
  }

  const envName = (args.env || process.env.APP_ENV || 'test').toLowerCase();
  const apkPath = path.resolve(args.apk || DEFAULT_APK);
  if (!fs.existsSync(apkPath)) {
    console.error(`❌ APK introuvable : ${apkPath}`);
    process.exit(1);
  }

  const token = await getAccessToken(serviceAccount);

  const apkObject = `app-updates/${envName}/klinup-${envName}-v${versionName}-b${versionCode}.apk`;
  console.log(`⬆️ Upload APK (${apkPath}) -> gs://${BUCKET}/${apkObject}...`);
  const apkUrl = await uploadToStorage(
    token,
    apkObject,
    fs.readFileSync(apkPath),
    'application/vnd.android.package-archive'
  );

  const manifest = {
    versionCode,
    versionName,
    apkUrl,
    releaseNotes: args.notes || '',
    mandatory: args.mandatory === 'true'
  };

  const manifestObject = `app-updates/${envName}/latest.json`;
  console.log(`⬆️ Upload manifeste -> gs://${BUCKET}/${manifestObject}...`);
  await uploadToStorage(
    token,
    manifestObject,
    Buffer.from(JSON.stringify(manifest, null, 2)),
    'application/json'
  );

  fs.writeFileSync(path.resolve('android-app/latest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await updateFirestoreDoc(token, manifest, envName);

  console.log('🎉 Mise à jour publiée avec succès :', manifest);
}

main().catch((err) => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
