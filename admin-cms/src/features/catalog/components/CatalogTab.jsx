import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Plus, Search, Trash2, Edit, AlertCircle, Power, CheckCircle2, XCircle, ChevronDown, Upload, PlusCircle } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import ImportCatalogModal from './ImportCatalogModal';

export default function CatalogTab({
  catalogCategory,
  setCatalogCategory,
  selectedCatalogIds,
  setSelectedCatalogIds,
  handleDeleteCatalogItemsBatch,
  catalogSearchText,
  setCatalogSearchText,
  catalogServiceFilter,
  setCatalogServiceFilter,
  catalogPriceFilter,
  setCatalogPriceFilter,
  catalogSortOrder,
  setCatalogSortOrder,
  filteredCatalog,
  catalogCurrentPage,
  setCatalogCurrentPage,
  getAssetIcon,
  handleStartEditProduct,
  handleDeleteCatalogItem,
  handleToggleCatalogItemActive,
  setShowAddCatalogModal,
  stores = [],
  selectedStoreId = '',
  refreshAdminData,
  catalog = []
}) {
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [showImportCatalogModal, setShowImportCatalogModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAddDropdownOpen(false);
      }
    }
    if (isAddDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddDropdownOpen]);

  const catalogItemsPerPage = 20;
  const totalCatalogPages = Math.ceil(filteredCatalog.length / catalogItemsPerPage);
  const paginatedCatalog = filteredCatalog.slice(
    (catalogCurrentPage - 1) * catalogItemsPerPage,
    catalogCurrentPage * catalogItemsPerPage
  );

  const handleToggleSelectCatalog = (id, e) => {
    if (
      e.target.tagName === 'BUTTON' ||
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'SELECT' ||
      e.target.closest('button') ||
      e.target.closest('.btn') ||
      e.target.closest('form')
    ) {
      return;
    }
    setSelectedCatalogIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="card" id="catalog-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 165px)', minHeight: '450px', maxHeight: '850px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexShrink: 0 }}>
        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Sparkles size={18} color="var(--primary)" />
          Grille Tarifaire & Catalogue des Produits
        </h3>

        {/* DROPDOWN BOUTON "AJOUTER UN ARTICLE" (Créer ou Importer) */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddDropdownOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
              padding: '0.55rem 1.15rem',
              borderRadius: '12px'
            }}
          >
            <Plus size={16} />
            <span>Ajouter un article</span>
            <ChevronDown
              size={15}
              style={{
                transform: isAddDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>

          {isAddDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.4rem',
                minWidth: '220px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                animation: 'fadeIn 0.15s ease'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsAddDropdownOpen(false);
                  setShowAddCatalogModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.6rem 0.85rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-app)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <PlusCircle size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)' }}>Créer un produit</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Saisie unitaire manuelle</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddDropdownOpen(false);
                  setShowImportCatalogModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.6rem 0.85rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-app)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Upload size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)' }}>Importer</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Template CSV / Excel</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs for Individual Clothes vs Subscriptions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div className="filter-pills-group">
          <button
            type="button"
            className={`filter-pill-btn ${catalogCategory === 'individuel' ? 'active' : ''}`}
            onClick={() => setCatalogCategory('individuel')}
          >
            Vêtements Individuels
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${catalogCategory === 'abonnement' ? 'active' : ''}`}
            onClick={() => setCatalogCategory('abonnement')}
          >
            Abonnements
          </button>
        </div>

        {selectedCatalogIds.length > 0 && (
          <button
            className="btn btn-danger"
            style={{ padding: '0.45rem 1.1rem', borderRadius: '12px', background: 'var(--danger)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem' }}
            onClick={handleDeleteCatalogItemsBatch}
          >
            <Trash2 size={15} />
            Supprimer la sélection ({selectedCatalogIds.length})
          </button>
        )}
      </div>

      {/* Smart Filters panel */}
      <div className="smart-filter-panel">
        <div className="search-control-container">
          <Search size={16} className="search-control-icon" />
          <input
            type="text"
            className="search-control-input"
            placeholder="Rechercher un article..."
            value={catalogSearchText}
            onChange={(e) => setCatalogSearchText(e.target.value)}
          />
        </div>
        
        {catalogCategory === 'individuel' && (
          <div className="select-control-wrapper">
            <CustomSelect
              className="input-control"
              value={catalogServiceFilter}
              onChange={(e) => setCatalogServiceFilter(e.target.value)}
            >
              <option value="all">Tous les services</option>
              <option value="lavage_simple">Traitement</option>
              <option value="repassage">Repassage</option>
            </CustomSelect>
          </div>
        )}

        {catalogCategory === 'individuel' && (
          <div className="select-control-wrapper">
            <CustomSelect
              className="input-control"
              value={catalogPriceFilter}
              onChange={(e) => setCatalogPriceFilter(e.target.value)}
            >
              <option value="all">Tous les prix</option>
              <option value="low">Économique (&lt; 1 500 F)</option>
              <option value="medium">Standard (1 500 F - 3 000 F)</option>
              <option value="high">Premium (&gt; 3 000 F)</option>
            </CustomSelect>
          </div>
        )}

        <div className="select-control-wrapper">
          <CustomSelect
            className="input-control"
            value={catalogSortOrder}
            onChange={(e) => setCatalogSortOrder(e.target.value)}
          >
            <option value="name_asc">Nom (A-Z)</option>
            <option value="name_desc">Nom (Z-A)</option>
            <option value="price_asc">Prix (croissant)</option>
            <option value="price_desc">Prix (décroissant)</option>
          </CustomSelect>
        </div>
        
        <label className="filter-checkbox-badge" htmlFor="select-all-catalog">
          <input
            type="checkbox"
            id="select-all-catalog"
            checked={paginatedCatalog.length > 0 && paginatedCatalog.every(item => selectedCatalogIds.includes(item.id))}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCatalogIds(prev => {
                  const pageIds = paginatedCatalog.map(item => item.id);
                  return [...new Set([...prev, ...pageIds])];
                });
              } else {
                setSelectedCatalogIds(prev => prev.filter(id => !paginatedCatalog.some(item => item.id === id)));
              }
            }}
          />
          <span>Tout cocher</span>
        </label>
      </div>

      {/* Table list or Subscription container */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          {catalogCategory === 'individuel' ? (
            <div className="table-container" style={{ margin: 0, border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', overflow: 'visible' }}>
              <table style={{ margin: 0, width: '100%' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '40px', textAlign: 'center', padding: '0.75rem' }}>
                      <input
                        type="checkbox"
                        style={{ cursor: 'pointer', scale: '1.1' }}
                        checked={paginatedCatalog.length > 0 && paginatedCatalog.every(item => selectedCatalogIds.includes(item.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCatalogIds(prev => {
                              const pageIds = paginatedCatalog.map(item => item.id);
                              return [...new Set([...prev, ...pageIds])];
                            });
                          } else {
                            setSelectedCatalogIds(prev => prev.filter(id => !paginatedCatalog.some(item => item.id === id)));
                          }
                        }}
                      />
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)', width: '60px' }}>ID</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Article</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Tarif Traitement</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Tarif Repassage</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Statut Mobile</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCatalog.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem' }}>
                        <AlertCircle size={28} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                        Aucun vêtement trouvé.
                      </td>
                    </tr>
                  ) : (
                    paginatedCatalog.map((item, index) => {
                      const isSelected = selectedCatalogIds.includes(item.id);
                      const isActive = item.is_active !== false && item.statut !== 'inactif';

                      return (
                        <tr
                          key={item.id}
                          onClick={(e) => handleToggleSelectCatalog(item.id, e)}
                          style={{
                            background: isSelected ? 'rgba(var(--primary-rgb), 0.02)' : 'transparent',
                            borderBottom: '1px solid var(--border-color)',
                            opacity: isActive ? 1 : 0.65,
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                            <input
                              type="checkbox"
                              style={{ cursor: 'pointer', scale: '1.1' }}
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCatalogIds(prev => [...prev, item.id]);
                                } else {
                                  setSelectedCatalogIds(prev => prev.filter(id => id !== item.id));
                                }
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {/^\d+$/.test(String(item.id || '')) ? item.id : (catalog.findIndex(c => c.id === item.id) + 1)}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isActive ? 'var(--primary-light)' : 'rgba(100, 116, 139, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {getAssetIcon(item.article)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <strong style={{ fontSize: '0.88rem', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.article}</strong>
                                {item.store_id && item.store_id !== 'all' && (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>
                                    {stores.find(s => s.id === item.store_id || s.code === item.store_id)?.nom || item.store_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          {/* Tarif Traitement */}
                          <td style={{ padding: '0.75rem' }}>
                            {item.traitement ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {item.traitement.prix.toLocaleString()} F
                                </span>
                                {item.traitement.prix_urgent != null && Number(item.traitement.prix_urgent) > 0 ? (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                                    ⚡ {Number(item.traitement.prix_urgent).toLocaleString()} F
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    ⚡ Non défini
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>
                            )}
                          </td>

                          {/* Tarif Repassage */}
                          <td style={{ padding: '0.75rem' }}>
                            {item.repassage ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {item.repassage.prix.toLocaleString()} F
                                </span>
                                {item.repassage.prix_urgent != null && Number(item.repassage.prix_urgent) > 0 ? (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                                    ⚡ {Number(item.repassage.prix_urgent).toLocaleString()} F
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    ⚡ Non défini
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>
                            )}
                          </td>

                          {/* Statut Mobile (Actif / Désactivé) */}
                          <td style={{ padding: '0.75rem' }}>
                            {isActive ? (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={11} /> Actif
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <XCircle size={11} /> Désactivé
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'end' }}>
                              {/* Bouton d'activation / désactivation */}
                              <button
                                className="btn btn-outline"
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: isActive ? '#ef4444' : '#10b981',
                                  borderColor: isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                                  background: isActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)'
                                }}
                                onClick={() => handleToggleCatalogItemActive && handleToggleCatalogItemActive(item)}
                                title={isActive ? 'Désactiver du catalogue mobile' : 'Activer sur le catalogue mobile'}
                              >
                                <Power size={13} />
                                {isActive ? 'Désactiver' : 'Activer'}
                              </button>

                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.35rem', borderRadius: '8px' }}
                                onClick={() => handleStartEditProduct(item)}
                                title="Modifier avec options avancées"
                              >
                                <Edit size={13} style={{ color: 'var(--text-secondary)' }} />
                              </button>

                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'transparent' }}
                                onClick={() => handleDeleteCatalogItem(item)}
                                title="Supprimer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', overflow: 'visible' }}>
              <table style={{ margin: 0, width: '100%' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '40px', textAlign: 'center', padding: '0.75rem' }}>
                      <input
                        type="checkbox"
                        style={{ cursor: 'pointer', scale: '1.1' }}
                        checked={paginatedCatalog.length > 0 && paginatedCatalog.every(item => selectedCatalogIds.includes(item.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCatalogIds(prev => {
                              const pageIds = paginatedCatalog.map(item => item.id);
                              return [...new Set([...prev, ...pageIds])];
                            });
                          } else {
                            setSelectedCatalogIds(prev => prev.filter(id => !paginatedCatalog.some(item => item.id === id)));
                          }
                        }}
                      />
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)', width: '60px' }}>ID</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Formule</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Prix / Durée</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Vêtements</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Avantages</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>Statut Mobile</th>
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCatalog.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem' }}>
                        <AlertCircle size={28} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                        Aucun abonnement trouvé.
                      </td>
                    </tr>
                  ) : (
                    paginatedCatalog.map((item) => {
                      const isSelected = selectedCatalogIds.includes(item.id);
                      const isActive = item.is_active !== false && item.statut !== 'inactif';
                      const advantages = item.description ? item.description.split('|').map(a => a.trim()).filter(Boolean) : [];

                      return (
                        <tr
                          key={item.id}
                          onClick={(e) => handleToggleSelectCatalog(item.id, e)}
                          style={{
                            background: isSelected ? 'rgba(var(--primary-rgb), 0.02)' : 'transparent',
                            borderBottom: '1px solid var(--border-color)',
                            opacity: isActive ? 1 : 0.65,
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                            <input
                              type="checkbox"
                              style={{ cursor: 'pointer', scale: '1.1' }}
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCatalogIds(prev => [...prev, item.id]);
                                } else {
                                  setSelectedCatalogIds(prev => prev.filter(id => id !== item.id));
                                }
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {/^\d+$/.test(String(item.id || '')) ? item.id : (catalog.findIndex(c => c.id === item.id) + 1)}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isActive ? 'var(--primary-light)' : 'rgba(100, 116, 139, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Sparkles size={14} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <strong style={{ fontSize: '0.88rem', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.article}</strong>
                                {item.store_id && item.store_id !== 'all' && (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>
                                    {stores.find(s => s.id === item.store_id || s.code === item.store_id)?.nom || item.store_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {(item.prix || 0).toLocaleString()} F
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                / {item.duree_jours || 30} jours
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {item.nombre_vetements ? (
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {item.nombre_vetements} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>vêt.</span>
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Non défini</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', maxWidth: '220px' }}>
                            {advantages.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {advantages.slice(0, 2).map((adv, aIdx) => (
                                  <span key={aIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <Sparkles size={10} color="var(--primary)" style={{ flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adv}</span>
                                  </span>
                                ))}
                                {advantages.length > 2 && (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+{advantages.length - 2} autre{advantages.length - 2 > 1 ? 's' : ''}</span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {isActive ? (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={11} /> Actif
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <XCircle size={11} /> Désactivé
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'end' }}>
                              <button
                                className="btn btn-outline"
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: isActive ? '#ef4444' : '#10b981',
                                  borderColor: isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                                  background: isActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)'
                                }}
                                onClick={() => handleToggleCatalogItemActive && handleToggleCatalogItemActive(item)}
                                title={isActive ? "Désactiver la formule d'abonnement" : "Activer la formule d'abonnement"}
                              >
                                <Power size={13} />
                                {isActive ? 'Désactiver' : 'Activer'}
                              </button>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.35rem', borderRadius: '8px' }}
                                onClick={() => handleStartEditProduct(item)}
                                title="Modifier"
                              >
                                <Edit size={13} style={{ color: 'var(--text-secondary)' }} />
                              </button>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'transparent' }}
                                onClick={() => handleDeleteCatalogItem(item)}
                                title="Supprimer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Pagination bar */}
        {(
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={catalogCurrentPage <= 1}
              onClick={() => setCatalogCurrentPage(prev => Math.max(1, prev - 1))}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                minWidth: '80px',
                opacity: catalogCurrentPage <= 1 ? 0.45 : 1,
                cursor: catalogCurrentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Précédent
            </button>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Page {catalogCurrentPage} sur {Math.max(1, totalCatalogPages)} ({filteredCatalog.length} article{filteredCatalog.length > 1 ? 's' : ''})
            </span>
            <button
              type="button"
              className="btn btn-outline"
              disabled={totalCatalogPages <= 1 || catalogCurrentPage >= totalCatalogPages}
              onClick={() => setCatalogCurrentPage(prev => Math.min(totalCatalogPages, prev + 1))}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                minWidth: '80px',
                opacity: (totalCatalogPages <= 1 || catalogCurrentPage >= totalCatalogPages) ? 0.45 : 1,
                cursor: (totalCatalogPages <= 1 || catalogCurrentPage >= totalCatalogPages) ? 'not-allowed' : 'pointer'
              }}
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      <ImportCatalogModal
        isOpen={showImportCatalogModal}
        onClose={() => setShowImportCatalogModal(false)}
        stores={stores}
        selectedStoreId={selectedStoreId}
        existingCatalog={catalog}
        onImportSuccess={() => {
          if (refreshAdminData) refreshAdminData();
        }}
      />
    </div>
  );
}
