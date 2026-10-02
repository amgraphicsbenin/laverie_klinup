import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  RefreshCw,
  AlertTriangle,
  XCircle,
  Check
} from 'lucide-react';
import { db } from '../../../services/db';
import CustomSelect from '../../../components/CustomSelect';

const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
};

// En-tête officiel du CSV intégrant ID_Produit (numérique seul), Store_ID, Store_Name, Statut (1/0)
const CSV_HEADER_LINE = 'ID_Produit;Store_ID;Store_Name;Statut;Article;Tarif_Traitement;Tarif_Traitement_Express;Tarif_Repassage;Tarif_Repassage_Express;Categorie;Description\r\n';

// Helper de normalisation pour la validation stricte des noms et identifiants
const normalizeClean = (str) => {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

export default function ImportCatalogModal({
  isOpen,
  onClose,
  stores = [],
  selectedStoreId = '',
  catalogCategory = 'individuel',
  existingCatalog = [],
  onImportSuccess
}) {
  if (!isOpen) return null;

  // Récupérer et filtrer les points de vente valides (exclure 'all' et 'GLOBAL')
  const allAvailableStores = useMemo(() => {
    let list = stores || [];
    if (!list || list.length === 0) {
      try {
        list = db.getStores() || [];
      } catch (e) {
        list = [];
      }
    }
    return list;
  }, [stores]);

  const validStores = useMemo(() => {
    return (allAvailableStores || []).filter(st => st && st.id !== 'all' && st.code !== 'GLOBAL');
  }, [allAvailableStores]);

  // Point de vente par défaut
  const defaultStoreId = useMemo(() => {
    if (selectedStoreId && (selectedStoreId === 'all' || selectedStoreId === 'GLOBAL')) {
      return 'all';
    }
    if (selectedStoreId) {
      return selectedStoreId;
    }
    return validStores.length === 1 ? validStores[0].id : 'all';
  }, [selectedStoreId, validStores]);

  const [targetStoreId, setTargetStoreId] = useState(defaultStoreId);
  const [exportCategoryFilter, setExportCategoryFilter] = useState(catalogCategory || 'individuel');

  useEffect(() => {
    setTargetStoreId(defaultStoreId);
    setExportCategoryFilter(catalogCategory || 'individuel');
    if (!isOpen) {
      setFileName('');
      setRawContent('');
      setImportStatus(null);
    }
  }, [isOpen, defaultStoreId, catalogCategory]);

  const [fileName, setFileName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const fileInputRef = useRef(null);

  // Nom du point de vente actif
  const currentStoreObj = targetStoreId === 'all'
    ? { id: 'all', nom: 'Tous les points (Global)', code: 'global' }
    : validStores.find(s => s.id === targetStoreId);
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
    const sId = (targetStoreId && targetStoreId !== 'all') ? targetStoreId : (validStores[0]?.id || 'store_1');
    const sName = (targetStoreId && targetStoreId !== 'all') ? (currentStoreObj?.nom || validStores[0]?.nom || 'Point Principal') : (validStores[0]?.nom || 'Point Principal');

    const sampleRows = exportCategoryFilter === 'abonnement' ? [
      `1;${sId};${sName};1;Formule Mensuelle 30;15000;0;0;0;abonnement;30 vêtements par mois avec ramassage`,
      `2;${sId};${sName};1;Abonnement Premium;35000;0;0;0;abonnement;50 vêtements max/mois | 2 ramassages gratuits`,
      `3;${sId};${sName};1;Formule VIP Famille;60000;0;0;0;abonnement;100 vêtements max/mois | 4 ramassages gratuits`
    ].join('\r\n') : (exportCategoryFilter === 'individuel' ? [
      `1;${sId};${sName};1;Chemise;1500;2250;800;1200;individuel;Coton, lin ou synthétique`,
      `2;${sId};${sName};1;Costume 2 pièces;3500;5000;2000;3000;individuel;Veste et pantalon pressing`,
      `3;${sId};${sName};1;Pantalon;1500;2000;800;1200;individuel;Jean, toile ou costume`,
      `4;${sId};${sName};1;Robe simple;2500;3500;1500;2000;individuel;Tenue quotidienne`,
      `5;${sId};${sName};1;Robe de soirée;4500;6500;2500;3500;individuel;Tissu délicat, soies ou perles`,
      `6;${sId};${sName};1;Veste / Blazer;2500;3500;1500;2000;individuel;Nettoyage à sec délicat`,
      `7;${sId};${sName};1;T-shirt / Polo;1000;1500;500;800;individuel;Lavage standard et repassage`,
      `8;${sId};${sName};1;Drap 2 places;2000;0;1000;0;individuel;Linge de lit grand format`
    ].join('\r\n') : [
      `1;${sId};${sName};1;Chemise;1500;2250;800;1200;individuel;Coton, lin ou synthétique`,
      `2;${sId};${sName};1;Costume 2 pièces;3500;5000;2000;3000;individuel;Veste et pantalon pressing`,
      `3;${sId};${sName};1;Pantalon;1500;2000;800;1200;individuel;Jean, toile ou costume`,
      `4;${sId};${sName};1;Robe simple;2500;3500;1500;2000;individuel;Tenue quotidienne`,
      `5;${sId};${sName};1;Formule Mensuelle 30;15000;0;0;0;abonnement;30 vêtements par mois avec ramassage`
    ].join('\r\n'));

    const fullContent = '\uFEFF' + CSV_HEADER_LINE + sampleRows;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const catSuffix = exportCategoryFilter === 'individuel' ? '_vetements' : (exportCategoryFilter === 'abonnement' ? '_abonnements' : '');
    link.setAttribute('download', `template_catalogue_produits_${(currentStoreObj?.code || 'klinup').toLowerCase()}${catSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Parser de ligne CSV (conforme RFC 4180 : support apostrophes françaises & guillemets doublés)
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
  const currentContent = rawContent;

  const parsedData = useMemo(() => {
    if (!currentContent || !currentContent.trim()) {
      return { rows: [], stats: { total: 0, valid: 0, duplicates: 0, invalid: 0 } };
    }

    const cleanText = currentContent.replace(/^\uFEFF/, '').trim();
    const rawLines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) {
      return { rows: [], stats: { total: 0, valid: 0, duplicates: 0, invalid: 0 } };
    }

    // Détection robuste du délimiteur (comptage d'occurrences sur les premières lignes)
    const firstLine = rawLines[0];
    const sampleText = rawLines.slice(0, 5).join('\n');
    const countOccurrences = (str, ch) => {
      let count = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === ch) count++;
      }
      return count;
    };
    const tabCount = countOccurrences(sampleText, '\t');
    const semiCount = countOccurrences(sampleText, ';');
    const commaCount = countOccurrences(sampleText, ',');

    let delimiter = ';';
    if (tabCount > semiCount && tabCount > commaCount) {
      delimiter = '\t';
    } else if (commaCount > semiCount && commaCount > tabCount) {
      delimiter = ',';
    } else {
      delimiter = ';';
    }

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

    const missingHeaders = [];
    if (hasHeader) {
      if (colStoreId === -1) missingHeaders.push('Store_ID');
      if (colStoreName === -1) missingHeaders.push('Store_Name');
      if (colStatut === -1) missingHeaders.push('Statut');
      if (colCategorie === -1) missingHeaders.push('Categorie');
    }

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
        if (num !== null && num > 0) {
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
      if (num !== null && num > 0) {
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
      const cleanNumericId = (parsedExplicitId !== null && parsedExplicitId > 0)
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

      const errors = [];

      // A. CONTRÔLE D'EN-TÊTE
      if (hasHeader && missingHeaders.length > 0) {
        errors.push(`Colonnes obligatoires manquantes dans l'en-tête : ${missingHeaders.join(', ')}`);
      }

      // B. 1. CONTRÔLE STRICT STORE_ID
      let resolvedStore = null;
      let isStoreIdValid = false;

      if (!rawStoreId) {
        errors.push("Store_ID manquant : l'identifiant du point de vente est obligatoire.");
      } else {
        resolvedStore = validStores.find(s => 
          (s.id && String(s.id).trim().toLowerCase() === rawStoreId.toLowerCase()) ||
          (s.code && String(s.code).trim().toLowerCase() === rawStoreId.toLowerCase())
        );
        if (resolvedStore) {
          isStoreIdValid = true;
        } else {
          const availableList = validStores.map(s => s.code ? `${s.code} (${s.id})` : s.id).join(', ');
          errors.push(`Store_ID '${rawStoreId}' inconnu ou invalide (points valides : ${availableList || 'aucun point configuré'}).`);
        }
      }

      // C. 2. CONTRÔLE STRICT STORE_NAME
      let isStoreNameValid = false;
      if (!rawStoreName) {
        errors.push("Store_Name manquant : le nom officiel du point de vente est obligatoire.");
      } else {
        if (resolvedStore) {
          const normRaw = normalizeClean(rawStoreName);
          const normStoreNom = normalizeClean(resolvedStore.nom);
          const normStoreCode = normalizeClean(resolvedStore.code);
          const isNameMatch = normRaw === normStoreNom || 
                              normRaw === normStoreCode || 
                              (normRaw.length >= 4 && normStoreNom.includes(normRaw)) || 
                              (normStoreNom.length >= 4 && normRaw.includes(normStoreNom));
          if (isNameMatch) {
            isStoreNameValid = true;
          } else {
            errors.push(`Store_Name '${rawStoreName}' ne correspond pas au Store_ID '${rawStoreId}' (nom attendu : '${resolvedStore.nom}').`);
          }
        } else {
          const storeByName = validStores.find(s => {
            const normRaw = normalizeClean(rawStoreName);
            const normStoreNom = normalizeClean(s.nom);
            return normRaw === normStoreNom || (normRaw.length >= 4 && normStoreNom.includes(normRaw));
          });
          if (storeByName) {
            isStoreNameValid = true;
            resolvedStore = storeByName;
          } else {
            errors.push(`Store_Name '${rawStoreName}' invalide ou introuvable.`);
          }
        }
      }

      // D. 3. CONTRÔLE STRICT STATUT (doit être '1' ou '0')
      let parsedIsActive = false;
      let isStatutValid = false;
      const cleanStatutLower = rawStatut.toLowerCase().trim();

      if (!rawStatut) {
        errors.push("Statut manquant : doit être obligatoirement '1' (actif) ou '0' (inactif).");
      } else if (cleanStatutLower === '1' || cleanStatutLower === 'actif' || cleanStatutLower === 'true') {
        isStatutValid = true;
        parsedIsActive = true;
      } else if (cleanStatutLower === '0' || cleanStatutLower === 'inactif' || cleanStatutLower === 'false') {
        isStatutValid = true;
        parsedIsActive = false;
      } else {
        errors.push(`Statut '${rawStatut}' invalide : doit être strictement '1' (actif) ou '0' (inactif).`);
      }

      // E. 4. CONTRÔLE STRICT CATEGORIE (doit être 'individuel' ou 'abonnement')
      let finalCategory = '';
      let isCategoryValid = false;
      const cleanCatLower = rawCat.toLowerCase().trim();

      if (!rawCat) {
        errors.push("Catégorie manquante : doit être obligatoirement 'individuel' ou 'abonnement'.");
      } else if (cleanCatLower === 'individuel') {
        isCategoryValid = true;
        finalCategory = 'individuel';
      } else if (cleanCatLower === 'abonnement') {
        isCategoryValid = true;
        finalCategory = 'abonnement';
      } else {
        finalCategory = cleanCatLower;
        errors.push(`Catégorie '${rawCat}' invalide : seules les catégories 'individuel' et 'abonnement' sont autorisées.`);
      }

      // F. 5. CONTRÔLE NOM D'ARTICLE
      if (!articleName) {
        errors.push("Nom d'article manquant.");
      }

      // Montants : cellule vide = 0
      const prixTraitement = cleanPrice(rawTraitement);
      const prixTraitementUrgent = cleanPrice(rawTraitementUrgent);
      const prixRepassage = cleanPrice(rawRepassage);
      const prixRepassageUrgent = cleanPrice(rawRepassageUrgent);

      // G. 6. CONTRÔLE TARIFS
      if (isCategoryValid) {
        if (finalCategory === 'individuel') {
          if (prixTraitement === 0 && prixRepassage === 0) {
            errors.push("Au moins un tarif (Lavage/Traitement ou Repassage) doit être > 0.");
          }
        } else if (finalCategory === 'abonnement') {
          if (prixTraitement === 0 && prixRepassage === 0) {
            errors.push("Tarif d'abonnement supérieur à 0 requis.");
          }
        }
      }

      // H. 7. CONTRÔLE COLLISION D'ID DANS LE FICHIER
      if (cleanNumericId) {
        if (seenIdsInFile.has(cleanNumericId)) {
          const firstSeen = seenIdsInFile.get(cleanNumericId);
          errors.push(`Collision critique d'ID : L'ID Produit '${cleanNumericId}' est déjà utilisé par '${firstSeen.article}' (ligne ${firstSeen.lineIndex}).`);
        } else {
          seenIdsInFile.set(cleanNumericId, {
            lineIndex: i + 1,
            article: articleName || 'Sans nom',
            categorie: finalCategory || rawCat
          });
        }
      }

      // Détection de correspondance avec le catalogue existant (par ID ou par Store + Nom)
      const storeIdForCheck = resolvedStore?.id || rawStoreId || targetStoreId;
      const keyForCheck = `${storeIdForCheck}__${articleName.toLowerCase()}`;
      
      const existsById = cleanNumericId ? existingById.has(cleanNumericId) : false;
      const existingMatch = articleName ? existingByNameAndStore.get(keyForCheck) : null;
      const existsByName = !!existingMatch;
      const isDuplicate = existsById || existsByName;

      // Attribution de l'ID produit fonctionnel :
      let assignedNumericId = '';
      let isNewProduct = false;

      if (cleanNumericId) {
        assignedNumericId = cleanNumericId;
        isNewProduct = !isDuplicate;
        const parsed = parseInt(cleanNumericId, 10);
        if (!isNaN(parsed)) usedNumbers.add(parsed);
      } else if (existingMatch) {
        const matchNum = extractNumericId(existingMatch.id, null);
        if (matchNum !== null && matchNum > 0) {
          assignedNumericId = String(matchNum);
        } else {
          do {
            nextAutoNum += 1;
          } while (usedNumbers.has(nextAutoNum));
          assignedNumericId = String(nextAutoNum);
          usedNumbers.add(nextAutoNum);
        }
        isNewProduct = false;
      } else {
        isNewProduct = true;
        do {
          nextAutoNum += 1;
        } while (usedNumbers.has(nextAutoNum));
        assignedNumericId = String(nextAutoNum);
        usedNumbers.add(nextAutoNum);
      }

      const finalStore = resolvedStore;
      const finalIsActive = parsedIsActive;
      const finalStatutVal = parsedIsActive ? 1 : 0;
      const isValid = errors.length === 0;

      if (!isValid) invalidCount++;
      else if (isDuplicate) duplicateCount++;
      else validCount++;

      rows.push({
        rowIdx: i,
        lineIndex: i + 1,
        idProduit: cleanNumericId,
        assignedNumericId,
        isNewProduct,
        rawStoreId,
        rawStoreName,
        rawStatut,
        rawCat,
        storeId: finalStore?.id || rawStoreId,
        storeName: finalStore?.nom || rawStoreName || 'Inconnu',
        storeCode: finalStore?.code || '',
        isStoreIdValid,
        isStoreNameValid,
        isStatutValid,
        isCategoryValid,
        statutVal: finalStatutVal,
        isActive: finalIsActive,
        article: articleName,
        prixTraitement,
        prixTraitementUrgent,
        prixRepassage,
        prixRepassageUrgent,
        categorie: finalCategory || rawCat,
        description: description || 'Prestation pressing standard',
        isValid,
        isDuplicate,
        existsById,
        errors
      });
    }

    const isTemplateRejected = invalidCount > 0 || (hasHeader && missingHeaders.length > 0);

    return {
      rows,
      missingHeaders: hasHeader ? missingHeaders : [],
      stats: {
        total: rows.length,
        valid: validCount,
        duplicates: duplicateCount,
        invalid: invalidCount,
        isTemplateRejected
      }
    };
  }, [currentContent, existingCatalog, targetStoreId, validStores]);

  // 7. Exécution de l'importation avec IDs purement numériques et montants vides = 0
  const handleExecuteImport = async () => {
    if (parsedData.stats.isTemplateRejected || parsedData.stats.invalid > 0) {
      setImportStatus({
        type: 'error',
        message: `Template rejeté : Le fichier contient ${parsedData.stats.invalid} ligne(s) non conforme(s). Les champs Store_ID, Store_Name, Statut et Categorie doivent être strictement valides avant toute importation.`
      });
      return;
    }

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
          itemsToPersist.push({
            id: targetId,
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
          if (row.prixTraitement > 0 || row.prixRepassage === 0) {
            itemsToPersist.push({
              id: targetId,
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

            itemsToPersist.push({
              id: existingRepassageItem ? existingRepassageItem.id : (targetId ? `${targetId}_rep` : undefined),
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
                  <option value="all">Tous les points (Catalogue Global)</option>
                  {validStores.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.nom} ({st.code})
                    </option>
                  ))}
                </CustomSelect>

                {/* Filtre de catégorie pour l'export */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type d'articles :</span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {[
                      { id: 'individuel', label: 'Vêtements' },
                      { id: 'abonnement', label: 'Abonnements' },
                      { id: 'all', label: 'Tous' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setExportCategoryFilter(cat.id)}
                        style={{
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.7rem',
                          fontWeight: exportCategoryFilter === cat.id ? 700 : 500,
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: exportCategoryFilter === cat.id ? 'var(--primary)' : 'var(--border-color)',
                          background: exportCategoryFilter === cat.id ? 'var(--primary-light)' : 'transparent',
                          color: exportCategoryFilter === cat.id ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleDownloadTemplate}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      borderColor: 'var(--primary)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem'
                    }}
                    title="Nouveaux produits sans ID Produit, montants vides = 0"
                  >
                    <Download size={14} /> Modèle Vierge ({exportCategoryFilter === 'individuel' ? 'Vêtements' : exportCategoryFilter === 'abonnement' ? 'Abonnements' : 'Tous'})
                  </button>
                </div>
              </div>

              {/* Guide et Règles du Template */}
              <div style={{ padding: '0.9rem', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.45rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={15} /> Règles & Contrôles Stricts du Template CSV
                </div>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  • <strong>Store_ID & Store_Name</strong> : obligatoires et doivent correspondre à un point de vente valide.<br/>
                  • <strong>Statut (colonne 4)</strong> : strictement <code>1</code> (actif) ou <code>0</code> (inactif).<br/>
                  • <strong>Catégorie (colonne 10)</strong> : strictement <code>individuel</code> ou <code>abonnement</code>.<br/>
                  • <strong>ID Produit</strong> : laissez vide pour les nouveaux articles (affectation séquentielle N+1).<br/>
                  • <strong>Contrôle strict</strong> : si une seule ligne est incorrecte, le template est <strong>rejeté</strong>.
                </div>
              </div>

            </div>

            {/* CHARGEMENT DU FICHIER CSV / TXT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <div
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Upload size={14} /> Fichier CSV / TXT
                </div>
              </div>

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
            </div>

            {/* PRÉVISUALISATION AVEC CHIPS INTELLIGENTS & ID NUMÉRIQUE */}
            {parsedData.rows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                
                {/* BANNIÈRE DE REJET SI TEMPLATE NON CONFORME */}
                {parsedData.stats.isTemplateRejected && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '2px solid rgba(239, 68, 68, 0.45)',
                    borderRadius: '16px',
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <AlertCircle size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#dc2626' }}>
                            TEMPLATE REJETÉ : Données non conformes ({parsedData.stats.invalid} ligne{parsedData.stats.invalid > 1 ? 's' : ''} en anomalie)
                          </h4>
                          <span style={{
                            background: '#dc2626',
                            color: '#fff',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Importation Bloquée
                          </span>
                        </div>
                        <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          L'application exige la conformité absolue des données. Les champs <strong>Store_ID</strong>, <strong>Store_Name</strong>, <strong>Statut</strong> et <strong>Categorie</strong> doivent être valides sur 100% des lignes pour que le template soit accepté.
                        </p>
                      </div>
                    </div>

                    {/* Liste des anomalies détectées */}
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      maxHeight: '130px',
                      overflowY: 'auto'
                    }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                        Détail des anomalies à corriger dans le fichier :
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.73rem', color: '#dc2626', lineHeight: 1.6 }}>
                        {parsedData.missingHeaders.length > 0 && (
                          <li>
                            <strong>Structure globale :</strong> Colonnes obligatoires manquantes dans l'en-tête ({parsedData.missingHeaders.join(', ')})
                          </li>
                        )}
                        {parsedData.rows.filter(r => !r.isValid).slice(0, 10).map((r, i) => (
                          <li key={i}>
                            <strong>Ligne {r.lineIndex} [{r.article || 'Sans nom'}] :</strong> {r.errors.join(' • ')}
                          </li>
                        ))}
                        {parsedData.rows.filter(r => !r.isValid).length > 10 && (
                          <li style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                            ... et {parsedData.rows.filter(r => !r.isValid).length - 10} autre(s) ligne(s) non conforme(s).
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* BANNIÈRE DE CONFORMITÉ 100% */}
                {!parsedData.stats.isTemplateRejected && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '14px',
                    padding: '0.75rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      <strong style={{ color: '#10b981' }}>Template validé & conforme :</strong> Les contrôles sur <strong>Store_ID</strong>, <strong>Store_Name</strong>, <strong>Statut</strong> et <strong>Categorie</strong> sont tous validés ({parsedData.stats.total} ligne{parsedData.stats.total > 1 ? 's' : ''} prêtes à être importées).
                    </div>
                  </div>
                )}

                {/* En-tête statistiques de l'aperçu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Aperçu ({parsedData.stats.total} ligne{parsedData.stats.total > 1 ? 's' : ''}) :
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> {parsedData.stats.valid} nouveau{parsedData.stats.valid > 1 ? 'x' : ''}
                    </span>
                    {parsedData.stats.duplicates > 0 && (
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> {parsedData.stats.duplicates} existant{parsedData.stats.duplicates > 1 ? 's' : ''}
                      </span>
                    )}
                    {parsedData.stats.invalid > 0 && (
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} /> {parsedData.stats.invalid} invalide{parsedData.stats.invalid > 1 ? 's' : ''}
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
                          <tr key={idx} style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: !row.isValid ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                          }}>
                            
                            {/* Numéro de ligne */}
                            <td style={{ padding: '0.45rem 0.75rem', color: !row.isValid ? '#dc2626' : 'var(--text-muted)', fontFamily: 'monospace', fontWeight: !row.isValid ? 700 : 500 }}>
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
                              {!row.isStoreIdValid || !row.isStoreNameValid ? (
                                <div>
                                  <span style={{ fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    ✕ {row.rawStoreName || '<Store_Name manquant>'}
                                  </span>
                                  <div style={{ fontSize: '0.69rem', color: '#dc2626', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                                    ID: {row.rawStoreId || '<vide>'} (Invalide)
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {row.storeName}
                                  </span>
                                  <span style={{ opacity: 0.6, fontSize: '0.7rem', marginLeft: '0.35rem' }}>
                                    ({row.storeCode || row.storeId})
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Statut (1 = Actif, 0 = Inactif) */}
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              {!row.isStatutValid ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                  ✕ '{row.rawStatut || 'vide'}' (Invalide)
                                </span>
                              ) : row.isActive ? (
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
                              {row.article || <span style={{ color: '#dc2626', fontStyle: 'italic' }}>&lt;Nom manquant&gt;</span>}
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
                              {!row.isCategoryValid ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                  ✕ '{row.rawCat || 'vide'}' (Interdit)
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: row.categorie === 'abonnement' ? '#8b5cf6' : (row.categorie === 'individuel' ? 'var(--primary)' : '#dc2626')
                                }}>
                                  {row.categorie === 'abonnement' ? 'Abonnement' : (row.categorie === 'individuel' ? 'Individuel' : `${row.categorie} (Interdit)`)}
                                </span>
                              )}
                            </td>

                            {/* Statut de la ligne */}
                            <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '8px',
                                color: !row.isValid ? '#dc2626' : (row.isDuplicate ? '#d97706' : '#16a34a'),
                                background: !row.isValid ? 'rgba(220, 38, 38, 0.12)' : (row.isDuplicate ? 'rgba(217, 119, 6, 0.1)' : 'rgba(22, 163, 74, 0.1)'),
                                border: !row.isValid ? '1px solid rgba(220, 38, 38, 0.3)' : 'none'
                              }}>
                                {!row.isValid ? (
                                  <><XCircle size={11} /> REJETÉ</>
                                ) : (row.isDuplicate ? (
                                  <>{updateExisting ? 'Mise à jour' : 'Ignoré (Doublon)'}</>
                                ) : (
                                  <><CheckCircle2 size={11} /> Valide</>
                                ))}
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
                parsedData.stats.isTemplateRejected ||
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
                background: parsedData.stats.isTemplateRejected ? '#dc2626' : '#10b981',
                borderColor: parsedData.stats.isTemplateRejected ? '#dc2626' : '#10b981',
                color: '#fff',
                boxShadow: parsedData.stats.isTemplateRejected
                  ? '0 4px 12px rgba(220, 38, 38, 0.25)'
                  : '0 4px 12px rgba(16, 185, 129, 0.25)',
                opacity: (parsedData.stats.isTemplateRejected || parsedData.rows.filter(r => r.isValid && (updateExisting || !r.isDuplicate)).length === 0) ? 0.7 : 1,
                cursor: (parsedData.stats.isTemplateRejected || parsedData.rows.filter(r => r.isValid && (updateExisting || !r.isDuplicate)).length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={15} className="spin-animation" /> Importation en cours...
                </>
              ) : parsedData.stats.isTemplateRejected ? (
                <>
                  <AlertCircle size={15} />
                  <span>Importation bloquée (Template rejeté)</span>
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
