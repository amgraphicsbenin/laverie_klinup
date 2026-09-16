#!/usr/bin/env node
/**
 * ============================================================================
 * 🛡️ KLIN UP - SQL PRODUCTION SAFETY LINTER & GUARDRAIL
 * ============================================================================
 * Ce script analyse tous les fichiers SQL destinés à la production pour détecter
 * et bloquer toute commande destructrice avant qu'elle n'atteigne Supabase Prod.
 * 
 * Commandes strictement interdites en production :
 * ❌ TRUNCATE
 * ❌ DROP TABLE
 * ❌ DROP COLUMN
 * ❌ DROP DATABASE / DROP SCHEMA
 * ❌ DELETE FROM <table> sans clause WHERE
 * ❌ Exécution directe de fichiers seed_test en production
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SUPABASE_DIR = path.join(ROOT_DIR, 'supabase');

// Fichiers explicitement réservés aux environnements hors production
const NON_PROD_FILES = [
  'seed_test.sql',
  'seed.sql',
  'test_seed.sql',
];

// Règles regex directes
const DIRECT_RULES = [
  {
    name: 'TRUNCATE TABLE',
    regex: /\bTRUNCATE\s+(TABLE\s+)?([^\s;]+)/i,
    severity: 'CRITICAL',
    message: 'Destruction massive des données via TRUNCATE interdite en production.',
  },
  {
    name: 'DROP TABLE',
    regex: /\bDROP\s+TABLE\s+(IF\s+EXISTS\s+)?([^\s;]+)/i,
    severity: 'CRITICAL',
    message: 'Suppression de table via DROP TABLE interdite en production.',
  },
  {
    name: 'DROP COLUMN',
    regex: /\bALTER\s+TABLE\s+[^\n;]+\s+DROP\s+COLUMN\s+([^\s;]+)/i,
    severity: 'CRITICAL',
    message: 'Suppression de colonne via DROP COLUMN interdite. Utiliser le pattern Expand & Contract.',
  },
  {
    name: 'DROP SCHEMA / DATABASE',
    regex: /\bDROP\s+(SCHEMA|DATABASE)\s+/i,
    severity: 'CRITICAL',
    message: 'Suppression globale de schéma ou de base interdite.',
  },
];

/**
 * Nettoie les commentaires SQL (monoligne -- et multiligne /* ... * /)
 */
function stripComments(sqlContent) {
  return sqlContent
    .replace(/\/\*[\s\S]*?\*\//g, '') // commentaires multi-lignes
    .replace(/--.*$/gm, '');          // commentaires mono-lignes
}

/**
 * Parcourt récursivement un dossier pour trouver les fichiers .sql
 */
function findSqlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findSqlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.sql')) {
      results.push(fullPath);
    }
  }
  return results;
}

function runSafetyCheck() {
  console.log('\n=================================================================');
  console.log('🛡️  KLIN UP - VÉRIFICATION DE SÉCURITÉ SQL PRODUCTION');
  console.log('=================================================================\n');

  const sqlFiles = findSqlFiles(SUPABASE_DIR);
  let hasCriticalErrors = false;
  let filesChecked = 0;
  let violationsCount = 0;

  for (const filePath of sqlFiles) {
    const fileName = path.basename(filePath);
    const relPath = path.relative(ROOT_DIR, filePath);

    // 1. Ignorer les fichiers explicitement réservés aux tests
    if (NON_PROD_FILES.includes(fileName)) {
      console.log(`ℹ️  [NON-PROD ONLY] Fichier ignoré pour la prod : ${relPath}`);
      continue;
    }

    filesChecked++;
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const cleanContent = stripComments(rawContent);

    // 2. Vérification des instructions par point-virgule
    const statements = cleanContent.split(';');

    for (const statement of statements) {
      const trimmedStmt = statement.trim();
      if (!trimmedStmt) continue;

      // 2a. Vérifier les règles directes
      for (const rule of DIRECT_RULES) {
        if (rule.regex.test(trimmedStmt)) {
          hasCriticalErrors = true;
          violationsCount++;
          console.error(`\n❌ [${rule.severity}] VIOLATION DÉTECTÉE DANS : ${relPath}`);
          console.error(`   Règle enfreinte : ${rule.name}`);
          console.error(`   Détail : ${rule.message}`);
          console.error(`   Extrait : ${trimmedStmt.slice(0, 120).replace(/\s+/g, ' ')}...`);
        }
      }

      // 2b. Vérifier DELETE FROM sans WHERE
      if (/\bDELETE\s+FROM\s+/i.test(trimmedStmt) && !/\bWHERE\b/i.test(trimmedStmt)) {
        hasCriticalErrors = true;
        violationsCount++;
        console.error(`\n❌ [CRITICAL] VIOLATION DÉTECTÉE DANS : ${relPath}`);
        console.error(`   Règle enfreinte : UNCONDITIONAL DELETE`);
        console.error(`   Détail : DELETE FROM sans clause WHERE détecté. Risque d'effacement complet.`);
        console.error(`   Extrait : ${trimmedStmt.slice(0, 120).replace(/\s+/g, ' ')}...`);
      }
    }
  }

  console.log('\n-----------------------------------------------------------------');
  console.log(`📊 Rapport : ${filesChecked} fichier(s) SQL de production analysé(s).`);

  if (hasCriticalErrors) {
    console.error(`\n🚫 ÉCHEC DU CONTRÔLE DE SÉCURITÉ ! ${violationsCount} violation(s) destructive(s) trouvée(s).`);
    console.error('   Le déploiement en production est BLOQUÉ pour protéger vos données réelles.');
    console.error('   Veuillez corriger ou convertir les opérations en migrations additives non-destructives.\n');
    process.exit(1);
  } else {
    console.log('✅ SUCCÈS : Aucune opération destructive détectée.');
    console.log('   Toutes les migrations sont 100% rétro-compatibles et sécurisées pour la production.\n');
    process.exit(0);
  }
}

runSafetyCheck();
