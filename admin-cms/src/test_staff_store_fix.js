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

console.log("=== TEST DE CORRECTION DU RATTACHEMENT DE LAVERIE DU PERSONNEL ===");

// 1. Ajouter un membre de test 'Credo SEDO' rattaché à Akpakpa ('store_akpakpa')
const credoMember = dbEngine.addStaff({
  nom: 'SEDO',
  prenom: 'Credo',
  role: 'agent_accueil',
  email: 'credo.sedo@klinup.com',
  telephone: '+229 97 00 00 00',
  store_id: 'store_akpakpa'
});

console.log("\n[Test 1] Création de Credo SEDO avec store_id = 'store_akpakpa'...");
console.log("  ID membre :", credoMember.id);
console.log("  store_id en mémoire :", credoMember.store_id);

const stores = dbEngine.getStores();
const targetStore = stores.find(st => st.id === credoMember.store_id);
console.log("  Nom réel de la boutique liée :", targetStore ? targetStore.nom : "NON TROUVÉ");

if (targetStore && targetStore.nom.includes('Akpakpa')) {
  console.log("  ✅ SUCCÈS : Credo SEDO est bien rattaché à Akpakpa !");
} else {
  console.error("  ❌ ÉCHEC : Le nom de la boutique ne correspond pas.");
}

// 2. Modification de l'affectation vers Calavi
console.log("\n[Test 2] Mise à jour de l'affectation de Credo SEDO vers Calavi ('store_calavi')...");
dbEngine.updateStaff(credoMember.id, { store_id: 'store_calavi' });
const updatedMember = memoryDb.staff.find(s => s.id === credoMember.id);

console.log("  Nouveau store_id en mémoire :", updatedMember.store_id);
const newTargetStore = stores.find(st => st.id === updatedMember.store_id);
console.log("  Nouveau nom de boutique :", newTargetStore ? newTargetStore.nom : "NON TROUVÉ");

if (newTargetStore && newTargetStore.nom.includes('Calavi')) {
  console.log("  ✅ SUCCÈS : Mise à jour dynamique de store_id dans updateStaff validée !");
} else {
  console.error("  ❌ ÉCHEC : store_id n'a pas été mis à jour.");
}
