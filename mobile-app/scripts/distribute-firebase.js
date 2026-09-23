#!/usr/bin/env node

/**
 * Script de déploiement automatique sur Firebase App Distribution pour KLIN UP
 * 
 * Usage:
 *   node scripts/distribute-firebase.js --file ./build/app-production.apk
 *   node scripts/distribute-firebase.js --env production --file <path-to-apk> --groups testers --notes "Version 1.0.1 Production"
 *   npm run distribute:prod -- --file <path-to-apk>
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration des applications Firebase par environnement
const FIREBASE_CONFIG = {
  projectId: 'klinup-apps',
  apps: {
    production: {
      appId: '1:735467305399:android:43c1e315d66b4c56069032',
      displayName: 'KLIN UP (Production)',
      packageName: 'com.klinup.laverie',
    },
    test: {
      appId: '1:735467305399:android:170a40fff0cb9af8069032',
      displayName: 'KLIN UP Test',
      packageName: 'com.klinup.laverie.test',
    },
    staging: {
      appId: '1:735467305399:android:43c1e315d66b4c56069032',
      displayName: 'KLIN UP Bêta',
      packageName: 'com.klinup.laverie.beta',
    },
  },
};

// Analyse des arguments
const args = process.argv.slice(2);
function getArgValue(name, defaultValue = null) {
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  if (match) {
    return match.split('=')[1];
  }
  return defaultValue;
}

const env = (getArgValue('env', 'production')).toLowerCase();
const appConfig = FIREBASE_CONFIG.apps[env] || FIREBASE_CONFIG.apps.production;

let binaryPath = getArgValue('file');
const testersGroups = getArgValue('groups', 'testers');
const testersEmails = getArgValue('testers', null);
const releaseNotes = getArgValue(
  'notes',
  `Version ${appConfig.displayName} - Déployée le ${new Date().toLocaleString('fr-FR')}`
);

// Recherche automatique si non spécifié (strictement ciblé sur klinup ou builds locaux)
if (!binaryPath) {
  const searchDirs = [
    path.join(__dirname, '..'),
    path.join(__dirname, '../dist'),
    path.join(__dirname, '../build'),
    path.join(process.env.USERPROFILE || '', 'Downloads'),
  ];

  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter((f) => f.endsWith('.apk') || f.endsWith('.aab'))
        .filter((f) => f.toLowerCase().includes('klin') || f.toLowerCase().includes('laverie'))
        .map((f) => ({
          name: f,
          path: path.join(dir, f),
          time: fs.statSync(path.join(dir, f)).mtimeMs,
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        binaryPath = files[0].path;
        console.log(`ℹ️ Binaire KLIN UP détecté automatiquement : ${binaryPath}`);
        break;
      }
    }
  }
}

if (!binaryPath || !fs.existsSync(binaryPath)) {
  console.error(`\n❌ Aucun fichier binaire (.apk ou .aab) spécifié ou trouvé pour KLIN UP.`);
  console.error(`\n📌 Pour distribuer une version :`);
  console.error(`   1. Construisez le binaire avec EAS :`);
  console.error(`      npx eas build --platform android --profile production-apk`);
  console.error(`   2. Lancez la distribution avec le fichier généré :`);
  console.error(`      node scripts/distribute-firebase.js --file ./chemin/vers/klinup.apk\n`);
  process.exit(1);
}

// Localisation de la clé service account Firebase
let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const defaultKeyPaths = [
  path.join(__dirname, '../firebase-service-account.json'),
  path.join(process.env.USERPROFILE || '', 'Downloads', 'klinup-apps-firebase-adminsdk-fbsvc-1e3712908f.json'),
];

if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  for (const p of defaultKeyPaths) {
    if (fs.existsSync(p)) {
      credentialsPath = p;
      break;
    }
  }
}

console.log('====================================================');
console.log(`🚀 Distribution Firebase : ${appConfig.displayName}`);
console.log('====================================================');
console.log(`• Projet Firebase : ${FIREBASE_CONFIG.projectId}`);
console.log(`• App ID          : ${appConfig.appId}`);
console.log(`• Package         : ${appConfig.packageName}`);
console.log(`• Fichier Binaire : ${binaryPath}`);
console.log(`• Groupes         : ${testersGroups || '(aucun)'}`);
console.log(`• Notes de version: "${releaseNotes}"`);
if (credentialsPath) {
  console.log(`• Clé Service     : ${credentialsPath}`);
}
console.log('----------------------------------------------------');

const cmdArgs = [
  'firebase-tools',
  'appdistribution:distribute',
  `"${binaryPath}"`,
  '--app',
  appConfig.appId,
  '--project',
  FIREBASE_CONFIG.projectId,
  '--release-notes',
  `"${releaseNotes}"`,
];

if (testersGroups) {
  cmdArgs.push('--groups', testersGroups);
}
if (testersEmails) {
  cmdArgs.push('--testers', testersEmails);
}

const envVars = {
  ...process.env,
};
if (credentialsPath) {
  envVars.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}

console.log(`⏳ Envoi du binaire vers Firebase App Distribution en cours...`);
const result = spawnSync('npx', cmdArgs, {
  stdio: 'inherit',
  env: envVars,
  shell: true,
});

if (result.status === 0) {
  console.log(`\n✅ Déploiement réussi sur Firebase App Distribution !`);
  console.log(`📱 Les testeurs du groupe "${testersGroups}" peuvent maintenant installer l'application.`);
} else {
  console.error(`\n❌ Échec de la distribution (Code d'erreur: ${result.status}).`);
  process.exit(result.status || 1);
}

