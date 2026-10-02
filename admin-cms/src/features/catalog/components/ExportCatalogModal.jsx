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
  Check,
  Copy,
  Info,
  ArrowRight,
  Sparkles
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
  const [step, setStep] = useState('choice'); // 'choice' | 'sheets_guide'
  const [hasCopied, setHasCopied] = useState(false);

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
    if (typeof window === 'undefined') return 'https://sheets.new';
    const storeUrl = currentStoreObj?.google_sheet_url || currentStoreObj?.sheet_url;
    if (storeUrl && storeUrl.trim()) return storeUrl.trim();
    
    const localUrl = localStorage.getItem(storageKey) || localStorage.getItem('klinup_google_sheet_url_all');
    if (localUrl && localUrl.trim()) return localUrl.trim();

    return 'https://sheets.new';
  }, [currentStoreObj, storageKey]);

  useEffect(() => {
    if (isOpen) {
      setSheetUrlInput(associatedSheetUrl);
      setIsEditingSheetUrl(false);
      setStep('choice');
      setHasCopied(false);
      setSuccessMessage(null);
    }
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

  // Construction des données d'export prêtes à l'emploi (TSV Google Sheets, CSV Google Sheets, CSV Excel)
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

    const cleanCell = (str) => String(str ?? '').replace(/[\r\n\t]+/g, ' ').trim();

    // 1. FORMAT GOOGLE SHEETS / TSV POUR PRESSE-PAPIERS (Format natif du copier-coller dans Google Sheets)
    const TSV_HEADER = ['ID_Produit', 'Store_ID', 'Store_Name', 'Statut', 'Article', 'Tarif_Traitement', 'Tarif_Traitement_Express', 'Tarif_Repassage', 'Tarif_Repassage_Express', 'Categorie', 'Description'].join('\t');
    const tsvRows = rows.map(r => [
      r.numId,
      r.storeId,
      cleanCell(r.storeName),
      r.statut,
      cleanCell(r.article),
      r.tTraitement,
      r.tTraitementExpress,
      r.tRepassage,
      r.tRepassageExpress,
      r.cat,
      cleanCell(r.desc)
    ].join('\t')).join('\n');
    const tsvContent = TSV_HEADER + '\n' + tsvRows;

    // 2. FORMAT CSV POUR GOOGLE SHEETS (Délimiteur virgule avec BOM UTF-8)
    const CSV_GS_HEADER = 'ID_Produit,Store_ID,Store_Name,Statut,Article,Tarif_Traitement,Tarif_Traitement_Express,Tarif_Repassage,Tarif_Repassage_Express,Categorie,Description\r\n';
    const csvGsRows = rows.map(r => [
      r.numId,
      r.storeId,
      `"${cleanCell(r.storeName).replace(/"/g, '""')}"`,
      r.statut,
      `"${cleanCell(r.article).replace(/"/g, '""')}"`,
      r.tTraitement,
      r.tTraitementExpress,
      r.tRepassage,
      r.tRepassageExpress,
      r.cat,
      `"${cleanCell(r.desc).replace(/"/g, '""')}"`
    ].join(',')).join('\r\n');
    const googleSheetsContent = '\uFEFF' + CSV_GS_HEADER + csvGsRows;
    const googleSheetsFileName = `catalogue_google_sheets_${storeSuffix}_${catSuffix}_${dateStr}.csv`;

    // 3. FORMAT EXCEL (Délimiteur point-virgule avec BOM UTF-8 pour Microsoft Excel francophone)
    const EXCEL_HEADER = 'ID_Produit;Store_ID;Store_Name;Statut;Article;Tarif_Traitement;Tarif_Traitement_Express;Tarif_Repassage;Tarif_Repassage_Express;Categorie;Description\r\n';
    const excelRows = rows.map(r => [
      r.numId,
      r.storeId,
      `"${cleanCell(r.storeName).replace(/"/g, '""')}"`,
      r.statut,
      `"${cleanCell(r.article).replace(/"/g, '""')}"`,
      r.tTraitement,
      r.tTraitementExpress,
      r.tRepassage,
      r.tRepassageExpress,
      r.cat,
      `"${cleanCell(r.desc).replace(/"/g, '""')}"`
    ].join(';')).join('\r\n');
    const excelContent = '\uFEFF' + EXCEL_HEADER + excelRows;
    const excelFileName = `catalogue_excel_${storeSuffix}_${catSuffix}_${dateStr}.csv`;

    return {
      rows,
      count: rows.length,
      tsvContent,
      googleSheetsContent,
      googleSheetsFileName,
      excelContent,
      excelFileName
    };
  }, [itemsToExport, stores, catalogCategory, catalogStoreFilter]);

  if (!isOpen) return null;

  // UTILITAIRE : Copier dans le presse-papiers avec garantie synchrone + asynchrone
  const copyToClipboard = (text) => {
    let success = false;
    // Fallback synchrone immédiat (garantit la copie pendant l'événement de clic de l'utilisateur)
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 999999);
      success = document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {
      console.warn("execCommand copy error:", e);
    }

    // Clipboard API moderne
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).catch((err) => {
        console.warn("navigator.clipboard.writeText error:", err);
      });
    }

    return success;
  };

  // UTILITAIRE : Téléchargement de fichier Blob
  const downloadBlob = (content, filename, mimeType = 'text/csv;charset=utf-8;') => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch (e) {
      console.error('Erreur téléchargement blob:', e);
      return false;
    }
  };

  // UTILITAIRE : Ouvrir un onglet externe sans blocage popup
  const openNewTab = (url) => {
    let opened = false;
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (win && !win.closed && typeof win.closed !== 'undefined') {
        opened = true;
      }
    } catch (e) {
      console.warn("window.open error:", e);
    }

    if (!opened) {
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } catch (err) {
        console.warn("anchor click error:", err);
      }
    }
  };

  // ACTION 1 : Export vers Google Sheets (Copie presse-papiers + Téléchargement CSV + Ouverture Onglet + Guide)
  const handleOpenGoogleSheets = () => {
    if (!exportData || exportData.count === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    let targetUrl = sheetUrlInput.trim();
    if (!targetUrl || targetUrl === 'https://docs.google.com/spreadsheets/' || targetUrl === 'https://docs.google.com/spreadsheets') {
      targetUrl = 'https://sheets.new';
    } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Sauvegarde de l'URL cible si personnalisée
    try {
      localStorage.setItem(storageKey, targetUrl);
    } catch (e) {
      console.warn("Impossible de sauvegarder l'URL Google Sheets en local", e);
    }

    // 1. Copie garantie des données dans le presse-papiers
    copyToClipboard(exportData.tsvContent);
    setHasCopied(true);

    // 2. Téléchargement automatique du fichier CSV prêt pour Google Sheets
    downloadBlob(exportData.googleSheetsContent, exportData.googleSheetsFileName);

    // 3. Ouverture de Google Sheets dans un nouvel onglet
    openNewTab(targetUrl);

    // 4. Basculer sur l'écran d'accompagnement clair (la modale reste ouverte pour guider l'utilisateur)
    setStep('sheets_guide');
  };

  // ACTION 1.2 : Téléchargement direct du fichier CSV Google Sheets sans ouvrir l'onglet
  const handleDownloadGoogleSheetsCsvOnly = () => {
    if (!exportData || exportData.count === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }
    copyToClipboard(exportData.tsvContent);
    downloadBlob(exportData.googleSheetsContent, exportData.googleSheetsFileName);
    setSuccessMessage(`Fichier Google Sheets CSV téléchargé (${exportData.count} articles) et données copiées dans le presse-papiers !`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleSaveSheetUrl = () => {
    let targetUrl = sheetUrlInput.trim();
    if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
      setSheetUrlInput(targetUrl);
    }
    try {
      localStorage.setItem(storageKey, targetUrl || 'https://sheets.new');
    } catch (e) {
      console.warn("Erreur sauvegarde URL", e);
    }
    setIsEditingSheetUrl(false);
  };

  // ACTION 2 : Téléchargement du fichier Excel (.csv UTF-8 BOM avec séparateur ;)
  const handleDownloadExcel = () => {
    if (!exportData || exportData.count === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    downloadBlob(exportData.excelContent, exportData.excelFileName);

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
            maxWidth: step === 'sheets_guide' ? '640px' : '580px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'max-width 0.2s ease'
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
            background: step === 'sheets_guide'
              ? 'linear-gradient(to right, rgba(16, 185, 129, 0.08), transparent)'
              : 'linear-gradient(to right, rgba(var(--primary-rgb, 59, 130, 246), 0.05), transparent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: step === 'sheets_guide' ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-light)',
                color: step === 'sheets_guide' ? '#10b981' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {step === 'sheets_guide' ? <CheckCircle2 size={22} /> : <FileSpreadsheet size={22} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  {step === 'sheets_guide' ? 'Guide de Transfert vers Google Sheets' : 'Exporter le Catalogue des Produits'}
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  {step === 'sheets_guide'
                    ? `${exportData.count} articles prêts pour votre feuille de calcul`
                    : 'Transférez vers Google Sheets ou téléchargez pour Excel'}
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
          <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '80vh', overflowY: 'auto' }}>
            
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

            {/* NOTIFICATION FLOTTANTE DE SUCCÈS */}
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

            {/* ========================================================================= */}
            {/* VUE 1 : CHOIX DU FORMAT D'EXPORTATION */}
            {/* ========================================================================= */}
            {step === 'choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  
                  {/* CARTE 1 : GOOGLE SHEETS */}
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
                        Prêt pour Coller
                      </span>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Google Sheets
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Ouvre Google Sheets, copie vos données pour les coller instantanément (Ctrl+V) et télécharge le fichier CSV.
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
                            title={sheetUrlInput || 'https://sheets.new'}
                          >
                            {sheetUrlInput ? sheetUrlInput.replace(/^https?:\/\//, '') : 'sheets.new'}
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

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleOpenGoogleSheets}
                        style={{
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
                        <span>Ouvrir & Exporter vers Sheets</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadGoogleSheetsCsvOnly}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem',
                          textDecoration: 'underline'
                        }}
                      >
                        <Download size={13} />
                        <span>Télécharger le CSV seul ({exportData.count} art.)</span>
                      </button>
                    </div>
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
                        Microsoft Excel
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Télécharge le fichier CSV complet avec encodage UTF-8 BOM et séparateurs point-virgule pour Excel.
                      </p>
                    </div>

                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)'
                    }}>
                      <Table size={12} />
                      <span style={{ fontFamily: 'monospace' }}>Point-virgule (;) & BOM UTF-8</span>
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

                {/* PIED DE MODALE VUE CHOIX */}
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
            )}

            {/* ========================================================================= */}
            {/* VUE 2 : GUIDE DE TRANSFERT GOOGLE SHEETS EN DIRECT (POST-CLIC) */}
            {/* ========================================================================= */}
            {step === 'sheets_guide' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                {/* BANNIÈRE DE SUCCÈS VISUELLE */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem'
                }}>
                  <div style={{
                    background: '#10b981',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Feuille Google Sheets ouverte dans un nouvel onglet !
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      Vos <strong>{exportData.count} articles</strong> sont copiés dans votre presse-papiers, et le fichier CSV de sauvegarde est téléchargé.
                    </p>
                  </div>
                </div>

                {/* NOTE EXPLICATIVE SUR L'OUVERTURE VIERGE DE GOOGLE SHEETS */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '0.8rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem'
                }}>
                  <Info size={17} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Pourquoi la feuille Google Sheets est-elle vierge à l'ouverture ?</strong><br />
                    Par mesure de sécurité du navigateur, Google Sheets ne permet pas à un site web d'écrire directement dans vos fichiers sans votre intervention. Utilisez l'une des deux méthodes ci-dessous pour insérer vos données :
                  </span>
                </div>

                {/* LES 2 MÉTHODES DE TRANSFERT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  
                  {/* MÉTHODE 1 : COLLER DIRECTEMENT (1 SECONDE) */}
                  <div style={{
                    background: 'var(--bg-app)',
                    border: '1.5px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '14px',
                    padding: '1.05rem 1.2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>⚡ Méthode 1 : Coller directement</span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>Recommandé (1 seconde)</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(exportData.tsvContent);
                          setHasCopied(true);
                          setTimeout(() => setHasCopied(false), 2000);
                        }}
                        style={{
                          background: hasCopied ? '#10b981' : 'var(--bg-card)',
                          color: hasCopied ? '#fff' : 'var(--text-primary)',
                          border: hasCopied ? '1px solid #10b981' : '1px solid var(--border-color)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {hasCopied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{hasCopied ? 'Données Recopiées !' : 'Recopier les données'}</span>
                      </button>
                    </div>

                    <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <li>Basculez sur l'onglet <strong>Google Sheets</strong> ouvert à l'instant.</li>
                      <li>Cliquez sur la première cellule <strong>A1</strong> (en haut à gauche).</li>
                      <li>
                        Appuyez sur <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.74rem' }}>Ctrl</kbd> + <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.74rem' }}>V</kbd> (ou <em>Clic droit &gt; Coller</em>).
                      </li>
                    </ol>

                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '0.4rem 0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      color: '#10b981',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <Sparkles size={14} />
                      <span>Les 11 colonnes et {exportData.count} lignes de vos produits se placent automatiquement !</span>
                    </div>
                  </div>

                  {/* MÉTHODE 2 : IMPORTER LE FICHIER CSV */}
                  <div style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '0.95rem 1.2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        📁 Méthode 2 : Importer le fichier CSV
                      </span>

                      <button
                        type="button"
                        onClick={() => downloadBlob(exportData.googleSheetsContent, exportData.googleSheetsFileName)}
                        style={{
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={13} />
                        <span>Re-télécharger le CSV</span>
                      </button>
                    </div>

                    <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <li>Le fichier <code>{exportData.googleSheetsFileName}</code> est déjà dans vos Téléchargements.</li>
                      <li>Dans Google Sheets : allez dans <strong>Fichier &gt; Importer &gt; Téléverser</strong>.</li>
                      <li>Déposez le fichier CSV pour importer l'intégralité du catalogue.</li>
                    </ol>
                  </div>

                </div>

                {/* PIED DE MODALE VUE GUIDE */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.6rem'
                }}>
                  <button
                    type="button"
                    onClick={() => openNewTab(sheetUrlInput.trim() || 'https://sheets.new')}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '10px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Ré-ouvrir l'onglet Sheets</span>
                  </button>

                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setStep('choice')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '0.45rem 0.7rem'
                      }}
                    >
                      ← Retour aux formats
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.45rem 1.1rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      ✓ Terminer
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
