import React from 'react';
import { Sparkles, Plus, Search, Trash2, Edit, AlertCircle } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

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
  setShowAddCatalogModal
}) {
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
          Grille Tarifaire
        </h3>
        <button className="btn btn-primary" onClick={() => setShowAddCatalogModal(true)}>
          <Plus size={16} /> Nouveau tarif
        </button>
      </div>

      {/* Sub-tabs for Individual Clothes vs Subscriptions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`btn ${catalogCategory === 'individuel' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCatalogCategory('individuel')}
            style={{ padding: '0.4rem 1rem', borderRadius: '8px' }}
          >
            Vêtements individuels
          </button>
          <button
            className={`btn ${catalogCategory === 'abonnement' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCatalogCategory('abonnement')}
            style={{ padding: '0.4rem 1rem', borderRadius: '8px' }}
          >
            Abonnements
          </button>
        </div>
        {selectedCatalogIds.length > 0 && (
          <button
            className="btn btn-danger"
            style={{ padding: '0.4rem 1rem', borderRadius: '8px', background: 'var(--danger)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={handleDeleteCatalogItemsBatch}
          >
            <Trash2 size={15} />
            Supprimer la sélection ({selectedCatalogIds.length})
          </button>
        )}
      </div>

      {/* Smart Filters bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '12px', flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-control"
            style={{ paddingLeft: '2.2rem', borderRadius: '8px', fontSize: '0.85rem', width: '100%', height: '36px' }}
            placeholder="Rechercher un article..."
            value={catalogSearchText}
            onChange={(e) => setCatalogSearchText(e.target.value)}
          />
        </div>
        
        {catalogCategory === 'individuel' && (
          <div style={{ width: '150px' }}>
            <CustomSelect
              className="input-control"
              style={{ borderRadius: '8px', fontSize: '0.85rem', height: '36px' }}
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
          <div style={{ width: '150px' }}>
            <CustomSelect
              className="input-control"
              style={{ borderRadius: '8px', fontSize: '0.85rem', height: '36px' }}
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

        <div style={{ width: '150px' }}>
          <CustomSelect
            className="input-control"
            style={{ borderRadius: '8px', fontSize: '0.85rem', height: '36px' }}
            value={catalogSortOrder}
            onChange={(e) => setCatalogSortOrder(e.target.value)}
          >
            <option value="name_asc">Nom (A-Z)</option>
            <option value="name_desc">Nom (Z-A)</option>
            <option value="price_asc">Prix (croissant)</option>
            <option value="price_desc">Prix (décroissant)</option>
          </CustomSelect>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem', marginLeft: 'auto' }}>
          <input
            type="checkbox"
            id="select-all-catalog"
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
          <label htmlFor="select-all-catalog" style={{ fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)', userSelect: 'none' }}>
            Tout cocher
          </label>
        </div>
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
                    <th style={{ fontSize: '0.8rem', padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCatalog.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem' }}>
                        <AlertCircle size={28} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                        Aucun vêtement trouvé.
                      </td>
                    </tr>
                  ) : (
                    paginatedCatalog.map((item, index) => {
                      const isSelected = selectedCatalogIds.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          onClick={(e) => handleToggleSelectCatalog(item.id, e)}
                          style={{
                            background: isSelected ? 'rgba(var(--primary-rgb), 0.02)' : 'transparent',
                            borderBottom: '1px solid var(--border-color)',
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
                            #{index + 1 + (catalogCurrentPage - 1) * 20}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {getAssetIcon(item.article)}
                              </div>
                              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.article}</strong>
                            </div>
                          </td>
                          
                          {/* Tarif Traitement */}
                          <td style={{ padding: '0.75rem' }}>
                            {item.traitement ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {item.traitement.prix.toLocaleString()} F
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                                  ⚡ {item.traitement.prix_urgent.toLocaleString()} F
                                </span>
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
                                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>
                                  ⚡ {item.repassage.prix_urgent.toLocaleString()} F
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>
                            )}
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'end' }}>
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
              padding: '0.2rem'
            }}>
              {paginatedCatalog.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                  <p>Aucun abonnement trouvé.</p>
                </div>
              ) : (
                paginatedCatalog.map(item => {
                  const isSelected = selectedCatalogIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={(e) => handleToggleSelectCatalog(item.id, e)}
                      style={{
                        background: isSelected ? 'rgba(var(--primary-rgb), 0.03)' : 'var(--bg-card)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        boxShadow: isSelected ? '0 12px 30px rgba(0,0,0,0.06)' : '0 8px 25px rgba(0,0,0,0.03)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease-out'
                      }}
                    >
                      <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10 }}>
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
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {item.article}
                        </h4>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                          {item.prix.toLocaleString()} F <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ mois</span>
                        </span>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        <ul style={{ paddingLeft: '0', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {item.description.split('|').map((adv, aIdx) => (
                            <li key={aIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Sparkles size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                              <span>{adv.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'end', marginTop: 'auto', paddingTop: '0.5rem' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.35rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleStartEditProduct(item)}
                          title="Modifier avec options avancées"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleDeleteCatalogItem(item.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Pagination bar */}
        {totalCatalogPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
            <button
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', minWidth: '80px' }}
              disabled={catalogCurrentPage === 1}
              onClick={() => setCatalogCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Précédent
            </button>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Page {catalogCurrentPage} sur {totalCatalogPages} ({filteredCatalog.length} articles)
            </span>
            <button
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', minWidth: '80px' }}
              disabled={catalogCurrentPage === totalCatalogPages}
              onClick={() => setCatalogCurrentPage(prev => Math.min(totalCatalogPages, prev + 1))}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
