import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileSpreadsheet, 
  Download, 
  ExternalLink,
  CheckCircle2, 
  X, 
  Store, 
  Layers, 
  Table,
  Link,
  Edit2,
  Check
} from 'lucide-react';

const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
};

export default function ExportCatalogModal({
  isOpen,
  onClose,
  itemsToExport = [],
  stores = [],
  catalogCategory = 'individuel',
  catalogStoreFilter = 'all'
}) {
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEditingSheetUrl, setIsEditingSheetUrl] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState('');

  // Clé de stockage local pour l'URL Google Sheets associée au point ou globale
  const storageKey = `klinup_google_sheet_url_${catalogStoreFilter || 'all'}`;

  // Récupération de l'URL Google Sheets associée
  const currentStoreObj = useMemo(() => {
    if (!catalogStoreFilter || catalogStoreFilter === 'all' || catalogStoreFilter === 'GLOBAL') {
      return null;
    }
    return stores.find(s => s.id === catalogStoreFilter || s.code === catalogStoreFilter) || null;
  }, [catalogStoreFilter, stores]);

  const associatedSheetUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://docs.google.com/spreadsheets/';
    const storeUrl = currentStoreObj?.google_sheet_url || currentStoreObj?.sheet_url;
    if (storeUrl && storeUrl.trim()) return storeUrl.trim();
    
    const localUrl = localStorage.getItem(storageKey) || localStorage.getItem('klinup_google_sheet_url_all');
    if (localUrl && localUrl.trim()) return localUrl.trim();

    return 'https://docs.google.com/spreadsheets/';
  }, [currentStoreObj, storageKey]);

  useEffect(() => {
    setSheetUrlInput(associatedSheetUrl);
    setIsEditingSheetUrl(false);
  }, [associatedSheetUrl, isOpen]);

  // Informations sur le point de vente actif
  const currentStoreName = useMemo(() => {
    if (!catalogStoreFilter || catalogStoreFilter === 'all' || catalogStoreFilter === 'GLOBAL') {
      return 'Tous les points (Global)';
    }
    return currentStoreObj ? currentStoreObj.nom : catalogStoreFilter;
  }, [catalogStoreFilter, currentStoreObj]);

  // Libellé de la catégorie
  const categoryLabel = useMemo(() => {
    if (catalogCategory === 'individuel') return 'Vêtements Individuels';
    if (catalogCategory === 'abonnement') return 'Abonnements & Forfaits';
    return 'Tous les types';
  }, [catalogCategory]);

  // Construction des données d'export prêtes à l'emploi pour Excel
  const exportData = useMemo(() => {
    const usedNumericIds = new Set();
    const groupsMap = new Map();

    (itemsToExport || []).forEach((item) => {
      if (!item || !item.article) return;
      const cat = (item.categorie || (item.service === 'abonnement' ? 'abonnement' : 'individuel')).toLowerCase().trim();
      if (cat !== 'individuel' && cat !== 'abonnement') return;
      if (item.service === 'system_setting' || item.service === 'reward_catalog') return;

      const storeObj = stores.find(s => s.id === item.store_id || s.code === item.store_id);
      const storeId = storeObj?.id || item.store_id || (stores[0]?.id || 'store_1');
      const storeName = storeObj?.nom || (stores[0]?.nom || 'Point Principal');

      const articleName = item.article.trim();
      const groupKey = `${storeId}__${cat}__${articleName.toLowerCase()}`;

      // Extraction de l'ID numérique de base (supporte "1", "cat1", "1_rep", etc.)
      let numId = null;
      const rawIdStr = String(item.id || '').trim();
      const baseNumericStr = rawIdStr.replace(/_rep$/i, '');
      if (/^\d+$/.test(baseNumericStr)) {
        numId = parseInt(baseNumericStr, 10);
      } else {
        const catMatch = baseNumericStr.match(/^cat(\d+)$/i);
        if (catMatch) numId = parseInt(catMatch[1], 10);
      }

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          numId: (numId && numId > 0) ? numId : null,
          storeId,
          storeName,
          statut: (item.is_active !== false && item.statut !== 0 && item.statut !== 'inactif') ? 1 : 0,
          article: articleName,
          tTraitement: 0,
          tTraitementExpress: 0,
          tRepassage: 0,
          tRepassageExpress: 0,
          cat,
          desc: item.description || (cat === 'abonnement' ? 'Formule abonnement' : 'Prestation pressing et repassage soigné')
        });
      }

      const existingGroup = groupsMap.get(groupKey);

      if (numId && numId > 0 && !existingGroup.numId) {
        existingGroup.numId = numId;
      }
      if (item.is_active !== false && item.statut !== 0 && item.statut !== 'inactif') {
        existingGroup.statut = 1;
      }
      if (item.description && (!existingGroup.desc || existingGroup.desc.startsWith('Prestation') || existingGroup.desc.startsWith('Formule'))) {
        existingGroup.desc = item.description;
      }

      if (cat === 'abonnement') {
        existingGroup.tTraitement = Number(item.prix) || existingGroup.tTraitement || 0;
      } else {
        // Format groupé (CatalogTab filteredCatalog) : sous-objets .traitement/.repassage
        if (item.traitement) {
          existingGroup.tTraitement = Number(item.traitement.prix) || existingGroup.tTraitement || 0;
          existingGroup.tTraitementExpress = Number(item.traitement.prix_urgent) || existingGroup.tTraitementExpress || 0;
        }
        if (item.repassage) {
          existingGroup.tRepassage = Number(item.repassage.prix) || existingGroup.tRepassage || 0;
          existingGroup.tRepassageExpress = Number(item.repassage.prix_urgent) || existingGroup.tRepassageExpress || 0;
        }

        // Format brut base de données (catalog array) : .service + .prix plats
        // Seulement si l'item n'a PAS de sous-objets groupés (sinon on écraserait les bonnes valeurs)
        if (!item.traitement && !item.repassage) {
          if (item.service === 'repassage') {
            existingGroup.tRepassage = Number(item.prix) || existingGroup.tRepassage || 0;
            existingGroup.tRepassageExpress = Number(item.prix_urgent) || existingGroup.tRepassageExpress || 0;
          } else if (item.service === 'lavage_simple' || item.service === 'traitement' || !item.service) {
            existingGroup.tTraitement = Number(item.prix) || existingGroup.tTraitement || 0;
            existingGroup.tTraitementExpress = Number(item.prix_urgent) || existingGroup.tTraitementExpress || 0;
          }
        }
      }
    });

    const rows = Array.from(groupsMap.values());

    // Premier passage : réserver les IDs uniques qui ne sont pas en conflit
    rows.forEach((r) => {
      if (r.numId && r.numId > 0) {
        if (usedNumericIds.has(r.numId)) {
          // Doublon détecté — sera réassigné au passage suivant
          r.numId = null;
        } else {
          usedNumericIds.add(r.numId);
        }
      }
    });

    // Deuxième passage : attribuer un ID unique à ceux qui n'en ont pas
    let nextCandidate = 1;
    rows.forEach((r) => {
      if (!r.numId) {
        while (usedNumericIds.has(nextCandidate)) nextCandidate++;
        r.numId = nextCandidate;
        usedNumericIds.add(nextCandidate);
      }
    });

    // Tri par ID numérique croissant
    rows.sort((a, b) => a.numId - b.numId);

    const storeSuffix = (catalogStoreFilter === 'all' || !catalogStoreFilter) ? 'tous_les_points' : (stores.find(s => s.id === catalogStoreFilter)?.code || 'point').toLowerCase();
    const catSuffix = catalogCategory === 'individuel' ? 'vetements' : (catalogCategory === 'abonnement' ? 'abonnements' : 'global');
    const dateStr = new Date().toISOString().slice(0, 10);

    // FORMAT EXCEL (Délimiteur point-virgule avec BOM UTF-8 pour Microsoft Excel francophone)
    const EXCEL_HEADER = 'ID_Produit;Store_ID;Store_Name;Statut;Article;Tarif_Traitement;Tarif_Traitement_Express;Tarif_Repassage;Tarif_Repassage_Express;Categorie;Description\r\n';
    const excelRows = rows.map(r => [
      r.numId,
      r.storeId,
      `"${r.storeName.replace(/"/g, '""')}"`,
      r.statut,
      `"${r.article.replace(/"/g, '""')}"`,
      r.tTraitement,
      r.tTraitementExpress,
      r.tRepassage,
      r.tRepassageExpress,
      r.cat,
      `"${r.desc.replace(/"/g, '""')}"`
    ].join(';')).join('\r\n');
    const excelContent = '\uFEFF' + EXCEL_HEADER + excelRows;
    const excelFileName = `catalogue_excel_${storeSuffix}_${catSuffix}_${dateStr}.csv`;

    return {
      rows,
      count: rows.length,
      excelContent,
      excelFileName
    };
  }, [itemsToExport, stores, catalogCategory, catalogStoreFilter]);

  if (!isOpen) return null;

  // ACTION 1 : Redirection vers Google Sheets + copie des données dans le presse-papiers
  const handleOpenGoogleSheets = () => {
    let targetUrl = sheetUrlInput.trim();
    if (!targetUrl) {
      targetUrl = 'https://docs.google.com/spreadsheets/';
    } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Sauvegarde de l'URL si modifiée
    try {
      localStorage.setItem(storageKey, targetUrl);
    } catch (e) {
      console.warn("Impossible de sauvegarder l'URL Google Sheets en local", e);
    }

    // Copier les données au format TSV dans le presse-papiers (format natif Google Sheets)
    if (exportData && exportData.count > 0) {
      const TSV_HEADER = 'ID_Produit\tStore_ID\tStore_Name\tStatut\tArticle\tTarif_Traitement\tTarif_Traitement_Express\tTarif_Repassage\tTarif_Repassage_Express\tCategorie\tDescription';
      const tsvRows = exportData.rows.map(r => [
        r.numId,
        r.storeId,
        r.storeName,
        r.statut,
        r.article,
        r.tTraitement,
        r.tTraitementExpress,
        r.tRepassage,
        r.tRepassageExpress,
        r.cat,
        r.desc
      ].join('\t'));
      const tsvContent = TSV_HEADER + '\n' + tsvRows.join('\n');

      try {
        navigator.clipboard.writeText(tsvContent);
      } catch (e) {
        console.warn("Impossible de copier les données dans le presse-papiers", e);
      }
    }

    // Ouvrir l'URL via un élément <a> (plus fiable que window.open dans un contexte de portail React)
    const anchor = document.createElement('a');
    anchor.href = targetUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Fermer la modale après un bref délai pour garantir l'ouverture de l'onglet
    setSuccessMessage(`Feuille Google Sheets ouverte ! Les données (${exportData.count} articles) ont été copiées dans le presse-papiers — collez avec Ctrl+V.`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 2500);
  };

  const handleSaveSheetUrl = () => {
    let targetUrl = sheetUrlInput.trim();
    if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
      setSheetUrlInput(targetUrl);
    }
    try {
      localStorage.setItem(storageKey, targetUrl || 'https://docs.google.com/spreadsheets/');
    } catch (e) {
      console.warn("Erreur sauvegarde URL", e);
    }
    setIsEditingSheetUrl(false);
  };

  // ACTION 2 : Téléchargement du fichier Excel (.csv UTF-8 BOM)
  const handleDownloadExcel = () => {
    if (!exportData || exportData.count === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const blob = new Blob([exportData.excelContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportData.excelFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMessage(`Fichier Excel téléchargé avec succès (${exportData.count} articles) !`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3500);
  };

  return (
    <ModalPortal>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      >
        <div 
          style={{
            background: 'var(--bg-card)',
            width: '100%',
            maxWidth: '560px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to right, rgba(var(--primary-rgb, 59, 130, 246), 0.05), transparent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  Exporter le Catalogue des Produits
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Accédez à Google Sheets ou téléchargez le fichier Excel
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex'
              }}
              title="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* CORPS DE LA MODALE */}
          <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* RÉSUMÉ DE LA SÉLECTION COURANTE */}
            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {categoryLabel}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={15} color="var(--text-secondary)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {currentStoreName}
                </span>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                padding: '0.2rem 0.6rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Table size={13} />
                <span>{exportData.count} article{exportData.count > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* NOTIFICATION DE SUCCÈS EXCEL */}
            {successMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.82rem',
                animation: 'fadeIn 0.2s ease'
              }}>
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* GRILLE DES 2 CHOIX D'EXPORTATION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
              
              {/* CARTE 1 : GOOGLE SHEETS DIRECT (REDIRECTION) */}
              <div 
                style={{
                  background: 'var(--bg-app)',
                  border: '1.5px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Icône Google Sheets */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 9H21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 15H21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 3V21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 3V21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981'
                  }}>
                    Redirection
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Google Sheets
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Redirige et ouvre directement la feuille de calcul Google Sheets associée à votre catalogue.
                  </p>
                </div>

                {/* Lien associé ou configuration */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.72rem'
                }}>
                  <Link size={12} color="var(--text-muted)" />
                  {isEditingSheetUrl ? (
                    <div style={{ display: 'flex', gap: '0.3rem', flex: 1 }}>
                      <input
                        type="text"
                        value={sheetUrlInput}
                        onChange={(e) => setSheetUrlInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        style={{
                          flex: 1,
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-app)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveSheetUrl}
                        style={{
                          background: '#10b981',
                          border: 'none',
                          color: '#fff',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Enregistrer l'URL"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span 
                        style={{ 
                          flex: 1, 
                          color: 'var(--text-secondary)', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          fontFamily: 'monospace' 
                        }}
                        title={sheetUrlInput || 'https://docs.google.com/spreadsheets/'}
                      >
                        {sheetUrlInput ? sheetUrlInput.replace(/^https?:\/\//, '') : 'docs.google.com/spreadsheets'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingSheetUrl(true)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.1rem'
                        }}
                        title="Modifier le lien Google Sheets"
                      >
                        <Edit2 size={12} />
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOpenGoogleSheets}
                  style={{
                    marginTop: 'auto',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    background: '#10b981',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                >
                  <ExternalLink size={15} />
                  <span>Ouvrir Google Sheets</span>
                </button>
              </div>

              {/* CARTE 2 : EXPORT POUR MICROSOFT EXCEL */}
              <div 
                style={{
                  background: 'var(--bg-app)',
                  border: '1.5px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileSpreadsheet size={22} />
                  </div>
                  <span style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)'
                  }}>
                    Fichier Local
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Export Microsoft Excel
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Télécharge le fichier CSV complet avec encodage UTF-8 BOM et séparateurs point-virgule pour Excel.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  style={{
                    marginTop: 'auto',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    background: 'var(--primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                >
                  <Download size={15} />
                  <span>Télécharger pour Excel (.csv)</span>
                </button>
              </div>

            </div>

            {/* PIED DE MODALE */}
            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.9rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                11 colonnes standardisées : ID_Produit, Store_ID, Store_Name, Statut, Article, Tarifs...
              </span>

              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
