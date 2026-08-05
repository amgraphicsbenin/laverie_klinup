#!/usr/bin/env node

/**
 * 🤖 Fable 5 CLI & Task Runner for Antigravity IDE
 * Permet d'exécuter des tâches, audits et analyses de code via Claude Fable 5 (SeekAI)
 * 
 * Exemples d'utilisation :
 * 1. Simple question :
 *    node fable5.js "Explique le fonctionnement de supabaseClient.js"
 * 
 * 2. Analyse d'un fichier source :
 *    node fable5.js -f admin-cms/src/App.jsx "Identifie les risques de performance"
 * 
 * 3. Génération dans un fichier de sortie :
 *    node fable5.js -f admin-cms/src/App.jsx -o audit_app.md "Rédige une revue de code complète"
 */

const fs = require('fs');
const path = require('path');

// 1. Chargement des identifiants et configuration SeekAI
const envPath = path.join(__dirname, '.env.seekai');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const val = valueParts.join('=').trim();
      if (key && val) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const API_KEY = process.env.SEEKAI_API_KEY || 'sk-LCyDOERm0enhIRt07solykJy1IgZd5q31KR45zz94jKU1FLG';
const BASE_URL = process.env.SEEKAI_BASE_URL || 'https://seekai.cc/v1';
const MODEL = process.env.SEEKAI_DEFAULT_MODEL || 'claude-fable-5';

// 2. Traitement des arguments de la ligne de commande
const args = process.argv.slice(2);
let targetFiles = [];
let outputFile = null;
let systemPrompt = "Tu es Claude Fable 5, un assistant IA senior spécialisé en architecture logicielle, sécurité et développement Web/React/Node.js dans l'IDE Antigravity.";
let userPromptParts = [];
let maxTokens = 4096;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-f' || arg === '--file') {
    targetFiles.push(args[++i]);
  } else if (arg === '-o' || arg === '--output') {
    outputFile = args[++i];
  } else if (arg === '-s' || arg === '--system') {
    systemPrompt = args[++i];
  } else if (arg === '--max-tokens') {
    maxTokens = parseInt(args[++i], 10) || 4096;
  } else {
    userPromptParts.push(arg);
  }
}

let userInstruction = userPromptParts.join(' ').trim();
if (!userInstruction && targetFiles.length === 0) {
  console.log(`
🤖 Fable 5 CLI Task Runner (SeekAI Engine)
------------------------------------------
Usage: node fable5.js [options] "Votre instruction ou tâche"

Options:
  -f, --file <chemin>     Fichier(s) source à inclure en contexte (cumulable)
  -o, --output <chemin>   Fichier de destination pour enregistrer le résultat
  -s, --system <prompt>   Instruction système personnalisée
  --max-tokens <nombre>   Nombre maximum de tokens générés (Défaut: 4096)

Exemples:
  node fable5.js "Bonjour"
  node fable5.js -f admin-cms/src/App.jsx "Analyse ce composant"
  node fable5.js -f src/db.js -o audit.md "Génère la documentation"
  `);
  process.exit(0);
}

// 3. Construction du contexte avec les fichiers sources
let fileContext = '';
for (const fileRelPath of targetFiles) {
  const absPath = path.isAbsolute(fileRelPath) ? fileRelPath : path.join(__dirname, fileRelPath);
  if (fs.existsSync(absPath)) {
    const fileContent = fs.readFileSync(absPath, 'utf8');
    fileContext += `\n\n--- FICHIER JOINT: ${fileRelPath} ---\n\`\`\`\n${fileContent}\n\`\`\`\n`;
  } else {
    console.warn(`⚠️ Fichier non trouvé : ${fileRelPath}`);
  }
}

const fullContent = `${userInstruction}${fileContext}`;

async function executeTask() {
  console.log(`\n🚀 [Antigravity Task] Exécution via Claude Fable 5 (SeekAI)`);
  console.log(`📍 Endpoint  : ${BASE_URL}/chat/completions`);
  console.log(`🤖 Modèle    : ${MODEL}`);
  if (targetFiles.length > 0) console.log(`📄 Fichier(s): ${targetFiles.join(', ')}`);
  if (outputFile) console.log(`💾 Sortie    : ${outputFile}`);
  console.log(`------------------------------------------------------------\n`);

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullContent }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}:`, errText);
      process.exit(1);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullOutput = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (let line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.replace('data: ', '').trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices[0]?.delta?.content || '';
            fullOutput += content;
            process.stdout.write(content);
          } catch (e) {}
        }
      }
    }

    if (outputFile) {
      const outAbsPath = path.isAbsolute(outputFile) ? outputFile : path.join(__dirname, outputFile);
      fs.writeFileSync(outAbsPath, fullOutput, 'utf8');
      console.log(`\n\n💾 Résultat enregistré avec succès dans : ${outputFile}`);
    }

    console.log(`\n✅ Tâche exécutée avec succès.\n`);
  } catch (error) {
    console.error(`❌ Erreur d'exécution :`, error.message);
    process.exit(1);
  }
}

executeTask();
