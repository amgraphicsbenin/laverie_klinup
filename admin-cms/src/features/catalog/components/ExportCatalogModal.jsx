import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  IconFileSpreadsheet, 
  IconDownload, 
  IconExternalLink, 
  IconCircleCheck, 
  IconX, 
  IconBuildingStore, 
  IconStack2, 
  IconTable, 
  IconCheck, 
  IconInfoCircle, 
  IconSparkles, 
  IconLoader2,
  IconArrowLeft
} from '@tabler/icons-react';
import { 
  getGoogleClientId, 
  requestGoogleAccessToken, 
  createAndPopulateGoogleSheet 
} from '../../../services/googleDriveService';

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
  const [errorMessage, setErrorMessage] = useState(null);
  const [step, setStep] = useState('choice'); // 'choice' | 'oauth_success'
  const [isExportingGoogle, setIsExportingGoogle] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportedSheetResult, setExportedSheetResult] = useState(null);

  const currentStoreObj = useMemo(() => {
    if (!catalogStoreFilter || catalogStoreFilter === 'all' || catalogStoreFilter === 'GLOBAL') {
      return null;
    }
    return stores.find(s => s.id === catalogStoreFilter || s.code === catalogStoreFilter) || null;
  }, [catalogStoreFilter, stores]);

  useEffect(() => {
    if (isOpen) {
      setIsExportingGoogle(false);
      setExportedSheetResult(null);
      setStep('choice');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const currentStoreName = useMemo(() => {
    if (!catalogStoreFilter || catalogStoreFilter === 'all' || catalogStoreFilter === 'GLOBAL') {
      return 'Tous les points (Global)';
    }
    return currentStoreObj ? currentStoreObj.nom : catalogStoreFilter;
  }, [catalogStoreFilter, currentStoreObj]);

  const categoryLabel = useMemo(() => {
    if (catalogCategory === 'individuel') return 'Vêtements Individuels';
    if (catalogCategory === 'abonnement') return 'Abonnements & Forfaits';
    return 'Tous les types';
  }, [catalogCategory]);

  // Construction des données du catalogue à exporter
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
        if (item.traitement) {
          existingGroup.tTraitement = Number(item.traitement.prix) || existingGroup.tTraitement || 0;
          existingGroup.tTraitementExpress = Number(item.traitement.prix_urgent) || existingGroup.tTraitementExpress || 0;
        }
        if (item.repassage) {
          existingGroup.tRepassage = Number(item.repassage.prix) || existingGroup.tRepassage || 0;
          existingGroup.tRepassageExpress = Number(item.repassage.prix_urgent) || existingGroup.tRepassageExpress || 0;
        }

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

    rows.forEach((r) => {
      if (r.numId && r.numId > 0) {
        if (usedNumericIds.has(r.numId)) {
          r.numId = null;
        } else {
          usedNumericIds.add(r.numId);
        }
      }
    });

    let nextCandidate = 1;
    rows.forEach((r) => {
      if (!r.numId) {
        while (usedNumericIds.has(nextCandidate)) nextCandidate++;
        r.numId = nextCandidate;
        usedNumericIds.add(nextCandidate);
      }
    });

    rows.sort((a, b) => a.numId - b.numId);

    const storeSuffix = (catalogStoreFilter === 'all' || !catalogStoreFilter) ? 'tous_les_points' : (stores.find(s => s.id === catalogStoreFilter)?.code || 'point').toLowerCase();
    const catSuffix = catalogCategory === 'individuel' ? 'vetements' : (catalogCategory === 'abonnement' ? 'abonnements' : 'global');
    const dateStr = new Date().toISOString().slice(0, 10);

    const cleanCell = (str) => String(str ?? '').replace(/[\r\n\t]+/g, ' ').trim();

    // 1. FORMAT GOOGLE SHEETS / TSV POUR PRESSE-PAPIERS
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

    // 2. FORMAT CSV POUR GOOGLE SHEETS (Virgule + BOM UTF-8)
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

    // 3. FORMAT EXCEL (Point-virgule + BOM UTF-8)
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

  // UTILITAIRE : Copie sécurisée dans le presse-papiers
  const copyToClipboard = (text) => {
    let success = false;
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

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).catch((err) => {
        console.warn("navigator.clipboard.writeText error:", err);
      });
    }

    return success;
  };

  // UTILITAIRE : Téléchargement Blob
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

  // ACTION PRINCIPALE : Exportation Automatique vers Google Sheets
  const handleOAuthExportGoogleSheets = async () => {
    if (!exportData || exportData.count === 0) {
      setErrorMessage("Aucune donnée à exporter.");
      return;
    }

    const currentCid = getGoogleClientId();
    if (!currentCid) {
      setErrorMessage("L'intégration Google Sheets n'est pas encore configurée sur ce serveur.");
      return;
    }

    setErrorMessage(null);
    setIsExportingGoogle(true);
    setExportProgressText("Connexion à Google en cours...");

    try {
      // 1. Demande d'accès Google
      const token = await requestGoogleAccessToken(currentCid);

      // 2. Préparation du document
      const cleanStore = currentStoreName.replace(/ \([^)]*\)/, '');
      const dateStr = new Date().toISOString().slice(0, 10);
      const title = `Catalogue Pressing Pro - ${categoryLabel} - ${cleanStore} - ${dateStr}`;

      const headers = [
        'ID_Produit',
        'Store_ID',
        'Store_Name',
        'Statut',
        'Article',
        'Tarif_Traitement',
        'Tarif_Traitement_Express',
        'Tarif_Repassage',
        'Tarif_Repassage_Express',
        'Categorie',
        'Description'
      ];

      const cleanCell = (str) => String(str ?? '').replace(/[\r\n\t]+/g, ' ').trim();
      const rows = exportData.rows.map(r => [
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
      ]);

      // 3. Création du Spreadsheet & insertion des données via Google Sheets API
      setExportProgressText(`Création de votre feuille Google Sheets (${exportData.count} articles)...`);
      const result = await createAndPopulateGoogleSheet({
        title,
        headers,
        rows,
        accessToken: token
      });

      // 4. Copie de secours dans le presse-papiers
      copyToClipboard(exportData.tsvContent);

      // 5. Sauvegarde du résultat et ouverture du classeur
      setExportedSheetResult({
        url: result.spreadsheetUrl,
        id: result.spreadsheetId,
        count: exportData.count,
        title
      });

      // Ouverture immédiate de la feuille remplie
      openNewTab(result.spreadsheetUrl);

      setStep('oauth_success');
    } catch (err) {
      console.error("Erreur Google Drive:", err);
      let friendlyError = "Une erreur est survenue lors de l'exportation vers Google Sheets.";
      if (err.message?.includes('popup') || err.message?.includes('blocked')) {
        friendlyError = "La fenêtre Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up pour continuer.";
      } else if (err.message?.includes('access_denied') || err.message?.includes('refus')) {
        friendlyError = "L'accès à votre compte Google a été annulé.";
      } else if (err.message) {
        friendlyError = err.message;
      }
      setErrorMessage(friendlyError);
    } finally {
      setIsExportingGoogle(false);
      setExportProgressText('');
    }
  };

  // ACTION : Télécharger pour Excel
  const handleDownloadExcel = () => {
    if (!exportData || exportData.count === 0) return;
    downloadBlob(exportData.excelContent, exportData.excelFileName);
    setSuccessMessage(`Fichier Excel téléchargé avec succès (${exportData.count} articles) !`);
    setTimeout(() => setSuccessMessage(null), 3500);
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
            background: step === 'oauth_success'
              ? 'linear-gradient(to right, rgba(16, 185, 129, 0.08), transparent)'
              : 'linear-gradient(to right, rgba(var(--primary-rgb, 59, 130, 246), 0.05), transparent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: step === 'oauth_success' ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-light)',
                color: step === 'oauth_success' ? '#10b981' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {step === 'oauth_success' ? <IconCircleCheck size={24} stroke={1.8} /> : <IconFileSpreadsheet size={22} stroke={1.8} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  {step === 'oauth_success' ? 'Exportation Réussie !' : 'Exporter le Catalogue des Produits'}
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  {step === 'oauth_success'
                    ? 'Votre feuille de calcul est prête sur Google Sheets'
                    : `${exportData.count} article${exportData.count > 1 ? 's' : ''} prêt${exportData.count > 1 ? 's' : ''} à l'exportation`}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              title="Fermer"
            >
              <IconX size={20} stroke={1.8} />
            </button>
          </div>

          {/* CORPS DE LA MODALE */}
          <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxHeight: '80vh', overflowY: 'auto' }}>
            
            {/* RÉSUMÉ DU PÉRIMÈTRE */}
            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.8rem 1rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconStack2 size={16} stroke={1.8} color="var(--primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {categoryLabel}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconBuildingStore size={15} stroke={1.8} color="var(--text-secondary)" />
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
                <IconTable size={13} stroke={1.8} />
                <span>{exportData.count} article{exportData.count > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* NOTIFICATION DE SUCCÈS */}
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
                <IconCircleCheck size={18} stroke={1.8} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* MESSAGE D'ERREUR */}
            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#ef4444',
                fontWeight: 600,
                fontSize: '0.82rem',
                animation: 'fadeIn 0.2s ease'
              }}>
                <IconInfoCircle size={18} stroke={1.8} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VUE 1 : CHOIX PRINCIPAL (GOOGLE SHEETS & EXCEL) */}
            {/* ========================================================================= */}
            {step === 'choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                {/* OPTION 1 : GOOGLE SHEETS */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
                  border: '1.5px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 9H21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 15H21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 3V21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 3V21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Google Sheets
                        </h4>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: '#10b981',
                          color: '#ffffff'
                        }}>
                          Recommandé
                        </span>
                      </div>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        Crée et ouvre directement votre catalogue dans Google Sheets en ligne.
                      </p>
                    </div>
                  </div>

                  {/* BOUTON D'ACTION GOOGLE SHEETS */}
                  <button
                    type="button"
                    onClick={handleOAuthExportGoogleSheets}
                    disabled={isExportingGoogle}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.2rem',
                      borderRadius: '12px',
                      background: '#10b981',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: isExportingGoogle ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.55rem',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.15s ease',
                      opacity: isExportingGoogle ? 0.8 : 1
                    }}
                    onMouseEnter={(e) => !isExportingGoogle && (e.currentTarget.style.filter = 'brightness(1.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                  >
                    {isExportingGoogle ? (
                      <>
                        <IconLoader2 size={18} stroke={2} className="animate-spin" />
                        <span>{exportProgressText || "Création en cours..."}</span>
                      </>
                    ) : (
                      <>
                        <IconSparkles size={18} stroke={1.8} />
                        <span>Créer & Exporter vers Google Sheets</span>
                      </>
                    )}
                  </button>
                </div>

                {/* SÉPARATEUR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.1rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Autre format disponible
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>

                {/* OPTION 2 : MICROSOFT EXCEL */}
                <div style={{
                  background: 'var(--bg-app)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '220px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconFileSpreadsheet size={22} stroke={1.8} />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Microsoft Excel
                      </h5>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Télécharge le fichier de votre catalogue directement sur votre appareil.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    style={{
                      padding: '0.6rem 1.15rem',
                      borderRadius: '10px',
                      background: 'var(--primary)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 2px 6px rgba(var(--primary-rgb, 59, 130, 246), 0.25)',
                      flexShrink: 0
                    }}
                  >
                    <IconDownload size={16} stroke={1.8} />
                    <span>Télécharger pour Excel</span>
                  </button>
                </div>

                {/* PIED DE MODALE CHOIX */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Comprend l'ensemble des articles, tarifs et catégories du catalogue
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
            {/* VUE 2 : SUCCÈS EXPORT (DOCUMENT PRÊT DANS GOOGLE SHEETS) */}
            {/* ========================================================================= */}
            {step === 'oauth_success' && exportedSheetResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.25s ease' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '2px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: '16px',
                  padding: '1.3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      background: '#10b981',
                      color: '#ffffff',
                      borderRadius: '12px',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconCircleCheck size={28} stroke={1.8} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Document Google Sheets créé avec succès !
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>{exportedSheetResult.count} articles</strong> ont été exportés avec leurs tarifs.
                      </span>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <IconFileSpreadsheet size={18} stroke={1.8} color="#10b981" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exportedSheetResult.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openNewTab(exportedSheetResult.url)}
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        flexShrink: 0
                      }}
                    >
                      <IconExternalLink size={14} stroke={1.8} />
                      <span>Ouvrir dans Google Sheets</span>
                    </button>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <IconArrowLeft size={15} stroke={1.8} />
                    <span>Retour</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.5rem 1.2rem',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <IconCheck size={16} stroke={1.8} />
                      <span>Terminé</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
