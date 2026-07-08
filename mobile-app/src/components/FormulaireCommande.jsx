import React, { useState } from 'react';
import { X, TriangleAlert } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

export default function FormulaireCommande({
  onClose,
  customers,
  catalog,
  db,
  currentUser,
  serviceLabels,
  setCreatedOrder,
  sendWhatsAppMessage,
  formatDateTime
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [payWithSubscription, setPayWithSubscription] = useState(false);
  const [subscribePlanId, setSubscribePlanId] = useState('');
  const [articleQuantities, setArticleQuantities] = useState({});
  const [articleServices, setArticleServices] = useState({});
  const [niveauUrgence, setNiveauUrgence] = useState('Normal');
  const [modeReglement, setModeReglement] = useState('especes');
  const [avancePayee, setAvancePayee] = useState('');
  const [remisePourcentage, setRemisePourcentage] = useState('');

  // Extract unique clothes from catalog
  const catalogClothes = catalog.length > 0
    ? [...new Set(catalog.filter(c => c.categorie !== 'abonnement' && c.categorie !== 'system_setting' && c.service !== 'system').map(c => c.article))]
    : [
        'Chemise', 'Pantalon', 'Robe', 'Combinaison', 'Jupe', 'Pull', 'Culotte', 'T-shirt', 'Polo', 'Blouson',
        'Veste', 'Costume', 'Cravate', 'Haut', 'Débardeur', 'Jeans', 'Robe de mariée', 'Couette Legée', 'Couette lourd',
        '1Draps+ 2 taies', '2 draps+ 2 taies', 'Taies', 'Petite serviette', 'Grandes serviettes', 'Ensemble 2 pièce',
        'Ensemble 3 pièces', 'Chapeau', 'chausette', 'Nappe de table', 'Rideau', 'Robe fantaisiste', 'Serpillière',
        'Torchon', 'Foulard'
      ];

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  const getTotalClothesCount = () => {
    return Object.values(articleQuantities).reduce((a, b) => a + b, 0);
  };

  const getCalculatedPrice = () => {
    let price = 0;
    if (payWithSubscription && !subscribePlanId) {
      return 0;
    }
    
    Object.entries(articleQuantities).forEach(([cloth, qty]) => {
      if (qty > 0) {
        const selectedSvc = articleServices[cloth] || 'lavage_simple';
        const catalogItem = catalog.find(c => c.categorie !== 'abonnement' && c.article === cloth && c.service === selectedSvc);
        const itemPrice = catalogItem ? catalogItem.prix : 1500;
        price += itemPrice * qty;
      }
    });

    if (niveauUrgence === 'Express') {
      const expressMarkupItem = catalog.find(c => c.id === 'setting_express_markup');
      const expressMarkup = expressMarkupItem ? Number(expressMarkupItem.prix) : 50;
      price = Math.round(price * (1 + expressMarkup / 100));
    }

    const discountPercent = Number(remisePourcentage || 0);
    if (discountPercent > 0 && discountPercent <= 100) {
      const discountAmount = Math.round(price * (discountPercent / 100));
      price = Math.max(0, price - discountAmount);
    }

    if (subscribePlanId) {
      const subPlan = catalog.find(c => c.id === subscribePlanId);
      if (subPlan) {
        price += subPlan.prix;
      }
    }

    return price;
  };

  const handleUpdateQty = (cloth, delta) => {
    setArticleQuantities(prev => {
      const current = prev[cloth] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [cloth]: next };
    });
  };

  const handleUpdateService = (cloth, svc) => {
    setArticleServices(prev => ({ ...prev, [cloth]: svc }));
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Veuillez sélectionner ou créer un client");
      return;
    }

    const selectedItems = [];
    Object.keys(articleQuantities).forEach(cloth => {
      const qty = articleQuantities[cloth];
      if (qty > 0) {
        selectedItems.push({
          article: cloth,
          quantite: qty,
          service: articleServices[cloth] || 'lavage_simple'
        });
      }
    });

    if (selectedItems.length === 0) {
      alert("Veuillez sélectionner au moins un article avec une quantité supérieure à 0");
      return;
    }

    const typeArticleSummary = selectedItems.map(item => `${item.quantite}x ${item.article}`).join(', ');
    const primaryService = selectedItems[0].service;

    const activeCustomerObj = customers.find(c => c.id === selectedCustomerId);
    if (payWithSubscription && !subscribePlanId && activeCustomerObj && activeCustomerObj.active_subscription) {
      const remaining = activeCustomerObj.active_subscription.remaining_clothes;
      const totalClothes = selectedItems.reduce((sum, item) => sum + Number(item.quantite), 0);
      if (remaining < totalClothes) {
        alert(`Solde d'abonnement insuffisant. Requis: ${totalClothes}, Disponible: ${remaining}. Veuillez souscrire à un abonnement/renouvellement immédiat ou payer par un autre mode de règlement.`);
        return;
      }
    }

    const orderData = {
      customer_id: selectedCustomerId,
      type_article: typeArticleSummary,
      type_service: primaryService,
      niveau_urgence: niveauUrgence,
      mode_reglement: payWithSubscription ? (subscribePlanId ? modeReglement : 'abonnement') : modeReglement,
      avance_payee: (payWithSubscription && !subscribePlanId) ? 0 : Number(avancePayee || 0),
      pay_with_subscription: payWithSubscription,
      subscribe_plan_id: subscribePlanId,
      items: selectedItems,
      remise_pourcentage: Number(remisePourcentage || 0)
    };

    try {
      const newOrder = db.createOrder(orderData);
      setCreatedOrder(newOrder);
      setAvancePayee('');
      setSubscribePlanId('');
      setArticleQuantities({});
      onClose();

      // Notification WhatsApp à l'enregistrement
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        let text = '';
        const formattedDueDate = formatDateTime(newOrder.due_date);
        
        if (newOrder.is_subscription_order && newOrder.subscription_details) {
          const det = newOrder.subscription_details;
          if (det.immediate_subscription) {
            const remaining = newOrder.prix_total - newOrder.avance_payee;
            text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${newOrder.identifiant_unique_marquage} (${newOrder.type_article}) a bien été enregistrée chez KLIN UP avec souscription immédiate au forfait ${det.immediate_subscription.name} (${det.immediate_subscription.prix.toLocaleString()} FCFA).\nArticles déposés: ${det.clothes_deducted} vêtements\nNouveau solde restant: ${det.new_balance} vêt.\nAcompte payé: ${newOrder.avance_payee.toLocaleString()} FCFA\nReste à payer sur l'abonnement: ${remaining.toLocaleString()} FCFA\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
          } else {
            text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${newOrder.identifiant_unique_marquage} (${newOrder.type_article}) a bien été enregistrée chez KLIN UP via votre forfait ${det.name}.\nArticles déposés: ${det.clothes_deducted} vêtements\nSolde précédent: ${det.previous_balance} vêt.\nNouveau solde restant: ${det.new_balance} vêt.\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
          }
        } else {
          const remaining = newOrder.prix_total - newOrder.avance_payee;
          text = `Bonjour ${customer.prenom} ${customer.nom}, votre commande ${newOrder.identifiant_unique_marquage} (${newOrder.type_article}) a bien été enregistrée chez KLIN UP.\nTotal: ${newOrder.prix_total.toLocaleString()} FCFA\nAcompte payé: ${newOrder.avance_payee.toLocaleString()} FCFA\nReste à payer: ${remaining.toLocaleString()} FCFA\nDate de livraison prévue: ${formattedDueDate}\nMerci pour votre confiance !`;
        }
        sendWhatsAppMessage(customer.telephone, text, customer.indicatif);
      }
    } catch (err) {
      alert("Erreur d'enregistrement : " + err.message);
    }
  };

  return (
    <div 
      className="modal-overlay bottom-align" 
      style={{ zIndex: 999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form onSubmit={handleCreateOrder} className="modal-sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-title)', fontWeight: 800, margin: 0 }}>Nouvelle commande</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '2px' }}>
          
          {/* Client Selection */}
          <div style={{ padding: '0.4rem 0' }}>
            <div style={{ marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Client</label>
            </div>
            <CustomSelect
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              placeholder="-- Choisir un client --"
              options={customers.map(c => ({
                value: c.id,
                label: `${c.prenom} ${c.nom} (${c.telephone})`
              }))}
              style={{ width: '100%', fontSize: '0.78rem' }}
            />

            {activeCustomer && (
              <div style={{ marginTop: '0.45rem', padding: '0.4rem', background: 'var(--primary-light)', borderRadius: '8px', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Préférence : <strong>{activeCustomer.preferences_pliage}</strong></span>
                  <span style={{ color: 'var(--secondary)' }}>Points: <strong>{activeCustomer.points_fidelite} pts</strong></span>
                </div>
                {activeCustomer.solde_dette > 0 && (
                  <div style={{ color: 'var(--status-late)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <TriangleAlert size={10} /> Dette: {activeCustomer.solde_dette} FCFA
                  </div>
                )}
                {/* Zone d'abonnement dynamique */}
                {activeCustomer.active_subscription ? (
                  <div style={{ marginTop: '0.3rem', borderTop: '1px dashed rgba(26, 26, 94, 0.15)', paddingTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: subscribePlanId ? 'not-allowed' : 'pointer', fontWeight: 700, color: 'var(--primary)' }}>
                        <input 
                          type="checkbox"
                          checked={payWithSubscription}
                          disabled={!!subscribePlanId}
                          onChange={(e) => setPayWithSubscription(e.target.checked)}
                        />
                        Régler avec l'abonnement
                      </label>
                      <span style={{ fontWeight: 700, fontSize: '0.62rem' }}>
                        ({activeCustomer.active_subscription.remaining_clothes} vêt.)
                      </span>
                    </div>

                    {payWithSubscription && !subscribePlanId && getTotalClothesCount() > activeCustomer.active_subscription.remaining_clothes && (
                      <div style={{ color: 'var(--status-late)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.62rem' }}>
                        <TriangleAlert size={10} /> Solde insuffisant ({getTotalClothesCount()} requis)
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Renouveler :</span>
                      <CustomSelect
                        value={subscribePlanId}
                        onChange={setSubscribePlanId}
                        placeholder="-- Conserver l'abonnement --"
                        options={catalog.filter(c => c.categorie === 'abonnement').map(p => ({
                          value: p.id,
                          label: `${p.article} (${p.prix.toLocaleString()} F)`
                        }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.3rem', borderTop: '1px dashed rgba(26, 26, 94, 0.15)', paddingTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.62rem' }}>Souscrire un abonnement :</span>
                      <CustomSelect
                        value={subscribePlanId}
                        onChange={setSubscribePlanId}
                        placeholder="-- Pas d'abonnement --"
                        options={catalog.filter(c => c.categorie === 'abonnement').map(p => ({
                          value: p.id,
                          label: `${p.article} (${p.prix.toLocaleString()} F)`
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clothes & Services Selection */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Linge & Services</label>
            <div style={{ 
              maxHeight: '360px', overflowY: 'auto', 
              border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.35rem',
              display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--bg-app)', marginTop: '0.25rem'
            }}>
              {catalogClothes.map(cloth => {
                const qty = articleQuantities[cloth] || 0;
                const selectedSvc = articleServices[cloth] || 'lavage_simple';
                
                const servicesForCloth = catalog.filter(c => c.categorie !== 'abonnement' && c.article === cloth && c.service !== 'nettoyage_a_sec');
                const activeServices = servicesForCloth.length > 0 ? servicesForCloth : [
                  { service: 'lavage_simple', prix: 1500 },
                  { service: 'repassage', prix: 1000 }
                ];

                const activeServiceObj = activeServices.find(s => s.service === selectedSvc) || activeServices[0];
                const unitPrice = activeServiceObj ? activeServiceObj.prix : 1500;
                
                return (
                  <div key={cloth} style={{ 
                    display: 'flex', flexDirection: 'column', gap: '0.25rem', 
                    padding: '0.4rem 0.5rem', 
                    background: qty > 0 ? 'var(--primary-light)' : '#fff', 
                    borderRadius: '10px',
                    border: qty > 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.15s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: qty > 0 ? 800 : 600 }}>{cloth}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button 
                          type="button" 
                          style={{ 
                            width: '22px', height: '22px', borderRadius: '50%', 
                            border: '1px solid var(--border-color)', background: '#fff', 
                            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            cursor: qty === 0 ? 'not-allowed' : 'pointer', opacity: qty === 0 ? 0.3 : 1,
                            fontSize: '0.8rem', fontWeight: 'bold', padding: 0
                          }}
                          disabled={qty === 0}
                          onClick={() => handleUpdateQty(cloth, -1)}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, minWidth: '12px', textAlign: 'center' }}>{qty}</span>
                        <button 
                          type="button" 
                          style={{ 
                            width: '22px', height: '22px', borderRadius: '50%', 
                            border: '1px solid var(--primary)', background: 'var(--primary-light)', 
                            color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', padding: 0
                          }}
                          onClick={() => handleUpdateQty(cloth, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {qty > 0 && (
                      <div style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem', 
                        borderTop: '1px dashed rgba(26, 26, 94, 0.12)', paddingTop: '0.2rem'
                      }}>
                        <CustomSelect
                          value={selectedSvc}
                          onChange={(val) => handleUpdateService(cloth, val)}
                          options={activeServices.map(s => ({
                            value: s.service,
                            label: `${serviceLabels[s.service]} (${s.prix} F)`
                          }))}
                          style={{ width: '60%' }}
                          dropdownStyle={{ maxHeight: '120px' }}
                          buttonStyle={{ padding: '0.2rem 0.35rem', fontSize: '0.62rem', borderRadius: '6px' }}
                        />
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {(unitPrice * qty).toLocaleString()} F
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Settings Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
            <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
              <label style={{ fontSize: '0.68rem' }}>Urgence</label>
              <CustomSelect
                value={niveauUrgence}
                onChange={setNiveauUrgence}
                options={[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'Express', label: 'Express (+50%)' }
                ]}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
              <label style={{ fontSize: '0.68rem' }}>Règlement</label>
              <CustomSelect
                value={(payWithSubscription && !subscribePlanId) ? 'abonnement' : modeReglement} 
                disabled={payWithSubscription && !subscribePlanId}
                onChange={setModeReglement}
                options={
                  (payWithSubscription && !subscribePlanId) ? [
                    { value: 'abonnement', label: 'Abonnement' }
                  ] : [
                    { value: 'especes', label: 'Espèces' },
                    { value: 'mobile_money', label: 'Mobile Money' },
                    { value: 'avance_solde', label: 'Avance/Crédit' }
                  ]
                }
              />
            </div>
          </div>

          {(!payWithSubscription || !!subscribePlanId) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Acompte (FCFA)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  placeholder="Ex: 1000"
                  value={avancePayee}
                  onChange={(e) => setAvancePayee(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gap: '0.2rem' }}>
                <label style={{ fontSize: '0.68rem' }}>Réduction (%)</label>
                <input 
                  type="number" 
                  className="input-control" 
                  style={{ padding: '0.42rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  placeholder="Ex: 10"
                  min="0"
                  max="100"
                  value={remisePourcentage}
                  onChange={(e) => setRemisePourcentage(e.target.value)}
                />
              </div>
            </div>
          )}

        </div>

        {/* Total and Save */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Total</span>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>
              {getCalculatedPrice().toLocaleString()} FCFA
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: '0.42rem 0.9rem', fontSize: '0.72rem', borderRadius: '8px' }}
          >
            Enregistrer
          </button>
        </div>

      </form>
    </div>
  );
}
