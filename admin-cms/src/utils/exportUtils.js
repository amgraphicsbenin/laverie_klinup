/**
 * Utilitaires d'exportation de données au format CSV
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

  const headerLine = headers.map(h => escapeCSV(h.label)).join(',');
  const rowLines = rows.map(row => {
    return headers.map(h => {
      const val = typeof h.accessor === 'function' ? h.accessor(row) : row[h.accessor];
      return escapeCSV(val);
    }).join(',');
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

export function exportOrdersCSV(orders) {
  const headers = [
    { label: 'ID Commande', accessor: 'id' },
    { label: 'Client', accessor: r => `${r.client_prenom || ''} ${r.client_nom || ''}`.trim() },
    { label: 'Téléphone Client', accessor: 'client_telephone' },
    { label: 'Statut Commande', accessor: 'statut' },
    { label: 'Total TTC (FCFA)', accessor: r => r.prix_total || r.total_ttc || 0 },
    { label: 'Acompte Versé (FCFA)', accessor: r => r.acompte_montant || 0 },
    { label: 'Reste à Payer (FCFA)', accessor: r => r.reste_a_payer !== undefined ? r.reste_a_payer : ((r.prix_total || 0) - (r.acompte_montant || 0)) },
    { label: 'Statut Paiement', accessor: 'est_paye' },
    { label: 'Urgence', accessor: 'niveau_urgence' },
    { label: 'Date Création', accessor: 'created_at' },
    { label: 'Date Livraison Prévue', accessor: 'due_date' }
  ];
  exportToCSV(`Commandes_KlinUp_${new Date().toISOString().slice(0, 10)}.csv`, headers, orders);
}

export function exportCustomersCSV(customers) {
  const headers = [
    { label: 'ID Client', accessor: 'id' },
    { label: 'Prénom', accessor: 'prenom' },
    { label: 'Nom', accessor: 'nom' },
    { label: 'Téléphone', accessor: 'telephone' },
    { label: 'Adresse', accessor: 'adresse' },
    { label: 'Solde Dette (FCFA)', accessor: 'solde_dette' },
    { label: 'Points Fidélité', accessor: 'points_fidelite' },
    { label: 'Abonnement Actif', accessor: r => r.active_subscription ? r.active_subscription.name : 'Aucun' },
    { label: 'Articles Restants Abn.', accessor: r => r.active_subscription ? r.active_subscription.remaining_clothes : 0 }
  ];
  exportToCSV(`Clients_KlinUp_${new Date().toISOString().slice(0, 10)}.csv`, headers, customers);
}

export function exportLogsCSV(logs, staffList = []) {
  const headers = [
    { label: 'ID Trace', accessor: 'id' },
    { label: 'Horodatage (ISO)', accessor: 'timestamp' },
    { label: 'Date & Heure Formatées', accessor: r => new Date(r.timestamp).toLocaleString() },
    { label: 'Opérateur / Utilisateur', accessor: r => {
      const u = staffList.find(s => s.id === r.user_id);
      return u ? `${u.prenom} ${u.nom}` : 'Automate / Système';
    }},
    { label: 'Rôle Utilisateur', accessor: r => {
      const u = staffList.find(s => s.id === r.user_id);
      return u ? u.role : 'Système';
    }},
    { label: 'Point de Laverie (Store ID)', accessor: r => r.store_id || 'store_central' },
    { label: 'Code Action', accessor: 'action' },
    { label: 'Détails & Motif de l\'Opération', accessor: 'details' }
  ];
  exportToCSV(`Audit_Logs_KlinUp_${new Date().toISOString().slice(0, 10)}.csv`, headers, logs);
}
