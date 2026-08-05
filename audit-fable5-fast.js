const fs = require('fs');
const path = require('path');

const API_KEY = 'sk-LCyDOERm0enhIRt07solykJy1IgZd5q31KR45zz94jKU1FLG';
const BASE_URL = 'https://seekai.cc/v1';
const MODEL = 'claude-fable-5';

async function runAudit() {
  const summaryPrompt = `Tu es un expert QA et architecte React/Supabase senior. Analyse l'architecture et les composants de l'application Admin CMS de la plateforme de laverie KLIN UP.

Les composants analysés comportent les modules suivants :
1. App.jsx : Gestion du state React local, filtres par boutique, routage principal sans Route Guards (masquage UI simple par permission).
2. dbEngine.ts : Logique d'abonnements avec quotas codés en dur (25, 50, 100, 200 pièces), synchronisation Supabase sans détection de conflit (last-write-wins).
3. OrderFormModal.jsx : Création de commandes sans gestion des acomptes/paiements partiels (état binaire Payé/Non payé) et sans déduction automatique du quota d'abonnement.
4. SettingsTab.jsx : Délais (express/normal) et taux de majoration stockés uniquement dans le state local / localStorage (non persistant sur Supabase).
5. AuditLogsTab.jsx : Tronquage de l'historique d'audit à 200 entrées via .limit(200) sans pagination.

Identifie et liste les 5 BUGS FONCTIONNELS ET RISQUES CRITIQUES MAJEURS dans cet Admin CMS.
Pour chaque bug, fournis :
- 📌 Nom du bug
- ⚙️ Cause technique
- ⚠️ Impact métier pour le pressing
- 💡 Correctif recommandé`;

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: summaryPrompt }]
      })
    });

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
    console.log('\n\n✅ Audit terminé !');
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

runAudit();
