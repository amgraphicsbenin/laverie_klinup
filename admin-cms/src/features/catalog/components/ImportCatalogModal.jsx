import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Store, 
  ClipboardPaste,
  RefreshCw
} from 'lucide-react';
import { db } from '../../../services/db';
import CustomSelect from '../../../components/CustomSelect';

const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
};

// En-tête officiel du CSV intégrant ID_Produit (numérique seul), Store_ID, Store_Name, Statut (1/0)
const CSV_HEADER_LINE = 'ID_Produit;Store_ID;Store_Name;Statut;Article;Tarif_Traitement;Tarif_Traitement_Express;Tarif_Repassage;Tarif_Repassage_Express;Categorie;Description\r\n';

export default function ImportCatalogModal({
  isOpen,
  onClose,
  stores = [],
  selectedStoreId = '',
  existingCatalog = [],
  onImportSuccess
}) {
  if (!isOpen) return null;

  // Filtrer les points de vente valides (exclure 'all' et 'GLOBAL')
  const validStores = useMemo(() => {
    return (stores || []).filter(st => st && st.id !== 'all' && st.code !== 'GLOBAL');
  }, [stores]);

  // Point de vente par défaut
  const defaultStoreId = useMemo(() => {
    if (selectedStoreId && selectedStoreId !== 'all' && selectedStoreId !== 'GLOBAL') {
      return selectedStoreId;
    }
    return validStores.length === 1 ? validStores[0].id : (validStores[0]?.id || '');
  }, [selectedStoreId, validStores]);

  const [targetStoreId, setTargetStoreId] = useState(defaultStoreId);
  const [activeInputTab, setActiveInputTab] = useState('file'); // 'file' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const fileInputRef = useRef(null);

  // Nom du point de vente actif
  const currentStoreObj = validStores.find(s => s.id === targetStoreId);
  const currentStoreName = currentStoreObj ? currentStoreObj.nom : (validStores[0]?.nom || 'Point Principal');

  // Helper pour extraire un ID purement numérique réel (ignore les hashes alphanumériques type cat_v7v20mtc6)
  const extractNumericId = (rawId, fallbackNum = 0) => {
    if (!rawId) return fallbackNum;
    const str = String(rawId).trim();
    if (/^\d+$/.test(str)) {
      const parsed = parseInt(str, 10);
      return !isNaN(parsed) && parsed > 0 ? parsed : fallbackNum;
    }
    const catMatch = str.match(/^cat(\d+)$/i);
    if (catMatch) {
      const parsed = parseInt(catMatch[1], 10);
      return !isNaN(parsed) && parsed > 0 ? parsed : fallbackNum;
    }
    const repMatch = str.match(/^(\d+)_rep$/i);
    if (repMatch) {
      const parsed = parseInt(repMatch[1], 10);
      return !isNaN(parsed) && parsed > 0 ? parsed : fallbackNum;
    }
    return fallbackNum;
  };

  // 1. MODÈLE VIERGE AVEC EXEMPLES : IDs d'exemples strictement distincts (1 à 9 sans doublon entre types), montants = 0 si non applicables
  const handleDownloadTemplate = () => {
    const sId = currentStoreObj ? currentStoreObj.id : (validStores[0]?.id || 'store_1');
    const sName = currentStoreObj ? currentStoreObj.nom : (validStores[0]?.nom || 'Point Principal');

    // Les exemples possèdent des IDs séquentiels et distincts (1 à 8 pour individuel, 9 pour abonnement)
    // Colonne 4 = Statut (1 = actif, 0 = inactif).
    // Les colonnes de montants ont la valeur explicite 0 pour toute cellule non concernée.
    const sampleRows = [
      `1;${sId};${sName};1;Chemise;1500;2250;800;1200;individuel;Coton, lin ou synthétique`,
      `2;${sId};${sName};1;Costume 2 pièces;3500;5000;2000;3000;individuel;Veste et pantalon pressing`,
      `3;${sId};${sName};1;Pantalon;1500;2000;800;1200;individuel;Jean, toile ou costume`,
      `4;${sId};${sName};1;Robe simple;2500;3500;1500;2000;individuel;Tenue quotidienne`,
      `5;${sId};${sName};1;Robe de soirée;4500;6500;2500;3500;individuel;Tissu délicat, soies ou perles`,
      `6;${sId};${sName};1;Veste / Blazer;2500;3500;1500;2000;individuel;Nettoyage à sec délicat`,
      `7;${sId};${sName};1;T-shirt / Polo;1000;1500;500;800;individuel;Lavage standard et repassage`,
      `8;${sId};${sName};1;Drap 2 places;2000;0;1000;0;individuel;Linge de lit grand format`,
      `9;${sId};${sName};1;Formule Mensuelle 30;15000;0;0;0;abonnement;30 vêtements par mois avec ramassage`
    ].join('\r\n');

    const fullContent = '\uFEFF' + CSV_HEADER_LINE + sampleRows;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_catalogue_produits_${(currentStoreObj?.code || 'klinup').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. EXPORT DU CATALOGUE EXISTANT : AUCUNE CELLULE VIDE & UNICITÉ STRICTE DES ID PRODUIT
  // RÈGLE STRICTE : Seuls les types 'individuel' et 'abonnement' sont exportables (exclut system_setting, reward_catalog, etc.)
  // Aucun ID PRODUIT ne peut être partagé entre articles de même type ou de différents types !
  const handleExportExistingCatalog = () => {
    const catalogToExport = (existingCatalog || []).filter(c => {
      if (!c || !c.article) return false;
      const cat = (c.categorie || (c.service === 'abonnement' ? 'abonnement' : 'individuel')).toLowerCase().trim();
      if (cat !== 'individuel' && cat !== 'abonnement') return false;
      if (c.service === 'system_setting' || c.service === 'reward_catalog') return false;

      if (targetStoreId && targetStoreId !== 'all') {
        return !c.store_id || c.store_id === targetStoreId;
      }
      return true;
    });

    if (!catalogToExport || catalogToExport.length === 0) {
      alert("Aucun article individuel ou abonnement présent dans le catalogue pour ce point de vente.");
      return;
    }

    // Regrouper par article, type et store pour le format propre d'export
    const groups = {};

    catalogToExport.forEach(item => {
      if (!item || !item.article) return;
      const cat = (item.categorie || (item.service === 'abonnement' ? 'abonnement' : 'individuel')).toLowerCase().trim();
      if (cat !== 'individuel' && cat !== 'abonnement') return;

      const isItemActive = item.is_active !== false && item.statut !== 'inactif';
      // Clé composite garantissant la séparation étanche entre individuel et abonnement
      const key = `${(item.store_id || 'default')}__${cat}__${item.article.trim().toLowerCase()}`;
      if (!groups[key]) {
        const storeMatch = validStores.find(s => s.id === item.store_id || s.code === item.store_id);

        groups[key] = {
          rawId: item.id,
          storeId: item.store_id || targetStoreId || validStores[0]?.id || '1',
          storeName: storeMatch ? storeMatch.nom : currentStoreName,
          statut: isItemActive ? 1 : 0, // 4ème colonne : 1 = actif, 0 = inactif
          article: item.article.trim(),
          tarifTraitement: 0,
          tarifTraitementExpress: 0,
          tarifRepassage: 0,
          tarifRepassageExpress: 0,
          categorie: cat,
          description: (item.description && item.description.trim()) ? item.description.trim() : 'Prestation pressing et repassage soigné'
        };
      } else {
        if (isItemActive) {
          groups[key].statut = 1;
        }
      }

      if (item.service === 'repassage') {
        groups[key].tarifRepassage = Number(item.prix) || 0;
        groups[key].tarifRepassageExpress = Number(item.prix_urgent) || 0;
        if (!groups[key].repassageId) groups[key].repassageId = item.id;
      } else if (item.service === 'abonnement' || item.categorie === 'abonnement') {
        groups[key].tarifTraitement = Number(item.prix) || 0;
        groups[key].treatmentId = item.id;
      } else {
        groups[key].tarifTraitement = Number(item.prix) || 0;
        groups[key].tarifTraitementExpress = Number(item.prix_urgent) || 0;
        groups[key].treatmentId = item.id;
      }
    });

    // ATTRIBUTION GARANTIE SANS AUCUNE COLLISION D'ID NUMÉRIQUE
    const groupList = Object.values(groups);
    const usedNumericIds = new Set();

    // Passe 1 : Réserver les IDs des articles qui possèdent déjà un identifiant purement numérique unique réaliste
    groupList.forEach(g => {
      const preferredId = g.treatmentId || g.rawId;
      const num = extractNumericId(preferredId, null);
      if (num !== null && num > 0 && num <= groupList.length + 50 && !usedNumericIds.has(num)) {
        g.numericId = String(num);
        usedNumericIds.add(num);
      }
    });

    // Passe 2 : Pour tous les autres articles (alphanumériques catX/subX ou doublons),
    // attribuer un numéro séquentiel unique strictly distinct sans aucun chevauchement
    let nextAvailableId = 1;
    groupList.forEach(g => {
      if (!g.numericId) {
        while (usedNumericIds.has(nextAvailableId)) {
          nextAvailableId++;
        }
        g.numericId = String(nextAvailableId);
        usedNumericIds.add(nextAvailableId);
      }
    });

    // Génération avec garantie : AUCUNE CELLULE VIDE & Statut (1/0) en 4ème place & ID UNIQUE
    const exportRows = groupList.map(g => {
      return [
        g.numericId, // ID numérique unique garanti (ex: 1, 2, 3...)
        g.storeId,
        `"${g.storeName.replace(/"/g, '""')}"`,
        g.statut, // Statut : 1 (actif) ou 0 (inactif) à la 4ème place
        `"${g.article.replace(/"/g, '""')}"`,
        g.tarifTraitement, // 0 si non défini, jamais vide
        g.tarifTraitementExpress, // 0 si non défini, jamais vide
        g.tarifRepassage, // 0 si non défini, jamais vide
        g.tarifRepassageExpress, // 0 si non défini, jamais vide
        g.categorie,
        `"${g.description.replace(/"/g, '""')}"` // Jamais vide
      ].join(';');
    }).join('\r\n');

    const fullContent = '\uFEFF' + CSV_HEADER_LINE + exportRows;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `catalogue_existant_export_${(currentStoreObj?.code || 'klinup').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Parser de ligne CSV (conforme RFC 4180 : support apostrophes françaises & guillemets doublés)
  const parseCSVLine = (line, delimiter) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Double guillemet échappé ("")
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  // 4. Nettoyage montant : cellule vide = 0, support devises et séparateurs de milliers
  const cleanPrice = (val) => {
    if (val === undefined || val === null || String(val).trim() === '') return 0;
    let s = String(val).trim().replace(/\s+/g, '').replace(/fcfa|cfa|f|\$|€/gi, '');
    if (/^\d{1,3}[,.]\d{3}$/.test(s)) {
      s = s.replace(/[,.]/g, '');
    } else if (/^\d{1,3}[,.]\d{3}[,.]\d{3}$/.test(s)) {
      s = s.replace(/[,.]/g, '');
    } else {
      s = s.replace(',', '.');
    }
    const n = parseFloat(s);
    return (!isNaN(n) && n >= 0) ? Math.round(n) : 0;
  };

  // 5. Gestion des fichiers
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    setFileName(file.name);
    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setRawContent(text);
    };
    reader.onerror = () => {
      setImportStatus({ type: 'error', message: "Erreur lors de la lecture du fichier." });
    };
    reader.readAsText(file, 'utf-8');
  };

  // 6. Analyse des données brutes avec Auto-Incrémentation des ID numériques
  const currentContent = activeInputTab === 'file' ? rawContent : pastedText;

  const parsedData = useMemo(() => {
    if (!currentContent || !currentContent.trim()) {
      return { rows: [], stats: { total: 0, valid: 0, duplicates: 0, invalid: 0 } };
    }

    const cleanText = currentContent.replace(/^\uFEFF/, '').trim();
    const rawLines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) {
      return { rows: [], stats: { total: 0, valid: 0, duplicates: 0, invalid: 0 } };
    }

    // Détection robuste du délimiteur
    const firstLine = rawLines[0];
    const countSemi = (firstLine.match(/;/g) || []).length;
    const countComma = (firstLine.match(/,/g) || []).length;
    const countTab = (firstLine.match(/\t/g) || []).length;
    let delimiter = ';';
    if (countTab > countSemi && countTab > countComma) delimiter = '\t';
    else if (countComma > countSemi) delimiter = ',';
    else delimiter = ';';

    const headerTokens = parseCSVLine(firstLine, delimiter).map(h => 
      h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]+/g, '')
    );

    // Mappage des colonnes supportées
    let colIdProduit = -1;
    let colStoreId = -1;
    let colStoreName = -1;
    let colStatut = -1;
    let colArticle = -1;
    let colTraitement = -1;
    let colTraitementUrgent = -1;
    let colRepassage = -1;
    let colRepassageUrgent = -1;
    let colCategorie = -1;
    let colDescription = -1;

    headerTokens.forEach((token, idx) => {
      if (['idproduit', 'idarticle', 'id', 'productid'].includes(token)) colIdProduit = idx;
      else if (['storeid', 'idstore', 'idpointlaverie', 'pointlaverieid', 'storecode'].includes(token)) colStoreId = idx;
      else if (['storename', 'nomstore', 'nomboutique', 'pointlaverienom', 'pointlaverie', 'laverie', 'store'].includes(token)) colStoreName = idx;
      else if (['statut', 'status', 'actif', 'active', 'isactive', 'etat'].includes(token)) colStatut = idx;
      else if (['article', 'nom', 'nomarticle', 'produit', 'designation', 'item', 'name'].includes(token)) colArticle = idx;
      else if (['tariftraitementexpress', 'traitementexpress', 'lavageexpress', 'tariflavageexpress', 'expresslavage', 'lavageurgent'].includes(token)) colTraitementUrgent = idx;
      else if (['tariftraitement', 'traitement', 'lavage', 'tariflavage', 'prixtraitement', 'prixlavage', 'prix'].includes(token)) colTraitement = idx;
      else if (['tarifrepassageexpress', 'repassageexpress', 'expressrepassage', 'repassageurgent'].includes(token)) colRepassageUrgent = idx;
      else if (['tarifrepassage', 'repassage', 'prixrepassage'].includes(token)) colRepassage = idx;
      else if (['categorie', 'category', 'type'].includes(token)) colCategorie = idx;
      else if (['description', 'details', 'detail', 'desc', 'instructions'].includes(token)) colDescription = idx;
    });

    const hasHeader = colArticle !== -1 || colTraitement !== -1 || colRepassage !== -1 || colStatut !== -1;
    const startIndex = hasHeader ? 1 : 0;

    if (!hasHeader) {
      colIdProduit = 0;
      colStoreId = 1;
      colStoreName = 2;
      colStatut = 3;
      colArticle = 4;
      colTraitement = 5;
      colTraitementUrgent = 6;
      colRepassage = 7;
      colRepassageUrgent = 8;
      colCategorie = 9;
      colDescription = 10;
    }

    const rows = [];
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    // 1. Recenser tous les IDs numériques existants dans le catalogue
    let nextAutoNum = 0;
    const usedNumbers = new Set();
    const existingById = new Map();
    const existingByNameAndStore = new Map(); // key -> existingItem

    // Plafond de détection d'anomalie : un catalogue compte quelques dizaines d'articles (~50).
    // Tout nombre démesuré (ex: 7206, 7207 provenant d'anciens hashes) est une anomalie à ignorer.
    const MAX_ANOMALY_THRESHOLD = Math.max(500, (existingCatalog?.length || 0) * 3);

    (existingCatalog || []).forEach(item => {
      if (!item) return;
      const cat = (item.categorie || (item.service === 'abonnement' ? 'abonnement' : 'individuel')).toLowerCase().trim();
      // Ignorer les éléments techniques et paramètres système
      if (item.service === 'system_setting' || item.service === 'reward_catalog' || (cat !== 'individuel' && cat !== 'abonnement')) {
        return;
      }

      if (item.id) {
        const rawIdStr = String(item.id).trim();
        const num = extractNumericId(rawIdStr, null);
        if (num !== null && num > 0 && num <= MAX_ANOMALY_THRESHOLD) {
          usedNumbers.add(num);
          if (num > nextAutoNum) nextAutoNum = num;
          existingById.set(String(num), item);
        }
        existingById.set(rawIdStr, item);
      }
      if (item.article) {
        const key = `${(item.store_id || 'default')}__${item.article.trim().toLowerCase()}`;
        if (!existingByNameAndStore.has(key)) {
          existingByNameAndStore.set(key, item);
        }
      }
    });

    // 2. Pré-scanner tous les IDs numériques explicites du CSV pour que nextAutoNum en tienne compte
    for (let i = startIndex; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) continue;
      const tokens = parseCSVLine(line, delimiter);
      if (tokens.every(t => !t || t.trim() === '')) continue;
      const rawId = (colIdProduit !== -1 ? (tokens[colIdProduit] || '') : '').trim();
      const num = extractNumericId(rawId, null);
      if (num !== null && num > 0 && num <= MAX_ANOMALY_THRESHOLD) {
        usedNumbers.add(num);
        if (num > nextAutoNum) nextAutoNum = num;
      }
    }

    // Registre pour détecter toute collision d'ID AU SEIN DU FICHIER CSV LUI-MÊME
    const seenIdsInFile = new Map(); // cleanNumericId -> { lineIndex, article, categorie }

    for (let i = startIndex; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) continue;
      const tokens = parseCSVLine(line, delimiter);
      // Ignorer les lignes composées uniquement de séparateurs vides (ex: ;;;;;;;;;;)
      if (tokens.every(t => !t || t.trim() === '')) continue;

      const rawIdProduit = (colIdProduit !== -1 ? (tokens[colIdProduit] || '') : '').trim();
      const parsedExplicitId = extractNumericId(rawIdProduit, null);
      // N'accepter l'ID du CSV que s'il est réaliste (<= MAX_ANOMALY_THRESHOLD). S'il est aberrant (ex: 7207), on l'ignore.
      const cleanNumericId = (parsedExplicitId !== null && parsedExplicitId > 0 && parsedExplicitId <= MAX_ANOMALY_THRESHOLD)
        ? String(parsedExplicitId)
        : '';

      const rawStoreId = (colStoreId !== -1 ? (tokens[colStoreId] || '') : '').trim();
      const rawStoreName = (colStoreName !== -1 ? (tokens[colStoreName] || '') : '').trim();
      const rawStatut = (colStatut !== -1 ? (tokens[colStatut] || '') : '').trim();
      const articleName = (colArticle !== -1 ? (tokens[colArticle] || '') : '').trim();
      const rawTraitement = colTraitement !== -1 ? tokens[colTraitement] : '';
      const rawTraitementUrgent = colTraitementUrgent !== -1 ? tokens[colTraitementUrgent] : '';
      const rawRepassage = colRepassage !== -1 ? tokens[colRepassage] : '';
      const rawRepassageUrgent = colRepassageUrgent !== -1 ? tokens[colRepassageUrgent] : '';
      const rawCat = (colCategorie !== -1 ? (tokens[colCategorie] || '') : '').toLowerCase().trim();
      const description = (colDescription !== -1 ? (tokens[colDescription] || '') : '').trim();

      // Résolution du statut (colonne 4 : 1 = actif, 0 = inactif)
      let parsedIsActive = true;
      if (rawStatut === '0' || rawStatut.toLowerCase() === 'inactif' || rawStatut.toLowerCase() === 'false' || rawStatut.toLowerCase() === 'desactive') {
        parsedIsActive = false;
      }

      // Résolution du Store
      let resolvedStore = null;
      if (rawStoreId) {
        resolvedStore = validStores.find(s => s.id === rawStoreId || s.code.toLowerCase() === rawStoreId.toLowerCase());
      }
      if (!resolvedStore && rawStoreName) {
        resolvedStore = validStores.find(s => s.nom.toLowerCase() === rawStoreName.toLowerCase() || s.nom.toLowerCase().includes(rawStoreName.toLowerCase()));
      }
      if (!resolvedStore) {
        resolvedStore = validStores.find(s => s.id === targetStoreId) || validStores[0] || null;
      }

      const finalStore = resolvedStore;
      const finalIsActive = parsedIsActive;
      const finalStatutVal = parsedIsActive ? 1 : 0;

      // Montants : cellule vide = 0
      const prixTraitement = cleanPrice(rawTraitement);
      const prixTraitementUrgent = cleanPrice(rawTraitementUrgent);
      const prixRepassage = cleanPrice(rawRepassage);
      const prixRepassageUrgent = cleanPrice(rawRepassageUrgent);

      // Validation stricte du type de produit : SEULS 'individuel' et 'abonnement' sont acceptés
      const normalizedCat = rawCat ? rawCat.toLowerCase().trim() : '';
      let isCategoryValid = true;
      let finalCategory = 'individuel';

      if (!normalizedCat || normalizedCat === 'individuel') {
        finalCategory = 'individuel';
      } else if (normalizedCat === 'abonnement' || normalizedCat.includes('abonn')) {
        finalCategory = 'abonnement';
      } else {
        isCategoryValid = false;
        finalCategory = normalizedCat;
      }

      // Détection de correspondance avec le catalogue existant (par ID ou par Store + Nom)
      const storeIdForCheck = finalStore?.id || targetStoreId;
      const keyForCheck = `${storeIdForCheck}__${articleName.toLowerCase()}`;
      
      const existsById = cleanNumericId ? existingById.has(cleanNumericId) : false;
      const existingMatch = articleName ? existingByNameAndStore.get(keyForCheck) : null;
      const existsByName = !!existingMatch;
      const isDuplicate = existsById || existsByName;

      // Attribution de l'ID produit fonctionnel :
      // - Si fourni dans le CSV (et valide <= MAX_ANOMALY_THRESHOLD) : conserver l'ID explicite
      // - Si non fourni dans le CSV (ou aberrant) mais le produit existe déjà en DB : conserver l'ID propre de l'existant
      // - Si non fourni et produit réellement nouveau : incrémenter de façon séquentielle N+1
      let assignedNumericId = '';
      let isNewProduct = false;

      if (cleanNumericId) {
        assignedNumericId = cleanNumericId;
        isNewProduct = !isDuplicate;
        const parsed = parseInt(cleanNumericId, 10);
        if (!isNaN(parsed)) usedNumbers.add(parsed);
      } else if (existingMatch) {
        // Le produit est déjà en base (par exemple après un premier import ou template d'update)
        const matchNum = extractNumericId(existingMatch.id, null);
        if (matchNum !== null && matchNum > 0 && matchNum <= MAX_ANOMALY_THRESHOLD) {
          assignedNumericId = String(matchNum);
        } else {
          // Si l'existant avait lui-même un ID corrompu/anormal, lui réattribuer un vrai ID séquentiel continu
          do {
            nextAutoNum += 1;
          } while (usedNumbers.has(nextAutoNum));
          assignedNumericId = String(nextAutoNum);
          usedNumbers.add(nextAutoNum);
        }
        isNewProduct = false;
      } else {
        // Vrai nouveau produit sans ID (ou ayant un ID aberrant dans le CSV) : attribution séquentielle N+1
        isNewProduct = true;
        do {
          nextAutoNum += 1;
        } while (usedNumbers.has(nextAutoNum));
        assignedNumericId = String(nextAutoNum);
        usedNumbers.add(nextAutoNum);
      }

      // Validation
      const errors = [];

      // DÉTECTION STRICTE DE COLLISION D'ID DANS LE FICHIER
      if (cleanNumericId) {
        if (seenIdsInFile.has(cleanNumericId)) {
          const firstSeen = seenIdsInFile.get(cleanNumericId);
          errors.push(`Collision critique d'ID : L'ID Produit '${cleanNumericId}' est déjà utilisé par '${firstSeen.article}' (${firstSeen.categorie}, ligne ${firstSeen.lineIndex}). Deux articles (qu'ils soient de même type ou de types différents) ne peuvent pas partager le même ID.`);
        } else {
          seenIdsInFile.set(cleanNumericId, {
            lineIndex: i + 1,
            article: articleName || 'Sans nom',
            categorie: finalCategory
          });
        }
      }

      if (!isCategoryValid) {
        errors.push(`Catégorie '${rawCat}' interdite : seuls 'individuel' et 'abonnement' sont acceptés`);
      }
      if (!articleName) {
        errors.push("Nom d'article manquant");
      }
      if (finalCategory === 'individuel') {
        if (prixTraitement === 0 && prixRepassage === 0) {
          errors.push("Au moins un tarif (Traitement ou Repassage) doit être > 0");
        }
      } else if (finalCategory === 'abonnement') {
        if (prixTraitement === 0 && prixRepassage === 0) {
          errors.push("Tarif d'abonnement > 0 requis");
        }
      }

      const isValid = errors.length === 0;

      if (!isValid) invalidCount++;
      else if (isDuplicate) duplicateCount++;
      else validCount++;

      rows.push({
        rowIdx: i,
        lineIndex: i + 1,
        idProduit: cleanNumericId, // ID numérique d'origine du CSV (vide si non spécifié)
        assignedNumericId, // ID numérique standard fonctionnel résolu
        isNewProduct,
        storeId: finalStore?.id || '',
        storeName: finalStore?.nom || 'Inconnu',
        storeCode: finalStore?.code || '',
        statutVal: finalStatutVal,
        isActive: finalIsActive,
        article: articleName,
        prixTraitement,
        prixTraitementUrgent,
        prixRepassage,
        prixRepassageUrgent,
        categorie: finalCategory,
        description: description || 'Prestation pressing standard',
        isValid,
        isDuplicate,
        existsById,
        errors
      });
    }

    return {
      rows,
      stats: {
        total: rows.length,
        valid: validCount,
        duplicates: duplicateCount,
        invalid: invalidCount
      }
    };
  }, [currentContent, existingCatalog, targetStoreId, validStores]);

  // 7. Exécution de l'importation avec IDs purement numériques et montants vides = 0
  const handleExecuteImport = async () => {
    const rowsToImport = parsedData.rows.filter(r => r.isValid && (updateExisting || !r.isDuplicate));
    if (rowsToImport.length === 0) {
      setImportStatus({ type: 'error', message: "Aucun article valide à importer selon vos critères." });
      return;
    }

    setIsProcessing(true);
    setImportStatus(null);

    try {
      const itemsToPersist = [];

      rowsToImport.forEach(row => {
        const storeId = row.storeId || targetStoreId;
        const targetId = row.assignedNumericId || row.idProduit;

        if (row.categorie === 'abonnement') {
          const existingSubItem = (existingCatalog || []).find(c =>
            c &&
            (c.store_id === storeId || (!c.store_id && storeId === targetStoreId)) &&
            (c.service === 'abonnement' || c.categorie === 'abonnement') &&
            c.article?.trim().toLowerCase() === row.article.trim().toLowerCase()
          );

          itemsToPersist.push({
            id: existingSubItem ? existingSubItem.id : targetId,
            article: row.article,
            service: 'abonnement',
            categorie: 'abonnement',
            prix: row.prixTraitement || row.prixRepassage || 0,
            description: row.description,
            store_id: storeId,
            duree_jours: 30,
            is_active: row.isActive,
            statut: row.isActive ? 'actif' : 'inactif'
          });
        } else {
          // Traitement
          const existingTraitementItem = (existingCatalog || []).find(c => 
            c &&
            (c.store_id === storeId || (!c.store_id && storeId === targetStoreId)) &&
            c.service === 'lavage_simple' &&
            c.article?.trim().toLowerCase() === row.article.trim().toLowerCase()
          );

          if (row.prixTraitement > 0 || row.prixRepassage === 0) {
            itemsToPersist.push({
              id: existingTraitementItem ? existingTraitementItem.id : targetId,
              article: row.article,
              service: 'lavage_simple',
              categorie: 'individuel',
              prix: row.prixTraitement,
              prix_urgent: row.prixTraitementUrgent > 0 ? row.prixTraitementUrgent : null,
              description: row.description,
              store_id: storeId,
              is_active: row.isActive,
              statut: row.isActive ? 'actif' : 'inactif'
            });
          }

          // Repassage
          if (row.prixRepassage > 0) {
            // Rechercher si un article de repassage correspondant existe déjà dans le catalogue
            const existingRepassageItem = (existingCatalog || []).find(c => 
              c &&
              (c.store_id === storeId || (!c.store_id && storeId === targetStoreId)) &&
              c.service === 'repassage' &&
              c.article?.trim().toLowerCase() === row.article.trim().toLowerCase()
            );

            const baseId = existingTraitementItem ? existingTraitementItem.id : targetId;
            const repId = existingRepassageItem
              ? existingRepassageItem.id
              : (baseId ? (baseId.endsWith('_rep') ? baseId : `${baseId}_rep`) : undefined);

            itemsToPersist.push({
              id: repId,
              article: row.article,
              service: 'repassage',
              categorie: 'individuel',
              prix: row.prixRepassage,
              prix_urgent: row.prixRepassageUrgent > 0 ? row.prixRepassageUrgent : null,
              description: row.description,
              store_id: storeId,
              is_active: row.isActive,
              statut: row.isActive ? 'actif' : 'inactif'
            });
          }
        }
      });

      const result = await db.addCatalogItemsBatch(itemsToPersist, {
        updateExisting: updateExisting,
        storeId: targetStoreId
      });

      if (db.refreshCatalog) {
        await db.refreshCatalog();
      }

      if (onImportSuccess) {
        onImportSuccess();
      }

      setImportStatus({
        type: 'success',
        message: `Importation réussie ! ${result.inserted} article(s) créé(s)${result.updated > 0 ? `, ${result.updated} mis à jour` : ''}.`
      });

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setImportStatus({
        type: 'error',
        message: `Erreur lors de l'importation : ${err.message || 'Une anomalie est survenue.'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
        <div
          className="card"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            width: '100%',
            maxWidth: '1080px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            cursor: 'default'
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: '1.2rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                  Importer & Synchroniser les Produits du Catalogue
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Standard fonctionnel d'ID numérique incrémental, montants par défaut à 0 et exports complets
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

          {/* BODY */}
          <div style={{ padding: '1.2rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
            
            {/* CARTE DES DEUX MODÈLES (Vierge vs Export Existant) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '0.9rem' }}>
              
              {/* Sélecteur de Laverie & Modèle CSV Vierge */}
              <div style={{ padding: '0.9rem', borderRadius: '14px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Store size={15} color="var(--primary)" /> Point de Laverie par défaut *
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {currentStoreObj?.code || ''}
                  </span>
                </div>
                
                <CustomSelect
                  className="input-control"
                  value={targetStoreId}
                  onChange={(e) => setTargetStoreId(e.target.value)}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  <option value="" disabled>-- Choisir le point de laverie --</option>
                  {validStores.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.nom} ({st.code})
                    </option>
                  ))}
                </CustomSelect>

                <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleDownloadTemplate}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      borderColor: 'var(--primary)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                    title="Nouveaux produits sans ID Produit, montants vides = 0"
                  >
                    <Download size={13} /> Modèle Vierge
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleExportExistingCatalog}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      borderColor: '#10b981',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                    title="Exporte tous les articles existants avec ID numérique et aucune cellule vide"
                  >
                    <FileSpreadsheet size={13} /> Exporter l'Existant (Complet)
                  </button>
                </div>
              </div>

              {/* Guide et Règles du Template */}
              <div style={{ padding: '0.9rem', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.45rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={15} /> Règles & Format du Template CSV
                </div>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  • <strong>ID Produit</strong> : laissez vide pour les nouveaux articles (affectation automatique d'un ID numérique).<br/>
                  • <strong>Statut (colonne 4)</strong> : <code>1</code> = produit actif, <code>0</code> = produit inactif.<br/>
                  • <strong>Montants</strong> : les cellules vides sont automatiquement affectées à 0 F.<br/>
                  • <strong>Catégories autorisées</strong> : uniquement <code>individuel</code> et <code>abonnement</code>.<br/>
                  • <strong>Export de l'existant</strong> : garanti complet, sans aucune cellule vide.
                </div>
              </div>

            </div>

            {/* ONGLET DE CHARGEMENT : FICHIER OU COPIER/COLLER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveInputTab('file')}
                  style={{
                    background: activeInputTab === 'file' ? 'var(--primary-light)' : 'transparent',
                    color: activeInputTab === 'file' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeInputTab === 'file' ? 700 : 500,
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Upload size={14} /> Fichier CSV / TXT
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab('paste')}
                  style={{
                    background: activeInputTab === 'paste' ? 'var(--primary-light)' : 'transparent',
                    color: activeInputTab === 'paste' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeInputTab === 'paste' ? 700 : 500,
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ClipboardPaste size={14} /> Coller depuis Sheets ou Excel
                </button>
              </div>

              {activeInputTab === 'file' ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: '16px',
                    padding: '1.4rem',
                    textAlign: 'center',
                    background: isDragging ? 'var(--primary-light)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .txt, .tsv"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Upload size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {fileName ? `Fichier prêt : ${fileName}` : 'Glissez-déposez votre fichier CSV ici'}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      ou cliquez pour parcourir votre ordinateur (.csv ou .txt, séparateur point-virgule ou virgule)
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={4}
                    className="input-control"
                    placeholder={`Collez vos lignes CSV ou vos cellules copiées directement depuis Google Sheets / Excel...\nExemple :\n;store_1;Point Principal;1;Chemise;1500;2250;800;1200;individuel;Coton\n;store_1;Point Principal;1;Pantalon;1500;2000;800;1200;individuel;Jeans\n;store_1;Point Principal;0;Costume d'hiver;3500;5000;2000;3000;individuel;Hors saison`}
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      setImportStatus(null);
                    }}
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      lineHeight: 1.4,
                      padding: '0.75rem',
                      borderRadius: '12px'
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Copiez une sélection de cellules dans Excel ou Google Sheets et collez-la directement.
                  </span>
                </div>
              )}
            </div>

            {/* PRÉVISUALISATION AVEC CHIPS INTELLIGENTS & ID NUMÉRIQUE */}
            {parsedData.rows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                
                {/* En-tête statistiques de l'aperçu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Aperçu ({parsedData.stats.total} ligne{parsedData.stats.total > 1 ? 's' : ''}) :
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontWeight: 700 }}>
                      ✓ {parsedData.stats.valid} nouveau{parsedData.stats.valid > 1 ? 'x' : ''}
                    </span>
                    {parsedData.stats.duplicates > 0 && (
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', fontWeight: 700 }}>
                        ⚠ {parsedData.stats.duplicates} existant{parsedData.stats.duplicates > 1 ? 's' : ''}
                      </span>
                    )}
                    {parsedData.stats.invalid > 0 && (
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', fontWeight: 700 }}>
                        ✕ {parsedData.stats.invalid} invalide{parsedData.stats.invalid > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {parsedData.stats.duplicates > 0 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                      />
                      Mettre à jour les articles existants si déjà présents
                    </label>
                  )}
                </div>

                {/* Tableau standard d'aperçu des articles */}
                <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ padding: '0.5rem 0.75rem', width: '35px' }}>#</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>ID Produit</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Point de Laverie</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Statut</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Article</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Lavage (Base / Exp)</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Repassage (Base / Exp)</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Catégorie</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.rows.map((row, idx) => {
                        let statusColor = '#16a34a';
                        let statusBg = 'rgba(22, 163, 74, 0.08)';
                        let statusLabel = 'Prêt';

                        if (!row.isValid) {
                          statusColor = '#dc2626';
                          statusBg = 'rgba(220, 38, 38, 0.08)';
                          statusLabel = row.errors.join(', ');
                        } else if (row.isDuplicate) {
                          statusColor = '#d97706';
                          statusBg = 'rgba(217, 119, 6, 0.08)';
                          statusLabel = updateExisting ? 'Mise à jour' : 'Ignoré (Doublon)';
                        }

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', opacity: !row.isValid ? 0.6 : 1 }}>
                            
                            {/* Numéro de ligne */}
                            <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {row.lineIndex}
                            </td>

                            {/* ID Produit purement numérique */}
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              {row.idProduit ? (
                                <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {row.idProduit}
                                </span>
                              ) : row.isNewProduct ? (
                                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--primary)', fontStyle: 'italic', fontWeight: 600 }}>
                                  Auto: {row.assignedNumericId}
                                </span>
                              ) : (
                                <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }} title="ID du produit existant dans le catalogue">
                                  {row.assignedNumericId}
                                </span>
                              )}
                            </td>

                            {/* Point de Laverie (Store ID & Store Name) */}
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {row.storeName}
                              </span>
                              <span style={{ opacity: 0.6, fontSize: '0.7rem', marginLeft: '0.35rem' }}>
                                ({row.storeCode || row.storeId})
                              </span>
                            </td>

                            {/* Statut (1 = Actif, 0 = Inactif) */}
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              {row.isActive ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
                                  1 (Actif)
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                  0 (Inactif)
                                </span>
                              )}
                            </td>

                            {/* Nom de l'article */}
                            <td style={{ padding: '0.45rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {row.article || '<Sans nom>'}
                            </td>

                            {/* Tarif Lavage / Traitement (0 si non configuré) */}
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              <span>
                                {row.prixTraitement.toLocaleString()} F
                                {row.prixTraitementUrgent > 0 ? ` (Exp: ${row.prixTraitementUrgent.toLocaleString()} F)` : ''}
                              </span>
                            </td>

                            {/* Tarif Repassage (0 si non configuré) */}
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              <span>
                                {row.prixRepassage.toLocaleString()} F
                                {row.prixRepassageUrgent > 0 ? ` (Exp: ${row.prixRepassageUrgent.toLocaleString()} F)` : ''}
                              </span>
                            </td>

                            {/* Catégorie */}
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: row.categorie === 'abonnement' ? '#8b5cf6' : (row.categorie === 'individuel' ? 'var(--primary)' : '#dc2626')
                              }}>
                                {row.categorie === 'abonnement' ? 'Abonnement' : (row.categorie === 'individuel' ? 'Individuel' : `${row.categorie} (Interdit)`)}
                              </span>
                            </td>

                            {/* Statut de la ligne */}
                            <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '8px', color: statusColor, background: statusBg }}>
                                {statusLabel}
                              </span>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* MESSAGE D'ÉTAT / NOTIFICATION */}
            {importStatus && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: importStatus.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                  color: importStatus.type === 'success' ? '#16a34a' : '#dc2626',
                  border: `1px solid ${importStatus.type === 'success' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                }}
              >
                {importStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{importStatus.message}</span>
              </div>
            )}

          </div>

          {/* FOOTER ACTIONS */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isProcessing}
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 600, borderRadius: '10px' }}
            >
              Fermer
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExecuteImport}
              disabled={
                isProcessing ||
                parsedData.rows.filter(r => r.isValid && (updateExisting || !r.isDuplicate)).length === 0
              }
              style={{
                padding: '0.55rem 1.35rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#10b981',
                borderColor: '#10b981',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                opacity: (parsedData.rows.filter(r => r.isValid && (updateExisting || !r.isDuplicate)).length === 0) ? 0.6 : 1
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={15} className="spin-animation" /> Importation en cours...
                </>
              ) : (
                <>
                  <Upload size={15} />
                  <span>
                    Importer {parsedData.rows.filter(r => r.isValid && (updateExisting || !r.isDuplicate)).length > 0
                      ? `(${parsedData.rows.filter(r => r.isValid && (updateExisting || !r.isDuplicate)).length} articles)`
                      : ''}
                  </span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
