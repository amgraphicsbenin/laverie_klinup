import React from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import CustomSelect from '../CustomSelect';

export default function MultiSearchInput({
  searchTypes = [],
  searchType,
  onSearchTypeChange,
  searchQuery,
  onSearchQueryChange,
  style = {},
  width = '390px',
  minWidth = '320px',
  selectWidth = '155px',
  dropdownMinWidth = '190px'
}) {
  const activeConfig = searchTypes.find(st => st.id === searchType) || searchTypes[0];
  const inputType = activeConfig?.inputType || (activeConfig?.id === 'phone' ? 'tel' : 'text');
  const placeholder = activeConfig?.placeholder || 'Rechercher...';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-app)',
        minWidth: minWidth,
        width: width,
        maxWidth: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        ...style
      }}
    >
      {/* Sélecteur de Type de Recherche */}
      <div style={{ width: selectWidth, flexShrink: 0 }}>
        <CustomSelect
          value={searchType}
          onChange={(e) => onSearchTypeChange(e.target.value)}
          style={{
            fontSize: '0.76rem',
            fontWeight: 600,
            padding: '0.42rem 0.65rem',
            borderRadius: '9px 0 0 9px',
            background: 'transparent',
            border: 'none',
            borderRight: '1px solid var(--border-color)',
            height: '100%',
            color: 'var(--text-primary)'
          }}
          dropdownStyle={{ minWidth: dropdownMinWidth, zIndex: 1050 }}
        >
          {searchTypes.map((st) => {
            const IconComp = st.icon;
            return (
              <option key={st.id} value={st.id}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  {IconComp && <IconComp size={14} />}
                  <span>{st.label}</span>
                </span>
              </option>
            );
          })}
        </CustomSelect>
      </div>

      {/* Champ de Saisie de Recherche adapté */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <IconSearch size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type={inputType}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            padding: '0.42rem 1.8rem 0.42rem 2rem',
            fontSize: '0.78rem',
            borderRadius: '0 9px 9px 0',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchQueryChange('')}
            title="Effacer la recherche"
            style={{
              position: 'absolute',
              right: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconX size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
