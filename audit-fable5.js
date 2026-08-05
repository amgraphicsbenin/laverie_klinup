const fs = require('fs');
const path = require('path');

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

async function runAudit() {
  console.log("🔍 Extraction du code source de l'Admin CMS...");

  const appJsxPath = path.join(__dirname, 'admin-cms', 'src', 'App.jsx');
  const dbEnginePath = path.join(__dirname, 'admin-cms', 'src', 'services', 'db', 'dbEngine.ts');
  const orderModalPath = path.join(__dirname, 'admin-cms', 'src', 'features', 'orders', 'components', 'OrderFormModal.jsx');

  const appJsx = fs.existsSync(appJsxPath) ? fs.readFileSync(appJsxPath, 'utf8').substring(0, 8000) : '';
  const dbEngine = fs.existsSync(dbEnginePath) ? fs.readFileSync(dbEnginePath, 'utf8').substring(0, 8000) : '';
  const orderModal = fs.existsSync(orderModalPath) ? fs.readFileSync(orderModalPath, 'utf8').substring(0, 6000) : '';

  const prompt = `Tu es un expert QA et architecte React/Supabase senior. Analyse les extraits suivants du code source de l'application "Admin CMS KLIN UP" (laverie/pressing) et identifie 5 bugs fonctionnels majeurs ou risques critiques pour les opérations.

Aperçu App.jsx:
\`\`\`jsx
${appJsx}
\`\`\`

Aperçu dbEngine.ts:
\`\`\`typescript
${dbEngine}
\`\`\`

Aperçu OrderFormModal.jsx:
\`\`\`jsx
${orderModal}
\`\`\`

Fournis une analyse structurée en français avec :
1. Titre du bug fonctionnel
2. Cause technique / extrait de code concerné
3. Impact métier sur la laverie / pressing
4. Solution / Correctif recommandé`;

  console.log(`🚀 Envoi à Claude Fable 5 sur SeekAI (${MODEL})...\n`);

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
      console.error('Erreur API:', response.status, await response.text());
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullReport = '';

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
            fullReport += content;
            process.stdout.write(content);
          } catch (e) {}
        }
      }
    }

    fs.writeFileSync(path.join(__dirname, 'admin-cms-fable5-audit.md'), fullReport, 'utf8');
    console.log('\n\n✅ Audit généré par Claude Fable 5 sauvegardé dans admin-cms-fable5-audit.md !');
  } catch (err) {
    console.error('Erreur d execution:', err.message);
  }
}

runAudit();
