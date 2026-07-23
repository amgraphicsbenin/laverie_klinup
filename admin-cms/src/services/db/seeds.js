export const STORAGE_KEYS = {
  STAFF: 'klin_up_staff_profiles',
  CUSTOMERS: 'klin_up_customers',
  ORDERS: 'klin_up_orders',
  LOGS: 'klin_up_activity_logs',
  CATALOG: 'klin_up_catalog',
  CURRENT_USER: 'klin_up_current_user'
};

export const DEFAULT_STAFF = [
  { id: 'u1', nom: 'Gomez', prenom: 'Jean-Luc', role: 'super_admin', email: 'jean-luc.gomez@klinup.com', code_pin: '111111', created_at: new Date().toISOString() },
  { id: 'u2', nom: 'Koffi', prenom: 'Marie-Antoinette', role: 'manager', email: 'marie.koffi@klinup.com', code_pin: '222222', created_at: new Date().toISOString() },
  { id: 'u3', nom: 'Diallo', prenom: 'Pierre', role: 'agent_accueil', email: 'pierre.diallo@klinup.com', code_pin: '333333', created_at: new Date().toISOString() },
  { id: 'u4', nom: 'Koutomi', prenom: 'André', role: 'super_admin', email: 'andre.koutomi98@gmail.com', code_pin: '000000', created_at: new Date().toISOString() },
  { id: 'u5', nom: 'Sosso', prenom: 'Paul', role: 'livreur', email: 'paul.sosso@klinup.com', code_pin: '444444', created_at: new Date().toISOString() },
  { id: 'u6', nom: 'Kole', prenom: 'Moussa', role: 'agent_lavage_repassage', email: 'moussa.kole@klinup.com', code_pin: '555555', created_at: new Date().toISOString() }
];

export const DEFAULT_CUSTOMERS = [];
export const DEFAULT_ORDERS = [];
export const DEFAULT_LOGS = [];

export const DEFAULT_CATALOG = [
  // Chemise
  { id: 'cat1', article: 'Chemise', service: 'lavage_simple', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat2', article: 'Chemise', service: 'nettoyage_a_sec', prix: 3000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat3', article: 'Chemise', service: 'repassage', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Pantalon
  { id: 'cat4', article: 'Pantalon', service: 'lavage_simple', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat5', article: 'Pantalon', service: 'nettoyage_a_sec', prix: 3500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat6', article: 'Pantalon', service: 'repassage', prix: 1200, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Robe
  { id: 'cat7', article: 'Robe', service: 'lavage_simple', prix: 2500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat8', article: 'Robe', service: 'nettoyage_a_sec', prix: 4500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat9', article: 'Robe', service: 'repassage', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Combinaison
  { id: 'cat10', article: 'Combinaison', service: 'lavage_simple', prix: 3000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat11', article: 'Combinaison', service: 'nettoyage_a_sec', prix: 5000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat12', article: 'Combinaison', service: 'repassage', prix: 1800, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Jupe
  { id: 'cat_jupe_ls', article: 'Jupe', service: 'lavage_simple', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_jupe_nas', article: 'Jupe', service: 'nettoyage_a_sec', prix: 3000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_jupe_rep', article: 'Jupe', service: 'repassage', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Pull
  { id: 'cat_pull_ls', article: 'Pull', service: 'lavage_simple', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_pull_nas', article: 'Pull', service: 'nettoyage_a_sec', prix: 3500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_pull_rep', article: 'Pull', service: 'repassage', prix: 1200, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Culotte
  { id: 'cat_culotte_ls', article: 'Culotte', service: 'lavage_simple', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_culotte_nas', article: 'Culotte', service: 'nettoyage_a_sec', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_culotte_rep', article: 'Culotte', service: 'repassage', prix: 600, categorie: 'individuel', is_active: true, statut: 'actif' },

  // T-shirt
  { id: 'cat_tshirt_ls', article: 'T-shirt', service: 'lavage_simple', prix: 1200, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_tshirt_nas', article: 'T-shirt', service: 'nettoyage_a_sec', prix: 2200, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_tshirt_rep', article: 'T-shirt', service: 'repassage', prix: 700, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Polo
  { id: 'cat_polo_ls', article: 'Polo', service: 'lavage_simple', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_polo_nas', article: 'Polo', service: 'nettoyage_a_sec', prix: 2500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_polo_rep', article: 'Polo', service: 'repassage', prix: 800, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Blouson
  { id: 'cat_blouson_ls', article: 'Blouson', service: 'lavage_simple', prix: 3000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_blouson_nas', article: 'Blouson', service: 'nettoyage_a_sec', prix: 5000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_blouson_rep', article: 'Blouson', service: 'repassage', prix: 1800, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Veste
  { id: 'cat_veste_ls', article: 'Veste', service: 'lavage_simple', prix: 3500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_veste_nas', article: 'Veste', service: 'nettoyage_a_sec', prix: 6000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_veste_rep', article: 'Veste', service: 'repassage', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Costume
  { id: 'cat_costume_ls', article: 'Costume', service: 'lavage_simple', prix: 5000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_costume_nas', article: 'Costume', service: 'nettoyage_a_sec', prix: 8000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_costume_rep', article: 'Costume', service: 'repassage', prix: 3000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Cravate
  { id: 'cat_cravate_ls', article: 'Cravate', service: 'lavage_simple', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_cravate_nas', article: 'Cravate', service: 'nettoyage_a_sec', prix: 1800, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_cravate_rep', article: 'Cravate', service: 'repassage', prix: 500, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Haut
  { id: 'cat_haut_ls', article: 'Haut', service: 'lavage_simple', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_haut_nas', article: 'Haut', service: 'nettoyage_a_sec', prix: 2800, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_haut_rep', article: 'Haut', service: 'repassage', prix: 900, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Débardeur
  { id: 'cat_debardeur_ls', article: 'Débardeur', service: 'lavage_simple', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_debardeur_nas', article: 'Débardeur', service: 'nettoyage_a_sec', prix: 1800, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_debardeur_rep', article: 'Débardeur', service: 'repassage', prix: 500, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Jeans
  { id: 'cat_jeans_ls', article: 'Jeans', service: 'lavage_simple', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_jeans_nas', article: 'Jeans', service: 'nettoyage_a_sec', prix: 3500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_jeans_rep', article: 'Jeans', service: 'repassage', prix: 1200, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Robe de mariée
  { id: 'cat_robemariee_ls', article: 'Robe de mariée', service: 'lavage_simple', prix: 12000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_robemariee_nas', article: 'Robe de mariée', service: 'nettoyage_a_sec', prix: 20000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_robemariee_rep', article: 'Robe de mariée', service: 'repassage', prix: 6000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Couette Légère
  { id: 'cat_couettelegee_ls', article: 'Couette Legée', service: 'lavage_simple', prix: 3500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_couettelegee_nas', article: 'Couette Legée', service: 'nettoyage_a_sec', prix: 5500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_couettelegee_rep', article: 'Couette Legée', service: 'repassage', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Couette lourde
  { id: 'cat_couettelourd_ls', article: 'Couette lourd', service: 'lavage_simple', prix: 5000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_couettelourd_nas', article: 'Couette lourd', service: 'nettoyage_a_sec', prix: 8000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_couettelourd_rep', article: 'Couette lourd', service: 'repassage', prix: 3000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // 1Draps+ 2 taies
  { id: 'cat_1draps2taies_ls', article: '1Draps+ 2 taies', service: 'lavage_simple', prix: 2500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_1draps2taies_nas', article: '1Draps+ 2 taies', service: 'nettoyage_a_sec', prix: 4000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_1draps2taies_rep', article: '1Draps+ 2 taies', service: 'repassage', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },

  // 2 draps+ 2 taies
  { id: 'cat_2draps2taies_ls', article: '2 draps+ 2 taies', service: 'lavage_simple', prix: 3500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_2draps2taies_nas', article: '2 draps+ 2 taies', service: 'nettoyage_a_sec', prix: 5500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_2draps2taies_rep', article: '2 draps+ 2 taies', service: 'repassage', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Taies
  { id: 'cat_taies_ls', article: 'Taies', service: 'lavage_simple', prix: 800, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_taies_nas', article: 'Taies', service: 'nettoyage_a_sec', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_taies_rep', article: 'Taies', service: 'repassage', prix: 500, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Petite serviette
  { id: 'cat_petiteserviette_ls', article: 'Petite serviette', service: 'lavage_simple', prix: 800, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_petiteserviette_nas', article: 'Petite serviette', service: 'nettoyage_a_sec', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_petiteserviette_rep', article: 'Petite serviette', service: 'repassage', prix: 500, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Grandes serviettes
  { id: 'cat_grandesserviettes_ls', article: 'Grandes serviettes', service: 'lavage_simple', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_grandesserviettes_nas', article: 'Grandes serviettes', service: 'nettoyage_a_sec', prix: 2500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_grandesserviettes_rep', article: 'Grandes serviettes', service: 'repassage', prix: 900, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Ensemble 2 pièces
  { id: 'cat_ensemble2piece_ls', article: 'Ensemble 2 pièce', service: 'lavage_simple', prix: 3500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_ensemble2piece_nas', article: 'Ensemble 2 pièce', service: 'nettoyage_a_sec', prix: 6000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_ensemble2piece_rep', article: 'Ensemble 2 pièce', service: 'repassage', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Ensemble 3 pièces
  { id: 'cat_ensemble3pieces_ls', article: 'Ensemble 3 pièces', service: 'lavage_simple', prix: 5000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_ensemble3pieces_nas', article: 'Ensemble 3 pièces', service: 'nettoyage_a_sec', prix: 8500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_ensemble3pieces_rep', article: 'Ensemble 3 pièces', service: 'repassage', prix: 3000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Chapeau
  { id: 'cat_chapeau_ls', article: 'Chapeau', service: 'lavage_simple', prix: 1500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_chapeau_nas', article: 'Chapeau', service: 'nettoyage_a_sec', prix: 2500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_chapeau_rep', article: 'Chapeau', service: 'repassage', prix: 800, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Chaussette
  { id: 'cat_chausette_ls', article: 'Chaussette', service: 'lavage_simple', prix: 500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_chausette_nas', article: 'Chaussette', service: 'nettoyage_a_sec', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_chausette_rep', article: 'Chaussette', service: 'repassage', prix: 300, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Nappe de table
  { id: 'cat_nappetable_ls', article: 'Nappe de table', service: 'lavage_simple', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_nappetable_nas', article: 'Nappe de table', service: 'nettoyage_a_sec', prix: 3500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_nappetable_rep', article: 'Nappe de table', service: 'repassage', prix: 1200, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Rideau
  { id: 'cat_rideau_ls', article: 'Rideau', service: 'lavage_simple', prix: 3000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_rideau_nas', article: 'Rideau', service: 'nettoyage_a_sec', prix: 5000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_rideau_rep', article: 'Rideau', service: 'repassage', prix: 2000, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Robe fantaisiste
  { id: 'cat_robefantaisiste_ls', article: 'Robe fantaisiste', service: 'lavage_simple', prix: 4000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_robefantaisiste_nas', article: 'Robe fantaisiste', service: 'nettoyage_a_sec', prix: 7000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_robefantaisiste_rep', article: 'Robe fantaisiste', service: 'repassage', prix: 2500, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Serpillière
  { id: 'cat_serpilliere_ls', article: 'Serpillière', service: 'lavage_simple', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_serpilliere_nas', article: 'Serpillière', service: 'nettoyage_a_sec', prix: 1800, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_serpilliere_rep', article: 'Serpillière', service: 'repassage', prix: 500, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Torchon
  { id: 'cat_torchon_ls', article: 'Torchon', service: 'lavage_simple', prix: 500, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_torchon_nas', article: 'Torchon', service: 'nettoyage_a_sec', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_torchon_rep', article: 'Torchon', service: 'repassage', prix: 300, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Foulard
  { id: 'cat_foulard_ls', article: 'Foulard', service: 'lavage_simple', prix: 1000, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_foulard_nas', article: 'Foulard', service: 'nettoyage_a_sec', prix: 1800, categorie: 'individuel', is_active: true, statut: 'actif' },
  { id: 'cat_foulard_rep', article: 'Foulard', service: 'repassage', prix: 600, categorie: 'individuel', is_active: true, statut: 'actif' },

  // Abonnements
  { id: 'sub1', article: 'Offre Active', service: 'abonnement', prix: 20000, description: '25 vêtements | Livraison et ramassage gratuits', categorie: 'abonnement', nombre_vetements: 25, ramassage: true, nombre_ramassages: null, ramassage_gratuit: true, livraison_gratuite: true, is_active: true, statut: 'actif' },
  { id: 'sub2', article: 'Abonnement Premium', service: 'abonnement', prix: 35000, description: '50 vêtements max/mois | 2 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement', nombre_vetements: 50, ramassage: true, nombre_ramassages: 2, ramassage_gratuit: true, livraison_gratuite: true, is_active: true, statut: 'actif' },
  { id: 'sub3', article: 'Abonnement Prestige', service: 'abonnement', prix: 60000, description: '100 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement', nombre_vetements: 100, ramassage: true, nombre_ramassages: 4, ramassage_gratuit: true, livraison_gratuite: true, is_active: true, statut: 'actif' },
  { id: 'sub4', article: 'Abonnement VIP', service: 'abonnement', prix: 100000, description: '200 vêtements max/mois | 4 ramassages max par mois | Ramassage et livraison gratuits', categorie: 'abonnement', nombre_vetements: 200, ramassage: true, nombre_ramassages: 4, ramassage_gratuit: true, livraison_gratuite: true, is_active: true, statut: 'actif' },

  // Paramètres Système
  { id: 'setting_express_hours', article: 'Délai Express (heures)', service: 'system', prix: 6, categorie: 'system_setting', description: 'Configuration système', is_active: true, statut: 'actif' },
  { id: 'setting_normal_hours', article: 'Délai Normal (heures)', service: 'system', prix: 48, categorie: 'system_setting', description: 'Configuration système', is_active: true, statut: 'actif' },
  { id: 'setting_express_markup', article: 'Majoration Express (%)', service: 'system', prix: 50, categorie: 'system_setting', description: 'Configuration système', is_active: true, statut: 'actif' }
];
