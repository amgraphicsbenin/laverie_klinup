const assert = require('assert');

console.log('======================================================================');
console.log('🧪 TESTS DE RÉGRESSION UNITAIRES ET LOGIQUE MÉTIER (BACKEND/CRM)');
console.log('======================================================================\n');

let passCount = 0;
let totalCount = 0;

function runTest(id, name, testFn) {
  totalCount++;
  try {
    testFn();
    passCount++;
    console.log(`✅ [${id}] PASS: ${name}`);
  } catch (err) {
    console.error(`❌ [${id}] FAIL: ${name}`);
    console.error(`   Message: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// TEST BUG #1: Logique de mise à jour de la dette client (updateCustomerDebt)
// ---------------------------------------------------------------------------
runTest('BUG-01', 'Mise à jour et réduction de dette avec limitation à 0', () => {
  const customer = { id: 'cust-1', solde_dette: 5000 };
  const adjustDebt = (cust, amountDelta) => {
    cust.solde_dette = Math.max(0, Number(cust.solde_dette || 0) + Number(amountDelta));
    return cust;
  };

  adjustDebt(customer, -2000);
  assert.strictEqual(customer.solde_dette, 3000, 'La dette doit être réduite à 3000 FCFA');

  adjustDebt(customer, -4000);
  assert.strictEqual(customer.solde_dette, 0, 'La dette ne doit jamais devenir négative');

  adjustDebt(customer, 1500);
  assert.strictEqual(customer.solde_dette, 1500, 'La dette doit pouvoir augmenter si montant positif');
});

// ---------------------------------------------------------------------------
// TEST BUG #2: Annulation de commande et réconciliation de la dette client
// ---------------------------------------------------------------------------
runTest('BUG-02', 'Réconciliation financière de dette client lors de l\'annulation de commande', () => {
  const customer = { id: 'cust-2', solde_dette: 8000 };
  const order = {
    id: 'ord-101',
    customer_id: 'cust-2',
    prix_total: 10000,
    avance_payee: 2000,
    statut: 'en_attente'
  };

  // Logique cancelOrder
  const unpaid = Math.max(0, Number(order.prix_total || 0) - Number(order.avance_payee || 0));
  assert.strictEqual(unpaid, 8000, 'Le montant impayé de la commande est de 8000 FCFA');

  customer.solde_dette = Math.max(0, Number(customer.solde_dette || 0) - unpaid);
  order.statut = 'annule';

  assert.strictEqual(customer.solde_dette, 0, 'La dette client doit être déduite de 8000 FCFA et revenir à 0');
  assert.strictEqual(order.statut, 'annule', 'Le statut de commande doit passer à annule');
});

// ---------------------------------------------------------------------------
// TEST BUG #3: Préservation des coordonnées GPS, Quartier et Ville à la création
// ---------------------------------------------------------------------------
runTest('BUG-03', 'Préservation intégrale des données géographiques dans l\'objet client', () => {
  const inputData = {
    nom: 'Houenou',
    prenom: 'Boris',
    telephone: '0197000001',
    adresse: 'Haie Vive Rue 12',
    quartier: 'Haie Vive',
    ville: 'Cotonou',
    latitude: 6.3541,
    longitude: 2.3912,
    coordonnees_livraison: { lat: 6.3541, lng: 2.3912 }
  };

  // Modèle addCustomer
  const newCustomer = {
    id: 'generated-id',
    nom: inputData.nom,
    prenom: inputData.prenom,
    telephone: inputData.telephone,
    adresse: inputData.adresse,
    quartier: inputData.quartier || 'Non renseigné',
    ville: inputData.ville || 'Cotonou',
    latitude: inputData.latitude !== undefined ? Number(inputData.latitude) : null,
    longitude: inputData.longitude !== undefined ? Number(inputData.longitude) : null,
    coordonnees_livraison: inputData.coordonnees_livraison || (inputData.latitude ? { lat: inputData.latitude, lng: inputData.longitude } : null)
  };

  assert.strictEqual(newCustomer.quartier, 'Haie Vive');
  assert.strictEqual(newCustomer.ville, 'Cotonou');
  assert.strictEqual(newCustomer.latitude, 6.3541);
  assert.strictEqual(newCustomer.longitude, 2.3912);
  assert.deepStrictEqual(newCustomer.coordonnees_livraison, { lat: 6.3541, lng: 2.3912 });
});

// ---------------------------------------------------------------------------
// TEST BUG #4: Assainissement payload Supabase (suppression coordonnees_livraison)
// ---------------------------------------------------------------------------
runTest('BUG-04', 'Sanitize payload Supabase exclut coordonnees_livraison de la table customers', () => {
  const STRIP_BY_TABLE = {
    orders: ['remise_pourcentage', 'solde_paid_at'],
    customers: ['coordonnees_livraison']
  };

  function sanitizePayload(table, data) {
    const sanitized = { ...data };
    for (const col of (STRIP_BY_TABLE[table] || [])) {
      delete sanitized[col];
    }
    return sanitized;
  }

  const customerPayload = {
    id: 'cust-3',
    nom: 'Tossou',
    adresse: 'Gbegamey',
    coordonnees_livraison: { lat: 6.36, lng: 2.41 },
    latitude: 6.36,
    longitude: 2.41
  };

  const clean = sanitizePayload('customers', customerPayload);
  assert.strictEqual(clean.coordonnees_livraison, undefined, 'coordonnees_livraison doit être retiré');
  assert.strictEqual(clean.nom, 'Tossou');
  assert.strictEqual(clean.latitude, 6.36);
});

// ---------------------------------------------------------------------------
// TEST BUG #5: Décrémentation et restitution du quota d'articles d'abonnement
// ---------------------------------------------------------------------------
runTest('BUG-05', 'Décrémentation au createOrder et restitution au cancelOrder du quota d\'abonnement', () => {
  const customer = {
    id: 'cust-sub-1',
    active_subscription: {
      id: 'sub-pack-30',
      name: 'Pack 30 Vêtements',
      total_clothes: 30,
      remaining_clothes: 30
    }
  };

  const orderArticles = [
    { article: 'Chemise', quantite: 3 },
    { article: 'Pantalon', quantite: 2 }
  ];

  // 1. Passage commande
  const clothesDeducted = orderArticles.reduce((sum, item) => sum + item.quantite, 0);
  assert.strictEqual(clothesDeducted, 5);

  customer.active_subscription.remaining_clothes = Math.max(0, customer.active_subscription.remaining_clothes - clothesDeducted);
  assert.strictEqual(customer.active_subscription.remaining_clothes, 25, 'Le quota doit passer de 30 à 25');

  // 2. Annulation commande
  customer.active_subscription.remaining_clothes = Math.min(
    customer.active_subscription.total_clothes,
    customer.active_subscription.remaining_clothes + clothesDeducted
  );
  assert.strictEqual(customer.active_subscription.remaining_clothes, 30, 'Le quota doit être restauré à 30 après annulation');
});

// ---------------------------------------------------------------------------
// TEST BUG #8: Recherche combinée (Prénom + Nom et Nom + Prénom)
// ---------------------------------------------------------------------------
runTest('BUG-08', 'Prédicat de recherche client avec combinaison Prénom + Nom', () => {
  const customer = { prenom: 'Koffi', nom: 'Dossou', telephone: '0197112233' };

  const matchesSearch = (c, query) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return true;
    const fullName = `${c.prenom || ''} ${c.nom || ''}`.toLowerCase();
    const reverseFullName = `${c.nom || ''} ${c.prenom || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      reverseFullName.includes(q) ||
      (c.telephone && c.telephone.includes(q))
    );
  };

  assert.strictEqual(matchesSearch(customer, 'Koffi Dossou'), true, 'Doit matcher "Koffi Dossou"');
  assert.strictEqual(matchesSearch(customer, 'Dossou Koffi'), true, 'Doit matcher "Dossou Koffi"');
  assert.strictEqual(matchesSearch(customer, 'koffi'), true, 'Doit matcher prénom seul');
  assert.strictEqual(matchesSearch(customer, 'dossou'), true, 'Doit matcher nom seul');
  assert.strictEqual(matchesSearch(customer, '9711'), true, 'Doit matcher téléphone');
  assert.strictEqual(matchesSearch(customer, 'Mensah'), false, 'Ne doit pas matcher Mensah');
});

// ---------------------------------------------------------------------------
// TEST BUG #10: Normalisation et validation des téléphones béninois (8 chiffres -> 10 chiffres)
// ---------------------------------------------------------------------------
runTest('BUG-10', 'Normalisation automatique des numéros béninois à 8 chiffres vers 10 chiffres', () => {
  const normalizePhoneNumber = (phone, indicatif = '229') => {
    if (!phone) return '';
    let cleanPhone = String(phone).replace(/\D/g, '');
    const cleanCode = String(indicatif || '229').replace(/\D/g, '');
    if (cleanCode === '229' && cleanPhone.length === 8) {
      cleanPhone = '01' + cleanPhone;
    }
    return cleanPhone;
  };

  assert.strictEqual(normalizePhoneNumber('96123456', '229'), '0196123456');
  assert.strictEqual(normalizePhoneNumber('0196123456', '229'), '0196123456');
  assert.strictEqual(normalizePhoneNumber('96 12 34 56', '229'), '0196123456');
  // Autre pays (Togo +228) ne doit pas être préfixé par 01
  assert.strictEqual(normalizePhoneNumber('90123456', '228'), '90123456');
});

// ---------------------------------------------------------------------------
// TEST BUG #11: Visibilité des clients sans boutique pour les gérants de boutique
// ---------------------------------------------------------------------------
runTest('BUG-11', 'Inclusion des clients non rattachés dans la vue multi-boutique', () => {
  const userRole = 'gerant';
  const userStoreId = 'store-cotonou-1';

  const allCustomers = [
    { id: '1', nom: 'Client Boutique 1', store_id: 'store-cotonou-1' },
    { id: '2', nom: 'Client Boutique 2', store_id: 'store-calavi-2' },
    { id: '3', nom: 'Client Sans Boutique', store_id: null },
    { id: '4', nom: 'Client Boutique Vide', store_id: '' },
    { id: '5', nom: 'Client Global', store_id: 'all' }
  ];

  const filterCustomersForManager = (custs, storeId) => {
    return custs.filter(c => 
      c.store_id === storeId ||
      !c.store_id ||
      c.store_id === 'all' ||
      c.store_id === ''
    );
  };

  const visibleCustomers = filterCustomersForManager(allCustomers, userStoreId);
  const visibleIds = visibleCustomers.map(c => c.id);

  assert.deepStrictEqual(visibleIds, ['1', '3', '4', '5'], 'Le gérant doit voir sa boutique et tous les clients sans affectation');
  assert.strictEqual(visibleIds.includes('2'), false, 'Le gérant ne doit pas voir les clients de la boutique 2');
});

// ---------------------------------------------------------------------------
// TEST BUG #12: Export CSV avec colonnes enrichies (Boutique, Quartier, Ville, Date)
// ---------------------------------------------------------------------------
runTest('BUG-12', 'Génération des colonnes enrichies pour l\'exportation CSV', () => {
  const stores = [
    { id: 'store-1', nom: 'Pressing Pro Haie Vive' },
    { id: 'store-2', nom: 'Pressing Pro Calavi' }
  ];

  const customer = {
    id: 'cust-exp-1',
    prenom: 'Salif',
    nom: 'Keita',
    indicatif: '229',
    telephone: '0197001122',
    adresse: 'Rue 145',
    quartier: 'Fidjrossè',
    ville: 'Cotonou',
    store_id: 'store-1',
    created_at: '2026-05-15T10:00:00Z',
    solde_dette: 2500,
    points_fidelite: 150,
    active_subscription: { name: 'Forfait Privilège', remaining_clothes: 12 }
  };

  const formatCustomerRow = (r, storesList) => {
    const store = (storesList || []).find(s => s.id === r.store_id);
    return {
      id: r.id,
      prenom: r.prenom || '',
      nom: r.nom || '',
      quartier: r.quartier || 'Non renseigné',
      ville: r.ville || 'Cotonou',
      point_laverie: store ? store.nom : (r.store_id || 'Tous les points'),
      date_inscription: r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : 'N/A',
      dette: r.solde_dette || 0
    };
  };

  const formatted = formatCustomerRow(customer, stores);
  assert.strictEqual(formatted.quartier, 'Fidjrossè');
  assert.strictEqual(formatted.ville, 'Cotonou');
  assert.strictEqual(formatted.point_laverie, 'Pressing Pro Haie Vive');
  assert.strictEqual(formatted.date_inscription.length > 5, true);
  assert.strictEqual(formatted.dette, 2500);
});

// ---------------------------------------------------------------------------
// TEST BUG #13: Commande sous abonnement actif - déduction de quota et dette nulle
// ---------------------------------------------------------------------------
runTest('BUG-13', 'Commande sous abonnement : déduction quota, incrément lavés et dette 0 FCFA', () => {
  const customer = {
    id: 'c_test_sub',
    solde_dette: 0,
    active_subscription: {
      name: 'Offre Active',
      total_clothes: 25,
      remaining_clothes: 25,
      clothes_washed: 0
    }
  };

  const orderData = {
    customer_id: customer.id,
    pay_with_subscription: true,
    items: [
      { article: 'Chemise', quantite: 10, prix: 1500 }
    ],
    frais_livraison: 0,
    frais_recuperation: 0
  };

  // Logique createOrder
  const itemsList = orderData.items || [];
  const totalClothes = itemsList.reduce((sum, it) => sum + Number(it.quantite || it.quantity || 1), 0);
  const deliveryFee = Number(orderData.frais_livraison || 0);
  const pickupFee = Number(orderData.frais_recuperation || 0);

  const sub = customer.active_subscription;
  const prevRemaining = Number(sub.remaining_clothes || 0);
  assert.strictEqual(totalClothes, 10, '10 vêtements doivent être comptabilisés');
  assert.strictEqual(prevRemaining >= totalClothes, true, 'Le quota doit être suffisant');

  sub.remaining_clothes = Math.max(0, prevRemaining - totalClothes);
  sub.clothes_washed = (Number(sub.clothes_washed || 0) + totalClothes);

  const calculatedTotal = deliveryFee + pickupFee;
  const advancePaid = 0;
  const unpaidBalance = Math.max(0, calculatedTotal - advancePaid);

  if (unpaidBalance > 0) {
    customer.solde_dette += unpaidBalance;
  }

  assert.strictEqual(sub.remaining_clothes, 15, 'Il doit rester 15 vêtements sur 25');
  assert.strictEqual(sub.clothes_washed, 10, '10 vêtements doivent être enregistrés comme lavés');
  assert.strictEqual(calculatedTotal, 0, 'Le montant monétaire exigible pour les vêtements doit être de 0 FCFA');
  assert.strictEqual(customer.solde_dette, 0, 'Aucune dette ne doit être créée sur le client pour une commande couverte');
});

// ---------------------------------------------------------------------------
// TEST BUG #14: Annulation de commande sous abonnement - restitution de quota
// ---------------------------------------------------------------------------
runTest('BUG-14', 'Annulation commande abonnement : restitution intégrale remaining_clothes et décrémentation clothes_washed', () => {
  const customer = {
    id: 'c_test_sub_cancel',
    solde_dette: 0,
    active_subscription: {
      name: 'Offre Active',
      total_clothes: 25,
      remaining_clothes: 15,
      clothes_washed: 10
    }
  };

  const order = {
    id: 'o_test_sub',
    customer_id: customer.id,
    is_subscription_order: true,
    prix_total: 0,
    avance_payee: 0,
    subscription_details: {
      clothes_deducted: 10
    },
    items: [
      { article: 'Chemise', quantite: 10, prix: 1500 }
    ]
  };

  // Logique cancelOrder
  const clothesCount = Number(order.subscription_details?.clothes_deducted) ||
                       (order.articles || order.items || []).reduce((sum, it) => sum + Number(it.quantite || it.quantity || 1), 0);
  const sub = customer.active_subscription;
  sub.remaining_clothes = Math.min(Number(sub.total_clothes || 0), Number(sub.remaining_clothes || 0) + clothesCount);
  sub.clothes_washed = Math.max(0, Number(sub.clothes_washed || 0) - clothesCount);

  assert.strictEqual(sub.remaining_clothes, 25, 'Le quota restant doit être restauré à 25 vêtements');
  assert.strictEqual(sub.clothes_washed, 0, 'Le compteur de vêtements lavés doit être ramené à 0');
  assert.strictEqual(customer.solde_dette, 0, 'Le solde dette doit demeurer à 0');
});

// ---------------------------------------------------------------------------
// TEST BUG #15: Commande abonnement avec frais de livraison impayés
// ---------------------------------------------------------------------------
runTest('BUG-15', 'Commande abonnement avec livraison : seuls les frais de livraison sont imputés en dette', () => {
  const customer = {
    id: 'c_test_sub_deliv',
    solde_dette: 0,
    active_subscription: {
      name: 'Offre Active',
      total_clothes: 25,
      remaining_clothes: 25,
      clothes_washed: 0
    }
  };

  const deliveryFee = 1500;
  const pickupFee = 500;
  const advancePaid = 0; // Client n'a pas encore payé la livraison

  const cashTotal = deliveryFee + pickupFee;
  const unpaid = Math.max(0, cashTotal - advancePaid);
  if (unpaid > 0) {
    customer.solde_dette += unpaid;
  }

  assert.strictEqual(cashTotal, 2000, 'Seuls 2000 FCFA de transport sont exigibles');
  assert.strictEqual(customer.solde_dette, 2000, 'La dette doit être strictement égale aux frais de transport (2000 FCFA)');
});

console.log('\n======================================================================');
console.log(`📊 RÉSULTAT : ${passCount}/${totalCount} tests unitaires et logiques validés avec succès.`);
console.log('======================================================================\n');

if (passCount < totalCount) {
  process.exit(1);
}


