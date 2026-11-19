import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, Store, Truck, MapPin, RefreshCw, Activity, XCircle, Phone, MessageSquare, X } from 'lucide-react';
import { db } from '../../../services/db';

function haversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function formatAge(iso) {
  if (!iso) return 'En attente GPS';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 10) return 'À l’instant';
  if (diffSec < 60) return `Il y a ${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `Il y a ${min} min`;
  return `Il y a ${Math.floor(min / 60)}h`;
}

export function LiveTrackingTab({
  orders = [],
  stores = [],
  customers = [],
  staff = [],
  activeStoreId = 'all',
  initialOrderId = null,
  isModal = false,
  onClose = null
}) {
  const [sessions, setSessions] = useState(() => db.getTrackingSessions(true));
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
  const [tick, setTick] = useState(0);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const layerGroupRef = useRef(null);
  const routeGroupRef = useRef(null);
  const liveTrailGroupRef = useRef(null);
  const routeCacheRef = useRef({});
  const liveTrailsRef = useRef({});
  const hasCenteredOnceRef = useRef(false);
  const lastFocusedOrderIdRef = useRef(null);
  const lastBoundsRef = useRef([]);
  const [mapLayer, setMapLayer] = useState('m');
  const [routingLoading, setRoutingLoading] = useState(false);

  useEffect(() => {
    const refresh = () => setSessions(db.getTrackingSessions(true));
    refresh();
    const unsub = db.subscribe(refresh);
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      if (db.refreshTrackingSessionsFromDb) {
        db.refreshTrackingSessionsFromDb().then((fresh) => setSessions(fresh));
      }
    }, 3000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (initialOrderId) setSelectedOrderId(initialOrderId);
  }, [initialOrderId]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!activeStoreId || activeStoreId === 'all' || activeStoreId === 'GLOBAL') return true;
      return !s.store_id || s.store_id === activeStoreId;
    });
  }, [sessions, activeStoreId]);

  useEffect(() => {
    if (!selectedOrderId || !filteredSessions.some((s) => s.order_id === selectedOrderId)) {
      setSelectedOrderId(filteredSessions[0]?.order_id || null);
    }
  }, [filteredSessions, selectedOrderId]);

  useEffect(() => {
    if (!mapContainerRef.current || typeof window === 'undefined' || !window.L) return;
    if (mapInstanceRef.current) return;

    const L = window.L;
    const defaultStore = stores.find((s) => s.id === activeStoreId) || stores[0];
    const centerLat = Number(defaultStore?.latitude) || 6.3703;
    const centerLng = Number(defaultStore?.longitude) || 2.3912;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([centerLat, centerLng], 14);
    const tileLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3']
    });
    tileLayer.on('tileerror', function () {
      if (!this._fallbackApplied) {
        this._fallbackApplied = true;
        this.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}');
      }
    });
    tileLayer.addTo(map);
    const group = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);
    const liveTrailGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    layerGroupRef.current = group;
    routeGroupRef.current = routeGroup;
    liveTrailGroupRef.current = liveTrailGroup;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      try {
        map.remove();
      } catch (_) {}
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    const liveTrailGroup = liveTrailGroupRef.current;
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!map || !group || !L) return;

    group.clearLayers();
    if (liveTrailGroup) liveTrailGroup.clearLayers();
    const bounds = [];

    filteredSessions.forEach((s) => {
      const isFocus = selectedOrderId === s.order_id;
      const isDepot = s.mission_type === 'depot_laverie';
      const color = isDepot ? '#f97316' : '#002cf7';
      const order = orders.find((o) => String(o.id) === String(s.order_id));
      const orderNum = order?.identifiant_unique_marquage || `#${s.order_id}`;

      if (s.dest_latitude != null && s.dest_longitude != null) {
        const destIcon = L.divIcon({
          className: 'klinup-live-dest',
          html: `<div style="width:28px;height:28px;border-radius:50%;background:#111827;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">${isDepot ? 'L' : 'C'}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker([s.dest_latitude, s.dest_longitude], { icon: destIcon })
          .bindPopup(`<b>${s.dest_label || 'Destination'}</b><br/>Commande ${orderNum}`)
          .addTo(group);
        if (isFocus || !selectedOrderId) bounds.push([s.dest_latitude, s.dest_longitude]);
      }

      if (s.latitude != null && s.longitude != null) {
        const rot = Number(s.heading || 0);
        const driverIcon = L.divIcon({
          className: 'klinup-live-driver',
          html: `<img src="/livreur_pin.png" alt="Livreur" style="width:46px;height:46px;background:transparent;transform:rotate(${rot}deg);display:block;" />`,
          iconSize: [46, 46],
          iconAnchor: [23, 23]
        });
        L.marker([s.latitude, s.longitude], { icon: driverIcon })
          .bindPopup(`<b>${s.driver_name || 'Livreur'}</b><br/>Commande ${orderNum} • ${Math.round(s.speed || 0)} km/h`)
          .addTo(group);
        if (isFocus || !selectedOrderId) bounds.push([s.latitude, s.longitude]);

        const trail = liveTrailsRef.current[s.order_id] || [];
        const lastPt = trail[trail.length - 1];
        const distMeters = lastPt ? (haversineKm(lastPt[0], lastPt[1], s.latitude, s.longitude) || 0) * 1000 : 999;
        if (!lastPt || distMeters >= 4) {
          liveTrailsRef.current[s.order_id] = [...trail, [s.latitude, s.longitude]].slice(-500);
        }
        const activeTrail = liveTrailsRef.current[s.order_id] || [];
        if (liveTrailGroup && activeTrail.length >= 2 && (isFocus || !selectedOrderId)) {
          L.polyline(activeTrail, { color: '#16a34a', weight: 5, opacity: 0.95 }).addTo(liveTrailGroup);
        }

        if (s.dest_latitude != null && s.dest_longitude != null && (isFocus || !selectedOrderId)) {
          drawRoadRoute(s, '#1a73e8', isFocus, false);
        }
      }
    });

    lastBoundsRef.current = bounds;
    const focusChanged = selectedOrderId !== lastFocusedOrderIdRef.current;
    if (bounds.length === 1 && (!hasCenteredOnceRef.current || focusChanged)) {
      map.setView(bounds[0], 16);
      hasCenteredOnceRef.current = true;
      lastFocusedOrderIdRef.current = selectedOrderId;
    } else if (bounds.length >= 2 && (!hasCenteredOnceRef.current || focusChanged)) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
      hasCenteredOnceRef.current = true;
      lastFocusedOrderIdRef.current = selectedOrderId;
    }
  }, [filteredSessions, selectedOrderId, orders, tick]);

  const changeMapLayer = (lyrs) => {
    setMapLayer(lyrs);
    if (tileLayerRef.current) {
      tileLayerRef.current._fallbackApplied = false;
      tileLayerRef.current.setUrl(`https://mt{s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`);
    }
  };

  const drawRoadRoute = (s, color, isFocus, forceFetch = false) => {
    const L = typeof window !== 'undefined' ? window.L : null;
    const routeGroup = routeGroupRef.current;
    const map = mapInstanceRef.current;
    if (!L || !routeGroup || !map || s.latitude == null || s.longitude == null || s.dest_latitude == null || s.dest_longitude == null) return;

    const key = `${s.order_id}:${Number(s.latitude).toFixed(4)},${Number(s.longitude).toFixed(4)}->${Number(s.dest_latitude).toFixed(4)},${Number(s.dest_longitude).toFixed(4)}`;
    if (!forceFetch && routeCacheRef.current[key]) {
      routeGroup.clearLayers();
      L.polyline(routeCacheRef.current[key], { color, weight: isFocus ? 5 : 3, opacity: 0.9 }).addTo(routeGroup);
      return;
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${s.longitude},${s.latitude};${s.dest_longitude},${s.dest_latitude}?overview=full&geometries=geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        routeGroup.clearLayers();
        if (Array.isArray(coords) && coords.length > 0) {
          const latLngs = coords.map((c) => [c[1], c[0]]);
          routeCacheRef.current[key] = latLngs;
          L.polyline(latLngs, { color, weight: isFocus ? 5 : 3, opacity: 0.9 }).addTo(routeGroup);
          if (forceFetch) map.fitBounds(latLngs, { padding: [60, 60], maxZoom: 17 });
        } else {
          L.polyline([[s.latitude, s.longitude], [s.dest_latitude, s.dest_longitude]], { color, weight: 4, dashArray: '8, 8' }).addTo(routeGroup);
        }
      })
      .catch(() => {
        routeGroup.clearLayers();
        L.polyline([[s.latitude, s.longitude], [s.dest_latitude, s.dest_longitude]], { color, weight: 4, dashArray: '8, 8' }).addTo(routeGroup);
      });
  };

  const handleLoadRouteFromDb = async () => {
    setRoutingLoading(true);
    try {
      const fresh = db.refreshTrackingSessionsFromDb
        ? await db.refreshTrackingSessionsFromDb()
        : db.getTrackingSessions(true);
      setSessions(fresh);
      const target = fresh.find((x) => x.order_id === selectedOrderId) || fresh[0];
      if (target) {
        drawRoadRoute(target, target.mission_type === 'depot_laverie' ? '#f97316' : '#1a73e8', true, true);
      }
    } finally {
      setRoutingLoading(false);
    }
  };

  const recenterMap = () => {
    const map = mapInstanceRef.current;
    const b = lastBoundsRef.current;
    if (!map || !b || b.length === 0) return;
    if (b.length === 1) map.setView(b[0], 16, { animate: true });
    else map.fitBounds(b, { padding: [60, 60], maxZoom: 17 });
  };

  const activeSession = filteredSessions.find((s) => String(s.order_id) === String(selectedOrderId)) || filteredSessions[0] || null;
  const activeOrder = orders.find((o) => String(o.id) === String(selectedOrderId || activeSession?.order_id || initialOrderId)) || null;
  const activeCustomer = customers.find((c) => String(c.id) === String(activeOrder?.customer_id || activeOrder?.client_id)) || null;
  const activeStore = stores.find((st) => String(st.id) === String(activeSession?.store_id || activeOrder?.store_id)) || null;
  const activeDriverStaff = staff.find(
    (st) =>
      (activeSession?.driver_id && String(st.id) === String(activeSession.driver_id)) ||
      (activeSession?.driver_name &&
        `${st.prenom || ''} ${st.nom || ''}`.trim().toLowerCase() === String(activeSession.driver_name).trim().toLowerCase())
  ) || null;

  if (isModal) {
    const isDepot = activeSession?.mission_type === 'depot_laverie';
    const orderNum = activeOrder?.identifiant_unique_marquage || `#${activeOrder?.id || activeSession?.order_id || initialOrderId || ''}`;
    const distKm = activeSession
      ? haversineKm(activeSession.latitude, activeSession.longitude, activeSession.dest_latitude, activeSession.dest_longitude)
      : null;
    const speedKmh = Math.round(Number(activeSession?.speed || 0));
    const avgSpeed = speedKmh >= 8 ? speedKmh : 24;
    const etaMinutes = distKm != null ? Math.max(2, Math.round((distKm / avgSpeed) * 60)) : null;
    const etaDate = etaMinutes != null ? new Date(Date.now() + etaMinutes * 60 * 1000) : null;
    const etaClockText = etaDate
      ? etaDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : 'En cours';
    const progressPct =
      distKm == null ? 35 : distKm <= 0.3 ? 95 : distKm >= 10 ? 20 : Math.min(92, Math.max(22, Math.round((1 - distKm / 10) * 100)));
    const cleanDestAddress = String(
      activeSession?.dest_label || activeCustomer?.adresse || activeStore?.nom || 'Adresse non renseignée'
    )
      .replace(/\s*\[GPS:[^\]]+\]/g, '')
      .trim();
    const driverName = activeSession?.driver_name || (activeDriverStaff ? `${activeDriverStaff.prenom || ''} ${activeDriverStaff.nom || ''}`.trim() : 'Livreur KLIN UP');
    const driverInitials = driverName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'KL';
    const driverPhoto = activeDriverStaff?.user_picture || null;
    const itemsArr = Array.isArray(activeOrder?.items) ? activeOrder.items : [];
    const itemsCount = itemsArr.reduce((sum, it) => sum + Number(it?.quantite || it?.quantity || 1), 0) || 1;
    const totalPrice = Number(activeOrder?.prix_total || activeOrder?.total || 0);
    const formattedPrice = `${Math.round(totalPrice).toLocaleString('fr-FR')} FCFA`;
    const clientFullName = activeCustomer
      ? `${activeCustomer.prenom || ''} ${activeCustomer.nom || ''}`.trim() || activeCustomer.nom || 'Client Passage'
      : activeOrder?.client_nom || 'Client Passage';
    const rawPhone = activeCustomer?.telephone || activeOrder?.client_telephone || '';
    const cleanWaPhone = rawPhone.replace(/[^\d]/g, '');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#F8FAFC', position: 'relative' }}>
        {/* Zone Carte */}
        <div style={{ flex: 1, position: 'relative', minHeight: '280px', overflow: 'hidden' }}>
          {/* Pilule blanche Titre + Statut (haut gauche) */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '16px',
              zIndex: 550,
              background: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '999px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              color: '#0F172A',
              fontSize: '0.86rem',
              fontWeight: 800
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: activeSession?.latitude != null ? '#10B981' : '#F59E0B',
                display: 'inline-block',
                flexShrink: 0
              }}
            />
            <span>Suivi Live Commande {orderNum}</span>
            {distKm != null && (
              <>
                <span style={{ color: '#CBD5E1', fontWeight: 400 }}>|</span>
                <span style={{ color: '#2563EB', fontWeight: 700 }}>{distKm} km</span>
              </>
            )}
          </div>

          {/* Pilules outils (haut droite) : Calques + Actualiser + Fermer */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              zIndex: 550,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: '#FFFFFF',
                padding: '4px',
                borderRadius: '999px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
                border: '1px solid #E2E8F0'
              }}
            >
              {[
                { code: 'm', label: 'Plan' },
                { code: 'y', label: 'Satellite' },
                { code: 'p', label: 'Relief' }
              ].map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => changeMapLayer(opt.code)}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    padding: '5px 11px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: mapLayer === opt.code ? '#2563EB' : 'transparent',
                    color: mapLayer === opt.code ? '#FFFFFF' : '#0F172A'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: '#FFFFFF',
                padding: '4px',
                borderRadius: '999px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
                border: '1px solid #E2E8F0'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (db.refreshTrackingSessionsFromDb) {
                    db.refreshTrackingSessionsFromDb().then((fresh) => setSessions(fresh));
                  }
                }}
                title="Actualiser"
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0F172A'
                }}
              >
                <RefreshCw size={15} />
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  title="Fermer"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#0F172A'
                  }}
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          {/* Contrôles Zoom +/- & Recentrer (bas droite carte) */}
          <div
            style={{
              position: 'absolute',
              bottom: '34px',
              right: '16px',
              zIndex: 550,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#FFFFFF',
                borderRadius: '14px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.14)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                title="Zoom +"
                style={{ border: 'none', background: 'transparent', width: '38px', height: '36px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', color: '#0F172A' }}
              >
                +
              </button>
              <div style={{ height: '1px', background: '#E2E8F0' }} />
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                title="Zoom -"
                style={{ border: 'none', background: 'transparent', width: '38px', height: '36px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', color: '#0F172A' }}
              >
                −
              </button>
            </div>
            <button
              type="button"
              onClick={recenterMap}
              title="Recentrer"
              style={{
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.14)',
                cursor: 'pointer',
                color: '#2563EB'
              }}
            >
              <Navigation size={16} />
            </button>
          </div>

          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Bottom Sheet White — Design 1 (Épuré Clair & Modulaire) identique à l'app mobile */}
        <div
          style={{
            position: 'relative',
            zIndex: 600,
            marginTop: '-20px',
            background: '#FFFFFF',
            borderRadius: '26px 26px 0 0',
            borderTop: '1px solid #E2E8F0',
            boxShadow: '0 -10px 30px rgba(15, 23, 42, 0.12)',
            padding: '12px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Drag handle */}
          <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: '#CBD5E1', alignSelf: 'center' }} />

          {/* ETA + Barre de progression */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.15 }}>
                  {etaMinutes != null ? `${etaMinutes} min env.` : 'En direct'}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 500, color: '#64748B', marginTop: '2px' }}>
                  {isDepot ? `Dépôt prévu à ${etaClockText}` : `Livraison prévue à ${etaClockText}`}
                  {activeSession?.updated_at ? ` • ${formatAge(activeSession.updated_at)}` : ''}
                </div>
              </div>
              {activeSession && (
                <button
                  type="button"
                  onClick={() => db.stopTrackingSession(activeSession.order_id)}
                  style={{
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    borderRadius: '999px',
                    padding: '6px 12px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                >
                  <XCircle size={14} /> Clôturer suivi
                </button>
              )}
            </div>

            <div style={{ width: '100%', height: '6px', borderRadius: '99px', background: '#F1F2F6', overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: '99px', background: '#2563EB', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Carte Commande + Livreur en grille responsive */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
            {/* Order Card Light (#F8FAFC) */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>
                Commande {orderNum}
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                {activeOrder ? `${itemsCount} article(s) | ${formattedPrice}` : isDepot ? 'Dépôt vers la laverie' : 'Livraison à domicile'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px', lineHeight: 1.35 }}>
                {cleanDestAddress || 'Adresse non renseignée'}
              </div>
            </div>

            {/* Livreur + 3 CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#1E293B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {driverPhoto ? (
                    <img src={driverPhoto} alt={driverName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    driverInitials
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {driverName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Client : {clientFullName}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleLoadRouteFromDb}
                  disabled={routingLoading}
                  style={{
                    flex: 1.45,
                    height: '44px',
                    border: 'none',
                    borderRadius: '14px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Navigation size={15} />
                  {routingLoading ? 'Calcul...' : 'Itinéraire'}
                </button>

                <a
                  href={rawPhone ? `tel:${rawPhone}` : undefined}
                  onClick={(e) => { if (!rawPhone) e.preventDefault(); }}
                  style={{
                    flex: 1.05,
                    height: '44px',
                    borderRadius: '14px',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#0F172A',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    opacity: rawPhone ? 1 : 0.5,
                    cursor: rawPhone ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Phone size={15} />
                  Appeler
                </a>

                <a
                  href={cleanWaPhone ? `https://wa.me/${cleanWaPhone}` : undefined}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => { if (!cleanWaPhone) e.preventDefault(); }}
                  style={{
                    flex: 0.95,
                    height: '44px',
                    borderRadius: '14px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    opacity: cleanWaPhone ? 1 : 0.5,
                    cursor: cleanWaPhone ? 'pointer' : 'not-allowed'
                  }}
                >
                  <MessageSquare size={15} />
                  Chat
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '1rem', height: 'calc(100vh - 150px)', minHeight: '540px' }}>
      {/* Carte Live */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            zIndex: 500,
            background: 'var(--bg-card)',
            padding: '0.55rem 0.9rem',
            borderRadius: '12px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <Activity size={16} color={filteredSessions.length > 0 ? '#16a34a' : '#64748b'} />
          <span>
            {filteredSessions.length > 0
              ? `${filteredSessions.length} course(s) suivie(s) en temps réel`
              : 'Aucune course active en ce moment'}
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 500,
            display: 'flex',
            gap: '6px',
            background: 'var(--bg-card)',
            padding: '4px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
            border: '1px solid var(--border-color)'
          }}
        >
          {[
            { code: 'm', label: 'Plan' },
            { code: 'y', label: 'Satellite' },
            { code: 'p', label: 'Relief' }
          ].map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => changeMapLayer(opt.code)}
              style={{
                border: 'none',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: mapLayer === opt.code ? '#1a73e8' : 'transparent',
                color: mapLayer === opt.code ? '#fff' : 'var(--text-primary)'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '14px',
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.16)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <button type="button" onClick={() => mapInstanceRef.current?.zoomIn()} title="Zoom +" style={{ border: 'none', background: 'transparent', padding: '7px 11px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', color: 'var(--text-primary)' }}>+</button>
            <div style={{ height: '1px', background: 'var(--border-color)' }} />
            <button type="button" onClick={() => mapInstanceRef.current?.zoomOut()} title="Zoom -" style={{ border: 'none', background: 'transparent', padding: '7px 11px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', color: 'var(--text-primary)' }}>−</button>
          </div>
          <button
            type="button"
            onClick={recenterMap}
            title="Recentrer"
            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.16)', cursor: 'pointer', color: '#1a73e8' }}
          >
            <Navigation size={15} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleLoadRouteFromDb}
          disabled={routingLoading}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '14px',
            zIndex: 500,
            border: 'none',
            borderRadius: '999px',
            background: '#1a73e8',
            color: '#fff',
            padding: '9px 16px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(26,115,232,0.4)',
            cursor: 'pointer'
          }}
        >
          <Navigation size={14} />
          {routingLoading ? 'Chargement...' : 'Itinéraire'}
        </button>

        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Liste des courses actives */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', overflowY: 'auto', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Navigation size={17} color="var(--accent)" />
            Courses actives
          </h3>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => setSessions(db.getTrackingSessions(true))}
          >
            <RefreshCw size={13} /> Actualiser
          </button>
        </div>

        {filteredSessions.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Dès qu’un livreur crée une commande (trajet dépôt vers la laverie) ou démarre une livraison client, son trajet apparaîtra automatiquement ici en direct.
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isSelected = selectedOrderId === s.order_id;
            const isDepot = s.mission_type === 'depot_laverie';
            const order = orders.find((o) => String(o.id) === String(s.order_id));
            const orderNum = order?.identifiant_unique_marquage || `#${s.order_id}`;
            const distKm = haversineKm(s.latitude, s.longitude, s.dest_latitude, s.dest_longitude);

            return (
              <div
                key={s.order_id}
                onClick={() => setSelectedOrderId(s.order_id)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                  background: isSelected ? 'rgba(0, 44, 247, 0.05)' : 'var(--bg-app)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: isDepot ? '#ea580c' : 'var(--accent)' }}>
                    {isDepot ? <Store size={15} /> : <Truck size={15} />}
                    {orderNum} • {isDepot ? 'Dépôt laverie' : 'Livraison client'}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>{formatAge(s.updated_at)}</span>
                </div>

                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Livreur : {s.driver_name || 'Agent'}
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={13} />
                  <span>{s.dest_label || 'Destination'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                  <strong style={{ color: 'var(--accent)' }}>
                    {distKm != null ? `${distKm} km restants` : 'Signal GPS en attente...'}
                  </strong>
                  <span style={{ color: 'var(--text-muted)' }}>{Math.round(s.speed || 0)} km/h</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      db.stopTrackingSession(s.order_id);
                    }}
                  >
                    <XCircle size={12} /> Clôturer suivi
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
