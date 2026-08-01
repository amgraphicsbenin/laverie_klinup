import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Shirt, 
  Wind, 
  Truck, 
  Users, 
  DollarSign, 
  Plus, 
  ChevronRight, 
  Layers, 
  Award,
  Zap,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Store
} from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import { db } from '../../../services/db';

export default function DashboardTab({
  earnedRevenue = 0,
  completedOrdersCount = 0,
  activeOrdersCount = 0,
  pendingOrdersCount = 0,
  chartPeriod = '30_days',
  setChartPeriod,
  daysOfWeek = [],
  baseLavage = [],
  baseRepassage = [],
  restitutionRate = 0,
  averageOrderValue = 0,
  mostPopularService = 'Aucun',
  activeSubscriptionsCount = 0,
  nonCancelledOrdersCount = 0,
  totalOrdersCount = 0,
  orders = [],
  customers = [],
  staff = [],
  serviceLabels = {},
  getOrderStatusLabel,
  setActiveDetailsCard,
  setShowOrderRegistrationModal,
  onManageStaff
}) {
  const [activeStageFilter, setActiveStageFilter] = useState('all');
  const [showCashClosureModal, setShowCashClosureModal] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [actualMomo, setActualMomo] = useState('');
  const [closureNotes, setClosureNotes] = useState('');

  const selectedStoreId = db.getSelectedStoreId ? db.getSelectedStoreId() : 'all';
  const stores = db.getStores ? db.getStores() : [];
  const currentStore = stores.find(s => s.id === selectedStoreId);
  const storeName = currentStore ? currentStore.nom : 'Tous les points (Vue Globale)';

  // Calculate today's theoretical cash totals
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(todayStr) && o.statut !== 'annule');
  const expectedCash = todayOrders.filter(o => o.mode_reglement === 'especes' || !o.mode_reglement).reduce((sum, o) => sum + Number(o.avance_payee || o.prix_total || 0), 0);
  const expectedMomo = todayOrders.filter(o => o.mode_reglement === 'mobile_money' || o.mode_reglement === 'kpay' || o.mode_reglement === 'flooz' || o.mode_reglement === 'mtn').reduce((sum, o) => sum + Number(o.avance_payee || o.prix_total || 0), 0);

  // Calculate live breakdown by stage
  const countWashing = orders.filter(o => o.statut === 'en_cours_lavage').length;
  const countReady = orders.filter(o => o.statut === 'pret' || o.statut === 'a_recuperer').length;
  const countDelivering = orders.filter(o => o.statut === 'a_livrer').length;

  // Total clothes count currently in process
  const totalArticlesInProcess = orders
    .filter(o => o.statut !== 'restitue' && o.statut !== 'annule')
    .reduce((sum, o) => {
      const itemsCount = Array.isArray(o.items) && o.items.length > 0
        ? o.items.reduce((s, it) => s + Number(it.quantite || it.quantity || 1), 0)
        : 1;
      return sum + itemsCount;
    }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      
      {/* 🚀 BANNIÈRE D'ACCUEIL & EN-TÊTE STATUTAIRE */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%)',
          border: '1px solid rgba(59, 130, 246, 0.18)',
          borderRadius: '24px',
          padding: '1.75rem 2rem',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow Effects */}
        <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '220px', height: '220px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '50%', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', left: '30%', bottom: '-60px', width: '180px', height: '180px', background: 'rgba(217, 70, 239, 0.05)', borderRadius: '50%', filter: 'blur(45px)' }} />

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.08)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Store size={14} color="var(--primary)" />
              {storeName}
            </span>
            <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              {currentStore ? `Point Actif (${currentStore.code})` : 'Vue Globale Réseau'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-title)', margin: 0, letterSpacing: '-0.3px', color: '#0f172a' }}>
            {currentStore ? `Supervision - ${currentStore.nom}` : 'Supervision Globale KLIN UP'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{totalArticlesInProcess} textile{totalArticlesInProcess > 1 ? 's' : ''} actuellement en traitement en atelier</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowCashClosureModal(true)}
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '0.65rem 1.1rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Award size={16} /> Clôture Caisse (Z)
          </button>

          <button
            type="button"
            onClick={onManageStaff}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.65rem 1.1rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Users size={16} /> Équipe
          </button>

          <button
            type="button"
            onClick={() => setShowOrderRegistrationModal(true)}
            style={{
              background: 'linear-gradient(135deg, #002cf7 0%, #2563eb 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '0.65rem 1.35rem',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 15px rgba(0, 44, 247, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={18} /> Nouvelle Commande
          </button>
        </div>
      </div>

      {/* 📊 4 CARTES KPI HÉROÏQUES PREMIUM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        
        {/* KPI 1: CHIFFRE D'AFFAIRES ENCAISSÉ */}
        <div
          className="card"
          onClick={() => setActiveDetailsCard('ca')}
          style={{
            padding: '1.35rem',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Chiffre d'Affaires (CA)
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 44, 247, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>

          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-title)', letterSpacing: '-0.5px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {earnedRevenue.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>F CFA</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 700 }}>
              <ArrowUpRight size={14} /> +12.5% vs mois dernier
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Encaissé</span>
          </div>
        </div>

        {/* KPI 2: COMMANDES LIVRÉES & RESTITUÉES */}
        <div
          className="card"
          onClick={() => setActiveDetailsCard('completed')}
          style={{
            padding: '1.35rem',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Commandes Livrées
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-title)', letterSpacing: '-0.5px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {completedOrdersCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>colis</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
              {restitutionRate}% Taux Restitution
            </span>
            <span>{totalOrdersCount} Total</span>
          </div>
        </div>

        {/* KPI 3: COMMANDES ACTIVES EN ATELIER */}
        <div
          className="card"
          onClick={() => setActiveDetailsCard('active')}
          style={{
            padding: '1.35rem',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              En Cours d'Atelier
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 44, 247, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} />
            </div>
          </div>

          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-title)', letterSpacing: '-0.5px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {activeOrdersCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>en cours</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
              {countWashing} Lavage | {countReady} Prêt
            </span>
            <span>Atelier</span>
          </div>
        </div>

        {/* KPI 4: COMMANDES EN ATTENTE À TRIER */}
        <div
          className="card"
          onClick={() => setActiveDetailsCard('pending')}
          style={{
            padding: '1.35rem',
            borderRadius: '20px',
            background: pendingOrdersCount > 0 ? 'rgba(217, 119, 6, 0.04)' : 'var(--bg-card)',
            border: pendingOrdersCount > 0 ? '1px solid rgba(217, 119, 6, 0.25)' : '1px solid var(--border-color)',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pendingOrdersCount > 0 ? '#d97706' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              En Attente de Tri
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>

          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-title)', letterSpacing: '-0.5px', marginBottom: '0.5rem', color: pendingOrdersCount > 0 ? '#d97706' : 'var(--text-primary)' }}>
            {pendingOrdersCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>à trier</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
            <span style={{ color: pendingOrdersCount > 0 ? '#d97706' : 'var(--text-muted)', fontWeight: 700 }}>
              {pendingOrdersCount > 0 ? '⚠️ Traitement prioritaire' : 'Aucune attente'}
            </span>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>
        </div>

      </div>

      {/* 🔄 TRACKER DE PIPELINE D'ATELIER EN DIRECT (SUIVI DE FLUX EN TEMPS RÉEL) */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--primary)" />
              Flux de Production & Traitement Atelier en Direct
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Suivi en temps réel des commandes à travers la chaîne de pressing
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.65rem', borderRadius: '20px', fontWeight: 700 }}>
            {totalOrdersCount} commandes répertoriées
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
          
          {/* Étape 1 : Attente */}
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(217, 119, 6, 0.05)', border: '1px solid rgba(217, 119, 6, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={16} /> 1. Attente / Tri
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>{pendingOrdersCount}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Nouveaux dépôts à marquer</div>
          </div>

          {/* Étape 2 : Lavage / Nettoyage */}
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shirt size={16} /> 2. Lavage & Séchage
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6' }}>{countWashing}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>En cours de traitement textile</div>
          </div>

          {/* Étape 3 : Repassage */}
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Wind size={16} /> 3. Repassage & Finition
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#8b5cf6' }}>{activeOrdersCount - countWashing}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Repassage & conditionnement</div>
          </div>

          {/* Étape 4 : Prêt */}
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={16} /> 4. Prêt en Caisse
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{countReady}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prêt pour retrait ou livraison</div>
          </div>

          {/* Étape 5 : Restitué */}
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(100, 116, 139, 0.05)', border: '1px solid rgba(100, 116, 139, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Truck size={16} /> 5. Livré & Restitué
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#64748b' }}>{completedOrdersCount}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Remis en main propre</div>
          </div>

        </div>
      </div>

      {/* 📊 GRAPHIQUE METIER : VOLUME DE LINGE TRAITÉ */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Volume de Linge Traité
            </h3>
            <CustomSelect 
              value={chartPeriod} 
              onChange={(e) => setChartPeriod(e.target.value)}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="7_days">7 derniers jours</option>
              <option value="30_days">30 derniers jours</option>
              <option value="all">Tout l'historique</option>
            </CustomSelect>
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '3px' }} /> Lavage
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#8b5cf6' }}>
              <span style={{ width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '3px' }} /> Repassage
            </div>
          </div>
        </div>

        <div className="column-chart-container" style={{ marginTop: '0.75rem', height: '210px' }}>
          {daysOfWeek.map((day, idx) => {
            const maxVal = Math.max(...baseLavage, ...baseRepassage, 10);
            const lavageVal = baseLavage[idx] || 0;
            const repassageVal = baseRepassage[idx] || 0;
            const lavageHeight = lavageVal > 0 ? (lavageVal / maxVal) * 100 : 0;
            const repassageHeight = repassageVal > 0 ? (repassageVal / maxVal) * 100 : 0;

            return (
              <div className="column-chart-bar-group" key={day}>
                <div className="column-chart-bars">
                  <div
                    className="column-bar filled-primary"
                    style={{ height: `${lavageHeight}%`, minHeight: lavageVal > 0 ? '6px' : '0px', borderRadius: '4px 4px 0 0' }}
                    data-value={`${lavageVal} Lavage${lavageVal > 1 ? 's' : ''}`}
                  />
                  <div
                    className="column-bar filled-secondary"
                    style={{ height: `${repassageHeight}%`, minHeight: repassageVal > 0 ? '6px' : '0px', background: '#8b5cf6', borderRadius: '4px 4px 0 0' }}
                    data-value={`${repassageVal} Repassage${repassageVal > 1 ? 's' : ''}`}
                  />
                </div>
                <div className="column-label" style={{ fontWeight: 600, marginTop: '0.5rem' }}>{day}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ⚡ GRILLE 2 COLONNES : ÉQUIPE EN SERVICE & METRIQUES DE PERFORMANCE */}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        
        {/* COLONNE GAUCHE : ÉQUIPE DU JOUR & AGENTS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.35rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={18} color="var(--primary)" /> Équipe du Jour & Présences
            </h3>
            <button
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '10px', fontWeight: 700 }}
              onClick={onManageStaff}
            >
              Gérer l'Équipe
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '280px' }}>
            {staff.map(s => {
              const isSuper = s.role === 'super_admin';
              const isMgr = s.role === 'manager';
              const isLivreur = s.role === 'livreur';
              const isAtelier = s.role === 'agent_lavage_repassage';
              const roleLabel = isSuper ? 'Super Admin' : isMgr ? 'Manager Caisse' : isLivreur ? 'Livreur' : isAtelier ? 'Agent Atelier' : "Agent d'Accueil";
              const avatarBg = isSuper ? '#2563eb' : isMgr ? '#0284c7' : isLivreur ? '#d97706' : isAtelier ? '#8b5cf6' : '#16a34a';

              return (
                <div 
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div 
                      style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '10px', 
                        background: avatarBg, 
                        color: '#ffffff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justify: 'center', 
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}
                    >
                      {(s.prenom || 'U').charAt(0)}{(s.nom || 'M').charAt(0)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.prenom} {s.nom}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{roleLabel}</div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    En Ligne
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLONNE DROITE : METRIQUES DE PERFORMANCE & PANIER MOYEN */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.35rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={18} color="#d97706" /> Performance Services & CRM
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Panier Moyen */}
            <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Panier Moyen
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
                {averageOrderValue.toLocaleString()} F
              </div>
            </div>

            {/* Service Populaire */}
            <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(217, 70, 239, 0.05)', border: '1px solid rgba(217, 70, 239, 0.15)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Service Populaire
              </span>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#d946ef', marginTop: '0.35rem' }}>
                {mostPopularService}
              </div>
            </div>
          </div>

          {/* Abonnés & Taux Restitution */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Clients Abonnés Actifs</span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{activeSubscriptionsCount} clients</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Taux de Satisfaction</span>
              <strong style={{ color: '#10b981', fontWeight: 800 }}>{restitutionRate}% Optimal</strong>
            </div>

            {/* Barre de progression du taux */}
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-app)', borderRadius: '6px', overflow: 'hidden', marginTop: '0.25rem' }}>
              <div style={{ width: `${restitutionRate}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)', borderRadius: '6px' }} />
            </div>
          </div>
        </div>

      </div>

      {/* 📦 ACTIVITÉS & COMMANDES RÉCENTES */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShoppingBag size={18} color="var(--primary)" /> Commandes & Activités Récentes en Direct
          </h3>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '10px', fontWeight: 700 }}
            onClick={() => setShowOrderRegistrationModal(true)}
          >
            + Enregistrer une Commande
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucune commande enregistrée pour le moment.
            </div>
          ) : (
            orders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(order => {
              const customer = customers.find(c => c.id === order.customer_id);
              const clientName = customer ? `${customer.prenom} ${customer.nom}` : 'Client Comptant';
              const serviceName = serviceLabels[order.type_service] || order.type_service;
              const isExpress = order.niveau_urgence === 'Express';

              return (
                <div 
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 44, 247, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      <Shirt size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {order.type_article} ({serviceName}) — <span style={{ color: 'var(--primary)' }}>{clientName}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        Code Marquage : <strong>{order.identifiant_unique_marquage}</strong> | Créé le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isExpress && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                        ⚡ Express
                      </span>
                    )}
                    <span className={`badge badge-${order.statut}`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      {getOrderStatusLabel(order)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showCashClosureModal && createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem', boxSizing: 'border-box' }} onClick={() => setShowCashClosureModal(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-card)', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
                🔒 Clôture de Caisse Journalière (Z)
              </h3>
              <button type="button" onClick={() => setShowCashClosureModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.82rem' }}>
                <div><strong>Total Théorique Espèces :</strong> {expectedCash.toLocaleString()} FCFA</div>
                <div style={{ marginTop: '4px' }}><strong>Total Théorique Mobile Money :</strong> {expectedMomo.toLocaleString()} FCFA</div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.82rem' }}>Montant Physique Espèces Réel (FCFA)</label>
                <input
                  type="number"
                  className="input-control"
                  placeholder={`Ex: ${expectedCash}`}
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.82rem' }}>Montant Mobile Money Réel (FCFA)</label>
                <input
                  type="number"
                  className="input-control"
                  placeholder={`Ex: ${expectedMomo}`}
                  value={actualMomo}
                  onChange={(e) => setActualMomo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.82rem' }}>Notes / Explications des Écarts</label>
                <textarea
                  className="input-control"
                  rows="2"
                  placeholder="Remarques éventuelles sur la journée de caisse..."
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                />
              </div>

              {actualCash !== '' && (
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: (Number(actualCash) - expectedCash) < 0 ? '#ef4444' : '#10b981' }}>
                  Écart Espèces : {(Number(actualCash) - expectedCash).toLocaleString()} FCFA
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowCashClosureModal(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#10b981', borderColor: '#10b981' }}
                  onClick={() => {
                    db.closeDailyCashRegister({
                      expected_cash: expectedCash,
                      actual_cash: actualCash || expectedCash,
                      expected_momo: expectedMomo,
                      actual_momo: actualMomo || expectedMomo,
                      notes: closureNotes
                    });
                    alert("Clôture de caisse validée et enregistrée avec succès !");
                    setShowCashClosureModal(false);
                    setActualCash('');
                    setActualMomo('');
                    setClosureNotes('');
                  }}
                >
                  Valider la Clôture Z
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
