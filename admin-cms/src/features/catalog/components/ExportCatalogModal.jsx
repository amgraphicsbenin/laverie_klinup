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
  Sparkles,
  Settings,
  HelpCircle,
  Loader2,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getGoogleClientId, 
  saveGoogleClientId, 
  getCachedAccessToken, 
  requestGoogleAccessToken, 
  createAndPopulateGoogleSheet, 
  disconnectGoogle 
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
  const [step, setStep] = useState('choice'); // 'choice' | 'sheets_guide' | 'oauth_success'
  const [hasCopied, setHasCopied] = useState(false);

  // ÉTATS GOOGLE OAUTH
  const [googleClientId, setGoogleClientId] = useState('');
  const [isConfiguringClientId, setIsConfiguringClientId] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [isExportingGoogle, setIsExportingGoogle] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportedSheetResult, setExportedSheetResult] = useState(null);
  const [googleAuthConnected, setGoogleAuthConnected] = useState(false);

  // Lien Google Sheets personnalisé
  const [isEditingSheetUrl, setIsEditingSheetUrl] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState('');

  const storageKey = `klinup_google_sheet_url_${catalogStoreFilter || 'all'}`;

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
      const cid = getGoogleClientId();
      setGoogleClientId(cid);
      setClientIdInput(cid);
      setSheetUrlInput(associatedSheetUrl);
      setIsEditingSheetUrl(false);
      setIsConfiguringClientId(false);
      setShowSetupGuide(false);
      setIsExportingGoogle(false);
      setExportedSheetResult(null);
      setGoogleAuthConnected(!!getCachedAccessToken());
      setStep('choice');
      setHasCopied(false);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [associatedSheetUrl, isOpen]);

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

  // ACTION PRINCIPALE : Exportation OAuth Automatique vers Google Drive & Sheets
  const handleOAuthExportGoogleSheets = async () => {
    if (!exportData || exportData.count === 0) {
      setErrorMessage("Aucune donnée à exporter.");
      return;
    }

    const currentCid = getGoogleClientId();
    if (!currentCid) {
      setIsConfiguringClientId(true);
      return;
    }

    setErrorMessage(null);
    setIsExportingGoogle(true);
    setExportProgressText("Authentification Google OAuth en cours...");

    try {
      // 1. Demande de token OAuth (popup Google si non encore connecté)
      const token = await requestGoogleAccessToken(currentCid);
      setGoogleAuthConnected(true);

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

      // 3. Création du Spreadsheet & insertion des données via Google Sheets API v4
      setExportProgressText(`Création de la feuille sur Google Drive & insertion de ${exportData.count} articles...`);
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
      console.error("Erreur Google Drive OAuth:", err);
      setErrorMessage(err.message || "Erreur lors de la communication avec Google Drive.");
    } finally {
      setIsExportingGoogle(false);
      setExportProgressText('');
    }
  };

  // Enregistrement du Client ID Google Cloud
  const handleSaveClientId = () => {
    const cleanId = clientIdInput.trim();
    saveGoogleClientId(cleanId);
    setGoogleClientId(cleanId);
    setIsConfiguringClientId(false);
    setSuccessMessage(cleanId ? "Identifiant Client Google OAuth enregistré !" : "Identifiant Client Google réinitialisé.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Déconnexion Google
  const handleDisconnectGoogle = () => {
    disconnectGoogle();
    setGoogleAuthConnected(false);
    setSuccessMessage("Session Google déconnectée.");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // ACTION MANUELLE (Copie presse-papiers + sheets.new)
  const handleOpenManualSheets = () => {
    if (!exportData || exportData.count === 0) return;
    copyToClipboard(exportData.tsvContent);
    setHasCopied(true);
    downloadBlob(exportData.googleSheetsContent, exportData.googleSheetsFileName);
    openNewTab(sheetUrlInput.trim() || 'https://sheets.new');
    setStep('sheets_guide');
  };

  // ACTION : Télécharger CSV Google Sheets uniquement
  const handleDownloadGoogleSheetsCsvOnly = () => {
    if (!exportData || exportData.count === 0) return;
    copyToClipboard(exportData.tsvContent);
    downloadBlob(exportData.googleSheetsContent, exportData.googleSheetsFileName);
    setSuccessMessage(`Fichier Google Sheets CSV téléchargé (${exportData.count} articles) !`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // ACTION : Télécharger CSV Excel
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
            maxWidth: step === 'choice' && isConfiguringClientId ? '660px' : '620px',
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
            background: step === 'oauth_success' || step === 'sheets_guide'
              ? 'linear-gradient(to right, rgba(16, 185, 129, 0.08), transparent)'
              : 'linear-gradient(to right, rgba(var(--primary-rgb, 59, 130, 246), 0.05), transparent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: step === 'oauth_success' || step === 'sheets_guide' ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-light)',
                color: step === 'oauth_success' || step === 'sheets_guide' ? '#10b981' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {step === 'oauth_success' ? <CheckCircle2 size={24} /> : <FileSpreadsheet size={22} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  {step === 'oauth_success' ? 'Export Google Drive Réussi !' : (step === 'sheets_guide' ? 'Guide de Transfert Google Sheets' : 'Exporter le Catalogue des Produits')}
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  {step === 'oauth_success'
                    ? 'Feuille de calcul créée et pré-remplie sur votre Google Drive'
                    : `${exportData.count} articles prêts • Google Drive OAuth & Fichiers locaux`}
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
                <CheckCircle2 size={18} />
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
                <Info size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VUE 1 : CHOIX PRINCIPAL AVEC GOOGLE DRIVE OAUTH DIRECT */}
            {/* ========================================================================= */}
            {step === 'choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                {/* CARTE D'EXPORT GOOGLE DRIVE OAUTH (DIRECT & AUTOMATIQUE) */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '18px',
                  padding: '1.3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        background: '#ffffff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {/* Logo officiel Google Sheets */}
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 9H21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 15H21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 3V21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 3V21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Google Sheets Automatique (OAuth Google Drive)
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
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Crée directement le document pré-rempli dans votre Google Drive sans aucune action manuelle.
                        </p>
                      </div>
                    </div>

                    {/* Statut connexion OAuth */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {googleAuthConnected && (
                        <button
                          type="button"
                          onClick={handleDisconnectGoogle}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            borderRadius: '6px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                          title="Déconnecter la session Google"
                        >
                          Déconnexion
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsConfiguringClientId(!isConfiguringClientId)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Settings size={13} />
                        <span>{googleClientId ? 'Client ID configuré' : 'Configurer OAuth'}</span>
                      </button>
                    </div>
                  </div>

                  {/* PANNEAU DE CONFIGURATION DU CLIENT ID OAUTH */}
                  {isConfiguringClientId && (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      animation: 'fadeIn 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Configuration Google OAuth 2.0 (Google Cloud Console)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSetupGuide(!showSetupGuide)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            cursor: 'pointer'
                          }}
                        >
                          <HelpCircle size={13} />
                          <span>Guide pas-à-pas {showSetupGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={clientIdInput}
                          onChange={(e) => setClientIdInput(e.target.value)}
                          placeholder="Ex: 123456789-xxxxxxxx.apps.googleusercontent.com"
                          style={{
                            flex: 1,
                            fontSize: '0.78rem',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-app)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveClientId}
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Check size={14} />
                          <span>Enregistrer</span>
                        </button>
                      </div>

                      {showSetupGuide && (
                        <div style={{
                          background: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.85rem',
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6
                        }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Comment obtenir votre Client ID Google en 2 minutes :</strong>
                          <ol style={{ margin: '0.35rem 0 0 0', paddingLeft: '1.2rem' }}>
                            <li>Allez sur la <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>Google Cloud Console</a>.</li>
                            <li>Créez un projet (ex: <em>KLIN UP Pressing</em>) et activez <strong>Google Sheets API</strong> et <strong>Google Drive API</strong>.</li>
                            <li>Dans <em>Identifiants</em> &gt; <em>Créer des identifiants</em> &gt; <strong>ID client OAuth</strong> :</li>
                            <li>Sélectionnez <strong>Application Web</strong> et ajoutez dans <em>Origines JavaScript autorisées</em> : <code>http://localhost:5174</code> et l'URL de votre site web.</li>
                            <li>Copiez votre <strong>ID Client</strong> généré et collez-le ci-dessus.</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BOUTON D'ACTION OAUTH */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      onClick={handleOAuthExportGoogleSheets}
                      disabled={isExportingGoogle}
                      style={{
                        flex: 1,
                        minWidth: '220px',
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
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.15s ease',
                        opacity: isExportingGoogle ? 0.8 : 1
                      }}
                      onMouseEnter={(e) => !isExportingGoogle && (e.currentTarget.style.filter = 'brightness(1.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                    >
                      {isExportingGoogle ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          <span>{exportProgressText || "Création du document en cours..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={17} />
                          <span>Créer & Exporter vers Google Sheets (OAuth)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SÉPARATEUR ALTERNATIVES */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.2rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Autres méthodes d'exportation
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>

                {/* GRILLE DES 2 AUTRES OPTIONS D'EXPORTATION */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  
                  {/* OPTION 1 : GOOGLE SHEETS FICHIER CSV DIRECT */}
                  <div style={{
                    background: 'var(--bg-app)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.7rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileSpreadsheet size={18} color="#10b981" />
                        <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Google Sheets (Fichier CSV)
                        </h5>
                      </div>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Sans OAuth</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      Télécharge le fichier CSV standard structuré pour Google Sheets et copie les données (Ctrl+V).
                    </p>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleDownloadGoogleSheetsCsvOnly}
                        style={{
                          flex: 1,
                          padding: '0.55rem',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Download size={13} />
                        <span>Télécharger CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenManualSheets}
                        style={{
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        title="Ouvrir sheets.new et coller manuellement"
                      >
                        <ExternalLink size={13} />
                        <span>Coller</span>
                      </button>
                    </div>
                  </div>

                  {/* OPTION 2 : MICROSOFT EXCEL */}
                  <div style={{
                    background: 'var(--bg-app)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.7rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileSpreadsheet size={18} color="var(--primary)" />
                        <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Microsoft Excel (.csv)
                        </h5>
                      </div>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Local</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      Télécharge le fichier CSV complet avec séparateur point-virgule et encodage UTF-8 BOM pour Excel.
                    </p>

                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      style={{
                        marginTop: 'auto',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        background: 'var(--primary)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Download size={13} />
                      <span>Télécharger pour Excel</span>
                    </button>
                  </div>

                </div>

                {/* PIED DE MODALE CHOIX */}
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
            {/* VUE 2 : SUCCÈS EXPORT OAUTH DIRECT (DOCUMENT REMPLI EN LIGNE) */}
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
                      <CheckCircle2 size={28} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Document Google Sheets créé et complété !
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>{exportedSheetResult.count} articles</strong> ont été insérés avec succès avec leurs tarifs et mise en forme.
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
                      <FileSpreadsheet size={16} color="#10b981" style={{ flexShrink: 0 }} />
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
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        flexShrink: 0
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Accéder au classeur</span>
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
                      cursor: 'pointer'
                    }}
                  >
                    ← Retour aux options
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
                    ✓ Terminé
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VUE 3 : GUIDE DE COLLAGE MANUEL (FALLBACK) */}
            {/* ========================================================================= */}
            {step === 'sheets_guide' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem'
                }}>
                  <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Feuille Google Sheets ouverte !
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Vos <strong>{exportData.count} articles</strong> sont copiés dans votre presse-papiers.
                    </p>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-app)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '14px',
                  padding: '1.05rem 1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>
                      ⚡ Coller dans Google Sheets (1 seconde)
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
                        cursor: 'pointer'
                      }}
                    >
                      {hasCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{hasCopied ? 'Données Recopiées !' : 'Recopier'}</span>
                    </button>
                  </div>

                  <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Allez sur l'onglet <strong>Google Sheets</strong> qui vient de s'ouvrir.</li>
                    <li>Cliquez sur la première cellule <strong>A1</strong> (en haut à gauche).</li>
                    <li>Appuyez sur <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 700, color: 'var(--text-primary)' }}>Ctrl</kbd> + <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 700, color: 'var(--text-primary)' }}>V</kbd>.</li>
                  </ol>
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
                      cursor: 'pointer'
                    }}
                  >
                    ← Retour
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.5rem 1.1rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Fermer
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
