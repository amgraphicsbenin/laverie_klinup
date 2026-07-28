const storageMock = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key) => storageMock[key] || null,
    setItem: (key, val) => { storageMock[key] = String(val); },
    removeItem: (key) => { delete storageMock[key]; }
  },
  writable: true,
  configurable: true
});

import { dbEngine, memoryDb } from './services/db/dbEngine.js';

console.log("=== TEST DE VALIDATION DU RATTACHEMENT OBLIGATOIRE DE STORE_ID ===");

// Configurer le store sélectionné à 'all' (filtre global)
memoryDb.selected_store_id = 'all';

// Test 1: Tentative de création sans store_id et avec selected_store_id = 'all'
try {
  console.log("\n[Test 1] Tentative de création de commande SANS store_id (selected_store_id = 'all')...");
  dbEngine.createOrder({
    customer_id: 'c1',
    type_article: 'Chemise',
    type_service: 'lavage_simple',
    niveau_urgence: 'Normal',
    mode_reglement: 'espece'
  });
  console.error("❌ ÉCHEC : La commande a été créée sans store_id !");
} catch (err) {
  console.log("✅ SUCCÈS : L'erreur a bien été capturée ->", err.message);
}

// Test 2: Création de commande AVEC un store_id explicite
try {
  console.log("\n[Test 2] Tentative de création de commande AVEC store_id ('store_central')...");
  const order = dbEngine.createOrder({
    customer_id: 'c1',
    store_id: 'store_central',
    type_article: 'Chemise',
    type_service: 'lavage_simple',
    niveau_urgence: 'Normal',
    mode_reglement: 'espece'
  });
  console.log("✅ SUCCÈS : Commande créée et rattachée avec succès à :", order.store_id);
} catch (err) {
  console.error("❌ ÉCHEC : Erreur inattendue ->", err.message);
}
