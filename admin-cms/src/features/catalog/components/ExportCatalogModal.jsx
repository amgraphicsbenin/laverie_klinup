import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Store, 
  Layers, 
  Table, 
  HelpCircle,
  FileText
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
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [googleSheetsOpened, setGoogleSheetsOpened] = useState(false);

  // Informations sur le point de vente actif
  const currentStoreName = useMemo(() => {
    if (!catalogStoreFilter || catalogStoreFilter === 'all' || catalogStoreFilter === 'GLOBAL') {
      return 'Tous les points (Global)';
    }
    const found = stores.find(s => s.id === catalogStoreFilter || s.code === catalogStoreFilter);
    return found ? found.nom : catalogStoreFilter;
  }, [catalogStoreFilter, stores]);

  // Libellé de la catégorie
  const categoryLabel = useMemo(() => {
    if (catalogCategory === 'individuel') return 'Vêtements Individuels';
    if (catalogCategory === 'abonnement') return 'Abonnements & Forfaits';
    return 'Tous les types';
  }, [catalogCategory]);

  // Construction des données d'export unifiées (CSV & TSV Google Sheets)
  const exportData = useMemo(() => {
    const CSV_HEADER_LINE = 'ID_Produit;Store_ID;Store_Name;Statut;Article;Tarif_Traitement;Tarif_Traitement_Express;Tarif_Repassage;Tarif_Repassage_Express;Categorie;Description\r\n';
    const TSV_HEADER_LINE = 'ID_Produit\tStore_ID\tStore_Name\tStatut\tArticle\tTarif_Traitement\tTarif_Traitement_Express\tTarif_Repassage\tTarif_Repassage_Express\tCategorie\tDescription\r\n';

    const usedNumericIds = new Set();
    const rows = [];

    (itemsToExport || []).forEach((item, index) => {
      let numId = null;
      const strId = String(item.id || '').trim();
      if (/^\d+$/.test(strId)) {
        numId = parseInt(strId, 10);
      } else {
        const catMatch = strId.match(/^cat(\d+)$/i);
        if (catMatch) numId = parseInt(catMatch[1], 10);
      }
      if (!numId || numId <= 0 || usedNumericIds.has(numId)) {
        let candidate = index + 1;
        while (usedNumericIds.has(candidate)) candidate++;
        numId = candidate;
      }
      usedNumericIds.add(numId);

      const storeObj = stores.find(s => s.id === item.store_id || s.code === item.store_id);
      const storeId = storeObj?.id || item.store_id || (stores[0]?.id || 'store_1');
      const storeName = storeObj?.nom || (stores[0]?.nom || 'Point Principal');
      const statut = (item.is_active !== false && item.statut !== 0) ? 1 : 0;
      const article = item.article || 'Article sans nom';
      const cat = (item.categorie || catalogCategory || 'individuel').toLowerCase().trim();
      const desc = item.description || (cat === 'abonnement' ? 'Formule abonnement' : 'Prestation pressing et repassage soigné');

      let tTraitement = 0;
      let tTraitementExpress = 0;
      let tRepassage = 0;
      let tRepassageExpress = 0;

      if (cat === 'abonnement') {
        tTraitement = Number(item.prix) || 0;
      } else {
        if (item.traitement) {
          tTraitement = Number(item.traitement.prix) || 0;
          tTraitementExpress = Number(item.traitement.prix_urgent) || 0;
        }
        if (item.repassage) {
          tRepassage = Number(item.repassage.prix) || 0;
          tRepassageExpress = Number(item.repassage.prix_urgent) || 0;
        }
      }

      rows.push({
        numId,
        storeId,
        storeName,
        statut,
        article,
        tTraitement,
        tTraitementExpress,
        tRepassage,
        tRepassageExpress,
        cat,
        desc
      });
    });

    // Tri par ID numérique croissant
    rows.sort((a, b) => a.numId - b.numId);

    // CSV délimité par point-virgule avec guillemets
    const csvRows = rows.map(r => [
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

    // TSV délimité par des tabulations pour collage direct instantané dans Google Sheets
    const tsvRows = rows.map(r => [
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
    ].join('\t')).join('\r\n');

    const csvContent = '\uFEFF' + CSV_HEADER_LINE + csvRows;
    const tsvContent = TSV_HEADER_LINE + tsvRows;

    const storeSuffix = (catalogStoreFilter === 'all' || !catalogStoreFilter) ? 'tous_les_points' : (stores.find(s => s.id === catalogStoreFilter)?.code || 'point').toLowerCase();
    const catSuffix = catalogCategory === 'individuel' ? 'vetements' : (catalogCategory === 'abonnement' ? 'abonnements' : 'global');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `catalogue_${storeSuffix}_${catSuffix}_${dateStr}.csv`;

    return {
      rows,
      count: rows.length,
      csvContent,
      tsvContent,
      fileName
    };
  }, [itemsToExport, stores, catalogCategory, catalogStoreFilter]);

  if (!isOpen) return null;

  // ACTION 1 : Export vers Excel (.CSV optimisé avec BOM UTF-8)
  const handleExportExcel = () => {
    if (!exportData || exportData.count === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const blob = new Blob([exportData.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportData.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  // ACTION 2 : Export direct vers Google Sheets
  const handleExportGoogleSheets = async () => {
    if (!exportData || exportData.count === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    try {
      // 1. Copie des données au format TSV dans le presse-papier
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(exportData.tsvContent);
      } else {
        // Fallback textarea
        const textarea = document.createElement('textarea');
        textarea.value = exportData.tsvContent;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedStatus(true);
      setGoogleSheetsOpened(true);

      // 2. Ouverture immédiate d'une nouvelle feuille Google Sheets
      window.open('https://sheets.new', '_blank');

      setTimeout(() => setCopiedStatus(false), 6000);
    } catch (err) {
      console.error("Erreur lors de la copie pour Google Sheets:", err);
      // Même en cas de restriction de presse-papier, ouvrir Google Sheets
      window.open('https://sheets.new', '_blank');
      setGoogleSheetsOpened(true);
    }
  };

  const handleCopyOnly = async () => {
    if (!exportData || exportData.count === 0) return;
    try {
      await navigator.clipboard.writeText(exportData.tsvContent);
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 3000);
    } catch (err) {
      console.error(err);
    }
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
            maxWidth: '580px',
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
                  Choisissez votre format d'exportation cible
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

            {/* NOTIFICATION GOOGLE SHEETS OU TÉLÉCHARGEMENT */}
            {googleSheetsOpened && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, fontSize: '0.84rem' }}>
                  <CheckCircle2 size={18} />
                  <span>Données copiées & Google Sheets ouvert !</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Un nouveau classeur Google Sheets a été ouvert dans votre navigateur. Cliquez sur la cellule <strong>A1</strong> et faites <strong>Ctrl + V</strong> (ou <i>Coller</i>) pour injecter instantanément l'intégralité du tableau.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={handleCopyOnly}
                    style={{
                      background: 'transparent',
                      border: '1px solid #10b981',
                      color: '#10b981',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {copiedStatus ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedStatus ? 'Données recopiées !' : 'Recopier les données'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open('https://sheets.new', '_blank')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: 'none',
                      color: '#10b981',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Réouvrir Google Sheets</span>
                  </button>
                </div>
              </div>
            )}

            {downloadSuccess && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '0.8rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                animation: 'fadeIn 0.2s ease'
              }}>
                <CheckCircle2 size={17} />
                <span>Le fichier Excel/CSV a été téléchargé avec succès sur votre appareil.</span>
              </div>
            )}

            {/* GRILLE DES 2 CHOIX D'EXPORTATION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
              
              {/* CARTE 1 : GOOGLE SHEETS DIRECT */}
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
                  transition: 'all 0.2s ease',
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
                    {/* Icône Google Sheets stylisée */}
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
                    En ligne
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Google Sheets Direct
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Ouvre immédiatement un nouveau classeur en ligne pré-formaté avec copie automatique des données.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportGoogleSheets}
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

              {/* CARTE 2 : EXPORT FICHIER EXCEL (.CSV BOM UTF-8) */}
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
                  transition: 'all 0.2s ease',
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
                    Fichier Excel (.csv)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Télécharge un fichier CSV encodé UTF-8 BOM avec séparateurs point-virgule, 100% compatible Excel.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportExcel}
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
                  <span>Télécharger Excel (.csv)</span>
                </button>
              </div>

            </div>

            {/* PIED DE MODALE & INFOS STRUCTURE */}
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
