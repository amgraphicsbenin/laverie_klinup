/**
 * Client d'exécution pour le modèle Claude Fable 5 via SeekAI
 * Usage: node seekai-fable5.js "Votre question ici"
 */

const fs = require('fs');
const path = require('path');

// Chargement des variables d'environnement depuis .env.seekai
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

async function askFable5(prompt) {
  if (!prompt) {
    prompt = "Bonjour ! Présente-toi brièvement et confirme le modèle en cours d'utilisation.";
  }

  console.log(`\n🚀 Envoi de la requête à SeekAI...`);
  console.log(`📍 Endpoint : ${BASE_URL}/chat/completions`);
  console.log(`🤖 Modèle   : ${MODEL}\n`);

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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}:`, errText);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    process.stdout.write("💬 Réponse : ");

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
            process.stdout.write(content);
          } catch (e) {}
        }
      }
    }
    console.log("\n\n✅ Génération terminée avec succès.\n");
  } catch (error) {
    console.error("❌ Erreur de connexion :", error.message);
  }
}

const promptArg = process.argv.slice(2).join(' ');
askFable5(promptArg);
