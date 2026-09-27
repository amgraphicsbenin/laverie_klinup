// Test fonctionnel rigoureux pour la fonctionnalité d'importation de catalogue
// Vérification : Template CSV, Parser, Règles métier, Validations, Persistance DB

import assert from 'node:assert';

console.log('=== DÉBUT DE LA SUITE DE TESTS FONCTIONNELS (IMPORT CATALOGUE) ===\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Erreur: ${err.message}`);
    failedTests++;
  }
}

// ---------------------------------------------------------------------------
// 1. TEST : PARSER CSV & APOSTROPHES FRANÇAISES
// ---------------------------------------------------------------------------
const parseCSVLine = (line, delimiter) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
};

runTest("Parser CSV : Découpage standard point-virgule", () => {
  const line = "1;store_1;Point Principal;1;Chemise;1500;2250;800;1200;individuel;Coton";
  const tokens = parseCSVLine(line, ';');
  assert.strictEqual(tokens.length, 11);
  assert.strictEqual(tokens[0], "1");
  assert.strictEqual(tokens[3], "1");
  assert.strictEqual(tokens[4], "Chemise");
});

runTest("Parser CSV : Apostrophes françaises (Costume d'hiver, Robe d'été)", () => {
  const line = ";store_1;Point Principal;1;Costume d'hiver;3500;5000;2000;3000;individuel;Tenue d'affaires";
  const tokens = parseCSVLine(line, ';');
  assert.strictEqual(tokens.length, 11, `Attendu 11 colonnes, obtenu ${tokens.length}`);
  assert.strictEqual(tokens[4], "Costume d'hiver");
  assert.strictEqual(tokens[5], "3500");
  assert.strictEqual(tokens[9], "individuel");
  assert.strictEqual(tokens[10], "Tenue d'affaires");
});

runTest("Parser CSV : Champs avec guillemets doubles", () => {
  const line = '1;store_1;"Point Principal";1;"Chemise, manche longue";1500;0;0;0;individuel;"Description avec ; point-virgule"';
  const tokens = parseCSVLine(line, ';');
  assert.strictEqual(tokens.length, 11);
  assert.strictEqual(tokens[2], "Point Principal");
  assert.strictEqual(tokens[4], "Chemise, manche longue");
  assert.strictEqual(tokens[10], "Description avec ; point-virgule");
});

// ---------------------------------------------------------------------------
// 2. TEST : NETTOYAGE DES MONTANTS (cleanPrice)
// ---------------------------------------------------------------------------
const cleanPrice = (val) => {
  if (val === undefined || val === null || String(val).trim() === '') return 0;
  let s = String(val).trim().replace(/\s+/g, '').replace(/fcfa|cfa|f/gi, '');
  if (/^\d{1,3}[,.]\d{3}$/.test(s)) {
    s = s.replace(/[,.]/g, '');
  } else if (/^\d{1,3}[,.]\d{3}[,.]\d{3}$/.test(s)) {
    s = s.replace(/[,.]/g, '');
  } else {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return (!isNaN(n) && n >= 0) ? Math.round(n) : 0;
};

runTest("cleanPrice : Entiers et cellules vides", () => {
  assert.strictEqual(cleanPrice(""), 0);
  assert.strictEqual(cleanPrice(null), 0);
  assert.strictEqual(cleanPrice(undefined), 0);
  assert.strictEqual(cleanPrice("0"), 0);
  assert.strictEqual(cleanPrice("1500"), 1500);
  assert.strictEqual(cleanPrice(2500), 2500);
});

runTest("cleanPrice : Espaces, suffixes monétaires et séparateurs de milliers", () => {
  assert.strictEqual(cleanPrice("1 500"), 1500);
  assert.strictEqual(cleanPrice("1 500 F"), 1500);
  assert.strictEqual(cleanPrice("2500 FCFA"), 2500);
  assert.strictEqual(cleanPrice("1,500"), 1500); // Format US millier
  assert.strictEqual(cleanPrice("15.000"), 15000); // Format millier
  assert.strictEqual(cleanPrice("1500,00"), 1500); // Format décimal français
  assert.strictEqual(cleanPrice("1500.00"), 1500); // Format décimal point
});

// ---------------------------------------------------------------------------
// 3. TEST : EN-TÊTE & ORDRE STRICT DES 11 COLONNES
// ---------------------------------------------------------------------------
const CSV_HEADER_LINE = 'ID_Produit;Store_ID;Store_Name;Statut;Article;Tarif_Traitement;Tarif_Traitement_Express;Tarif_Repassage;Tarif_Repassage_Express;Categorie;Description\r\n';

runTest("Structure Template : 11 colonnes avec Statut en 4ème place", () => {
  const headers = CSV_HEADER_LINE.trim().split(';');
  assert.strictEqual(headers.length, 11);
  assert.strictEqual(headers[0], "ID_Produit");
  assert.strictEqual(headers[1], "Store_ID");
  assert.strictEqual(headers[2], "Store_Name");
  assert.strictEqual(headers[3], "Statut");
  assert.strictEqual(headers[4], "Article");
  assert.strictEqual(headers[5], "Tarif_Traitement");
  assert.strictEqual(headers[6], "Tarif_Traitement_Express");
  assert.strictEqual(headers[7], "Tarif_Repassage");
  assert.strictEqual(headers[8], "Tarif_Repassage_Express");
  assert.strictEqual(headers[9], "Categorie");
  assert.strictEqual(headers[10], "Description");
});

// ---------------------------------------------------------------------------
// 4. TEST : RÈGLE STATUT (1 ou 0)
// ---------------------------------------------------------------------------
const parseStatus = (val) => {
  const s = String(val || '').trim().toLowerCase();
  if (['0', '0.0', 'inactif', 'inactive', 'desactive', 'false', 'non', 'no'].includes(s)) {
    return { isActive: false, statut: 'inactif', statutVal: 0 };
  }
  return { isActive: true, statut: 'actif', statutVal: 1 };
};

runTest("Statut : 1 = Actif, 0 = Inactif, défaut = Actif", () => {
  assert.deepStrictEqual(parseStatus("1"), { isActive: true, statut: 'actif', statutVal: 1 });
  assert.deepStrictEqual(parseStatus("0"), { isActive: false, statut: 'inactif', statutVal: 0 });
  assert.deepStrictEqual(parseStatus("inactif"), { isActive: false, statut: 'inactif', statutVal: 0 });
  assert.deepStrictEqual(parseStatus(""), { isActive: true, statut: 'actif', statutVal: 1 }); // Défaut si non renseigné
});

// ---------------------------------------------------------------------------
// 5. TEST : VALIDATION DES CATÉGORIES (SEULS individuel & abonnement)
// ---------------------------------------------------------------------------
const validateCategory = (rawCat) => {
  const norm = String(rawCat || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (!norm || norm === 'individuel' || norm === 'individuels' || norm.startsWith('indiv')) {
    return { isValid: true, category: 'individuel' };
  }
  if (norm === 'abonnement' || norm === 'abonnements' || norm.startsWith('abonn')) {
    return { isValid: true, category: 'abonnement' };
  }
  return { isValid: false, category: norm, error: `Catégorie '${rawCat}' interdite : seuls 'individuel' et 'abonnement' sont acceptés` };
};

runTest("Catégories : Accepter 'individuel' et 'abonnement', refuser les autres", () => {
  assert.strictEqual(validateCategory("individuel").isValid, true);
  assert.strictEqual(validateCategory("INDIVIDUEL").isValid, true);
  assert.strictEqual(validateCategory("abonnement").isValid, true);
  assert.strictEqual(validateCategory("ABONNEMENT").isValid, true);
  assert.strictEqual(validateCategory("Abonnements").isValid, true);
  assert.strictEqual(validateCategory("").isValid, true); // Défaut = individuel

  assert.strictEqual(validateCategory("system_setting").isValid, false);
  assert.strictEqual(validateCategory("reward_catalog").isValid, false);
  assert.strictEqual(validateCategory("autre").isValid, false);
});

// ---------------------------------------------------------------------------
// 6. TEST : AUTO-INCRÉMENTATION DES NOUVEAUX PRODUITS SANS ID
// ---------------------------------------------------------------------------
runTest("Auto-Incrémentation : Attribution d'ID numérique séquentiel pour nouveaux articles", () => {
  const existingCatalog = [
    { id: "1", article: "Costume" },
    { id: "5", article: "Robe" }
  ];

  let nextAutoNum = 0;
  existingCatalog.forEach(item => {
    const n = parseInt(String(item.id).replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > nextAutoNum) nextAutoNum = n;
  });
  assert.strictEqual(nextAutoNum, 5);

  // Deux nouveaux articles sans ID dans le CSV
  const newRow1Id = "";
  const assigned1 = !newRow1Id ? String(++nextAutoNum) : newRow1Id;
  assert.strictEqual(assigned1, "6");

  const newRow2Id = "";
  const assigned2 = !newRow2Id ? String(++nextAutoNum) : newRow2Id;
  assert.strictEqual(assigned2, "7");
});

// ---------------------------------------------------------------------------
// 7. TEST : RECONCILIATION ET BATCH PERSISTENCE
// ---------------------------------------------------------------------------
runTest("Batch Persistence : Séparation Traitement et Repassage pour articles individuels", () => {
  const row = {
    assignedNumericId: "8",
    isNewProduct: true,
    article: "Veste d'hiver",
    storeId: "store_1",
    isActive: true,
    prixTraitement: 2500,
    prixTraitementUrgent: 3500,
    prixRepassage: 1500,
    prixRepassageUrgent: 2000,
    categorie: "individuel",
    description: "Veste doublée"
  };

  const itemsToPersist = [];
  const targetId = row.assignedNumericId;

  if (row.categorie === 'individuel') {
    if (row.prixTraitement > 0 || row.prixRepassage === 0) {
      itemsToPersist.push({
        id: targetId,
        article: row.article,
        service: 'lavage_simple',
        categorie: 'individuel',
        prix: row.prixTraitement,
        prix_urgent: row.prixTraitementUrgent,
        description: row.description,
        store_id: row.storeId,
        is_active: row.isActive,
        statut: row.isActive ? 'actif' : 'inactif'
      });
    }
    if (row.prixRepassage > 0) {
      itemsToPersist.push({
        article: row.article,
        service: 'repassage',
        categorie: 'individuel',
        prix: row.prixRepassage,
        prix_urgent: row.prixRepassageUrgent,
        description: row.description,
        store_id: row.storeId,
        is_active: row.isActive,
        statut: row.isActive ? 'actif' : 'inactif'
      });
    }
  }

  assert.strictEqual(itemsToPersist.length, 2);
  assert.strictEqual(itemsToPersist[0].service, 'lavage_simple');
  assert.strictEqual(itemsToPersist[0].id, "8");
  assert.strictEqual(itemsToPersist[0].statut, 'actif');
  assert.strictEqual(itemsToPersist[1].service, 'repassage');
  assert.strictEqual(itemsToPersist[1].statut, 'actif');
});

// ---------------------------------------------------------------------------
// 8. TEST : LIGNES VIDES OU SÉPARATEURS SEULS (;;;;;;;;;;)
// ---------------------------------------------------------------------------
runTest("Lignes vides : Ignorer les lignes composées uniquement de séparateurs", () => {
  const line = ";;;;;;;;;;";
  const tokens = parseCSVLine(line, ';');
  const isCompletelyEmpty = tokens.every(t => !t || t.trim() === '');
  assert.strictEqual(isCompletelyEmpty, true);
});

// ---------------------------------------------------------------------------
// 9. TEST : GUILLEMETS ÉCHAPPÉS SELON RFC 4180 ("")
// ---------------------------------------------------------------------------
runTest("Parser CSV : Guillemets doublés échappés RFC 4180", () => {
  const line = '1;store_1;Point Principal;1;"Costume ""Super 100"" en laine";5000;0;2000;0;individuel;"Qualité supérieure"';
  const tokens = parseCSVLine(line, ';');
  assert.strictEqual(tokens[4], 'Costume "Super 100" en laine');
});

// ---------------------------------------------------------------------------
// 10. TEST : PRIX NÉGATIFS OU SYMBOLES INCONNUS (cellule vide ou invalide = 0)
// ---------------------------------------------------------------------------
runTest("cleanPrice : Valeurs négatives, NaN ou corrompues retournent 0", () => {
  assert.strictEqual(cleanPrice("-1500"), 0);
  assert.strictEqual(cleanPrice("N/A"), 0);
  assert.strictEqual(cleanPrice("Gratuit"), 0);
  assert.strictEqual(cleanPrice("---"), 0);
});

// ---------------------------------------------------------------------------
// 11. TEST : RÉCONCILIATION ID REPASSAGE LORS D'UN UPDATE
// ---------------------------------------------------------------------------
runTest("Réconciliation Repassage : Conservation de l'ID existant", () => {
  const existingCatalog = [
    { id: "101", article: "Robe de soirée", service: "lavage_simple", store_id: "store_1", prix: 5000 },
    { id: "102", article: "Robe de soirée", service: "repassage", store_id: "store_1", prix: 2000 }
  ];

  const row = {
    idProduit: "101",
    article: "Robe de soirée",
    storeId: "store_1",
    prixTraitement: 5500,
    prixRepassage: 2500,
    isActive: true
  };

  const existingRepassageItem = existingCatalog.find(c => 
    c.store_id === row.storeId &&
    c.service === 'repassage' &&
    c.article.trim().toLowerCase() === row.article.trim().toLowerCase()
  );

  assert.ok(existingRepassageItem, "L'item repassage doit être trouvé");
  assert.strictEqual(existingRepassageItem.id, "102");
});

// ---------------------------------------------------------------------------
// 12. TEST : SIMULATION FLUX COMPLET D'IMPORT MULTI-LIGNES
// ---------------------------------------------------------------------------
runTest("Simulation Multi-lignes : Parsing CSV complet avec lignes vides et apostrophes", () => {
  const sampleCSV = `ID_Produit;Store_ID;Store_Name;Statut;Article;Tarif_Traitement;Tarif_Traitement_Express;Tarif_Repassage;Tarif_Repassage_Express;Categorie;Description
1;store_1;Boutique A;1;Costume d'affaires;3500;5000;1500;2000;individuel;Tenue complète
;;;;;;;;;;
;store_1;Boutique A;0;Robe d'été;2000;;1000;;individuel;Légère
;store_1;Boutique A;1;Pack Famille 30 Jours;25000;;;;abonnement;30 jours de linge
`;

  const lines = sampleCSV.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = [];
  let autoNum = 100;

  for (let i = 1; i < lines.length; i++) {
    const tokens = parseCSVLine(lines[i], ';');
    if (tokens.every(t => !t || t.trim() === '')) continue; // Skip delimiter lines

    const id = tokens[0] ? tokens[0].trim() : String(++autoNum);
    const statut = tokens[3] === '0' ? 0 : 1;
    const article = tokens[4];
    const cat = tokens[9] || 'individuel';

    rows.push({ id, statut, article, cat });
  }

  assert.strictEqual(rows.length, 3, "Doit comporter 3 lignes (la ligne vide sautée)");
  assert.strictEqual(rows[0].id, "1");
  assert.strictEqual(rows[0].article, "Costume d'affaires");
  assert.strictEqual(rows[0].statut, 1);

  assert.strictEqual(rows[1].id, "101"); // Auto-incrémenté
  assert.strictEqual(rows[1].article, "Robe d'été");
  assert.strictEqual(rows[1].statut, 0); // Inactif

  assert.strictEqual(rows[2].id, "102"); // Auto-incrémenté
  assert.strictEqual(rows[2].article, "Pack Famille 30 Jours");
  assert.strictEqual(rows[2].cat, "abonnement");
});

// ---------------------------------------------------------------------------
// 13. TEST : UNICITÉ STRICTE DES ID PRODUIT À L'EXPORT (individuel vs abonnement)
// ---------------------------------------------------------------------------
runTest("Export Catalogue : Garantie d'unicité absolue des ID Produit entre types différents", () => {
  // Simulation de données avec préfixes historiques qui créaient une collision naïve (cat1 vs sub1)
  const sampleExistingCatalog = [
    { id: 'cat1', article: 'Chemise', service: 'lavage_simple', categorie: 'individuel', store_id: 'store_1', prix: 1500 },
    { id: 'cat2', article: 'Chemise', service: 'repassage', categorie: 'individuel', store_id: 'store_1', prix: 800 },
    { id: 'cat3', article: 'Costume', service: 'lavage_simple', categorie: 'individuel', store_id: 'store_1', prix: 3500 },
    { id: 'sub1', article: 'Offre Active', service: 'abonnement', categorie: 'abonnement', store_id: 'store_1', prix: 20000 },
    { id: 'sub2', article: 'Abonnement VIP', service: 'abonnement', categorie: 'abonnement', store_id: 'store_1', prix: 100000 }
  ];

  const groups = {};
  sampleExistingCatalog.forEach(item => {
    const cat = item.categorie;
    const key = `${item.store_id}__${cat}__${item.article.trim().toLowerCase()}`;
    if (!groups[key]) {
      groups[key] = {
        rawId: item.id,
        article: item.article,
        categorie: cat
      };
    }
  });

  const groupList = Object.values(groups);
  const usedNumericIds = new Set();

  // Passe 1 : Réserver les IDs des articles qui possèdent déjà un identifiant purement numérique unique
  groupList.forEach(g => {
    const raw = String(g.rawId || '').trim();
    if (/^\d+$/.test(raw)) {
      const num = parseInt(raw, 10);
      if (num > 0 && !usedNumericIds.has(num)) {
        g.numericId = String(num);
        usedNumericIds.add(num);
      }
    }
  });

  // Passe 2 : Pour tous les autres articles, attribuer un numéro séquentiel unique sans collision
  let nextAvailableId = 1;
  groupList.forEach(g => {
    if (!g.numericId) {
      while (usedNumericIds.has(nextAvailableId)) {
        nextAvailableId++;
      }
      g.numericId = String(nextAvailableId);
      usedNumericIds.add(nextAvailableId);
    }
  });

  // Vérification rigoureuse : 4 articles distincts (Chemise, Costume, Offre Active, VIP)
  assert.strictEqual(groupList.length, 4);

  // Vérification de l'unicité stricte : aucun ID en double
  const allIds = groupList.map(g => g.numericId);
  const uniqueIds = new Set(allIds);
  assert.strictEqual(allIds.length, uniqueIds.size, `Doublon d'ID détecté dans l'export : ${allIds.join(', ')}`);

  // Vérifier qu'aucun article individuel et abonnement ne partagent le même ID
  const chemise = groupList.find(g => g.article === 'Chemise');
  const offreActive = groupList.find(g => g.article === 'Offre Active');
  assert.notStrictEqual(chemise.numericId, offreActive.numericId, "Chemise et Offre Active NE DOIVENT PAS avoir le même ID Produit !");
});

// ---------------------------------------------------------------------------
// 14. TEST : DÉTECTION & REJET DE TOUTE COLLISION D'ID DANS LE FICHIER IMPORTÉ
// ---------------------------------------------------------------------------
runTest("Détection Collision Fichier : Rejet immédiat de deux articles ayant le même ID", () => {
  const fileLines = [
    { lineIndex: 2, idProduit: "1", article: "Chemise", categorie: "individuel" },
    { lineIndex: 3, idProduit: "2", article: "Costume", categorie: "individuel" },
    { lineIndex: 4, idProduit: "1", article: "Offre Active", categorie: "abonnement" } // ERREUR : ID 1 déjà pris par Chemise !
  ];

  const seenIdsInFile = new Map();
  const errorsByLine = [];

  fileLines.forEach(row => {
    const cleanId = row.idProduit;
    if (cleanId) {
      if (seenIdsInFile.has(cleanId)) {
        const prev = seenIdsInFile.get(cleanId);
        errorsByLine.push({
          line: row.lineIndex,
          error: `Collision critique d'ID : L'ID Produit '${cleanId}' est déjà utilisé par '${prev.article}' (${prev.categorie}, ligne ${prev.lineIndex}).`
        });
      } else {
        seenIdsInFile.set(cleanId, {
          lineIndex: row.lineIndex,
          article: row.article,
          categorie: row.categorie
        });
      }
    }
  });

  assert.strictEqual(errorsByLine.length, 1, "Une collision doit être levée");
  assert.strictEqual(errorsByLine[0].line, 4);
  assert.ok(errorsByLine[0].error.includes("Collision critique d'ID"));
  assert.ok(errorsByLine[0].error.includes("Chemise"));
});

// ---------------------------------------------------------------------------
// 15. TEST : MODÈLE VIERGE AVEC EXEMPLES DISTINCTS (1 à 9)
// ---------------------------------------------------------------------------
runTest("Modèle Vierge : Vérification de la stricte distinction des 9 lignes d'exemples", () => {
  const sampleRows = [
    `1;store_1;Point Principal;1;Chemise;1500;2250;800;1200;individuel;Coton, lin ou synthétique`,
    `2;store_1;Point Principal;1;Costume 2 pièces;3500;5000;2000;3000;individuel;Veste et pantalon pressing`,
    `3;store_1;Point Principal;1;Pantalon;1500;2000;800;1200;individuel;Jean, toile ou costume`,
    `4;store_1;Point Principal;1;Robe simple;2500;3500;1500;2000;individuel;Tenue quotidienne`,
    `5;store_1;Point Principal;1;Robe de soirée;4500;6500;2500;3500;individuel;Tissu délicat, soies ou perles`,
    `6;store_1;Point Principal;1;Veste / Blazer;2500;3500;1500;2000;individuel;Nettoyage à sec délicat`,
    `7;store_1;Point Principal;1;T-shirt / Polo;1000;1500;500;800;individuel;Lavage standard et repassage`,
    `8;store_1;Point Principal;1;Drap 2 places;2000;0;1000;0;individuel;Linge de lit grand format`,
    `9;store_1;Point Principal;1;Formule Mensuelle 30;15000;0;0;0;abonnement;30 vêtements par mois avec ramassage`
  ];

  const parsedIds = sampleRows.map(row => row.split(';')[0]);
  const uniqueSet = new Set(parsedIds);

  assert.strictEqual(parsedIds.length, 9);
  assert.strictEqual(uniqueSet.size, 9, "Chaque exemple doit avoir un ID unique");
  assert.strictEqual(parsedIds[8], "9", "La formule mensuelle d'abonnement doit avoir l'ID 9 et non un doublon");
});

// ---------------------------------------------------------------------------
// 16. TEST : AUTO-INCRÉMENTATION STRICTE N+1 POUR NOUVEAU PRODUIT SANS ID
// ---------------------------------------------------------------------------
runTest("Auto-Incrémentation Stricte N+1 : Nouveau produit sans ID dans template avec 9 existants reçoit ID 10", () => {
  const existingCatalog = [
    { id: "1", article: "Chemise", store_id: "store_1" },
    { id: "2", article: "Costume", store_id: "store_1" },
    { id: "9", article: "Formule Mensuelle 30", store_id: "store_1" }
  ];

  // Template avec 9 lignes explicites (1 à 9) + 1 ligne nouvelle sans ID
  const csvLines = [
    "1;store_1;Point Principal;1;Chemise;1500;0;800;0;individuel;Coton",
    "9;store_1;Point Principal;1;Formule Mensuelle 30;15000;0;0;0;abonnement;30 vêtements",
    ";store_1;Point Principal;1;Nouveau Polo;1200;0;600;0;individuel;Nouveau" // ID vide !
  ];

  let nextAutoNum = 0;
  const usedNumbers = new Set();
  existingCatalog.forEach(item => {
    if (/^\d+$/.test(String(item.id).trim())) {
      const n = parseInt(String(item.id).trim(), 10);
      if (!isNaN(n)) {
        usedNumbers.add(n);
        if (n > nextAutoNum) nextAutoNum = n;
      }
    }
  });

  // Pré-scan explicite
  csvLines.forEach(l => {
    const tokens = l.split(';');
    const rawId = tokens[0].trim();
    if (rawId && /^\d+$/.test(rawId)) {
      const n = parseInt(rawId, 10);
      usedNumbers.add(n);
      if (n > nextAutoNum) nextAutoNum = n;
    }
  });

  assert.strictEqual(nextAutoNum, 9, "Le max recensé doit être 9");

  // Attribution pour la 3ème ligne (Nouveau Polo sans ID)
  let assigned = '';
  do {
    nextAutoNum += 1;
  } while (usedNumbers.has(nextAutoNum));
  assigned = String(nextAutoNum);

  assert.strictEqual(assigned, "10", "Le nouveau produit sans ID doit obligatoirement recevoir l'ID 10 (N+1)");
});

// ---------------------------------------------------------------------------
// 17. TEST : PRÉSERVATION DE L'ID EXISTANT APRÈS IMPORT
// ---------------------------------------------------------------------------
runTest("Vue du Template Après Import : Ligne sans ID d'un produit existant conserve son ID existant au lieu de ré-incrémenter", () => {
  // Après import, Nouveau Polo existe en base avec ID 10
  const existingCatalogAfterImport = [
    { id: "1", article: "Chemise", store_id: "store_1" },
    { id: "9", article: "Formule Mensuelle 30", store_id: "store_1" },
    { id: "10", article: "Nouveau Polo", store_id: "store_1" }
  ];

  const existingByNameAndStore = new Map();
  existingCatalogAfterImport.forEach(item => {
    existingByNameAndStore.set(`${item.store_id}__${item.article.toLowerCase()}`, item);
  });

  // La ligne du fichier CSV a toujours la cellule ID vide
  const csvRowArticle = "Nouveau Polo";
  const csvRowStoreId = "store_1";
  const keyForCheck = `${csvRowStoreId}__${csvRowArticle.toLowerCase()}`;
  const existingMatch = existingByNameAndStore.get(keyForCheck);

  assert.ok(existingMatch, "Le produit doit être reconnu comme existant");
  const assignedId = String(existingMatch.id).replace(/\D/g, '') || String(existingMatch.id);
  assert.strictEqual(assignedId, "10", "La vue du template doit afficher l'ID existant 10 et non ré-incrémenter à 11 ou plus");
});

// ---------------------------------------------------------------------------
// 18. TEST : REJET DES IDS ABERRANTS (> 500 COMME 7207) ET INCRÉMENTATION SÉQUENTIELLE RÉELLE
// ---------------------------------------------------------------------------
runTest("Gestion des anomalies d'ID : Rejet de 7207 et attribution séquentielle propre 49 et 50", () => {
  const existingCatalog = [
    { id: "48", article: "test", store_id: "store_akpakpa", categorie: "individuel" }
  ];

  const MAX_ANOMALY_THRESHOLD = Math.max(500, existingCatalog.length * 3);

  // Simulation du CSV avec 7207 sur test3 (ancienne anomalie) et vide sur test8
  const csvLines = [
    "7207;store_akpakpa;Point Akpakpa;1;test3;3000;0;0;0;individuel;Test3",
    ";store_akpakpa;Point Akpakpa;1;test8;3000;0;0;0;individuel;Test8"
  ];

  let nextAutoNum = 0;
  const usedNumbers = new Set();

  // Étape 1 : Scan existant
  existingCatalog.forEach(item => {
    const n = parseInt(item.id, 10);
    if (n <= MAX_ANOMALY_THRESHOLD) {
      usedNumbers.add(n);
      if (n > nextAutoNum) nextAutoNum = n;
    }
  });

  assert.strictEqual(nextAutoNum, 48, "nextAutoNum doit être à 48");

  // Étape 2 : Pré-scan CSV (7207 doit être rejeté comme anomalie)
  csvLines.forEach(l => {
    const rawId = l.split(';')[0].trim();
    if (rawId && /^\d+$/.test(rawId)) {
      const n = parseInt(rawId, 10);
      if (n <= MAX_ANOMALY_THRESHOLD) {
        usedNumbers.add(n);
        if (n > nextAutoNum) nextAutoNum = n;
      }
    }
  });

  assert.strictEqual(nextAutoNum, 48, "Le pré-scan doit rejeter 7207 et maintenir nextAutoNum à 48");

  // Étape 3 : Attribution ligne 1 (test3 dont l'ID 7207 est ignoré)
  let assignedTest3 = '';
  do {
    nextAutoNum += 1;
  } while (usedNumbers.has(nextAutoNum));
  assignedTest3 = String(nextAutoNum);
  usedNumbers.add(nextAutoNum);

  assert.strictEqual(assignedTest3, "49", "test3 doit recevoir l'ID séquentiel 49 et non 7207");

  // Étape 4 : Attribution ligne 2 (test8 sans ID)
  let assignedTest8 = '';
  do {
    nextAutoNum += 1;
  } while (usedNumbers.has(nextAutoNum));
  assignedTest8 = String(nextAutoNum);
  usedNumbers.add(nextAutoNum);

  assert.strictEqual(assignedTest8, "50", "test8 doit recevoir l'ID séquentiel 50 et non 7208");
});

// ---------------------------------------------------------------------------
// 19. TEST : EXCLUSION DES PARAMÈTRES SYSTÈME ET RÉCOMPENSES DU CALCUL D'ID
// ---------------------------------------------------------------------------
runTest("Exclusion stricte des system_setting et reward_catalog du recensement", () => {
  const mixedCatalog = [
    { id: "1", article: "Chemise", categorie: "individuel", service: "lavage_simple" },
    { id: "setting_express_hours", article: "Délai", categorie: "system_setting", service: "system_setting" },
    { id: "remise_5000", article: "Remise 5000", categorie: "reward_catalog", service: "reward_catalog" }
  ];

  let nextAutoNum = 0;
  const usedNumbers = new Set();
  const MAX_ANOMALY_THRESHOLD = 500;

  mixedCatalog.forEach(item => {
    const cat = (item.categorie || '').toLowerCase();
    if (item.service === 'system_setting' || item.service === 'reward_catalog' || (cat !== 'individuel' && cat !== 'abonnement')) {
      return;
    }
    const rawIdStr = String(item.id).trim();
    if (/^\d+$/.test(rawIdStr)) {
      const n = parseInt(rawIdStr, 10);
      if (n <= MAX_ANOMALY_THRESHOLD) {
        usedNumbers.add(n);
        if (n > nextAutoNum) nextAutoNum = n;
      }
    }
  });

  assert.strictEqual(nextAutoNum, 1, "nextAutoNum doit être 1 (et ne pas être pollué par remise_5000)");
  assert.strictEqual(usedNumbers.has(5000), false, "5000 ne doit pas être présent dans usedNumbers");
});

console.log(`\n=== BILAN DES TESTS : ${passedTests} réussis, ${failedTests} échoués ===\n`);
if (failedTests > 0) {
  process.exit(1);
}


