/**
 * Utilitaires d'exportation de données au format CSV (Optimisé MS Excel France)
 */

export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const stringified = String(str).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  // Séparateur point-virgule (;) obligatoire pour ouverture propre dans MS Excel en Français
  const headerLine = headers.map(h => escapeCSV(h.label)).join(';');
  const rowLines = rows.map(row => {
    return headers.map(h => {
      const val = typeof h.accessor === 'function' ? h.accessor(row) : row[h.accessor];
      return escapeCSV(val);
    }).join(';');
  });

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n'); // \uFEFF pour l'encodage UTF-8 Excel BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportOrdersCSV(orders, customersList = []) {
  const getClientObj = (r) => {
    if (Array.isArray(customersList) && customersList.length > 0) {
      const cid = r.client_id || r.customer_id;
      if (cid) {
        const found = customersList.find(c => String(c.id) === String(cid));
        if (found) return found;
      }
    }
    return null;
  };

  const getClientName = (r) => {
    if (r.client_prenom || r.client_nom) {
      const p = r.client_prenom || '';
      const n = r.client_nom || '';
      const full = `${p} ${n}`.trim();
      if (full) return full;
    }
    if (r.client_name) return r.client_name;
    if (r.customer_name) return r.customer_name;
    const c = getClientObj(r);
    if (c) return `${c.prenom || ''} ${c.nom || ''}`.trim();
    return 'Client Anonyme';
  };

  const getClientPhone = (r) => {
    if (r.client_telephone) return r.client_telephone;
    if (r.client_phone) return r.client_phone;
    const c = getClientObj(r);
    if (c) return c.telephone || c.phone || 'N/A';
    return 'N/A';
  };

  const getStatusLabel = (s) => {
    const labels = {
      en_attente: 'En attente',
      traitement: 'Traitement',
      en_cours_lavage: 'Lavage',
      en_cours_repassage: 'Repassage',
      pret: 'Prêt',
      a_livrer: 'À livrer',
      a_recuperer: 'À récupérer',
      en_cours_livraison: 'En livraison',
      restitue: 'Livré / Récupéré',
      annule: 'Annulée'
    };
    return labels[s] || s || 'Nouveau';
  };

  const getPaymentStatus = (r) => {
    if (r.statut_paiement === 'paye' || r.est_paye === true || r.est_paye === 'true') return 'Payé';
    if (r.statut_paiement === 'acompte' || (r.acompte_montant && r.acompte_montant > 0) || (r.avance_payee && r.avance_payee > 0)) return 'Acompte Versé';
    return 'Non Payé';
  };

  const headers = [
    { label: 'Code Commande', accessor: r => r.identifiant_unique_marquage || r.code_commande || r.id },
    { label: 'Client', accessor: getClientName },
    { label: 'Téléphone Client', accessor: getClientPhone },
    { label: 'Article', accessor: r => r.type_article || 'Non renseigné' },
    { label: 'Service', accessor: r => r.type_service || 'Standard' },
    { label: 'Statut Commande', accessor: r => getStatusLabel(r.statut) },
    { label: 'Total (FCFA)', accessor: r => r.prix_total || r.total || r.total_ttc || 0 },
    { label: 'Acompte Versé (FCFA)', accessor: r => r.acompte_montant || r.avance_payee || 0 },
    { label: 'Reste à Payer (FCFA)', accessor: r => r.reste_a_payer !== undefined ? r.reste_a_payer : Math.max(0, (r.prix_total || r.total || 0) - (r.acompte_montant || r.avance_payee || 0)) },
    { label: 'Statut Paiement', accessor: getPaymentStatus },
    { label: 'Urgence', accessor: r => r.niveau_urgence || 'Normale' },
    { label: 'Date Création', accessor: r => r.created_at ? new Date(r.created_at).toLocaleString('fr-FR') : '' },
    { label: 'Date Livraison Prévue', accessor: r => r.date_livraison_prevue || r.due_date || '' }
  ];

  exportToCSV(`Commandes_KlinUp_${new Date().toISOString().slice(0, 10)}.csv`, headers, orders);
}

export function exportCustomersCSV(customers) {
  const headers = [
    { label: 'ID Client', accessor: 'id' },
    { label: 'Prénom', accessor: r => r.prenom || '' },
    { label: 'Nom', accessor: r => r.nom || '' },
    { label: 'Téléphone', accessor: r => r.telephone || r.phone || '' },
    { label: 'Adresse', accessor: r => r.adresse || r.address || 'Non renseignée' },
    { label: 'Solde Dette (FCFA)', accessor: r => r.solde_dette || 0 },
    { label: 'Points Fidélité', accessor: r => r.points_fidelite || 0 },
    { label: 'Abonnement Actif', accessor: r => r.active_subscription ? r.active_subscription.name : (r.abonnement_actif || 'Aucun') },
    { label: 'Articles Restants Abn.', accessor: r => r.active_subscription ? r.active_subscription.remaining_clothes : (r.articles_restants || 0) }
  ];

  exportToCSV(`Clients_KlinUp_${new Date().toISOString().slice(0, 10)}.csv`, headers, customers);
}

export function exportLogsCSV(logs, staffList = [], storesList = []) {
  const actionLabels = {
    CONNEXION: 'Connexion Utilisateur',
    DECONNEXION: 'Déconnexion Session',
    CREATION_COMMANDE: 'Nouvelle Commande',
    ANNULATION_COMMANDE: 'Annulation Commande',
    MISE_A_JOUR_STATUT: 'Changement Statut Commande',
    PAIEMENT_FINAL: 'Règlement Commande',
    COMMANDE_ABONNEMENT: 'Débit Abonnement Commande',
    CREATION_CLIENT: 'Nouveau Client',
    MODIFICATION_CLIENT: 'Mise à Jour Client',
    SUPPRESSION_CLIENT: 'Suppression Client',
    SOUSCRIPTION_ABONNEMENT: 'Souscription Abonnement',
    DESABONNEMENT: 'Résiliation Abonnement',
    MAJ_SOLDE_FINANCIER: 'Ajustement Dette Client',
    CHANGEMENT_POINT_LAVERIE: 'Gestion Point de Laverie',
    CREATION_POINT_LAVERIE: 'Création Point de Laverie',
    MODIFICATION_POINT_LAVERIE: 'Modification Point de Laverie',
    SUPPRESSION_POINT_LAVERIE: 'Suppression Point de Laverie',
    AJOUT_CATALOGUE: 'Ajout Article Catalogue',
    MODIFICATION_TARIF: 'Modification Tarif Catalogue',
    SUPPRESSION_CATALOGUE: 'Suppression Article Catalogue'
  };

  const headers = [
    { label: 'ID Trace', accessor: 'id' },
    { label: 'Horodatage (ISO)', accessor: r => r.timestamp || r.created_at || '' },
    { label: 'Date & Heure', accessor: r => (r.timestamp || r.created_at) ? new Date(r.timestamp || r.created_at).toLocaleString('fr-FR') : '' },
    { label: 'Opérateur / Utilisateur', accessor: r => {
      if (r.user_id) {
        const u = staffList.find(s => String(s.id) === String(r.user_id));
        if (u) return `${u.prenom || ''} ${u.nom || ''}`.trim();
      }
      return r.user_name || r.user_label || 'Automate / Système';
    }},
    { label: 'Rôle Utilisateur', accessor: r => {
      if (r.user_id) {
        const u = staffList.find(s => String(s.id) === String(r.user_id));
        if (u) return u.role || 'Agent';
      }
      return r.user_role || 'Système';
    }},
    { label: 'Point de Laverie', accessor: r => {
      if (r.store_name) return r.store_name;
      const user = Array.isArray(staffList) ? staffList.find(s => String(s.id) === String(r.user_id)) : null;
      const targetStoreId = r.store_id || user?.store_id;

      if (targetStoreId && Array.isArray(storesList) && storesList.length > 0) {
        const found = storesList.find(st => String(st.id) === String(targetStoreId));
        if (found && (found.nom || found.name || found.store_name)) {
          return found.nom || found.name || found.store_name;
        }
      }
      if (targetStoreId && targetStoreId !== 'store_central' && targetStoreId !== 'all') {
        return targetStoreId;
      }
      return 'Point Central';
    }},
    { label: 'Action Exécutée', accessor: r => actionLabels[r.action] || r.action || 'Action Système' },
    { label: 'Détails & Motif de l\'Opération', accessor: r => r.details || r.description || '' }
  ];

  exportToCSV(`Audit_Logs_KlinUp_${new Date().toISOString().slice(0, 10)}.csv`, headers, logs);
}
