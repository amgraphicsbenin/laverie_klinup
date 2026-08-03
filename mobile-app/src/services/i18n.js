/**
 * @file i18n.js
 * @description Service d'internationalisation KLIN UP.
 * Gère les traductions français, anglais et la sélection de langue.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { memoryDb } from './db/dbEngine';

const STORAGE_KEY_LANG = 'klin_up_language';

// Langues disponibles
export const LANGUAGES = [
  { code: 'fr', label: 'Français', nativeLabel: 'Français' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Español', nativeLabel: 'Español' },
  { code: 'pt', label: 'Português', nativeLabel: 'Português' },
  { code: 'ar', label: 'العربية', nativeLabel: 'العربية (Arabe)' },
  { code: 'yo', label: 'Yorùbá', nativeLabel: 'Yorùbá' },
  { code: 'fon', label: 'Fon', nativeLabel: 'Fon' },
];

/**
 * Traductions complètes de l'application KLIN UP.
 * Organisées par module fonctionnel.
 */
const translations = {
  fr: {
    // ── App Globale ──
    app: {
      loading: 'Chargement de KLIN UP...',
      error_detected: 'Erreur détectée',
      no_stack_trace: 'Pas de trace d\'empilement disponible',
      success: 'Succès',
      information: 'Information',
      ok: 'OK',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      close: 'Fermer',
      save: 'Enregistrer',
      delete: 'Supprimer',
    },
    // ── Navigation ──
    nav: {
      accueil: 'Accueil',
      gestion: 'Gestion',
      ajouter: 'Ajouter',
      historique: 'Historique',
      profil: 'Profil',
    },
    // ── Connexion ──
    auth: {
      login_title: 'Connexion KLIN UP',
      login_subtitle: 'Connectez-vous pour accéder à la plateforme de caisse & atelier.',
      pin_title: 'Vérifiez votre identité',
      pin_subtitle: 'Entrez votre code PIN à 6 chiffres pour accéder à l\'espace de travail.',
      email_label: 'Email',
      email_placeholder: 'Entrez votre adresse email',
      login_button: 'Se connecter',
      logout_confirm_title: 'Déconnexion',
      logout_confirm_message: 'Voulez-vous vraiment vous déconnecter de votre session ?',
      logout_action: 'Déconnexion',
      error_inactive: 'Ce compte utilisateur est inactif ou suspendu. Veuillez contacter votre administrateur.',
      error_email_not_found: 'Email introuvable. Veuillez vérifier vos identifiants.',
      error_wrong_pin: 'Code PIN incorrect. Veuillez réessayer.',
      pin_digits: '6 chiffres',
    },
    // ── Rôles ──
    roles: {
      super_admin: 'Super Administrateur',
      manager: 'Gestionnaire',
      editeur_catalogue: 'Éditeur Catalogue',
      livreur: 'Livreur',
      agent_lavage_repassage: 'Atelier Lavage & Repassage',
      agent_accueil: "Agent d'accueil",
      invité: 'Invité',
    },
    // ── Dashboard ──
    dashboard: {
      greeting: 'Salut',
      ca_mensuel: 'CA Mensuel',
      panier_moyen: 'Panier Moyen',
      recolte_jour: 'Récolte du Jour',
      colis_jour: 'Colis du Jour',
      commandes_aujourdhui: "Commandes d'aujourd'hui",
      voir_tout: 'Voir tout',
      nouveau: 'Nouveau',
      en_cours: 'En cours',
      pret: 'Prêt',
      livre: 'Livré',
      activite_recente: 'Activité Récente',
      aucune_commande: 'Aucune commande aujourd\'hui',
      evolution_jour: 'évolution jour',
      vs_sem_passee: 'vs sem. passée',
      vs_mois_passe: 'vs mois passé',
      vs_an_passe: 'vs an passé',
      cette_annee: 'Cette Année',
      personnalise: 'Personnalisé',
      date_debut: 'Date début',
      date_fin: 'Date fin',
      appliquer: 'Appliquer',
    },
    // ── Gestion des Commandes ──
    orders: {
      gestion_title: 'Gestion des Commandes',
      rechercher: 'Rechercher une commande...',
      filtre_tous: 'Tous',
      filtre_aujourdhui: "Aujourd'hui",
      filtre_semaine: 'Cette Semaine',
      filtre_mois: 'Ce Mois',
      statut_en_attente: 'En attente',
      statut_traitement: 'En cours de traitement',
      statut_lavage: 'Lavage en cours',
      statut_repassage: 'Repassage en cours',
      statut_pret: 'Prête',
      statut_a_livrer: 'Prête à livrer',
      statut_a_recuperer: 'À récupérer',
      statut_livraison: 'En cours de livraison',
      statut_restitue: 'Livrée / Restituée',
      statut_annule: 'Annulée',
      statut_maj: 'Mise à jour',
      nouvelle_commande: '🧺 Nouvelle commande enregistrée',
      commande_pret: '✅ Commande prête !',
      livraison_cours: '🛵 Livraison en cours',
      commande_livree: '🎉 Commande livrée',
      commande_annulee: '⚠️ Commande annulée',
      statut_mis_a_jour: '📦 Statut mis à jour',
    },
    // ── Création de Commande ──
    order_create: {
      title: 'Nouvelle Commande',
      client_section: 'Informations Client',
      articles_section: 'Articles',
      resume_section: 'Résumé & Validation',
      select_client: 'Sélectionner un client',
      chercher_client: 'Rechercher un client...',
      ajouter_article: 'Ajouter un article',
      type_article: 'Type d\'article',
      type_service: 'Type de service',
      quantite: 'Quantité',
      urgence: 'Niveau d\'urgence',
      normal: 'Normal',
      express: 'Express',
      mode_paiement: 'Mode de paiement',
      especes: 'Espèces',
      mobile_money: 'Mobile Money',
      carte: 'Carte',
      abonnement: 'Abonnement',
      avance: 'Avance',
      remise: 'Remise (%)',
      total: 'Total',
      creer_commande: 'Créer la commande',
      reference_momo: 'Référence Mobile Money',
      ref_placeholder: 'Entrez le numéro de référence',
      cancel_confirm_title: 'Confirmer l\'annulation',
      cancel_confirm_message: 'Voulez-vous vraiment annuler la création de cette commande ? Toutes les informations saisies seront réinitialisées.',
      cancel_continue: 'Continuer l\'édition',
      cancel_yes: 'Oui, annuler',
      error_no_client: 'Veuillez sélectionner un client.',
      error_no_article: 'Veuillez ajouter au moins un article.',
      error_solde_insuffisant: 'Solde insuffisant',
      error_ref_momo_required: 'Numéro de référence Mobile Money requis.',
      error_ref_momo_title: 'Confirmation Mobile Money requise',
      error_ref_momo_message: 'Veuillez saisir le numéro de référence de la transaction Mobile Money avant de valider la création de la commande.',
      success_created: 'Commande créée avec succès !',
      error_create: 'Impossible de créer la commande.',
    },
    // ── Historique ──
    history: {
      title: 'Historique des Commandes',
      search_placeholder: 'Rechercher par référence, client...',
      filtre_tous: 'Tous',
      filtre_aujourdhui: "Aujourd'hui",
      filtre_7j: '7 Derniers Jours',
      filtre_30j: '30 Derniers Jours',
      filtre_mois: 'Ce Mois-ci',
      filtre_personnalise: 'Personnalisé',
      date_debut: 'Date début',
      date_fin: 'Date fin',
      appliquer: 'Appliquer',
      exporter: 'Exporter',
      total_commandes: 'Total commandes',
      revenu_total: 'Revenu total',
      aucune_commande: 'Aucune commande trouvée',
    },
    // ── Profil ──
    profile: {
      title: 'Mon Profil',
      activite_session: 'Activité de la Session (Aujourd\'hui)',
      commandes_crees: 'Commandes créées',
      volume_encaisse: 'Volume encaissé',
      mes_performances: 'Mes performances',
      activite_aujourdhui: "Activité d'aujourd'hui",
      performance_mois: 'Performance du Mois',
      bilan_global: 'Bilan Global Agent',
      total_commandes_agent: 'Commandes gérées',
      ca_cumule: 'Chiffre d\'affaires généré',
      express_gerees: 'Commandes Express',
      commandes_livrees: 'Commandes finalisées',
      preferences: 'Préférences Caisse',
      mode_sombre: 'Mode Sombre',
      notifications: 'Notifications en temps réel',
      langue: 'Langue de l\'interface',
      securite: 'Sécurité & Compte',
      modifier_pin: 'Modifier mon code PIN',
      se_deconnecter: 'Se déconnecter',
      modifier_pin_title: 'Modifier mon code PIN',
      pin_actuel: 'Code PIN actuel',
      nouveau_pin: 'Nouveau code PIN (6 chiffres)',
      confirmer_pin: 'Confirmer le changement',
      pin_error_fields: 'Tous les champs sont obligatoires.',
      pin_error_length: 'Le nouveau code PIN doit faire 6 chiffres.',
      pin_error_current: 'Code PIN actuel incorrect.',
      pin_success: 'Votre code PIN a été modifié avec succès.',
      pin_error_update: 'Impossible de modifier le code PIN.',
      support_title: 'Support Technique',
      support_message: 'Besoin d\'assistance avec l\'application ou la caisse ?\n\nEmail : andre.koutomi98@gmail.com\nContact : +229 01 67 98 77 97 (Tél / WhatsApp)',
      support_button: 'Support Technique Administrateur',
      version: 'KLIN UP Mobile v1.5.0 — Caisse & Gestion',
      back: 'Retour',
      email_non_config: 'non configuré',
    },
    // ── Détail Client ──
    client: {
      title: 'Détails du Client',
      telephone: 'Téléphone',
      adresse: 'Adresse',
      solde: 'Solde',
      points_fidelite: 'Points Fidélité',
      commandes: 'Commandes',
      total_depenses: 'Total Dépenses',
      abonnement_actif: 'Abonnement Actif',
      aucun_abonnement: 'Aucun abonnement actif',
      reste: 'Restant',
      vetements: 'vêtements',
      commande_recente: 'Commandes Récentes',
      aucune_commande: 'Aucune commande pour ce client',
      nouvel_abonnement: 'Nouvel Abonnement',
      prendre_abonnement: 'Prendre un abonnement',
      fermer: 'Fermer',
    },
    // ── Notifications ──
    notifications: {
      title: 'Notifications',
      aucune: 'Aucune notification',
      marquer_tout_lu: 'Tout marquer comme lu',
      effacer_tout: 'Tout effacer',
      notification: 'notification',
      notifications_pl: 'notifications',
      non_lues: 'non lues',
      ordre: 'commande',
      type_alerte: 'Alerte',
    },
    // ── Formule d'abonnement ──
    subscription: {
      title: 'Formules d\'abonnement',
      souscrire: 'Souscrire',
      mois: '/mois',
      vetements_inclus: 'vêtements inclus',
      ramassage_gratuit: 'Ramassage gratuit',
      livraison_gratuite: 'Livraison gratuite',
      ramassages: 'ramassages/mois',
      offre_active: 'Offre Active',
      premium: 'Abonnement Premium',
      prestige: 'Abonnement Prestige',
      vip: 'Abonnement VIP',
    },
    // ── Statuts abrégés ──
    status_labels: {
      en_attente: 'En attente',
      attente: 'En attente',
      traitement: 'En cours de traitement',
      en_cours_lavage: 'Lavage en cours',
      lavage: 'Lavage en cours',
      en_cours_repassage: 'Repassage en cours',
      repassage: 'Repassage en cours',
      pret: 'Prête',
      a_livrer: 'Prête à livrer',
      a_recuperer: 'À récupérer',
      en_cours_livraison: 'En cours de livraison',
      restitue: 'Livrée / Restituée',
      livre: 'Livrée / Restituée',
      annule: 'Annulée',
    },
    // ── Logs d'activité ──
    logs: {
      connexion: 'CONNEXION',
      deconnexion: 'DECONNEXION',
      creation_commande: 'CREATION_COMMANDE',
      maj_statut: 'MISE_A_JOUR_STATUT',
      annulation: 'ANNULATION_COMMANDE',
      creation_client: 'CREATION_CLIENT',
      modification_client: 'MODIFICATION_CLIENT',
      suppression_client: 'SUPPRESSION_CLIENT',
      paiement_final: 'PAIEMENT_FINAL',
      souscription: 'SOUSCRIPTION_ABONNEMENT',
      commande_abonnement: 'COMMANDE_ABONNEMENT',
      connexion_log: 'Connexion de',
      deconnexion_log: 'Déconnexion de l\'utilisateur',
    },
    // ── Alertes ──
    alert: {
      error: 'Erreur',
      success: 'Succès',
      warning: 'Attention',
      info: 'Information',
      compris: 'Compris',
    },
    // ── Mois ──
    months: {
      janvier: 'Janvier',
      fevrier: 'Février',
      mars: 'Mars',
      avril: 'Avril',
      mai: 'Mai',
      juin: 'Juin',
      juillet: 'Juillet',
      aout: 'Août',
      septembre: 'Septembre',
      octobre: 'Octobre',
      novembre: 'Novembre',
      decembre: 'Décembre',
    },
    // ── Jours ──
    days: {
      lundi: 'Lundi',
      mardi: 'Mardi',
      mercredi: 'Mercredi',
      jeudi: 'Jeudi',
      vendredi: 'Vendredi',
      samedi: 'Samedi',
      dimanche: 'Dimanche',
    },
  },

  // ════════════════════════════════════════════════
  // ENGLISH TRANSLATIONS
  // ════════════════════════════════════════════════
  en: {
    app: {
      loading: 'Loading KLIN UP...',
      error_detected: 'Error Detected',
      no_stack_trace: 'No stack trace available',
      success: 'Success',
      information: 'Information',
      ok: 'OK',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      save: 'Save',
      delete: 'Delete',
    },
    nav: {
      accueil: 'Home',
      gestion: 'Manage',
      ajouter: 'Add',
      historique: 'History',
      profil: 'Profile',
    },
    auth: {
      login_title: 'KLIN UP Login',
      login_subtitle: 'Log in to access the cash register & workshop platform.',
      pin_title: 'Verify Your Identity',
      pin_subtitle: 'Enter your 6-digit PIN code to access the workspace.',
      email_label: 'Email',
      email_placeholder: 'Enter your email address',
      login_button: 'Sign In',
      logout_confirm_title: 'Logout',
      logout_confirm_message: 'Are you sure you want to log out of your session?',
      logout_action: 'Logout',
      error_inactive: 'This user account is inactive or suspended. Please contact your administrator.',
      error_email_not_found: 'Email not found. Please check your credentials.',
      error_wrong_pin: 'Incorrect PIN. Please try again.',
      pin_digits: '6 digits',
    },
    roles: {
      super_admin: 'Super Administrator',
      manager: 'Manager',
      editeur_catalogue: 'Catalog Editor',
      livreur: 'Delivery Driver',
      agent_lavage_repassage: 'Wash & Iron Workshop',
      agent_accueil: 'Front Desk Agent',
      invité: 'Guest',
    },
    dashboard: {
      greeting: 'Hi',
      ca_mensuel: 'Monthly Revenue',
      panier_moyen: 'Average Basket',
      recolte_jour: 'Daily Collection',
      colis_jour: 'Daily Parcels',
      commandes_aujourdhui: "Today's Orders",
      voir_tout: 'View All',
      nouveau: 'New',
      en_cours: 'In Progress',
      pret: 'Ready',
      livre: 'Delivered',
      activite_recente: 'Recent Activity',
      aucune_commande: 'No orders today',
    },
    orders: {
      gestion_title: 'Order Management',
      rechercher: 'Search orders...',
      filtre_tous: 'All',
      filtre_aujourdhui: 'Today',
      filtre_semaine: 'This Week',
      filtre_mois: 'This Month',
      statut_en_attente: 'Pending',
      statut_traitement: 'Processing',
      statut_lavage: 'Washing',
      statut_repassage: 'Ironing',
      statut_pret: 'Ready',
      statut_a_livrer: 'Ready to deliver',
      statut_a_recuperer: 'Pick up',
      statut_livraison: 'Delivering',
      statut_restitue: 'Delivered / Returned',
      statut_annule: 'Cancelled',
      statut_maj: 'Update',
      nouvelle_commande: '🧺 New order recorded',
      commande_pret: '✅ Order ready!',
      livraison_cours: '🛵 Delivery in progress',
      commande_livree: '🎉 Order delivered',
      commande_annulee: '⚠️ Order cancelled',
      statut_mis_a_jour: '📦 Status updated',
    },
    order_create: {
      title: 'New Order',
      client_section: 'Client Information',
      articles_section: 'Items',
      resume_section: 'Summary & Validation',
      select_client: 'Select a client',
      chercher_client: 'Search client...',
      ajouter_article: 'Add item',
      type_article: 'Item type',
      type_service: 'Service type',
      quantite: 'Quantity',
      urgence: 'Urgency level',
      normal: 'Normal',
      express: 'Express',
      mode_paiement: 'Payment method',
      especes: 'Cash',
      mobile_money: 'Mobile Money',
      carte: 'Card',
      abonnement: 'Subscription',
      avance: 'Deposit',
      remise: 'Discount (%)',
      total: 'Total',
      creer_commande: 'Create order',
      reference_momo: 'Mobile Money Reference',
      ref_placeholder: 'Enter reference number',
      cancel_confirm_title: 'Confirm cancellation',
      cancel_confirm_message: 'Are you sure you want to cancel this order? All entered information will be reset.',
      cancel_continue: 'Continue editing',
      cancel_yes: 'Yes, cancel',
      error_no_client: 'Please select a client.',
      error_no_article: 'Please add at least one item.',
      error_solde_insuffisant: 'Insufficient balance',
      error_ref_momo_required: 'Mobile Money reference number required.',
      error_ref_momo_title: 'Mobile Money Confirmation Required',
      error_ref_momo_message: 'Please enter the Mobile Money transaction reference number before confirming the order.',
      success_created: 'Order created successfully!',
      error_create: 'Unable to create order.',
    },
    history: {
      title: 'Order History',
      search_placeholder: 'Search by reference, client...',
      filtre_tous: 'All',
      filtre_aujourdhui: 'Today',
      filtre_7j: 'Last 7 Days',
      filtre_30j: 'Last 30 Days',
      filtre_mois: 'This Month',
      filtre_personnalise: 'Custom',
      date_debut: 'Start date',
      date_fin: 'End date',
      appliquer: 'Apply',
      exporter: 'Export',
      total_commandes: 'Total orders',
      revenu_total: 'Total revenue',
      aucune_commande: 'No orders found',
    },
    profile: {
      title: 'My Profile',
      activite_session: 'Session Activity (Today)',
      commandes_crees: 'Orders created',
      volume_encaisse: 'Revenue volume',
      preferences: 'Cash Register Preferences',
      mode_sombre: 'Dark Mode',
      notifications: 'Real-time notifications',
      langue: 'Interface Language',
      securite: 'Security & Account',
      modifier_pin: 'Change my PIN code',
      se_deconnecter: 'Log out',
      modifier_pin_title: 'Change my PIN code',
      pin_actuel: 'Current PIN code',
      nouveau_pin: 'New PIN code (6 digits)',
      confirmer_pin: 'Confirm change',
      pin_error_fields: 'All fields are required.',
      pin_error_length: 'New PIN code must be 6 digits.',
      pin_error_current: 'Current PIN code is incorrect.',
      pin_success: 'Your PIN code has been changed successfully.',
      pin_error_update: 'Unable to change PIN code.',
      support_title: 'Technical Support',
      support_message: 'Need help with the app or cash register?\n\nEmail: andre.koutomi98@gmail.com\nContact: +229 01 67 98 77 97 (Phone / WhatsApp)',
      support_button: 'Administrator Tech Support',
      version: 'KLIN UP Mobile v1.5.0 — Cash Register & Management',
      back: 'Back',
      email_non_config: 'not configured',
    },
    client: {
      title: 'Client Details',
      telephone: 'Phone',
      adresse: 'Address',
      solde: 'Balance',
      points_fidelite: 'Loyalty Points',
      commandes: 'Orders',
      total_depenses: 'Total Spent',
      abonnement_actif: 'Active Subscription',
      aucun_abonnement: 'No active subscription',
      reste: 'Remaining',
      vetements: 'clothes',
      commande_recente: 'Recent Orders',
      aucune_commande: 'No orders for this client',
      nouvel_abonnement: 'New Subscription',
      prendre_abonnement: 'Get a subscription',
      fermer: 'Close',
    },
    notifications: {
      title: 'Notifications',
      aucune: 'No notifications',
      marquer_tout_lu: 'Mark all as read',
      effacer_tout: 'Clear all',
      notification: 'notification',
      notifications_pl: 'notifications',
      non_lues: 'unread',
      ordre: 'order',
      type_alerte: 'Alert',
    },
    subscription: {
      title: 'Subscription Plans',
      souscrire: 'Subscribe',
      mois: '/month',
      vetements_inclus: 'clothes included',
      ramassage_gratuit: 'Free pickup',
      livraison_gratuite: 'Free delivery',
      ramassages: 'pickups/month',
      offre_active: 'Active Offer',
      premium: 'Premium Subscription',
      prestige: 'Prestige Subscription',
      vip: 'VIP Subscription',
    },
    status_labels: {
      en_attente: 'Pending',
      attente: 'Pending',
      traitement: 'Processing',
      en_cours_lavage: 'Washing',
      lavage: 'Washing',
      en_cours_repassage: 'Ironing',
      repassage: 'Ironing',
      pret: 'Ready',
      a_livrer: 'Ready to deliver',
      a_recuperer: 'To pick up',
      en_cours_livraison: 'Delivering',
      restitue: 'Delivered / Returned',
      livre: 'Delivered / Returned',
      annule: 'Cancelled',
    },
    logs: {
      connexion: 'LOGIN',
      deconnexion: 'LOGOUT',
      creation_commande: 'ORDER_CREATION',
      maj_statut: 'STATUS_UPDATE',
      annulation: 'ORDER_CANCELLATION',
      creation_client: 'CLIENT_CREATION',
      modification_client: 'CLIENT_MODIFICATION',
      suppression_client: 'CLIENT_DELETION',
      paiement_final: 'FINAL_PAYMENT',
      souscription: 'SUBSCRIPTION',
      commande_abonnement: 'SUBSCRIPTION_ORDER',
      connexion_log: 'Login of',
      deconnexion_log: 'User logout',
    },
    alert: {
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      compris: 'Got it',
    },
    months: {
      janvier: 'January',
      fevrier: 'February',
      mars: 'March',
      avril: 'April',
      mai: 'May',
      juin: 'June',
      juillet: 'July',
      aout: 'August',
      septembre: 'September',
      octobre: 'October',
      novembre: 'November',
      decembre: 'December',
    },
    days: {
      lundi: 'Monday',
      mardi: 'Tuesday',
      mercredi: 'Wednesday',
      jeudi: 'Thursday',
      vendredi: 'Friday',
      samedi: 'Saturday',
      dimanche: 'Sunday',
    },
  },

  // ════════════════════════════════════════════════
  // SPANISH TRANSLATIONS
  // ════════════════════════════════════════════════
  es: {
    app: {
      loading: 'Cargando KLIN UP...',
      error_detected: 'Error Detectado',
      no_stack_trace: 'No hay traza de pila disponible',
      success: 'Éxito',
      information: 'Información',
      ok: 'OK',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      close: 'Cerrar',
      save: 'Guardar',
      delete: 'Eliminar',
    },
    nav: {
      accueil: 'Inicio',
      gestion: 'Gestión',
      ajouter: 'Añadir',
      historique: 'Historial',
      profil: 'Perfil',
    },
    auth: {
      login_title: 'Inicio de Sesión KLIN UP',
      login_subtitle: 'Inicie sesión para acceder a la plataforma de caja y taller.',
      pin_title: 'Verifique su Identidad',
      pin_subtitle: 'Ingrese su código PIN de 6 dígitos para acceder al espacio de trabajo.',
      email_label: 'Correo electrónico',
      email_placeholder: 'Ingrese su correo electrónico',
      login_button: 'Iniciar Sesión',
      logout_confirm_title: 'Cerrar Sesión',
      logout_confirm_message: '¿Está seguro de que desea cerrar su sesión?',
      logout_action: 'Cerrar Sesión',
      error_inactive: 'Esta cuenta de usuario está inactiva o suspendida. Contacte a su administrador.',
      error_email_not_found: 'Correo no encontrado. Verifique sus credenciales.',
      error_wrong_pin: 'PIN incorrecto. Intente nuevamente.',
      pin_digits: '6 dígitos',
    },
    roles: {
      super_admin: 'Super Administrador',
      manager: 'Gerente',
      livreur: 'Repartidor',
      agent_lavage_repassage: 'Taller de Lavado y Planchado',
      agent_accueil: 'Agente de Recepción',
      invité: 'Invitado',
    },
    dashboard: {
      greeting: 'Hola',
      ca_mensuel: 'Ingresos Mensuales',
      panier_moyen: 'Canasta Promedio',
      recolte_jour: 'Recolección del Día',
      colis_jour: 'Paquetes del Día',
      commandes_aujourdhui: 'Pedidos de Hoy',
      voir_tout: 'Ver Todo',
      nouveau: 'Nuevo',
      en_cours: 'En Proceso',
      pret: 'Listo',
      livre: 'Entregado',
      activite_recente: 'Actividad Reciente',
      aucune_commande: 'Sin pedidos hoy',
    },
    orders: {
      gestion_title: 'Gestión de Pedidos',
      rechercher: 'Buscar pedidos...',
      filtre_tous: 'Todos',
      filtre_aujourdhui: 'Hoy',
      filtre_semaine: 'Esta Semana',
      filtre_mois: 'Este Mes',
      statut_en_attente: 'Pendiente',
      statut_traitement: 'Procesando',
      statut_lavage: 'Lavando',
      statut_repassage: 'Planchando',
      statut_pret: 'Listo',
      statut_a_livrer: 'Listo para entregar',
      statut_a_recuperer: 'Para recoger',
      statut_livraison: 'Entregando',
      statut_restitue: 'Entregado / Devuelto',
      statut_annule: 'Cancelado',
      statut_maj: 'Actualización',
      nouvelle_commande: '🧺 Nuevo pedido registrado',
      commande_pret: '✅ ¡Pedido listo!',
      livraison_cours: '🛵 Entrega en curso',
      commande_livree: '🎉 Pedido entregado',
      commande_annulee: '⚠️ Pedido cancelado',
      statut_mis_a_jour: '📦 Estado actualizado',
    },
    order_create: {
      title: 'Nuevo Pedido',
      client_section: 'Información del Cliente',
      articles_section: 'Artículos',
      resume_section: 'Resumen y Validación',
      select_client: 'Seleccionar un cliente',
      chercher_client: 'Buscar cliente...',
      ajouter_article: 'Añadir artículo',
      type_article: 'Tipo de artículo',
      type_service: 'Tipo de servicio',
      quantite: 'Cantidad',
      urgence: 'Nivel de urgencia',
      normal: 'Normal',
      express: 'Express',
      mode_paiement: 'Método de pago',
      especes: 'Efectivo',
      mobile_money: 'Mobile Money',
      carte: 'Tarjeta',
      abonnement: 'Suscripción',
      avance: 'Anticipo',
      remise: 'Descuento (%)',
      total: 'Total',
      creer_commande: 'Crear pedido',
      reference_momo: 'Referencia Mobile Money',
      ref_placeholder: 'Ingrese el número de referencia',
      cancel_confirm_title: 'Confirmar cancelación',
      cancel_confirm_message: '¿Está seguro de cancelar este pedido? Toda la información ingresada se restablecerá.',
      cancel_continue: 'Continuar editando',
      cancel_yes: 'Sí, cancelar',
      error_no_client: 'Por favor seleccione un cliente.',
      error_no_article: 'Por favor añada al menos un artículo.',
      error_solde_insuffisant: 'Saldo insuficiente',
      error_ref_momo_required: 'Número de referencia Mobile Money requerido.',
      error_ref_momo_title: 'Confirmación Mobile Money Requerida',
      error_ref_momo_message: 'Por favor ingrese el número de referencia de la transacción Mobile Money antes de confirmar el pedido.',
      success_created: '¡Pedido creado exitosamente!',
      error_create: 'No se pudo crear el pedido.',
    },
    history: {
      title: 'Historial de Pedidos',
      search_placeholder: 'Buscar por referencia, cliente...',
      filtre_tous: 'Todos',
      filtre_aujourdhui: 'Hoy',
      filtre_7j: 'Últimos 7 Días',
      filtre_30j: 'Últimos 30 Días',
      filtre_mois: 'Este Mes',
      filtre_personnalise: 'Personalizado',
      date_debut: 'Fecha inicio',
      date_fin: 'Fecha fin',
      appliquer: 'Aplicar',
      exporter: 'Exportar',
      total_commandes: 'Total pedidos',
      revenu_total: 'Ingresos totales',
      aucune_commande: 'No se encontraron pedidos',
    },
    profile: {
      title: 'Mi Perfil',
      activite_session: 'Actividad de la Sesión (Hoy)',
      commandes_crees: 'Pedidos creados',
      volume_encaisse: 'Volumen cobrado',
      preferences: 'Preferencias de Caja',
      mode_sombre: 'Modo Oscuro',
      notifications: 'Notificaciones en tiempo real',
      langue: 'Idioma de la interfaz',
      securite: 'Seguridad y Cuenta',
      modifier_pin: 'Cambiar mi código PIN',
      se_deconnecter: 'Cerrar sesión',
      modifier_pin_title: 'Cambiar mi código PIN',
      pin_actuel: 'Código PIN actual',
      nouveau_pin: 'Nuevo código PIN (6 dígitos)',
      confirmer_pin: 'Confirmar cambio',
      pin_error_fields: 'Todos los campos son obligatorios.',
      pin_error_length: 'El nuevo PIN debe tener 6 dígitos.',
      pin_error_current: 'El código PIN actual es incorrecto.',
      pin_success: 'Su código PIN se ha cambiado exitosamente.',
      pin_error_update: 'No se pudo cambiar el código PIN.',
      support_title: 'Soporte Técnico',
      support_message: '¿Necesita ayuda con la aplicación o la caja?\n\nCorreo: andre.koutomi98@gmail.com\nContacto: +229 01 67 98 77 97 (Tel / WhatsApp)',
      support_button: 'Soporte Técnico Administrador',
      version: 'KLIN UP Mobile v1.5.0 — Caja y Gestión',
      back: 'Volver',
      email_non_config: 'no configurado',
    },
    client: {
      title: 'Detalles del Cliente',
      telephone: 'Teléfono',
      adresse: 'Dirección',
      solde: 'Saldo',
      points_fidelite: 'Puntos de Fidelidad',
      commandes: 'Pedidos',
      total_depenses: 'Total Gastado',
      abonnement_actif: 'Suscripción Activa',
      aucun_abonnement: 'Sin suscripción activa',
      reste: 'Restante',
      vetements: 'prendas',
      commande_recente: 'Pedidos Recientes',
      aucune_commande: 'Sin pedidos para este cliente',
      nouvel_abonnement: 'Nueva Suscripción',
      prendre_abonnement: 'Obtener suscripción',
      fermer: 'Cerrar',
    },
    notifications: {
      title: 'Notificaciones',
      aucune: 'Sin notificaciones',
      marquer_tout_lu: 'Marcar todo como leído',
      effacer_tout: 'Borrar todo',
      notification: 'notificación',
      notifications_pl: 'notificaciones',
      non_lues: 'no leídas',
      ordre: 'pedido',
      type_alerte: 'Alerta',
    },
    subscription: {
      title: 'Planes de Suscripción',
      souscrire: 'Suscribirse',
      mois: '/mes',
      vetements_inclus: 'prendas incluidas',
      ramassage_gratuit: 'Recogida gratuita',
      livraison_gratuite: 'Entrega gratuita',
      ramassages: 'recogidas/mes',
      offre_active: 'Oferta Activa',
      premium: 'Suscripción Premium',
      prestige: 'Suscripción Prestige',
      vip: 'Suscripción VIP',
    },
    status_labels: {
      en_attente: 'Pendiente',
      attente: 'Pendiente',
      traitement: 'Procesando',
      en_cours_lavage: 'Lavando',
      lavage: 'Lavando',
      en_cours_repassage: 'Planchando',
      repassage: 'Planchando',
      pret: 'Listo',
      a_livrer: 'Listo para entregar',
      a_recuperer: 'Para recoger',
      en_cours_livraison: 'Entregando',
      restitue: 'Entregado / Devuelto',
      livre: 'Entregado / Devuelto',
      annule: 'Cancelado',
    },
    alert: {
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información',
      compris: 'Entendido',
    },
    months: {
      janvier: 'Enero',
      fevrier: 'Febrero',
      mars: 'Marzo',
      avril: 'Abril',
      mai: 'Mayo',
      juin: 'Junio',
      juillet: 'Julio',
      aout: 'Agosto',
      septembre: 'Septiembre',
      octobre: 'Octubre',
      novembre: 'Noviembre',
      decembre: 'Diciembre',
    },
    days: {
      lundi: 'Lunes',
      mardi: 'Martes',
      mercredi: 'Miércoles',
      jeudi: 'Jueves',
      vendredi: 'Viernes',
      samedi: 'Sábado',
      dimanche: 'Domingo',
    },
  },

  // ════════════════════════════════════════════════
  // PORTUGUESE TRANSLATIONS
  // ════════════════════════════════════════════════
  pt: {
    app: {
      loading: 'Carregando KLIN UP...',
      error_detected: 'Erro Detectado',
      no_stack_trace: 'Nenhum stack trace disponível',
      success: 'Sucesso',
      information: 'Informação',
      ok: 'OK',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      close: 'Fechar',
      save: 'Salvar',
      delete: 'Excluir',
    },
    nav: {
      accueil: 'Início',
      gestion: 'Gestão',
      ajouter: 'Adicionar',
      historique: 'Histórico',
      profil: 'Perfil',
    },
    auth: {
      login_title: 'Login KLIN UP',
      login_subtitle: 'Faça login para acessar a plataforma de caixa e oficina.',
      pin_title: 'Verifique sua Identidade',
      pin_subtitle: 'Digite seu código PIN de 6 dígitos para acessar o espaço de trabalho.',
      email_label: 'Email',
      email_placeholder: 'Digite seu endereço de email',
      login_button: 'Entrar',
      logout_confirm_title: 'Sair',
      logout_confirm_message: 'Tem certeza de que deseja sair da sua sessão?',
      logout_action: 'Sair',
      error_inactive: 'Esta conta de usuário está inativa ou suspensa. Contate seu administrador.',
      error_email_not_found: 'Email não encontrado. Verifique suas credenciais.',
      error_wrong_pin: 'PIN incorreto. Tente novamente.',
      pin_digits: '6 dígitos',
    },
    roles: {
      super_admin: 'Super Administrador',
      manager: 'Gerente',
      livreur: 'Entregador',
      agent_lavage_repassage: 'Oficina de Lavagem e Passadoria',
      agent_accueil: 'Agente de Recepção',
      invité: 'Convidado',
    },
    dashboard: {
      greeting: 'Olá',
      ca_mensuel: 'Receita Mensal',
      panier_moyen: 'Cesta Média',
      recolte_jour: 'Coleta do Dia',
      colis_jour: 'Pacotes do Dia',
      commandes_aujourdhui: 'Pedidos de Hoje',
      voir_tout: 'Ver Tudo',
      nouveau: 'Novo',
      en_cours: 'Em Andamento',
      pret: 'Pronto',
      livre: 'Entregue',
      activite_recente: 'Atividade Recente',
      aucune_commande: 'Nenhum pedido hoje',
    },
    orders: {
      gestion_title: 'Gestão de Pedidos',
      rechercher: 'Buscar pedidos...',
      filtre_tous: 'Todos',
      filtre_aujourdhui: 'Hoje',
      filtre_semaine: 'Esta Semana',
      filtre_mois: 'Este Mês',
      statut_en_attente: 'Pendente',
      statut_traitement: 'Processando',
      statut_lavage: 'Lavando',
      statut_repassage: 'Passando',
      statut_pret: 'Pronto',
      statut_a_livrer: 'Pronto para entregar',
      statut_a_recuperer: 'Para retirar',
      statut_livraison: 'Entregando',
      statut_restitue: 'Entregue / Devolvido',
      statut_annule: 'Cancelado',
      statut_maj: 'Atualização',
      nouvelle_commande: '🧺 Novo pedido registrado',
      commande_pret: '✅ Pedido pronto!',
      livraison_cours: '🛵 Entrega em andamento',
      commande_livree: '🎉 Pedido entregue',
      commande_annulee: '⚠️ Pedido cancelado',
      statut_mis_a_jour: '📦 Status atualizado',
    },
    order_create: {
      title: 'Novo Pedido',
      client_section: 'Informações do Cliente',
      articles_section: 'Itens',
      resume_section: 'Resumo e Validação',
      select_client: 'Selecionar um cliente',
      chercher_client: 'Buscar cliente...',
      ajouter_article: 'Adicionar item',
      type_article: 'Tipo de item',
      type_service: 'Tipo de serviço',
      quantite: 'Quantidade',
      urgence: 'Nível de urgência',
      normal: 'Normal',
      express: 'Express',
      mode_paiement: 'Forma de pagamento',
      especes: 'Dinheiro',
      mobile_money: 'Mobile Money',
      carte: 'Cartão',
      abonnement: 'Assinatura',
      avance: 'Adiantamento',
      remise: 'Desconto (%)',
      total: 'Total',
      creer_commande: 'Criar pedido',
      reference_momo: 'Referência Mobile Money',
      ref_placeholder: 'Digite o número de referência',
      cancel_confirm_title: 'Confirmar cancelamento',
      cancel_confirm_message: 'Tem certeza de que deseja cancelar este pedido? Todas as informações serão redefinidas.',
      cancel_continue: 'Continuar editando',
      cancel_yes: 'Sim, cancelar',
      error_no_client: 'Por favor, selecione um cliente.',
      error_no_article: 'Por favor, adicione pelo menos um item.',
      error_solde_insuffisant: 'Saldo insuficiente',
      error_ref_momo_required: 'Número de referência Mobile Money obrigatório.',
      error_ref_momo_title: 'Confirmação Mobile Money Obrigatória',
      error_ref_momo_message: 'Por favor, digite o número de referência da transação Mobile Money antes de confirmar o pedido.',
      success_created: 'Pedido criado com sucesso!',
      error_create: 'Não foi possível criar o pedido.',
    },
    history: {
      title: 'Histórico de Pedidos',
      search_placeholder: 'Buscar por referência, cliente...',
      filtre_tous: 'Todos',
      filtre_aujourdhui: 'Hoje',
      filtre_7j: 'Últimos 7 Dias',
      filtre_30j: 'Últimos 30 Dias',
      filtre_mois: 'Este Mês',
      filtre_personnalise: 'Personalizado',
      date_debut: 'Data início',
      date_fin: 'Data fim',
      appliquer: 'Aplicar',
      exporter: 'Exportar',
      total_commandes: 'Total pedidos',
      revenu_total: 'Receita total',
      aucune_commande: 'Nenhum pedido encontrado',
    },
    profile: {
      title: 'Meu Perfil',
      activite_session: 'Atividade da Sessão (Hoje)',
      commandes_crees: 'Pedidos criados',
      volume_encaisse: 'Volume recebido',
      preferences: 'Preferências do Caixa',
      mode_sombre: 'Modo Escuro',
      notifications: 'Notificações em tempo real',
      langue: 'Idioma da interface',
      securite: 'Segurança e Conta',
      modifier_pin: 'Alterar meu código PIN',
      se_deconnecter: 'Sair',
      modifier_pin_title: 'Alterar meu código PIN',
      pin_actuel: 'Código PIN atual',
      nouveau_pin: 'Novo código PIN (6 dígitos)',
      confirmer_pin: 'Confirmar alteração',
      pin_error_fields: 'Todos os campos são obrigatórios.',
      pin_error_length: 'O novo PIN deve ter 6 dígitos.',
      pin_error_current: 'O código PIN atual está incorreto.',
      pin_success: 'Seu código PIN foi alterado com sucesso.',
      pin_error_update: 'Não foi possível alterar o código PIN.',
      support_title: 'Suporte Técnico',
      support_message: 'Precisa de ajuda com o aplicativo ou caixa?\n\nE-mail: andre.koutomi98@gmail.com\nContato: +229 01 67 98 77 97 (Tel / WhatsApp)',
      support_button: 'Suporte Técnico Administrador',
      version: 'KLIN UP Mobile v1.5.0 — Caixa e Gestão',
      back: 'Voltar',
      email_non_config: 'não configurado',
    },
    client: {
      title: 'Detalhes do Cliente',
      telephone: 'Telefone',
      adresse: 'Endereço',
      solde: 'Saldo',
      points_fidelite: 'Pontos de Fidelidade',
      commandes: 'Pedidos',
      total_depenses: 'Total Gasto',
      abonnement_actif: 'Assinatura Ativa',
      aucun_abonnement: 'Sem assinatura ativa',
      reste: 'Restante',
      vetements: 'roupas',
      commande_recente: 'Pedidos Recentes',
      aucune_commande: 'Nenhum pedido para este cliente',
      nouvel_abonnement: 'Nova Assinatura',
      prendre_abonnement: 'Obter assinatura',
      fermer: 'Fechar',
    },
    notifications: {
      title: 'Notificações',
      aucune: 'Sem notificações',
      marquer_tout_lu: 'Marcar tudo como lido',
      effacer_tout: 'Limpar tudo',
      notification: 'notificação',
      notifications_pl: 'notificações',
      non_lues: 'não lidas',
      ordre: 'pedido',
      type_alerte: 'Alerta',
    },
    subscription: {
      title: 'Planos de Assinatura',
      souscrire: 'Assinar',
      mois: '/mês',
      vetements_inclus: 'roupas incluídas',
      ramassage_gratuit: 'Coleta gratuita',
      livraison_gratuite: 'Entrega gratuita',
      ramassages: 'coletas/mês',
      offre_active: 'Oferta Ativa',
      premium: 'Assinatura Premium',
      prestige: 'Assinatura Prestige',
      vip: 'Assinatura VIP',
    },
    status_labels: {
      en_attente: 'Pendente',
      attente: 'Pendente',
      traitement: 'Processando',
      en_cours_lavage: 'Lavando',
      lavage: 'Lavando',
      en_cours_repassage: 'Passando',
      repassage: 'Passando',
      pret: 'Pronto',
      a_livrer: 'Pronto para entregar',
      a_recuperer: 'Para retirar',
      en_cours_livraison: 'Entregando',
      restitue: 'Entregue / Devolvido',
      livre: 'Entregue / Devolvido',
      annule: 'Cancelado',
    },
    alert: {
      error: 'Erro',
      success: 'Sucesso',
      warning: 'Aviso',
      info: 'Informação',
      compris: 'Entendi',
    },
    months: {
      janvier: 'Janeiro',
      fevrier: 'Fevereiro',
      mars: 'Março',
      avril: 'Abril',
      mai: 'Maio',
      juin: 'Junho',
      juillet: 'Julho',
      aout: 'Agosto',
      septembre: 'Setembro',
      octobre: 'Outubro',
      novembre: 'Novembro',
      decembre: 'Dezembro',
    },
    days: {
      lundi: 'Segunda-feira',
      mardi: 'Terça-feira',
      mercredi: 'Quarta-feira',
      jeudi: 'Quinta-feira',
      vendredi: 'Sexta-feira',
      samedi: 'Sábado',
      dimanche: 'Domingo',
    },
  },
};

// ── État actuel de la langue ──
let _currentLang = 'fr';

// ── Écouteurs de changement de langue ──
const _langListeners = new Set();

/**
 * Notifie les écouteurs d'un changement de langue.
 */
function notifyLangChange() {
  _langListeners.forEach(listener => {
    try { listener(_currentLang); } catch (e) { /* ignore */ }
  });
}

/**
 * S'abonne aux changements de langue.
 * @param {Function} listener - Callback appelé avec le nouveau code langue.
 * @returns {Function} Fonction pour annuler l'abonnement.
 */
export function subscribeToLangChange(listener) {
  _langListeners.add(listener);
  return () => _langListeners.delete(listener);
}

/**
 * Traduit une clé en fonction de la langue courante.
 * Supporte les clés imbriquées avec la syntaxe pointée (ex: "auth.login_title").
 *
 * @param {string} key - Clé de traduction (ex: "auth.login_title")
 * @param {object} [params] - Paramètres dynamiques à injecter dans la traduction
 * @returns {string} Texte traduit
 */
export function t(key, params = {}, fallbackText = '') {
  const defaultFallback = typeof params === 'string' ? params : (fallbackText || key);
  const paramObj = typeof params === 'object' && params !== null ? params : {};

  const keys = key.split('.');
  let value = translations[_currentLang] || translations.fr;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback vers le français si la clé n'existe pas dans la langue courante
      let fallback = translations.fr;
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return defaultFallback;
        }
      }
      value = fallback;
      break;
    }
  }

  if (typeof value !== 'string') {
    return defaultFallback;
  }

  // Injection des paramètres dynamiques (ex: {name: "Jean"} → "Bonjour Jean")
  if (paramObj && Object.keys(paramObj).length > 0) {
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(paramObj)) {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }
    return result;
  }

  return value;
}

/**
 * Retourne le code de la langue courante.
 * @returns {string} Code langue (ex: "fr", "en")
 */
export function getCurrentLang() {
  return _currentLang;
}

/**
 * Retourne le libellé natif de la langue courante.
 * @returns {string} Ex: "Français", "English"
 */
export function getCurrentLangLabel() {
  const lang = LANGUAGES.find(l => l.code === _currentLang);
  return lang ? lang.nativeLabel : 'Français';
}

/**
 * Change la langue de l'application et persiste le choix.
 * @param {string} langCode - Code de la langue (ex: "fr", "en", "es", "pt")
 */
export async function setLanguage(langCode) {
  if (!translations[langCode]) {
    console.warn(`[i18n] Langue "${langCode}" non disponible.`);
    return;
  }

  _currentLang = langCode;

  // Persister dans AsyncStorage
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LANG, langCode);
  } catch (e) {
    console.warn('[i18n] Sauvegarde de la langue échouée:', e);
  }

  // Mettre à jour memoryDb pour que useDbState détecte le changement
  if (memoryDb) {
    memoryDb.app_language = langCode;
    if (memoryDb.notify) {
      memoryDb.notify();
    }
  }

  notifyLangChange();
  console.log(`[i18n] ✅ Langue changée : ${langCode}`);
}

/**
 * Initialise la langue depuis le stockage local ou utilise le français par défaut.
 */
export async function initLanguage() {
  try {
    const savedLang = await AsyncStorage.getItem(STORAGE_KEY_LANG);
    if (savedLang && translations[savedLang]) {
      _currentLang = savedLang;
    } else {
      _currentLang = 'fr';
    }
  } catch (e) {
    _currentLang = 'fr';
  }

  if (memoryDb) {
    memoryDb.app_language = _currentLang;
  }

  console.log(`[i18n] ✅ Langue initialisée : ${_currentLang}`);
  return _currentLang;
}