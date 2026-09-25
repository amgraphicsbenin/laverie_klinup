import React from 'react';
import './PageShimmer.css';

// Reusable Primitive Shimmer Component
export function Shimmer({ width = '100%', height = '16px', borderRadius = '8px', style = {}, className = '' }) {
  return (
    <div
      className={`shimmer-block ${className}`}
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
        ...style
      }}
    />
  );
}

// 1. Dashboard Shimmer
function DashboardShimmer() {
  return (
    <div className="page-shimmer-container">
      {/* Hero Banner */}
      <div className="shimmer-card" style={{ padding: '1.75rem 2rem', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div className="shimmer-row">
              <Shimmer width="140px" height="24px" borderRadius="20px" />
              <Shimmer width="110px" height="24px" borderRadius="20px" />
            </div>
            <Shimmer width="320px" height="32px" borderRadius="10px" />
            <Shimmer width="240px" height="16px" borderRadius="6px" />
          </div>
          <div className="shimmer-row">
            <Shimmer width="100px" height="40px" borderRadius="12px" />
            <Shimmer width="170px" height="40px" borderRadius="12px" />
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="shimmer-kpi-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="shimmer-card" style={{ padding: '1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Shimmer width="110px" height="14px" />
              <Shimmer width="38px" height="38px" borderRadius="12px" />
            </div>
            <Shimmer width="140px" height="32px" borderRadius="8px" style={{ marginTop: '0.5rem' }} />
            <Shimmer width="90px" height="16px" borderRadius="6px" style={{ marginTop: '0.25rem' }} />
          </div>
        ))}
      </div>

      {/* Charts & Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left Chart Card */}
        <div className="shimmer-card" style={{ minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Shimmer width="160px" height="18px" />
            <div className="shimmer-row">
              <Shimmer width="60px" height="28px" borderRadius="16px" />
              <Shimmer width="60px" height="28px" borderRadius="16px" />
              <Shimmer width="60px" height="28px" borderRadius="16px" />
            </div>
          </div>
          {/* Chart placeholder bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '190px', paddingTop: '1.5rem', gap: '0.75rem' }}>
            {[35, 60, 45, 80, 55, 90, 70, 85, 65, 95, 75, 88].map((h, idx) => (
              <Shimmer key={idx} width="100%" height={`${h}%`} borderRadius="6px" />
            ))}
          </div>
        </div>

        {/* Right Doughnut / Distribution Card */}
        <div className="shimmer-card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Shimmer width="150px" height="18px" />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem 0' }}>
            <Shimmer width="140px" height="140px" borderRadius="50%" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="shimmer-row" style={{ justifyContent: 'space-between' }}>
              <Shimmer width="100px" height="14px" />
              <Shimmer width="40px" height="14px" />
            </div>
            <div className="shimmer-row" style={{ justifyContent: 'space-between' }}>
              <Shimmer width="120px" height="14px" />
              <Shimmer width="40px" height="14px" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Pipeline Table */}
      <div className="shimmer-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <Shimmer width="180px" height="18px" />
          <Shimmer width="100px" height="28px" borderRadius="14px" />
        </div>
        {[1, 2, 3].map(row => (
          <div key={row} className="shimmer-table-row">
            <div className="shimmer-row" style={{ flex: 1 }}>
              <Shimmer width="70px" height="24px" borderRadius="6px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <Shimmer width="130px" height="14px" />
                <Shimmer width="90px" height="12px" />
              </div>
            </div>
            <Shimmer width="90px" height="22px" borderRadius="12px" />
            <Shimmer width="80px" height="16px" />
            <Shimmer width="100px" height="26px" borderRadius="14px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Orders Management Shimmer
function OrdersShimmer() {
  return (
    <div className="page-shimmer-container">
      {/* 4 Stats Pills */}
      <div className="shimmer-kpi-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="shimmer-card" style={{ padding: '1rem 1.25rem' }}>
            <Shimmer width="90px" height="12px" />
            <Shimmer width="120px" height="26px" style={{ marginTop: '0.4rem' }} />
          </div>
        ))}
      </div>

      {/* Filter Toolbar Card */}
      <div className="shimmer-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Shimmer width="240px" height="40px" borderRadius="10px" style={{ flex: '1 1 200px' }} />
          <Shimmer width="140px" height="40px" borderRadius="10px" />
          <Shimmer width="140px" height="40px" borderRadius="10px" />
          <Shimmer width="120px" height="40px" borderRadius="10px" />
          <Shimmer width="170px" height="40px" borderRadius="10px" />
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="shimmer-card">
        {/* Table Header */}
        <div className="shimmer-table-row" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
          <Shimmer width="100px" height="14px" />
          <Shimmer width="140px" height="14px" />
          <Shimmer width="100px" height="14px" />
          <Shimmer width="70px" height="14px" />
          <Shimmer width="90px" height="14px" />
          <Shimmer width="110px" height="14px" />
          <Shimmer width="90px" height="14px" />
        </div>

        {/* 6 Table Rows */}
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="shimmer-table-row" style={{ padding: '1rem 0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <Shimmer width="80px" height="18px" borderRadius="6px" />
              <Shimmer width="60px" height="12px" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Shimmer width="36px" height="36px" borderRadius="50%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <Shimmer width="110px" height="14px" />
                <Shimmer width="80px" height="12px" />
              </div>
            </div>
            <Shimmer width="90px" height="22px" borderRadius="12px" />
            <Shimmer width="60px" height="20px" borderRadius="6px" />
            <Shimmer width="85px" height="16px" />
            <Shimmer width="110px" height="26px" borderRadius="14px" />
            <Shimmer width="80px" height="32px" borderRadius="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Customers CRM Shimmer
function CustomersShimmer() {
  return (
    <div className="page-shimmer-container">
      {/* KPI Row */}
      <div className="shimmer-kpi-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="shimmer-card" style={{ padding: '1.25rem' }}>
            <Shimmer width="100px" height="13px" />
            <Shimmer width="120px" height="28px" style={{ marginTop: '0.4rem' }} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="shimmer-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Shimmer width="240px" height="40px" borderRadius="10px" style={{ flex: '1 1 200px' }} />
          <Shimmer width="180px" height="40px" borderRadius="10px" />
          <Shimmer width="120px" height="40px" borderRadius="10px" />
          <Shimmer width="150px" height="40px" borderRadius="10px" />
        </div>
      </div>

      {/* Split Layout: Customer Table Left + Profile Preview Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Left Table */}
        <div className="shimmer-card" style={{ flex: '1 1 500px' }}>
          <div className="shimmer-table-row" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Shimmer width="140px" height="14px" />
            <Shimmer width="90px" height="14px" />
            <Shimmer width="90px" height="14px" />
            <Shimmer width="70px" height="14px" />
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="shimmer-table-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Shimmer width="38px" height="38px" borderRadius="50%" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <Shimmer width="120px" height="14px" />
                  <Shimmer width="85px" height="12px" />
                </div>
              </div>
              <Shimmer width="80px" height="20px" borderRadius="10px" />
              <Shimmer width="75px" height="16px" />
              <Shimmer width="60px" height="28px" borderRadius="8px" />
            </div>
          ))}
        </div>

        {/* Right Customer Details Sheet */}
        <div className="shimmer-card" style={{ maxWidth: '420px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '1rem 0' }}>
            <Shimmer width="72px" height="72px" borderRadius="50%" />
            <Shimmer width="150px" height="20px" borderRadius="8px" />
            <Shimmer width="100px" height="14px" />
            <Shimmer width="120px" height="22px" borderRadius="12px" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div className="shimmer-card" style={{ padding: '0.75rem', alignItems: 'center' }}>
              <Shimmer width="60px" height="12px" />
              <Shimmer width="80px" height="20px" style={{ marginTop: '0.3rem' }} />
            </div>
            <div className="shimmer-card" style={{ padding: '0.75rem', alignItems: 'center' }}>
              <Shimmer width="60px" height="12px" />
              <Shimmer width="80px" height="20px" style={{ marginTop: '0.3rem' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <Shimmer width="50%" height="38px" borderRadius="10px" />
            <Shimmer width="50%" height="38px" borderRadius="10px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Catalog Shimmer
function CatalogShimmer() {
  return (
    <div className="page-shimmer-container">
      {/* Category Pills Bar */}
      <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[100, 130, 150, 120, 140].map((w, i) => (
          <Shimmer key={i} width={`${w}px`} height="36px" borderRadius="18px" />
        ))}
      </div>

      {/* Toolbar Card */}
      <div className="shimmer-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Shimmer width="240px" height="40px" borderRadius="10px" style={{ flex: '1 1 200px' }} />
          <Shimmer width="150px" height="40px" borderRadius="10px" />
          <Shimmer width="140px" height="40px" borderRadius="10px" />
          <Shimmer width="180px" height="40px" borderRadius="10px" />
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div className="shimmer-cards-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="shimmer-card" style={{ padding: '1.25rem', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Shimmer width="48px" height="48px" borderRadius="14px" />
              <Shimmer width="70px" height="22px" borderRadius="12px" />
            </div>
            <Shimmer width="140px" height="18px" borderRadius="6px" style={{ marginTop: '0.25rem' }} />
            <Shimmer width="90%" height="13px" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <Shimmer width="50px" height="11px" />
                <Shimmer width="80px" height="20px" borderRadius="6px" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <Shimmer width="50px" height="11px" />
                <Shimmer width="80px" height="20px" borderRadius="6px" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Shimmer width="50%" height="32px" borderRadius="8px" />
              <Shimmer width="50%" height="32px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Stores Shimmer
function StoresShimmer() {
  return (
    <div className="page-shimmer-container">
      {/* Header Banner */}
      <div className="shimmer-card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Shimmer width="220px" height="24px" borderRadius="8px" />
            <Shimmer width="300px" height="14px" />
          </div>
          <Shimmer width="170px" height="42px" borderRadius="12px" />
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="shimmer-kpi-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="shimmer-card" style={{ padding: '1.25rem' }}>
            <Shimmer width="110px" height="13px" />
            <Shimmer width="90px" height="28px" style={{ marginTop: '0.35rem' }} />
          </div>
        ))}
      </div>

      {/* Stores Cards Grid */}
      <div className="shimmer-cards-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="shimmer-card" style={{ padding: '1.35rem', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Shimmer width="140px" height="20px" borderRadius="6px" />
              <Shimmer width="70px" height="22px" borderRadius="12px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Shimmer width="80%" height="13px" />
              <Shimmer width="60%" height="13px" />
            </div>
            <div className="shimmer-row" style={{ marginTop: '0.5rem' }}>
              <Shimmer width="32px" height="32px" borderRadius="50%" />
              <Shimmer width="120px" height="14px" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <Shimmer width="100%" height="34px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Audit Logs Shimmer
function LogsShimmer() {
  return (
    <div className="page-shimmer-container">
      {/* Filter Toolbar */}
      <div className="shimmer-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Shimmer width="200px" height="40px" borderRadius="10px" style={{ flex: '1 1 180px' }} />
          <Shimmer width="160px" height="40px" borderRadius="10px" />
          <Shimmer width="160px" height="40px" borderRadius="10px" />
          <Shimmer width="120px" height="40px" borderRadius="10px" />
        </div>
      </div>

      {/* Logs Timeline Card */}
      <div className="shimmer-card">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="shimmer-table-row" style={{ padding: '1rem 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Shimmer width="38px" height="38px" borderRadius="10px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                <div className="shimmer-row">
                  <Shimmer width="120px" height="18px" borderRadius="6px" />
                  <Shimmer width="100px" height="14px" />
                </div>
                <Shimmer width="85%" height="13px" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
              <Shimmer width="80px" height="14px" />
              <Shimmer width="60px" height="12px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 7. Staff & Permissions Shimmer
function StaffShimmer() {
  return (
    <div className="page-shimmer-container">
      {/* Subtabs Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="shimmer-row">
          <Shimmer width="150px" height="38px" borderRadius="12px" />
          <Shimmer width="150px" height="38px" borderRadius="12px" />
        </div>
        <Shimmer width="160px" height="40px" borderRadius="12px" />
      </div>

      {/* Staff Grid */}
      <div className="shimmer-cards-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="shimmer-card" style={{ padding: '1.25rem', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shimmer width="46px" height="46px" borderRadius="50%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <Shimmer width="120px" height="16px" borderRadius="6px" />
                <Shimmer width="80px" height="18px" borderRadius="10px" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.25rem' }}>
              <Shimmer width="80%" height="13px" />
              <Shimmer width="60%" height="13px" />
            </div>
            <div className="shimmer-row" style={{ marginTop: '0.5rem' }}>
              <Shimmer width="60px" height="20px" borderRadius="10px" />
              <Shimmer width="70px" height="20px" borderRadius="10px" />
              <Shimmer width="50px" height="20px" borderRadius="10px" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <Shimmer width="50%" height="32px" borderRadius="8px" />
              <Shimmer width="50%" height="32px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. Settings Shimmer
function SettingsShimmer() {
  return (
    <div className="page-shimmer-container">
      {/* Subnav Pills */}
      <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[140, 130, 150, 160, 130].map((w, i) => (
          <Shimmer key={i} width={`${w}px`} height="38px" borderRadius="12px" />
        ))}
      </div>

      {/* Form Settings Card */}
      <div className="shimmer-card" style={{ padding: '2rem', maxWidth: '780px' }}>
        <Shimmer width="200px" height="22px" borderRadius="6px" />
        <Shimmer width="320px" height="14px" style={{ marginTop: '-0.3rem' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Shimmer width="130px" height="14px" />
              <Shimmer width="100%" height="42px" borderRadius="10px" />
              <Shimmer width="220px" height="12px" />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <Shimmer width="160px" height="42px" borderRadius="12px" />
        </div>
      </div>
    </div>
  );
}

// 9. Help Shimmer
function HelpShimmer() {
  return (
    <div className="page-shimmer-container">
      <div className="shimmer-card" style={{ padding: '1.5rem' }}>
        <Shimmer width="220px" height="22px" borderRadius="6px" />
        <Shimmer width="320px" height="14px" style={{ marginTop: '0.25rem' }} />
      </div>
      <div className="shimmer-cards-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="shimmer-card" style={{ padding: '1.5rem', gap: '0.75rem' }}>
            <Shimmer width="44px" height="44px" borderRadius="12px" />
            <Shimmer width="140px" height="18px" />
            <Shimmer width="90%" height="13px" />
            <Shimmer width="80%" height="13px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 10. Master PageShimmer Router
export default function PageShimmer({ tab }) {
  if (tab === 'dashboard') {
    return <DashboardShimmer />;
  }
  if (tab === 'orders_management') {
    return <OrdersShimmer />;
  }
  if (tab === 'crm_management') {
    return <CustomersShimmer />;
  }
  if (tab === 'catalog') {
    return <CatalogShimmer />;
  }
  if (tab === 'laundry_points') {
    return <StoresShimmer />;
  }
  if (tab === 'logs') {
    return <LogsShimmer />;
  }
  if (tab === 'staff_management' || tab === 'staff_roles' || tab === 'staff_users') {
    return <StaffShimmer />;
  }
  if (tab && tab.startsWith('settings')) {
    return <SettingsShimmer />;
  }
  if (tab === 'help') {
    return <HelpShimmer />;
  }
  return <DashboardShimmer />;
}
