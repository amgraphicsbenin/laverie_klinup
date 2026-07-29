import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Search } from 'lucide-react';
import { db } from '../../../services/db';

const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
};

export default function OrderFormModal({ visible, onClose, onShowSuccess, refreshAdminData }) {
  if (!visible) return null;

  const customers = db.getCustomers() || [];
  const catalog = db.getCatalog() || [];

  // Mode Commande state matching mobile app OrderFormModal.js 1:1
  const [orderClient, setOrderClient] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]); // [{ id, article, service, price, quantity }]
  const [orderAvance, setOrderAvance] = useState('0');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('Espèce');
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [orderUrgency, setOrderUrgency] = useState('Normal');
  const [expandedArticles, setExpandedArticles] = useState([]);
  const [clothingSearchQuery, setClothingSearchQuery] = useState('');

  const [payWithSubscription, setPayWithSubscription] = useState(false);
  const [subscribePlanId, setSubscribePlanId] = useState('');

  const activeCustomer = orderClient ? customers.find(c => c.id === orderClient) : null;
  const isSubscriptionMode = (!!payWithSubscription || !!subscribePlanId) && activeCustomer && (!!activeCustomer.active_subscription || !!subscribePlanId);

  useEffect(() => {
    if (isSubscriptionMode) {
      setOrderAvance('0');
      setOrderDiscount('0');
      setOrderUrgency('Normal');
    }
  }, [isSubscriptionMode]);

  useEffect(() => {
    if (activeCustomer && activeCustomer.active_subscription) {
      setPayWithSubscription(true);
    } else {
      setPayWithSubscription(false);
    }
    setSubscribePlanId('');
  }, [orderClient]);

  const resetForm = () => {
    setOrderClient('');
    setSelectedArticles([]);
    setOrderAvance('0');
    setOrderPaymentMethod('Espèce');
    setOrderDiscount('0');
    setOrderUrgency('Normal');
    setExpandedArticles([]);
    setPayWithSubscription(false);
    setSubscribePlanId('');
    setClothingSearchQuery('');
  };

  const handleCancelOrder = () => {
    const hasData = !!orderClient || selectedArticles.length > 0 || parseFloat(orderAvance) > 0 || parseInt(orderDiscount) > 0 || !!subscribePlanId;
    if (hasData) {
      if (window.confirm("Voulez-vous vraiment annuler la création de cette commande ? Toutes les informations saisies seront réinitialisées.")) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0 FCFA';
    return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
  };

  const getTotalClothesCount = () => {
    return selectedArticles.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const addArticleToOrder = (item) => {
    const existingIndex = selectedArticles.findIndex(a => a.id === item.id);
    if (existingIndex > -1) {
      const updated = [...selectedArticles];
      updated[existingIndex].quantity += 1;
      setSelectedArticles(updated);
    } else {
      setSelectedArticles([...selectedArticles, {
        id: item.id,
        article: item.article,
        service: item.service,
        price: item.prix,
        quantity: 1
      }]);
    }
  };

  const removeArticleFromOrder = (itemId) => {
    const existingIndex = selectedArticles.findIndex(a => a.id === itemId);
    if (existingIndex > -1) {
      const updated = [...selectedArticles];
      if (updated[existingIndex].quantity > 1) {
        updated[existingIndex].quantity -= 1;
        setSelectedArticles(updated);
      } else {
        setSelectedArticles(selectedArticles.filter(a => a.id !== itemId));
      }
    }
  };

  const isArticleExpanded = (articleName, items) => {
    if (expandedArticles.includes(articleName)) return true;
    return items.some(item => selectedArticles.some(cart => cart.id === item.id));
  };

  const toggleExpandArticle = (articleName) => {
    if (expandedArticles.includes(articleName)) {
      setExpandedArticles(expandedArticles.filter(a => a !== articleName));
    } else {
      setExpandedArticles([...expandedArticles, articleName]);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderClient) {
      alert("Veuillez sélectionner le client.");
      return;
    }
    if (selectedArticles.length === 0) {
      alert("Veuillez ajouter au moins un vêtement.");
      return;
    }

    const totalClothes = getTotalClothesCount();
    if (payWithSubscription && !subscribePlanId && activeCustomer && activeCustomer.active_subscription) {
      const remaining = activeCustomer.active_subscription.remaining_clothes;
      if (remaining < totalClothes) {
        alert(`Solde d'abonnement insuffisant. Le solde du client (${remaining} vêtements) est insuffisant pour cette commande (${totalClothes} vêtements).`);
        return;
      }
    }

    const currentTotal = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = Number(orderDiscount) || 0;
    const discountAmount = Math.round(currentTotal * (discountPercent / 100));
    const netTotal = currentTotal - discountAmount;

    const isSubscriptionActive = (!!payWithSubscription || !!subscribePlanId) && activeCustomer && (!!activeCustomer.active_subscription || !!subscribePlanId);
    const isImmediateSub = !!subscribePlanId;

    const finalModeReglement = isSubscriptionActive ? (isImmediateSub ? orderPaymentMethod : 'abonnement') : orderPaymentMethod;
    const finalAvance = (isSubscriptionActive && !isImmediateSub) ? 0 : (parseFloat(orderAvance) || 0);

    try {
      const currentUser = db.getCurrentUser();
      const newOrder = {
        customer_id: orderClient,
        articles: selectedArticles.map(a => ({
          article: a.article,
          service: a.service,
          quantite: a.quantity,
          prix: a.price
        })),
        items: selectedArticles.map(a => ({
          article: a.article,
          service: a.service,
          quantite: a.quantity,
          prix: a.price
        })),
        total: netTotal,
        prix_total: netTotal,
        avance: finalAvance,
        avance_payee: finalAvance,
        statut: 'attente',
        mode_paiement: finalModeReglement,
        mode_reglement: finalModeReglement,
        niveau_urgence: orderUrgency,
        remise_pourcentage: discountPercent,
        created_by_id: currentUser ? currentUser.id : 'u1',
        pay_with_subscription: payWithSubscription,
        subscribe_plan_id: subscribePlanId
      };

      await db.createOrder(newOrder);

      if (refreshAdminData) refreshAdminData();
      resetForm();
      onClose();

      if (onShowSuccess) onShowSuccess("Commande créée avec succès !");
      else alert("Commande créée avec succès !");
    } catch (e) {
      alert(e.message || "Impossible de créer la commande.");
    }
  };

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={handleCancelOrder}>
        <div 
          className="card modal-dialog-card" 
          onClick={(e) => e.stopPropagation()} 
          style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            background: 'var(--bg-card, #ffffff)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '24px'
          }}
        >
        {/* Header matching compactModalHeader */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#09090b', margin: 0, fontFamily: 'inherit' }}>
            Nouvelle Commande
          </h3>
          <button 
            type="button" 
            onClick={handleCancelOrder}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#71717a' }}
          >
            <X size={20} color="#71717a" />
          </button>
        </div>

        {/* Scroll Content Container matching compactModalScroll */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column' }}>

          {/* Sélection du client */}
          <div style={{ zIndex: 30, position: 'relative' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginTop: '4px', marginBottom: '6px', display: 'block' }}>
              Client
            </label>
            <select
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '0 16px',
                fontSize: '14px',
                color: '#09090b',
                fontWeight: 500,
                marginBottom: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              value={orderClient}
              onChange={(e) => setOrderClient(e.target.value)}
            >
              <option value="">Sélectionner le client</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.telephone})</option>
              ))}
            </select>
          </div>

          {/* Zone d'abonnement dynamique matching subCard */}
          {activeCustomer && (
            <div style={{ marginTop: '4px', marginBottom: '8px', zIndex: 10 }}>
              {activeCustomer.active_subscription ? (
                <div style={{
                  backgroundColor: 'rgba(0, 44, 247, 0.04)',
                  border: '1.5px solid rgba(0, 44, 247, 0.1)',
                  borderRadius: '16px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label 
                      onClick={() => {
                        if (!subscribePlanId) setPayWithSubscription(!payWithSubscription);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: subscribePlanId ? 'not-allowed' : 'pointer' }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: '1.5px solid #002cf7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: payWithSubscription ? '#002cf7' : '#ffffff',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {payWithSubscription && '✓'}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: subscribePlanId ? '#a1a1aa' : '#002cf7' }}>
                        Régler avec l'abonnement
                      </span>
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#09090b' }}>
                      ({activeCustomer.active_subscription.remaining_clothes} vêt. restants)
                    </span>
                  </div>

                  {/* Alerte si solde insuffisant */}
                  {payWithSubscription && !subscribePlanId && getTotalClothesCount() > activeCustomer.active_subscription.remaining_clothes && (
                    <div style={{
                      marginTop: '6px',
                      backgroundColor: '#fff1f2',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #ffe4e6',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      ⚠ Solde insuffisant ({getTotalClothesCount()} requis)
                    </div>
                  )}

                  {/* Menu de renouvellement / changement */}
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                      Renouveler / Changer d'abonnement :
                    </label>
                    <select
                      style={{
                        width: '100%',
                        height: '42px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '0 12px',
                        fontSize: '13px',
                        color: '#09090b',
                        fontWeight: 500,
                        outline: 'none'
                      }}
                      value={subscribePlanId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubscribePlanId(val);
                        if (val) {
                          setPayWithSubscription(true);
                        } else {
                          setPayWithSubscription(!!activeCustomer.active_subscription);
                        }
                      }}
                    >
                      <option value="">-- Conserver l'abonnement en cours --</option>
                      {catalog.filter(c => c.categorie === 'abonnement' && c.is_active !== false && c.statut !== 'inactif').map(p => (
                        <option key={p.id} value={p.id}>{p.article} ({p.prix.toLocaleString('fr-FR')} F)</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(0, 44, 247, 0.04)',
                  border: '1.5px solid rgba(0, 44, 247, 0.1)',
                  borderRadius: '16px',
                  padding: '12px'
                }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Souscrire immédiatement à un abonnement :
                  </label>
                  <select
                    style={{
                      width: '100%',
                      height: '42px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#09090b',
                      fontWeight: 500,
                      outline: 'none'
                    }}
                    value={subscribePlanId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubscribePlanId(val);
                      if (val) {
                        setPayWithSubscription(true);
                      } else {
                        setPayWithSubscription(false);
                      }
                    }}
                  >
                    <option value="">-- Pas d'abonnement --</option>
                    {catalog.filter(c => c.categorie === 'abonnement' && c.is_active !== false && c.statut !== 'inactif').map(p => (
                      <option key={p.id} value={p.id}>{p.article} ({p.prix.toLocaleString('fr-FR')} F)</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Choisir les vêtements avec barre de recherche & hauteur optimale */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block' }}>
              Choisir les vêtements
            </label>
            {getTotalClothesCount() > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#002cf7', backgroundColor: 'rgba(0, 44, 247, 0.08)', padding: '2px 8px', borderRadius: '12px' }}>
                {getTotalClothesCount()} vêt. sélectionné(s)
              </span>
            )}
          </div>

          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search 
              size={16} 
              color="#64748b" 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} 
            />
            <input
              type="text"
              placeholder="Rechercher un vêtement (ex: Chemise, Robe, Pantalon...)"
              value={clothingSearchQuery}
              onChange={(e) => setClothingSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                paddingLeft: '38px',
                paddingRight: '14px',
                fontSize: '13px',
                color: '#09090b',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            height: '310px',
            minHeight: '250px',
            maxHeight: '360px',
            borderRadius: '16px',
            overflowY: 'auto',
            marginBottom: '14px',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxSizing: 'border-box'
          }}>
            {(() => {
              const rawArticles = [...new Set(catalog
                .filter(c => 
                  c.article &&
                  c.categorie !== 'system_setting' && 
                  c.service !== 'system' && 
                  c.categorie !== 'abonnement' && 
                  c.service !== 'abonnement' &&
                  !c.id?.startsWith('setting_') &&
                  c.is_active !== false &&
                  (c.service === 'lavage_simple' || c.service === 'repassage' || c.service === 'traitement')
                )
                .map(c => c.article.trim())
              )];

              const uniqueArticles = rawArticles.filter(art =>
                art.toLowerCase().includes(clothingSearchQuery.trim().toLowerCase())
              );

              if (uniqueArticles.length === 0) {
                return (
                  <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '20px 0' }}>
                    {clothingSearchQuery ? "Aucun vêtement trouvé pour cette recherche" : "Aucun article disponible"}
                  </div>
                );
              }

              return uniqueArticles.map(articleName => {
                // Seuls Traitement (lavage_simple) et Repassage sont affichés
                const ALLOWED_SERVICES = ['lavage_simple', 'traitement', 'repassage'];
                const rawItems = catalog.filter(c => 
                  c.article && 
                  c.article.trim().toLowerCase() === articleName.toLowerCase() &&
                  c.categorie !== 'system_setting' &&
                  c.service !== 'system' &&
                  c.categorie !== 'abonnement' &&
                  c.service !== 'abonnement' &&
                  !c.id?.startsWith('setting_') &&
                  c.is_active !== false &&
                  ALLOWED_SERVICES.includes(c.service)
                );

                // Déduplique : lavage_simple + traitement → une seule entrée "Traitement"
                const canonicalMap = new Map();
                // Priorité : lavage_simple > traitement
                rawItems
                  .filter(item => item.service === 'repassage')
                  .forEach(item => canonicalMap.set('repassage', { ...item }));
                rawItems
                  .filter(item => item.service === 'traitement')
                  .forEach(item => { if (!canonicalMap.has('lavage_simple')) canonicalMap.set('lavage_simple', { ...item, service: 'lavage_simple' }); });
                rawItems
                  .filter(item => item.service === 'lavage_simple')
                  .forEach(item => canonicalMap.set('lavage_simple', { ...item, service: 'lavage_simple' }));

                // Ordre d'affichage : Traitement en premier, puis Repassage
                const serviceOrder = ['lavage_simple', 'repassage'];
                const items = serviceOrder
                  .filter(k => canonicalMap.has(k))
                  .map(k => canonicalMap.get(k));
                const isExpanded = isArticleExpanded(articleName, items);

                const getQtyInCart = (itemId) => {
                  const cartItem = selectedArticles.find(a => a.id === itemId);
                  return cartItem ? cartItem.quantity : 0;
                };

                return (
                  <div key={articleName} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '12px',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#09090b' }}>
                        {articleName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpandArticle(articleName)}
                        style={{
                          backgroundColor: isExpanded ? '#f1f5f9' : 'rgba(0, 44, 247, 0.08)',
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          color: isExpanded ? '#475569' : '#002cf7',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isExpanded ? 'Masquer' : 'Ajouter'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{
                        marginTop: '10px',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {items.map(item => {
                          const serviceLabel = 
                            (item.service === 'lavage_simple' || item.service === 'traitement') ? 'Traitement' :
                            item.service === 'repassage' ? 'Repassage' :
                            item.service === 'nettoyage_a_sec' ? 'Nettoyage à sec' :
                            item.service ? item.service.replace(/_/g, ' ') : 'Service';

                          const qty = getQtyInCart(item.id);

                          return (
                            <div key={item.id || `${articleName}_${item.service}`} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              backgroundColor: qty > 0 ? 'rgba(0, 44, 247, 0.05)' : '#f8fafc',
                              borderRadius: '12px',
                              border: qty > 0 ? '1.5px solid rgba(0, 44, 247, 0.25)' : '1px solid #e2e8f0',
                              boxSizing: 'border-box'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                  {serviceLabel}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#002cf7', marginTop: '1px' }}>
                                  {formatPrice(item.prix)}
                                </div>
                              </div>

                              {qty === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => addArticleToOrder(item)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    backgroundColor: '#ffffff',
                                    border: '1.5px solid #002cf7',
                                    padding: '5px 12px',
                                    borderRadius: '10px',
                                    color: '#002cf7',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    flexShrink: 0
                                  }}
                                >
                                  <Plus size={12} color="#002cf7" />
                                  <span>Ajouter</span>
                                </button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    onClick={() => removeArticleFromOrder(item.id)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '13px',
                                      backgroundColor: '#002cf7',
                                      color: '#ffffff',
                                      border: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      flexShrink: 0
                                    }}
                                  >
                                    -
                                  </button>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#09090b', minWidth: '18px', textAlign: 'center' }}>
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => addArticleToOrder(item)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '13px',
                                      backgroundColor: '#002cf7',
                                      color: '#ffffff',
                                      border: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      flexShrink: 0
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Niveau d'urgence matching urgencyRow */}
          <label style={{ fontSize: '12px', fontWeight: 600, color: isSubscriptionMode ? '#94a3b8' : '#475569', marginTop: '6px', marginBottom: '6px', display: 'block' }}>
            Urgence
          </label>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', opacity: isSubscriptionMode ? 0.7 : 1 }}>
            {['Normal', 'Express'].map((level) => {
              const isActive = (isSubscriptionMode ? 'Normal' : orderUrgency) === level;
              const isDisabled = isSubscriptionMode;
              return (
                <button
                  key={level}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setOrderUrgency(level)}
                  style={{
                    flex: 1,
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    backgroundColor: isActive ? '#002cf7' : '#ffffff',
                    border: isActive ? '1.5px solid #002cf7' : '1.5px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isActive ? '#ffffff' : (isDisabled && level === 'Express' ? '#94a3b8' : '#475569'),
                    cursor: isDisabled ? 'default' : 'pointer'
                  }}
                >
                  {level === 'Express' ? 'Express (24h)' : 'Normal (48h)'}
                </button>
              );
            })}
          </div>

          {/* Avance, Mode de règlement & Réduction (%) en grille alignée */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: isSubscriptionMode ? '#94a3b8' : '#475569', marginBottom: '4px', display: 'block' }}>
                Avance (FCFA)
              </label>
              <input
                type="number"
                value={isSubscriptionMode ? '0' : orderAvance}
                onChange={(e) => setOrderAvance(e.target.value)}
                disabled={isSubscriptionMode}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: isSubscriptionMode ? '#f1f5f9' : '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: isSubscriptionMode ? '#94a3b8' : '#09090b',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                Mode Règlement
              </label>
              <select
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0 10px',
                  fontSize: '13px',
                  color: '#09090b',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                value={orderPaymentMethod}
                onChange={(e) => setOrderPaymentMethod(e.target.value)}
              >
                <option value="Espèce">Espèce</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: isSubscriptionMode ? '#94a3b8' : '#475569', marginBottom: '4px', display: 'block' }}>
                Réduction (%)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={isSubscriptionMode ? '0' : orderDiscount}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = parseInt(val, 10);
                    if (val === '') setOrderDiscount('0');
                    else if (!isNaN(num) && num >= 0 && num <= 100) setOrderDiscount(num.toString());
                  }}
                  disabled={isSubscriptionMode}
                  placeholder="0"
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: isSubscriptionMode ? '#f1f5f9' : '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    paddingLeft: '12px',
                    paddingRight: '28px',
                    fontSize: '13px',
                    color: isSubscriptionMode ? '#94a3b8' : '#09090b',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isSubscriptionMode ? '#94a3b8' : '#64748b',
                  pointerEvents: 'none'
                }}>%</span>
              </div>
            </div>
          </div>

          {/* Live Receipt Card matching receiptPreviewCard */}
          {(() => {
            const isSubscriptionActive = (!!payWithSubscription || !!subscribePlanId) && activeCustomer && (!!activeCustomer.active_subscription || !!subscribePlanId);
            
            let currentTotal = 0;
            let isImmediateSub = false;
            let subPlan = null;
            
            if (subscribePlanId) {
              subPlan = catalog.find(c => c.id === subscribePlanId && c.categorie === 'abonnement');
              currentTotal = subPlan ? subPlan.prix : 0;
              isImmediateSub = true;
            } else if (isSubscriptionActive) {
              currentTotal = 0;
            } else {
              currentTotal = selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            }

            if (!isSubscriptionActive && orderUrgency === 'Express') {
              const expressMarkupItem = catalog.find(c => c.id === 'setting_express_markup');
              const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;
              currentTotal = Math.round(currentTotal * (1 + expressMarkup / 100));
            }

            const discountPercent = Number(orderDiscount) || 0;
            const discountAmount = Math.round(currentTotal * (discountPercent / 100));
            const netTotal = currentTotal - discountAmount;
            
            const currentAvance = (isSubscriptionActive && !isImmediateSub) ? 0 : (parseFloat(orderAvance) || 0);
            const currentReste = netTotal - currentAvance;

            const expressHours = catalog.find(c => c.id === 'setting_express_hours')?.prix || 24;
            const normalHours = catalog.find(c => c.id === 'setting_normal_hours')?.prix || 48;
            const delay = orderUrgency === 'Express' ? `${expressHours}h (Express)` : `${normalHours}h (Normal)`;

            return (
              <div style={{
                backgroundColor: 'rgba(0, 44, 247, 0.03)',
                border: '1px solid rgba(0, 44, 247, 0.1)',
                borderRadius: '16px',
                padding: '16px',
                margin: '14px 0',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Facturation
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Total Brut</span>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                    {isSubscriptionActive && !isImmediateSub ? 'Débit forfait abonnement' : formatPrice(currentTotal)}
                  </span>
                </div>
                
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Réduction ({discountPercent}%)</span>
                    <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                {isImmediateSub && subPlan ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Abonnement Choisi</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#002cf7' }}>
                        {subPlan.article} ({subPlan.nombre_vetements || 0} vêt.)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Prix Souscription</span>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{formatPrice(subPlan.prix)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Vêtements Commande En Cours</span>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                        {getTotalClothesCount()} vêt. (Valeur {formatPrice(selectedArticles.reduce((sum, item) => sum + (item.price * item.quantity), 0))})
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Prise en Charge par l'Abonnement</span>
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                        -{getTotalClothesCount()} vêt. (0 FCFA)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#09090b', fontWeight: 600 }}>Solde Restant (Nouvel Abonnement)</span>
                      <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                        {Math.max(0, (subPlan.nombre_vetements || 0) - getTotalClothesCount())} vêt.
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#09090b', fontWeight: 600 }}>Net à Payer (Abonnement)</span>
                      <span style={{ fontSize: '13px', color: '#002cf7', fontWeight: 600 }}>{formatPrice(netTotal)}</span>
                    </div>
                  </>
                ) : isSubscriptionActive && !isImmediateSub && activeCustomer && activeCustomer.active_subscription ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Formule Active</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#002cf7' }}>
                        {activeCustomer.active_subscription.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Solde Actuel</span>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                        {activeCustomer.active_subscription.remaining_clothes} vêt.
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Vêtements Déduits</span>
                      <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                        -{getTotalClothesCount()} vêt.
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#09090b', fontWeight: 600 }}>Solde Restant (Abonnement)</span>
                      <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                        {activeCustomer.active_subscription.remaining_clothes - getTotalClothesCount()} vêt.
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#09090b', fontWeight: 600 }}>Net à Payer</span>
                    <span style={{ fontSize: '13px', color: '#09090b', fontWeight: 600 }}>{formatPrice(netTotal)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Acompte (Avance)</span>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{formatPrice(currentAvance)}</span>
                </div>

                <div style={{ height: '1px', backgroundColor: 'rgba(0, 44, 247, 0.1)', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#09090b', fontWeight: 600 }}>Solde Restant</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: currentReste > 0 ? '#ef4444' : '#10b981' }}>
                    {formatPrice(currentReste)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Mode règlement :</span>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    {isSubscriptionActive && !isImmediateSub ? 'Abonnement' : orderPaymentMethod}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Disponibilité :</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#002cf7' }}>Sous {delay}</span>
                </div>
              </div>
            );
          })()}

          {/* Buttons row matching app */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleCancelOrder}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '16px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleCreateOrder}
              style={{
                flex: 2,
                height: '48px',
                borderRadius: '16px',
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Enregistrer la Commande
            </button>
          </div>

        </div>
      </div>
    </div>
  </ModalPortal>
);
}
